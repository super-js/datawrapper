import {Connection, Document, Schema, SchemaOptions} from "mongoose";
import {Virtual} from "./types";

export interface IStaticMethods {
    [methodName: string] : any;
}

type TAttributes<P>  = { [name in keyof Partial<P>]: any }
type TDocumentMethods<D> = { [name in keyof Partial<D>]: Function }

export interface ISchemaDefinition<D, P> extends SchemaOptions {
    documentMethods?: TDocumentMethods<D>;
    staticMethods?: IStaticMethods;
    pre?: [string, any][];
    post?: [string, any][];
    isSubDocument?: boolean;
    timestamps?: boolean;
}

export interface ISchemaDefinitionCallbackOptions<S> {
    schemas: S;
    mongooseConnection: Connection;
}

export type SchemaAttributesCallback<P, S> = (options: ISchemaDefinitionCallbackOptions<S>) => TAttributes<P>;

interface DatawrapperSchemaOptions<D, P, S> {
    schemaDefinition?: ISchemaDefinition<D, P>;
    schemaAttributesCallback: SchemaAttributesCallback<P, S>
}
interface DatawrapperSchemaBuildOptions<S> {
    schemas: S;
    mongooseConnection: Connection;
}
export class DatawrapperSchema<D, P, S> {

    schemaInstance: Schema;
    schemaName: string;
    schemaAttributesCallback: SchemaAttributesCallback<P, S>;
    isSubDocument: boolean;

    constructor(options: DatawrapperSchemaOptions<D, P, S>) {

        const {
            schemaAttributesCallback, schemaDefinition = {}
        } = options;

        const {
            isSubDocument, timestamps = true, documentMethods = {}, staticMethods = {},
            pre = [], post = [],
            ...schemaOptions
        } = schemaDefinition;

        this.schemaAttributesCallback = schemaAttributesCallback;
        this.isSubDocument = !!isSubDocument;

        this.schemaInstance = new Schema<D>({},
            {
                timestamps,
                ...schemaOptions
            }
        );

        for(const methodName in documentMethods) {
            this.schemaInstance.methods[methodName] = documentMethods[methodName];
        }

        for(const methodName in staticMethods) {
            this.schemaInstance.statics[methodName] = staticMethods[methodName];
        }

        pre.forEach(preHook => {
            const [trigger, callback] = preHook;
            this.schemaInstance.pre(trigger, callback);
        });

        post.forEach(postHook => {
            const [trigger, callback] = postHook;
            this.schemaInstance.post(trigger, callback);
        });
    }

    getSchemaInstance = () => this.schemaInstance;

    setSchemaName = (schemaName: string) => this.schemaName = schemaName;
    getSchemaName = () => this.schemaName;

    build(buildOptions: DatawrapperSchemaBuildOptions<S>): DatawrapperSchema<D, P, S> {
        const attributes = this.schemaAttributesCallback(buildOptions);

        const {virtuals, embedded} = Object.keys(attributes).reduce((_, attributeName) => {

            const attribute = attributes[attributeName];

            if(!Array.isArray(attribute) || attribute.length > 0) {
                const attributeType = Array.isArray(attribute) ? attribute[0].type : attribute.type;

                _[attributeType && attributeType === Virtual ?
                    "virtuals" : "embedded"][attributeName] = attribute;
            }

            return _;
        }, {virtuals: {}, embedded: {}});


        for(const virtualAttributeName in virtuals) {
            if(virtuals.hasOwnProperty(virtualAttributeName)) {
                const isArray = Array.isArray(virtuals[virtualAttributeName]);
                const {get, set, ...options} = isArray ? virtuals[virtualAttributeName][0] : virtuals[virtualAttributeName];

                const virtualAttribute = this.schemaInstance.virtual(virtualAttributeName, isArray ? [options] : options);
                if(typeof get === "function") virtualAttribute.get(get);
                if(typeof set === "function") virtualAttribute.set(set);
            }
        }

        for(const embeddedAttributeName in embedded) {
            this.schemaInstance.add({[embeddedAttributeName] : embedded[embeddedAttributeName]})
        }

        return this;
    }

}

export function defineSchema<D extends Document, P, S>(schemaAttributesCallback: SchemaAttributesCallback<P, S>, schemaDefinition?: ISchemaDefinition<D, P>): DatawrapperSchema<D, P, S> {
    return new DatawrapperSchema<D, P, S>({
        schemaDefinition,
        schemaAttributesCallback
    });
}