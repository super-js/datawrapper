import type {Document, DocumentToObjectOptions} from "mongoose";

export interface DocumentProperties {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    changedBy?: string;
}

export type DataWrapperDocument<P extends DocumentProperties> = {
    toJSON(options?: DocumentToObjectOptions): P;
} & P & Document;