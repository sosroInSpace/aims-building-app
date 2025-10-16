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
import { CustomerDefectModel } from "./CustomerDefect";
import { FileModel } from "./File";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class DefectImageModel extends _Base implements _ModelRequirements {
    static tableName: string = "DefectImage";
    static apiRoute: string = "defectImage";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "ImageName";

    static cacheMinutes_get = 10;
    static cacheMinutes_getList = 20;

    // - -------- - //
    // - SERVICES - //
    // - -------- - //

    static async Get(id: string) {
        return await JC_Get<DefectImageModel>(DefectImageModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<DefectImageModel>(DefectImageModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: DefectImageModel) {
        return await JC_Put<DefectImageModel>(DefectImageModel, this.apiRoute, data);
    }
    static async CreateList(dataList: DefectImageModel[]) {
        return await JC_PutRaw<DefectImageModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "DefectImage");
    }
    static async Update(data: DefectImageModel) {
        return await JC_Post<DefectImageModel>(DefectImageModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: DefectImageModel[]) {
        return await JC_PostRaw<DefectImageModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "DefectImage");
    }
    static async Delete(id: string) {
        const defectImage = await this.Get(id);
        const result = await JC_Delete(DefectImageModel, this.apiRoute, id);
        if (result && defectImage && defectImage.ImageFileId) {
            try {
                await FileModel.Delete(defectImage.ImageFileId);
            } catch (error) {
                console.error("Error deleting associated file:", error);
                // Don't throw here - the DefectImage was already deleted successfully
            }
        }
        return result;
    }
    static async DeleteList(ids: string[]) {
        // Get all DefectImage records first to retrieve their ImageFileIds
        const defectImages: DefectImageModel[] = [];
        for (const id of ids) {
            try {
                const defectImage = await this.Get(id);
                if (defectImage) {
                    defectImages.push(defectImage);
                }
            } catch (error) {
                console.error(`Error getting DefectImage ${id}:`, error);
            }
        }

        // Delete the DefectImage records
        const result = await JC_PostRaw(`${this.apiRoute}/deleteList`, { ids }, undefined, "DefectImage");

        // If DefectImage deletions were successful, delete the associated Files
        if (result) {
            const fileIds = defectImages.map(di => di.ImageFileId).filter(fileId => fileId); // Filter out any null/undefined fileIds

            if (fileIds.length > 0) {
                try {
                    await FileModel.DeleteList(fileIds);
                } catch (error) {
                    console.error("Error deleting associated files:", error);
                    // Don't throw here - the DefectImages were already deleted successfully
                }
            }
        }

        return result;
    }

    // - CUSTOM SERVICES - //
    static async GetByDefectId(defectId: string, abortSignal?: AbortSignal) {
        return await JC_GetList<DefectImageModel>(DefectImageModel, `${this.apiRoute}/getByDefectId`, undefined, { defectId }, abortSignal);
    }
    static async GetByImageFileId(imageFileId: string, abortSignal?: AbortSignal) {
        return await JC_GetList<DefectImageModel>(DefectImageModel, `${this.apiRoute}/getByImageFileId`, undefined, { imageFileId }, abortSignal);
    }
    static async GetNextSortOrder(defectId: string) {
        return await JC_GetRaw<number>(`${this.apiRoute}/getNextSortOrder`, { defectId });
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    DefectId: string;
    ImageName: string;
    ImageFileId: string;
    SortOrder: number;

    // Extended Fields
    Ex_DefectName?: string;
    Ex_ImageKey?: string;
    Ex_ImageSignedUrl?: string;

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [
        { Name: "Ex_DefectName", FromField: "DefectId", ReferenceModel: CustomerDefectModel, ReferenceField: "Name" },
        {
            Name: "Ex_ImageKey",
            FromField: "ImageFileId",
            ReferenceModel: FileModel,
            ReferenceField: "Key"
        },
        {
            Name: "Ex_ImageSignedUrl",
            FromField: "ImageFileId",
            ReferenceModel: FileModel,
            setWithCallback: async (obj: DefectImageModel) => {
                try {
                    // Use the Ex_ImageKey that should already be populated
                    if (obj.Ex_ImageKey) {
                        // Generate signed URL using the File's Key
                        return await JC_Utils_Files.getSignedUrlForKey(obj.Ex_ImageKey);
                    }
                    return null;
                } catch (error) {
                    console.error("Error generating signed URL for defect image:", error);
                    return null;
                }
            }
        }
    ];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<DefectImageModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.DefectId = "";
        this.ImageName = "";
        this.ImageFileId = "";
        this.SortOrder = 999;
        this.Ex_DefectName = undefined;
        this.Ex_ImageKey = undefined;
        this.Ex_ImageSignedUrl = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new DefectImageModel());
    }

    static jcFieldTypeforField(fieldName: keyof DefectImageModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "DefectId":
                return FieldTypeEnum.Text;
            case "ImageName":
                return FieldTypeEnum.Text;
            case "ImageFileId":
                return FieldTypeEnum.Text;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.ImageName}`;
    }
}
