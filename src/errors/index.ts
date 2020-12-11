import {ValidationError} from "class-validator";
import {QueryFailedError} from "typeorm";
import {ERROR_CODES} from "./codes";

export interface IDataWrapperValidationErrorConstructor {
    entityName: string;
    validationErrors?: ValidationError[];
    failedDatabaseQuery?: QueryFailedError;
}

export interface IDataWrapperValidationErrors {
    [propertyName: string] :  string[];
}

export class DataWrapperValidationError extends Error {

    entityName: string = "";
    validationErrors: IDataWrapperValidationErrors = {};

    constructor(options: IDataWrapperValidationErrorConstructor) {
        super("Validation Error");

        const {validationErrors, failedDatabaseQuery, entityName} = options;

        this.entityName = entityName;

        if(Array.isArray(validationErrors)) {

            validationErrors.forEach(validationError => {
                this.validationErrors[validationError.property] =
                    Object
                        .keys(validationError.constraints)
                        .map(constraintName => validationError.constraints[constraintName])
            })
        }

        if(failedDatabaseQuery) {
            this.validationErrors[(failedDatabaseQuery as any).column] = [
                ERROR_CODES[(failedDatabaseQuery as any).code] || 'Invalid value'
            ]
        }

    }
}

export class DataWrapperNotFound extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class DataWrapperConnectionNotFound extends Error {
    constructor(message: string) {
        super(message);
    }
}