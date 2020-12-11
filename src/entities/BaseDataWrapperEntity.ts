import {
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    BeforeInsert, BeforeUpdate, SaveOptions, QueryRunner, InsertResult, ObjectType,
    UpdateResult
} from "typeorm";
import {classToPlain, Expose} from "class-transformer";
import { validateOrReject } from "class-validator";
import {DataWrapperValidationError} from "../errors";
import {DataWrapperTransaction} from "../transaction";

import {DeepPartial} from "typeorm/common/DeepPartial";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";


export interface IToJSONOptions {
    withDetails?: boolean;
}

export interface ISaveOptions extends Omit<SaveOptions, 'transaction'> {
    transaction: DataWrapperTransaction;
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

    static createAndSave<T extends BaseDataWrapperEntity>(this: ObjectType<T>, entity: DeepPartial<T>, saveOptions?: ISaveOptions): Promise<T> {

        const {transaction, ..._saveOptions} = saveOptions || {};

        const newInstance = super.create(entity);
        return transaction && transaction.isTransactionActive ?
            transaction.getQueryRunner().manager.save(newInstance) : newInstance.save(_saveOptions) as any;
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

        const {transaction, ..._saveOptions} = saveOptions || {};

        const queryBuilder = super.createQueryBuilder<T>();
        if(transaction && transaction.isTransactionActive) queryBuilder.setQueryRunner(transaction.getQueryRunner());

        return queryBuilder
            .softDelete()
            .where(whereEntities)
            .execute()
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

    async save(options?: SaveOptions) {
        try {
            await super.save(options);
            return this;
        } catch(err) {
            throw new DataWrapperValidationError({
                entityName: this.constructor.name,
                failedDatabaseQuery: err
            })
        }
    }

    toJSON(options? : IToJSONOptions) {

        const {withDetails} = options || {};
        let groups = [];

        if(withDetails) groups.push('withDetails')

        return classToPlain(this, { groups });
    }

}