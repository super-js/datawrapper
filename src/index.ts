import { connect, Mongoose } from 'mongoose';

import {defineModel, loadModels} from './models';

import * as utils from './utils';

export interface IDataWrapperOptions {
    host: string;
    port: number;
    db: string;
    user?: string;
    password?: string;
    debug?: boolean;
}

export interface IDataWrapperConnectOptions {
    modelsDirPath: string;
}

const _transform = (doc, ret) => {

    if(doc._id) {
        ret.id = doc._id;
        delete ret._id;
    }

    delete ret.createdAt;
    delete ret.updatedAt;

    return ret;
};

export class DataWrapper<T> {
    _connectionOptions: IDataWrapperOptions = {} as IDataWrapperOptions;
    _mongooseInstance: Mongoose;

    models: T = {} as T;
    utils = utils;

    constructor(dataWrapperOptions: IDataWrapperOptions) {

        const {...connectionOptions} = dataWrapperOptions;

        this._connectionOptions = connectionOptions;
    }

    async connect(connectOptions: IDataWrapperConnectOptions): Promise<DataWrapper<T>> {
        const { host, port, db, debug, ...mongoConnectionOptions } = this._connectionOptions;

        this._mongooseInstance = await connect(`mongodb://${host}:${port}/${db}`, {
            ...mongoConnectionOptions,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            //TBD SSL for production
        });

        if(debug) this._mongooseInstance.set('debug', true);
        this._mongooseInstance.set('toObject', {versionKey: false, transform: _transform, virtuals: true});
        this._mongooseInstance.set('toJSON', {versionKey: false, transform: _transform, virtuals: true});

        this.models = await loadModels<T>(this._mongooseInstance.connection, connectOptions.modelsDirPath);

        return this;
    }

    async disconnect(): Promise<DataWrapper<T>> {
        if(this._mongooseInstance) {
            await this._mongooseInstance.disconnect();
        }

        return this;
    }

    isConnected(): boolean {
        return this._mongooseInstance && this._mongooseInstance.connection.readyState === 1;
    }

}

export * from "./utils";
export {defineModel};