import { _ModelConstructor } from "./_ModelRequirements";

export interface _ExtendedField {
    Name: string;
    FromField: string;
    ReferenceModel: _ModelConstructor;
    ReferenceField?: string;
    setWithCallback?: (obj: any) => any;
}
