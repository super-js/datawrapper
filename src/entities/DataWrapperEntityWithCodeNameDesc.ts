import {Column} from "typeorm";
import {DataWrapperEntityWithCode} from "./DataWrapperEntityWithCode";
import {DataWrapperFile} from "./DataWrapperFile";

export abstract class DataWrapperEntityWithCodeNameDesc<FileEntity extends DataWrapperFile = DataWrapperFile> extends DataWrapperEntityWithCode<FileEntity> {

    @Column()
    name: string;

    @Column({nullable: true})
    description: string;

}