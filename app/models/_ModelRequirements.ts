import { FieldTypeEnum } from "../enums/FieldType";
import { _ExtendedField } from "./_ExtendedField";

/**
 * Interface defining the requirements for model classes.
 * This consolidates all the various requirements used across JC_Utils_Business methods.
 * Models should implement this interface to ensure they have all required properties.
 */
export interface _ModelRequirements {
    ExtendedFields?: _ExtendedField[];
}

/**
 * Type alias for model constructors that meet the static requirements.
 * This can be used as a constraint for generic functions that work with model constructors.
 */
export type _ModelConstructor<T = any> = {
    new (init?: Partial<T>): T;
    tableName: string;
    apiRoute: string;
    primaryKey: string;
    primaryDisplayField: string;
    cacheMinutes_get?: number;
    cacheMinutes_getList?: number;
    getKeys(): string[];
    jcFieldTypeforField(fieldName: keyof T): FieldTypeEnum;
};
