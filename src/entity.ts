import {
    BaseEntity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    BeforeInsert, BeforeUpdate, SaveOptions, QueryRunner
} from "typeorm";
import {classToPlain, Expose} from "class-transformer";
import { MaxLength, validateOrReject } from "class-validator";
import { v4 as uuidv4 } from 'uuid';
import {UniqueColumn} from "./decorators";
import {DataWrapperValidationError} from "./errors";
import {ObjectType} from "typeorm/common/ObjectType";
import {DeepPartial} from "typeorm/common/DeepPartial";

export interface IToJSONOptions {
    withDetails?: boolean;
}

export interface ISaveOptions extends Omit<SaveOptions, 'transaction'> {
    transaction: QueryRunner;
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
        return transaction ? transaction.manager.save(newInstance) : newInstance.save(_saveOptions) as any;
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

export abstract class DataWrapperEntity extends BaseDataWrapperEntity {

    @PrimaryGeneratedColumn()
    id: number;
}

export abstract class DataWrapperEntityWithCode extends DataWrapperEntity {

    @UniqueColumn({
        length: 36
    })
    code?: string;

    @BeforeInsert()
    _setCode() {
        if(!this.code) this.code = uuidv4();
    }

}

export abstract class DataWrapperEntityWithCodeNameDesc extends DataWrapperEntityWithCode {

    @UniqueColumn()
    name: string;

    @Column({nullable: true})
    description: string;

}