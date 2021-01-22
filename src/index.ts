global.__DATE_FORMAT = process.env.DATE_FORMAT || ''
global.__DATETIME_FORMAT = process.env.DATETIME_FORMAT || ''

import {ConnectionOptions} from "typeorm/connection/ConnectionOptions";

import {createConnection, Connection, QueryRunner} from "typeorm";
import {DataWrapperConnectionNotFound} from "./errors";
import {DataWrapperTransaction} from "./transaction";

export type DataWrapperConnectionOptions<E> = {
    entityNameSpacesToRegisters: (keyof E & string)[];
} & ConnectionOptions;

export interface IDataWrapperBuildOptions<E, C> {
    connections: {[Name in keyof C]: DataWrapperConnectionOptions<E>}
}

export interface IDataWrapperDatabaseConnections {
    [connectionName: string]: Connection;
}


export abstract class DataWrapper<E = any, C = IDataWrapperDatabaseConnections> {

    abstract entities: E;
    connections: C = {} as C;

    public static async build<E, C, T extends DataWrapper<E, C> = DataWrapper<E,C>>(this: new () => T, options: IDataWrapperBuildOptions<E, C>): Promise<T> {

        const self = new this();

        const {connections} = options;

        for(let connectionName in connections) {
            await self.addDatabaseConnection(connectionName, connections[connectionName]);
        }

        return self;
    }

    async addDatabaseConnection(connectionName: string, connectionOptions: DataWrapperConnectionOptions<E>) {
        const {
            entityNameSpacesToRegisters = [], ...databaseConnectionOptions
        } = connectionOptions;

        this.connections[connectionName] = await createConnection({
            ...databaseConnectionOptions,
            name: connectionName,
            logger: "advanced-console",
            entities: entityNameSpacesToRegisters
                .flatMap(this.getEntitiesAsArray.bind(this)) as Function[]
        });

        entityNameSpacesToRegisters
            .forEach(entityNamespace =>
                this.setConnectionToEntityNamespace(entityNamespace, this.connections[connectionName])
            )
    }

    setConnectionToEntityNamespace(entityNamespace: string, connection: Connection): void {
        if(!this.entities.hasOwnProperty(entityNamespace)) return;

        Object
            .keys(this.entities[entityNamespace])
            .forEach(entityName => {
                this.entities[entityNamespace][entityName].useConnection(connection)
            });
    }

    getEntitiesAsArray(entityNamespace: string): Function[] {
        if(!this.entities.hasOwnProperty(entityNamespace)) return [];

        return Object
            .keys(this.entities[entityNamespace])
            .map(entityName => this.entities[entityNamespace][entityName])
    }

    async startTransaction(connectionName: string): Promise<DataWrapperTransaction> {
        if(!this.connections.hasOwnProperty(connectionName))
            throw new DataWrapperConnectionNotFound(`Connection ${connectionName} not found`);

        return DataWrapperTransaction.startTransaction(this.connections[connectionName])

    }

}

export * from "typeorm";
export * from "class-transformer";
export * as Validator from "class-validator";

export * from "./entities";
export * from "./decorators";
export * from "./errors";
export * from "./transaction";