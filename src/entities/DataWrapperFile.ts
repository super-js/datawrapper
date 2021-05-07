import {Column, In} from "typeorm";
import {DataWrapperEntityWithCode} from "./DataWrapperEntityWithCode";
import {DataWrapperEntity} from "./DataWrapperEntity";

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

export interface IDataWrapperFindFilesOptions {
    entityInstanceId?: number;
    entityInstanceIds?: number[];
    entityInstanceCode?: string;
    entityInstanceCodes?: string[];
    withDetails?: boolean;
}

export abstract class DataWrapperFile<E = any> extends DataWrapperEntityWithCode {

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
    entityInstanceCode?: string;

    entityInstance?: E;

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

    static async findFilesFor<T extends DataWrapperFile>(entityTypeName: string, findFilesOptions: IDataWrapperFindFilesOptions): Promise<T[]> {
        const { entityInstanceId, entityInstanceIds, entityInstanceCode, entityInstanceCodes, withDetails } = findFilesOptions as any;

        let where = {};

        if(Array.isArray(entityInstanceIds)) where['id'] = In(entityInstanceIds);
        if(Array.isArray(entityInstanceCodes)) where['code'] = In(entityInstanceIds);

        if(entityInstanceId) where['id'] = entityInstanceId;
        if(entityInstanceCode) where['code'] = entityInstanceCode;

        const files = await this.find({
            select: withDetails ?
                undefined : ['id', 'code', 'fileName', 'fileLabel', 'contentType', 'contentLength', 'contentEncoding'],
            where,
            order: {
                createdAt: "ASC",
                fileName: "ASC",
            }
        });

        return files as T[];
    }

    static mapFilesToEntities<T extends DataWrapperFile, E extends DataWrapperEntity>(entityInstances: E[], files: T[]): E[] {
        return entityInstances.map(entityInstance => {
            entityInstance.files = files.filter(file => file.entityInstanceId === entityInstance.id);
            return entityInstance;
        });
    }

}