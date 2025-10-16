import { JC_Delete } from "../apiServices/JC_Delete";
import { JC_Get } from "../apiServices/JC_Get";
import { JC_GetList } from "../apiServices/JC_GetList";
import { JC_GetRaw } from "../apiServices/JC_GetRaw";
import { JC_Post } from "../apiServices/JC_Post";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import { JC_Put } from "../apiServices/JC_Put";
import { JC_PutRaw } from "../apiServices/JC_PutRaw";
import { FieldTypeEnum } from "../enums/FieldType";
import { JC_ListPagingModel } from "./ComponentModels/JC_ListPagingModel";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class GlobalSettingsModel implements _ModelRequirements {
    static tableName: string = "GlobalSettings";
    static apiRoute: string = "globalSettings";
    static primaryKey: string = "Code";
    static primaryDisplayField: string = "Code";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static async Get(code: string) {
        return await JC_Get<GlobalSettingsModel>(GlobalSettingsModel, this.apiRoute, { code });
    }
    static async ItemExists(code: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { code });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<GlobalSettingsModel>(GlobalSettingsModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: GlobalSettingsModel) {
        return await JC_Put<GlobalSettingsModel>(GlobalSettingsModel, this.apiRoute, data);
    }
    static async CreateList(dataList: GlobalSettingsModel[]) {
        return await JC_PutRaw<GlobalSettingsModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "GlobalSettings");
    }
    static async Update(data: GlobalSettingsModel) {
        return await JC_Post<GlobalSettingsModel>(GlobalSettingsModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: GlobalSettingsModel[]) {
        return await JC_PostRaw<GlobalSettingsModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "GlobalSettings");
    }
    static async Delete(code: string) {
        return await JC_Delete(GlobalSettingsModel, this.apiRoute, code);
    }
    static async DeleteList(codes: string[]) {
        return await JC_PostRaw(`${this.apiRoute}/deleteList`, { codes }, undefined, "GlobalSettings");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Code: string;
    Description: string;
    Value: string;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<GlobalSettingsModel>) {
        this.Code = "";
        this.Description = "";
        this.Value = "";
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new GlobalSettingsModel());
    }

    static jcFieldTypeforField(fieldName: keyof GlobalSettingsModel) {
        switch (fieldName) {
            case "Code":
                return FieldTypeEnum.Text;
            case "Description":
                return FieldTypeEnum.Text;
            case "Value":
                return FieldTypeEnum.Text;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.Code} | ${this.Description} | ${this.Value}`;
    }
}
