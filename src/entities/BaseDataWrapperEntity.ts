import {
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    BeforeInsert, BeforeUpdate, SaveOptions, InsertResult, ObjectType,
    UpdateResult, QueryFailedError, Connection
} from "typeorm";
import {classToPlain, Expose} from "class-transformer";
import { validateOrReject } from "class-validator";
import {DataWrapperValidationError} from "../errors";
import {DataWrapperTransaction} from "../transaction";

import {DeepPartial} from "typeorm/common/DeepPartial";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";
import {TreeRepository} from "typeorm/repository/TreeRepository";


export interface IToJSONOptions {
    withDetails?: boolean;
}

export interface ISaveOptions extends Omit<SaveOptions, 'transaction'> {
    transaction?: DataWrapperTransaction;
    changedBy?: string;
}

export interface IUpdateOptions extends ISaveOptions {
    primaryKeyNames?: string;
    noReload?: boolean;
}

export interface IToTreeOptions {
    parentIdentifier?: string;
    childrenIdentifier?: string;
}

export interface ITreeOptions {
    transaction?: DataWrapperTransaction;
}

export abstract class BaseDataWrapperEntity extends BaseEntity {

    @CreateDateColumn({
        type: 'timestamptz'
    })
    @Expose({ groups: ['withDetails'] })
    createdAt: Date;
    @UpdateDateColumn({
        type: 'timestamptz'
    })
    @Expose({ groups: ['withDetails']})
    updatedAt?: Date;
    @Column()
    @Expose({ groups: ['withDetails'] })
    createdBy: string;
    @Column()
    @Expose({ groups: ['withDetails'] })
    changedBy?: string;
    @Column({nullable: true})
    @Expose({ groups: ['withDetails'] })
    deletedBy?: string;
    @DeleteDateColumn({nullable: true, type: 'timestamptz'})
    @Expose({ groups: ['withDetails'] })
    deletedAt?: Date;

    @BeforeInsert()
    _setInternalDates() {
        this.updatedAt = this.createdAt;
        this.changedBy = this.createdBy;
    }

    @BeforeInsert()
    _runValidatorBeforeInsert() {
        return this._runValidator();
    }

    @BeforeUpdate()
    _runValidatorBeforeUpdatet() {
        return this._runValidator();
    }

    static get currentConnection(): Connection {
        return (this as any).usedConnection;
    }

    static createAndSave<T extends BaseDataWrapperEntity>(this: ObjectType<T>, entity: DeepPartial<T>, saveOptions?: ISaveOptions): Promise<T> {
        const newInstance = super.create(entity) as T;
        return newInstance.saveEntity(saveOptions);
    }

    static bulkCreateAndSave<T extends BaseDataWrapperEntity>(this: ObjectType<T>, entities: DeepPartial<T>[], saveOptions?: ISaveOptions): Promise<InsertResult> {

        const {transaction, ..._saveOptions} = saveOptions || {};

        const queryBuilder = super.createQueryBuilder();

        if(transaction && transaction.isTransactionActive) queryBuilder.setQueryRunner(transaction.getQueryRunner());

        const entitiesToCreateOrUpdate = entities.map(entity => super.create(entity as any)) as any;

        return queryBuilder
            .insert()
            .into(this)
            .values(entitiesToCreateOrUpdate)
            .execute();
    }

    static bulkSoftDelete<T extends BaseDataWrapperEntity>(this: ObjectType<T>, whereEntities: Partial<T>[], saveOptions?: ISaveOptions): Promise<UpdateResult> {

        if(whereEntities.length === 0) return;
        
        const {transaction, ..._saveOptions} = saveOptions || {};

        const queryBuilder = super.createQueryBuilder<T>();
        if(transaction && transaction.isTransactionActive) queryBuilder.setQueryRunner(transaction.getQueryRunner());

        return queryBuilder
            .softDelete()
            .where(whereEntities)
            .execute()
    }

    static bulkUpdate<T extends BaseDataWrapperEntity>(this: ObjectType<T>, where: Partial<T>, partialEntity: QueryDeepPartialEntity<T>, saveOptions?: ISaveOptions): Promise<UpdateResult> {
        const {transaction, ..._saveOptions} = saveOptions || {};

        const queryBuilder = super.createQueryBuilder<T>();
        if(transaction && transaction.isTransactionActive) queryBuilder.setQueryRunner(transaction.getQueryRunner());

        return queryBuilder
            .update(partialEntity)
            .where(where)
            .execute()
    }

    static toTree<T extends BaseDataWrapperEntity>(this: ObjectType<T>, instances: T[], options : IToTreeOptions = {}) {
        const {
            childrenIdentifier = "children", parentIdentifier = "parentId"
        } = options;

        const mapChildrenForInstance = instance => {
            if(!instance[childrenIdentifier] || !Array.isArray(instance[childrenIdentifier])) {
                instance[childrenIdentifier] = [];
            }

            const hasChildren = instances
                .some(potentialChild => potentialChild[parentIdentifier] === instance.id);

            if(hasChildren) {
                instance[childrenIdentifier].push(
                    ...instances
                        .filter(potentialChild => potentialChild[parentIdentifier] === instance.id)
                        .map(child => mapChildrenForInstance(child))
                )
            }

            return instance;
        }

        return instances
            .filter(instance => !instance[parentIdentifier])
            .map(instance => mapChildrenForInstance(instance))
    }

    static asTree<T extends BaseDataWrapperEntity>(this: ObjectType<T>, options: ITreeOptions = {}): TreeRepository<T> {
        const {transaction} = options;
        return (this as any).currentConnection.getTreeRepository(this);
    }

    async _runValidator() {
        try {
            await validateOrReject(this);
        } catch(validationErrors) {
            throw new DataWrapperValidationError({
                entityName: this.constructor.name,
                validationErrors
            });
        }
    }

    async update(updateObject: DeepPartial<this>, updateOptions?: IUpdateOptions): Promise<this> {
        const {primaryKeyNames, noReload, changedBy, ..._saveOptions} = updateOptions || {} as any;

        for(let p in updateObject) {
            (this as any)[p] = updateObject[p];
        }
        this["changedBy"] = changedBy;

        if(noReload) {
            const queryBuilder = (this as any).constructor.createQueryBuilder();
            if(_saveOptions.transaction && _saveOptions.transaction.isTransactionActive) {
                queryBuilder.setQueryRunner(_saveOptions.transaction.getQueryRunner());
            }

            let where = {}
            if(Array.isArray(primaryKeyNames) && primaryKeyNames.length > 0) {
                primaryKeyNames
                    .forEach(primaryKeyName => where[primaryKeyName] = this[primaryKeyName])
            } else {
                where["id"] = (this as any).id;
            }

            await queryBuilder
                .update({
                    ...updateObject,
                    changedBy
                })
                .where(where)
                .execute();
        } else {
            return this.saveEntity(_saveOptions)
        }



    }

    async saveEntity(options?: ISaveOptions) {
        try {
            const {transaction,changedBy, ...saveOptions} = options || {};

            if(transaction && transaction.isTransactionActive) {
                await transaction.getQueryRunner().manager.save(this, {...saveOptions});
            } else {
                await super.save({...saveOptions});
            }

            return this;
        } catch(err) {
            if(err instanceof QueryFailedError) {
                throw new DataWrapperValidationError({
                    entityName: this.constructor.name,
                    failedDatabaseQuery: err instanceof QueryFailedError ? err : null
                })
            }

            throw err

        }
    }

    toJSON(options? : IToJSONOptions) {

        const {withDetails} = options || {};
        let groups = [];

        if(withDetails) groups.push('withDetails')

        return classToPlain(this, {
            groups, excludePrefixes: ['_', '__']
        });
    }

}