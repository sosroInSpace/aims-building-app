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
import { JC_ListPagingModel, JC_ListPagingResultModel } from "./ComponentModels/JC_ListPagingModel";
import { UserModel } from "./User";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class FileModel extends _Base implements _ModelRequirements {
    static tableName: string = "File";
    static apiRoute: string = "file";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "FileName";
    static defaultSortField: string = "CreatedAt";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static async Get(id: string) {
        return await JC_Get<FileModel>(FileModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<FileModel>(FileModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: FileModel) {
        return await JC_Put<FileModel>(FileModel, this.apiRoute, data);
    }
    static async CreateList(dataList: FileModel[]) {
        return await JC_PutRaw<FileModel[]>(`${this.apiRoute}?list=true`, dataList, undefined, "File");
    }
    static async Update(data: FileModel) {
        return await JC_Post<FileModel>(FileModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: FileModel[]) {
        return await JC_PostRaw<FileModel[]>(`${this.apiRoute}?list=true`, dataList, undefined, "File");
    }
    static async Delete(id: string) {
        return await JC_Delete(FileModel, this.apiRoute, id);
    }
    static async DeleteList(idList: string[]) {
        return await JC_PostRaw(`${this.apiRoute}?list=true`, { idList });
    }

    // - CUSTOM SERVICES - //
    static async GetByUserId(userId: string, abortSignal?: AbortSignal) {
        return await JC_GetList<FileModel>(FileModel, `${this.apiRoute}/byUser`, undefined, { userId }, abortSignal);
    }
    static async GetListByIdsList(fileIds: string[]): Promise<JC_ListPagingResultModel<FileModel>> {
        const response = await JC_PostRaw<{ fileIds: string[] }, JC_ListPagingResultModel<FileModel>>(`${this.apiRoute}/getListByIdsList`, { fileIds });
        return response;
    }
    static async GetSignedUrl(key: string, expiresInSeconds?: number) {
        const params: any = { key };
        if (expiresInSeconds !== undefined) {
            params.expiresInSeconds = expiresInSeconds.toString();
        }
        return await JC_GetRaw<string>(`${this.apiRoute}/getSignedUrl`, params);
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    UserId: string;
    FileName: string;
    StorageProvider: string;
    Bucket: string;
    Key: string;
    MimeType: string;
    SizeBytes: number;
    IsPublic: boolean;
    Notes?: string;
    CreatedAt: Date;
    ModifiedAt?: Date;
    Deleted: boolean;

    // Extended
    Ex_UserName?: string;
    Ex_UserEmail?: string;
    Ex_FileSignedUrl?: string;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [
        { Name: "Ex_UserName", FromField: "UserId", ReferenceModel: UserModel },
        { Name: "Ex_UserEmail", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "Email" },
        {
            Name: "Ex_FileSignedUrl",
            FromField: "Key",
            ReferenceModel: FileModel,
            setWithCallback: async (obj: FileModel) => {
                try {
                    // Generate signed URL using the File's Key
                    if (obj.Key) {
                        return await JC_Utils_Files.getSignedUrlForKey(obj.Key);
                    }
                    return null;
                } catch (error) {
                    console.error("Error generating signed URL for file:", error);
                    return null;
                }
            }
        }
    ];

    constructor(init?: Partial<FileModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.UserId = "";
        this.FileName = "";
        this.StorageProvider = "";
        this.Bucket = "";
        this.Key = "";
        this.MimeType = "";
        this.SizeBytes = 0;
        this.IsPublic = false;
        this.Notes = undefined;
        this.CreatedAt = new Date();
        this.ModifiedAt = undefined;
        this.Deleted = false;
        this.Ex_UserName = undefined;
        this.Ex_UserEmail = undefined;
        this.Ex_FileSignedUrl = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new FileModel());
    }

    static jcFieldTypeforField(fieldName: keyof FileModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "UserId":
                return FieldTypeEnum.Text;
            case "FileName":
                return FieldTypeEnum.Text;
            case "StorageProvider":
                return FieldTypeEnum.Text;
            case "Bucket":
                return FieldTypeEnum.Text;
            case "Key":
                return FieldTypeEnum.Text;
            case "MimeType":
                return FieldTypeEnum.Text;
            case "SizeBytes":
                return FieldTypeEnum.Number;
            case "IsPublic":
                return FieldTypeEnum.Dropdown;
            case "Notes":
                return FieldTypeEnum.Textarea;
            case "CreatedAt":
                return FieldTypeEnum.Date;
            case "ModifiedAt":
                return FieldTypeEnum.Date;
            case "Deleted":
                return FieldTypeEnum.Dropdown;
            default:
                return FieldTypeEnum.Text;
        }
    }
}
