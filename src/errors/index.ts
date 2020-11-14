import {ValidationError} from "class-validator";
import {QueryFailedError} from "typeorm";
import {ERROR_CODES} from "./codes";

export interface IDataWrapperValidationErrorConstructor {
    entityName: string;
    validationErrors?: ValidationError[];
    failedDatabaseQuery?: QueryFailedError;
}

export interface IDataWrapperValidationError {
    propertyName: string;
    errors: string[];
}

export class DataWrapperValidationError extends Error {

    entityName: string = "";
    validationErrors: IDataWrapperValidationError[] = [];

    constructor(options: IDataWrapperValidationErrorConstructor) {
        super("Validation Error");

        const {validationErrors, failedDatabaseQuery, entityName} = options;

        this.entityName = entityName;

        if(Array.isArray(validationErrors)) {
            this.validationErrors.push(
                ...validationErrors.map(validationError => ({
                    propertyName: validationError.property,
                    errors: Object
                        .keys(validationError.constraints)
                        .map(constraintName => validationError.constraints[constraintName])
                }))
            )
        }

        if(failedDatabaseQuery) {
            this.validationErrors.push({
                propertyName: 'TODO',
                errors: [
                    ERROR_CODES[(failedDatabaseQuery as any).code] || 'Invalid value'
                ]
            })
        }

    }
}