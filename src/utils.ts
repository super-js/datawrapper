import {Types}from "mongoose";

export function convertToObjectId(id: any): Types.ObjectId {
    return Types.ObjectId(id);
}