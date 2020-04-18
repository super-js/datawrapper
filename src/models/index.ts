import fs from 'fs';
import path from 'path';
import {Connection, Model, Document} from 'mongoose';

export * from "./define";

export interface IModel<T extends Document, P> extends Omit<Model<T>, 'new'> {
    new(doc?: P): T
}

export async function loadModels<T>(mongooseConnection: Connection, dirPath: string): Promise<T> {
    const models: T = {} as T;

    await Promise.all(
        fs
            .readdirSync(dirPath)
            .filter(schemaFile =>
                schemaFile.indexOf('.') !== 0
                && !schemaFile.includes('index')
                && !schemaFile.includes('spec')
                && !schemaFile.includes('_')
            )
            .map(async schemaFile => {
                const schemaName = path.parse(schemaFile).name;
                const getModule = await import(path.join(dirPath, schemaFile));

                models[schemaName] = getModule.default(schemaName, mongooseConnection);
            }),
    );

    return models;
}
