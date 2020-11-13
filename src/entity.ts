import {
    BaseEntity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    BeforeInsert,
    ObjectType
} from "typeorm";
import {classToPlain, Expose} from "class-transformer";
import { v4 as uuidv4 } from 'uuid';

export interface IToJSONOptions {
    withDetails?: boolean;
}

export abstract class BaseDataWrapperEntity extends BaseEntity {

    @CreateDateColumn()
    @Expose({ groups: ['withDetails'] })
    createdAt: Date;
    @UpdateDateColumn()
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
    @DeleteDateColumn({nullable: true})
    @Expose({ groups: ['withDetails'] })
    deletedAt?: Date;

    @BeforeInsert()
    _setInternalDates() {
        this.updatedAt = this.createdAt;
        this.changedBy = this.createdBy;
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

    @Column({
        unique: true
    })
    code?: string;

    @BeforeInsert()
    _setCode() {
        if(!this.code) this.code = uuidv4();
    }

}