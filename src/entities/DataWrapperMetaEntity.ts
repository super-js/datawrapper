import {BeforeInsert, Column, PrimaryColumn} from "typeorm";
import {BaseDataWrapperEntity} from "./BaseDataWrapperEntity";
import {UniqueColumn} from "../decorators";
import {v4 as uuidv4} from "uuid";

export abstract class DataWrapperMetaEntity extends BaseDataWrapperEntity {

    @PrimaryColumn({unsigned: true})
    id: number;
    @UniqueColumn({
        length: 36
    })
    code?: string;
    @Column()
    name: string;
    @Column({default: false})
    isDefault: boolean;
    @Column({nullable: true})
    description: string;

    @BeforeInsert()
    _setCode() {
        if(!this.code) this.code = uuidv4();
    }

    static get metaData(): any[] {
        return [];
    }

    static get metaDataAsObject(): any {
        return {};
    }

    static get metaDataAsCodes(): any {
        return {};
    }

}