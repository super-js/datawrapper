import {UniqueColumn} from "../decorators";
import {BeforeInsert} from "typeorm";
import {v4 as uuidv4} from "uuid";
import {DataWrapperEntity} from "./DataWrapperEntity";
import {DataWrapperFile} from "./DataWrapperFile";

export abstract class DataWrapperEntityWithCode<FileEntity extends DataWrapperFile = DataWrapperFile> extends DataWrapperEntity<FileEntity> {

    @UniqueColumn({
        length: 36
    })
    code?: string;

    @BeforeInsert()
    _setCode() {
        if(!this.code) this.code = uuidv4();
    }

}