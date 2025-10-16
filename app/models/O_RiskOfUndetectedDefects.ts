import { JC_Utils_Business } from "../Utils";
import { JC_Utils } from "../Utils";
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
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class O_RiskOfUndetectedDefectsModel extends _Base implements _ModelRequirements {
    static tableName: string = "O_RiskOfUndetectedDefects";
    static apiRoute: string = "o_riskOfUndetectedDefects";
    static primaryKey: string = "Code";
    static primaryDisplayField: string = "Name";

    static cacheMinutes_get = 10;
    static cacheMinutes_getList = 20;

    // - -------- - //
    // - SERVICES - //
    // - -------- - //

    static async Get(code: string) {
        return await JC_Get<O_RiskOfUndetectedDefectsModel>(O_RiskOfUndetectedDefectsModel, this.apiRoute, { code });
    }
    static async ItemExists(code: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { code });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        if (typeof window !== "undefined") {
            return await JC_GetList<O_RiskOfUndetectedDefectsModel>(O_RiskOfUndetectedDefectsModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
        } else {
            return await JC_Utils_Business.sqlGetList(O_RiskOfUndetectedDefectsModel, "");
        }
    }
    static async Create(data: O_RiskOfUndetectedDefectsModel) {
        let response = await JC_Put<O_RiskOfUndetectedDefectsModel>(O_RiskOfUndetectedDefectsModel, this.apiRoute, data);
        return response;
    }
    static async CreateList(dataList: O_RiskOfUndetectedDefectsModel[]) {
        return await JC_PutRaw<O_RiskOfUndetectedDefectsModel[]>(`${this.apiRoute}?list=true`, dataList, undefined, "O_RiskOfUndetectedDefects");
    }
    static async Update(data: O_RiskOfUndetectedDefectsModel) {
        return await JC_Post<O_RiskOfUndetectedDefectsModel>(O_RiskOfUndetectedDefectsModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: O_RiskOfUndetectedDefectsModel[]) {
        return await JC_PostRaw<O_RiskOfUndetectedDefectsModel[]>(`${this.apiRoute}?list=true`, dataList, undefined, "O_RiskOfUndetectedDefects");
    }
    static async UpdateSortOrder(code: string, sortOrder: number) {
        return await JC_PostRaw(`${this.apiRoute}?sortOrder=true`, { code, sortOrder }, undefined, "O_RiskOfUndetectedDefects");
    }
    static async Delete(code: string) {
        return await JC_Delete(O_RiskOfUndetectedDefectsModel, this.apiRoute, code);
    }
    static async DeleteList(codes: string[]) {
        return await JC_Delete(O_RiskOfUndetectedDefectsModel, `${this.apiRoute}?codes=${codes.join(",")}`, "");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Code: string;
    Name: string;
    SortOrder: number;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<O_RiskOfUndetectedDefectsModel>) {
        super(init);
        this.Code = "";
        this.Name = "";
        this.SortOrder = 999;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new O_RiskOfUndetectedDefectsModel());
    }

    static jcFieldTypeforField(fieldName: keyof O_RiskOfUndetectedDefectsModel) {
        switch (fieldName) {
            case "Code":
                return FieldTypeEnum.Text;
            case "Name":
                return FieldTypeEnum.Text;
            case "SortOrder":
                return FieldTypeEnum.NumberStepper;
            default:
                return FieldTypeEnum.Text;
        }
    }

    toString() {
        return this.Name;
    }
}
