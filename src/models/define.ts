import {
    Connection,
    Document,
    Model,
    Schema,
    SchemaOptions,
    HookSyncCallback,
    HookAsyncCallback
} from "mongoose";

export type ModelDefiner = <M extends Document>(name: string, mongooseConnection: Connection) => Model<M>;

export interface IStaticMethods {
    [methodName: string] : any;
}

type TAttributes<P>  = { [name in keyof Partial<P>]: any }
type TDocumentMethods<D> = { [name in keyof Partial<D>]: Function }

export const Virtual = "VIRTUAL";

export interface IModelDefinition<D, P> {
    attributes?: TAttributes<P>;
    options?: SchemaOptions;
    documentMethods?: TDocumentMethods<D>;
    staticMethods?: IStaticMethods;
    pre?: [string, any][];
    post?: [string, any][];
}

export function defineModel<D extends Document, P>(modelDefinition: IModelDefinition<D, P>): ModelDefiner {

    const {
        attributes = {}, options = {}, documentMethods = {}, staticMethods = {}, pre = [], post = []
    } = modelDefinition;

    const {virtuals, embedded} = Object.keys(attributes).reduce((_, attributeName) => {

        const attribute = attributes[attributeName];
        _[attribute.type && attribute.type === Virtual ?
            "virtuals" : "embedded"][attributeName] = attribute;

        return _;
    }, {virtuals: {}, embedded: {}});

    const scheme = new Schema<D>(
        embedded,
        {
            timestamps: true,
            ...options
        }
    );

    for(const virtualAttributeName in virtuals) {
        if(virtuals.hasOwnProperty(virtualAttributeName)) {
            const {get, set, ...options} = virtuals[virtualAttributeName];

            const virtualAttribute = scheme.virtual(virtualAttributeName, options);
            if(typeof get === "function") virtualAttribute.get(get);
            if(typeof set === "function") virtualAttribute.set(set);
        }
    }

    for(const methodName in documentMethods) {
        scheme.methods[methodName] = documentMethods[methodName];
    }

    for(const methodName in staticMethods) {
        scheme.statics[methodName] = staticMethods[methodName];
    }

    pre.forEach(preHook => {
        const [trigger, callback] = preHook;
        scheme.pre<D>(trigger, callback);
    });

    post.forEach(postHook => {
        const [trigger, callback] = postHook;
        scheme.post<D>(trigger, callback);
    });

    return <M extends Document>(name: string, mongooseConnection: Connection) => mongooseConnection.model<M>(name, scheme);
}