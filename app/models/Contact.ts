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
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class ContactModel extends _Base implements _ModelRequirements {
    static tableName: string = "Contact";
    static apiRoute: string = "contact";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "Name";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static async Get(id: string) {
        return await JC_Get<ContactModel>(ContactModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<ContactModel>(ContactModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: ContactModel) {
        return await JC_Put<ContactModel>(ContactModel, this.apiRoute, data);
    }
    static async CreateList(dataList: ContactModel[]) {
        return await JC_PutRaw<ContactModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "Contact");
    }
    static async Update(data: ContactModel) {
        return await JC_Post<ContactModel>(ContactModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: ContactModel[]) {
        return await JC_PostRaw<ContactModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "Contact");
    }
    static async Delete(id: string) {
        return await JC_Delete(ContactModel, this.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_PostRaw(`${this.apiRoute}/deleteList`, { ids }, undefined, "Contact");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    UserId?: string;
    Name: string;
    Email: string;
    Phone?: string;
    Message: string;

    // Extended Fields
    Ex_UserName?: string;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [{ Name: "Ex_UserName", FromField: "UserId", ReferenceModel: UserModel }];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<ContactModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.UserId = undefined;
        this.Name = "";
        this.Email = "";
        this.Phone = undefined;
        this.Message = "";
        this.Ex_UserName = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new ContactModel());
    }

    static jcFieldTypeforField(fieldName: keyof ContactModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "UserId":
                return FieldTypeEnum.Text;
            case "Name":
                return FieldTypeEnum.Text;
            case "Email":
                return FieldTypeEnum.Email;
            case "Phone":
                return FieldTypeEnum.Text;
            case "Message":
                return FieldTypeEnum.Textarea;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.Name} | ${this.Email} | ${this.Message}`;
    }
}
