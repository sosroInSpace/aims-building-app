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
import { UserModel } from "./User";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class UserPersistedDataModel implements _ModelRequirements {
    static tableName: string = "UserPersistedData";
    static apiRoute: string = "userPersistedData";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "Code";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static async Get(id: string) {
        return await JC_Get<UserPersistedDataModel>(UserPersistedDataModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<UserPersistedDataModel>(UserPersistedDataModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: UserPersistedDataModel) {
        return await JC_Put<UserPersistedDataModel>(UserPersistedDataModel, this.apiRoute, data);
    }
    static async CreateList(dataList: UserPersistedDataModel[]) {
        return await JC_PutRaw<UserPersistedDataModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "UserPersistedData");
    }
    static async Update(data: UserPersistedDataModel) {
        return await JC_Post<UserPersistedDataModel>(UserPersistedDataModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: UserPersistedDataModel[]) {
        return await JC_PostRaw<UserPersistedDataModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "UserPersistedData");
    }
    static async Delete(id: string) {
        return await JC_Delete(UserPersistedDataModel, this.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_PostRaw(`${this.apiRoute}/deleteList`, { ids }, undefined, "UserPersistedData");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    UserId: string;
    Code: string;
    Value: string;

    // Extended Fields
    Ex_UserName?: string;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [{ Name: "Ex_UserName", FromField: "UserId", ReferenceModel: UserModel }];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<UserPersistedDataModel>) {
        this.Id = JC_Utils.generateGuid();
        this.UserId = "";
        this.Code = "";
        this.Value = "";
        this.Ex_UserName = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new UserPersistedDataModel());
    }

    static jcFieldTypeforField(fieldName: keyof UserPersistedDataModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "UserId":
                return FieldTypeEnum.Text;
            case "Code":
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
        return `${this.Code} | ${this.Value}`;
    }
}
