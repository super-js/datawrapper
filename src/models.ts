import fs from 'fs';
import path from 'path';
import {Connection, Model, Document} from 'mongoose';

import {DatawrapperSchema} from "./schemas";

export interface IModel<D extends Document, P> extends Omit<Model<D>, 'new'> {
    new(doc?: P): D
}

export async function loadModels<T>(mongooseConnection: Connection, schemaDirPath: string): Promise<T> {

    let schemas = {};

    // Filter, create Schema instances and builders
    const datawrapperSchemas: DatawrapperSchema<any, any, any>[] = await Promise.all(
        fs
            .readdirSync(schemaDirPath)
            .filter(schemaFile =>
                schemaFile.indexOf('.') !== 0
                && schemaFile.includes('.')
                && !schemaFile.includes('index')
                && !schemaFile.includes('spec')
                && !schemaFile.includes('_')
            )
            // Build schemas
            .map(async schemaFile => {
                const schemaName = path.parse(schemaFile).name;

                const datawrapperSchema = (await import(path.join(schemaDirPath, schemaFile))).default as DatawrapperSchema<any, any, any>;
                datawrapperSchema.setSchemaName(schemaName);
                schemas[schemaName] = datawrapperSchema.getSchemaInstance();

                return datawrapperSchema;
            })
    );

    return datawrapperSchemas.reduce((models, datawrapperSchema) => {

        const schemaName = datawrapperSchema.getSchemaName();
        datawrapperSchema.build({
            schemas, mongooseConnection
        });

        if(!datawrapperSchema.isSubDocument) {
            models[schemaName] = mongooseConnection.model(schemaName, datawrapperSchema.getSchemaInstance());
        }

        return models;
    }, {} as T);
}
