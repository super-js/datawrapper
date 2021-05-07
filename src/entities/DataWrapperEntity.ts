import {PrimaryGeneratedColumn} from "typeorm";
import {BaseDataWrapperEntity} from "./BaseDataWrapperEntity";

import {DataWrapperFile} from "./DataWrapperFile";

export abstract class DataWrapperEntity<FileEntity extends DataWrapperFile = DataWrapperFile> extends BaseDataWrapperEntity {
    @PrimaryGeneratedColumn({})
    id: number;

    private _files: FileEntity[] = [];

    set files(files: FileEntity[]) {
        this._files = files;
    }
    get files(): FileEntity[] {
        return this._files || [];
    }
}