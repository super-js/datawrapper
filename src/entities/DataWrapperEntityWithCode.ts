import {UniqueColumn} from "../decorators";
import {BeforeInsert} from "typeorm";
import {v4 as uuidv4} from "uuid";
import {DataWrapperEntity} from "./DataWrapperEntity";

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