import {Column} from "typeorm";
import {DataWrapperEntityWithCode} from "./DataWrapperEntityWithCode";

export type DataWrapperFileStorageInfo = {
    bucketName: string;
    key: string;
    url: string;
}

export interface IDataWrapperFileBasicInfo {
    id: number,
    fileName: string,
    fileLabel?: string,
    contentType: string,
    contentLength: number,
    contentEncoding?: string
}

export abstract class DataWrapperFile extends DataWrapperEntityWithCode {

    @Column()
    fileName: string;

    @Column()
    fullFilePath: string;

    @Column({nullable: true})
    fileLabel?: string;

    @Column()
    storageType: string;

    @Column({
        type: "json"
    })
    storageInfo: DataWrapperFileStorageInfo;

    @Column()
    entityTypeName: string;

    @Column()
    entityInstanceId: number;

    @Column()
    contentType: string;

    @Column()
    contentEncoding: string;

    @Column()
    contentLength: number;

    @Column({nullable: true})
    fileUrl?: string;

    @Column({nullable: true})
    eTag?: string;

    toBasicInfo(): IDataWrapperFileBasicInfo {
        return {
            id: this.id,
            fileName: this.fileName,
            fileLabel: this.fileLabel,
            contentType: this.contentType,
            contentLength: this.contentLength,
            contentEncoding: this.contentEncoding
        }
    }

}