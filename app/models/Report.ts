import { JC_Utils, JC_Utils_Files } from "../Utils";
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
import { CustomerModel } from "./Customer";
import { FileModel } from "./File";
import { UserModel } from "./User";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class ReportModel extends _Base implements _ModelRequirements {
    static tableName: string = "Report";
    static apiRoute: string = "report";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "Name";
    static defaultSortField: string = "Name";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //

    static async Get(id: string) {
        return await JC_Get<ReportModel>(ReportModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<ReportModel>(ReportModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: ReportModel) {
        return await JC_Put<ReportModel>(ReportModel, this.apiRoute, data);
    }
    static async CreateList(dataList: ReportModel[]) {
        return await JC_PutRaw<ReportModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "Report");
    }
    static async Update(data: ReportModel) {
        return await JC_Post<ReportModel>(ReportModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: ReportModel[]) {
        return await JC_PostRaw<ReportModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "Report");
    }
    static async Delete(id: string) {
        return await JC_Delete(ReportModel, this.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_PostRaw(`${this.apiRoute}/deleteList`, { ids }, undefined, "Report");
    }

    static async GetByCustomerId(customerId: string) {
        return await JC_GetRaw<ReportModel[]>(`${this.apiRoute}/byCustomer`, { customerId });
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    CustomerId: string;
    UserId: string;
    Name: string;
    FileId: string;

    // Extended
    Ex_CustomerName?: string;
    Ex_UserName?: string;
    Ex_UserEmail?: string;
    Ex_FileName?: string;
    Ex_FileKey?: string;
    Ex_FileSignedUrl?: string;

    ExtendedFields: _ExtendedField[] = [
        { Name: "Ex_CustomerName", FromField: "CustomerId", ReferenceModel: CustomerModel },
        { Name: "Ex_UserName", FromField: "UserId", ReferenceModel: UserModel },
        { Name: "Ex_UserEmail", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "Email" },
        { Name: "Ex_FileName", FromField: "FileId", ReferenceModel: FileModel },
        {
            Name: "Ex_FileKey",
            FromField: "FileId",
            ReferenceModel: FileModel,
            ReferenceField: "Key"
        },
        {
            Name: "Ex_FileSignedUrl",
            FromField: "FileId",
            ReferenceModel: FileModel,
            setWithCallback: async (obj: ReportModel) => {
                try {
                    // Use the Ex_FileKey that should already be populated
                    if (obj.Ex_FileKey) {
                        // Generate signed URL using the File's Key
                        return await JC_Utils_Files.getSignedUrlForKey(obj.Ex_FileKey);
                    }
                    return null;
                } catch (error) {
                    console.error("Error generating signed URL for report file:", error);
                    return null;
                }
            }
        }
    ];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<ReportModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.CustomerId = "";
        this.UserId = "";
        this.Name = "";
        this.FileId = "";
        this.Ex_CustomerName = undefined;
        this.Ex_UserName = undefined;
        this.Ex_UserEmail = undefined;
        this.Ex_FileName = undefined;
        this.Ex_FileKey = undefined;
        this.Ex_FileSignedUrl = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new ReportModel());
    }

    static jcFieldTypeforField(fieldName: keyof ReportModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "CustomerId":
                return FieldTypeEnum.Dropdown;
            case "UserId":
                return FieldTypeEnum.Dropdown;
            case "Name":
                return FieldTypeEnum.Text;
            case "FileId":
                return FieldTypeEnum.Text;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.Name}`;
    }
}
