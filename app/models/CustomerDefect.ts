import { JC_Utils } from "../Utils";
import { DefectImageBusiness } from "../api/defectImage/business";
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
import { O_AreaModel } from "./O_Area";
import { O_BuildingModel } from "./O_Building";
import { O_DefectFindingModel } from "./O_DefectFinding";
import { O_DefectOrientationModel } from "./O_DefectOrientation";
import { O_LocationModel } from "./O_Location";
import { O_SeverityModel } from "./O_Severity";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class CustomerDefectModel extends _Base implements _ModelRequirements {
    static tableName: string = "CustomerDefect";
    static apiRoute: string = "customerDefect";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "Name";

    static cacheMinutes_get = 10;
    static cacheMinutes_getList = 20;

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static async Get(id: string) {
        return await JC_Get<CustomerDefectModel>(CustomerDefectModel, this.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${this.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<CustomerDefectModel>(CustomerDefectModel, `${this.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async Create(data: CustomerDefectModel) {
        return await JC_Put<CustomerDefectModel>(CustomerDefectModel, this.apiRoute, data);
    }
    static async CreateList(dataList: CustomerDefectModel[]) {
        return await JC_PutRaw<CustomerDefectModel[]>(`${this.apiRoute}/createList`, dataList, undefined, "CustomerDefect");
    }
    static async Update(data: CustomerDefectModel) {
        return await JC_Post<CustomerDefectModel>(CustomerDefectModel, this.apiRoute, data);
    }
    static async UpdateList(dataList: CustomerDefectModel[]) {
        return await JC_PostRaw<CustomerDefectModel[]>(`${this.apiRoute}/updateList`, dataList, undefined, "CustomerDefect");
    }
    static async Delete(id: string) {
        return await JC_Delete(CustomerDefectModel, this.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_PostRaw(`${this.apiRoute}/deleteList`, { ids }, undefined, "CustomerDefect");
    }

    static async GetByCustomerId(customerId: string) {
        return await JC_GetList<CustomerDefectModel>(CustomerDefectModel, `${this.apiRoute}/byCustomer`, undefined, { customerId });
    }

    static async AiGenerateInfoFromDefectId(defectId: string): Promise<{ SelectedOptions: Array<{ Code: string; NameOverride: string | null; InformationOverride: string | null }> }> {
        return await JC_PostRaw<{ defectId: string }, { SelectedOptions: Array<{ Code: string; NameOverride: string | null; InformationOverride: string | null }> }>(`${this.apiRoute}/aiGenerateInfoFromDefectId`, { defectId });
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    CustomerId: string;
    Name: string | undefined;
    BuildingListJson: string | undefined;
    AreaListJson: string | undefined;
    LocationListJson: string | undefined;
    OrientationCode: string | undefined;
    DefectFindingCode: string | undefined;
    DefectFindingNameOverride: string | undefined;
    DefectFindingInformationOverride: string | undefined;
    SeverityListJson: string | undefined;
    SortOrder: number;

    // Extended Fields
    Ex_CustomerName?: string;
    Ex_BuildingCodesList?: string[];
    Ex_BuildingList?: O_BuildingModel[];
    Ex_BuildingNamesList?: string[];
    Ex_AreaCodesList?: string[];
    Ex_AreaList?: O_AreaModel[];
    Ex_AreaNamesList?: string[];
    Ex_LocationCodesList?: string[];
    Ex_LocationList?: O_LocationModel[];
    Ex_LocationNamesList?: string[];
    Ex_OrientationName?: string;
    Ex_DefectFindingName?: string;
    Ex_SeverityCodesList?: string[];
    Ex_SeverityList?: O_SeverityModel[];
    Ex_SeverityNamesList?: string[];
    Ex_ImageFileIds?: string[];

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [
        { Name: "Ex_CustomerName", FromField: "CustomerId", ReferenceModel: CustomerModel },
        {
            Name: "Ex_BuildingCodesList",
            FromField: "BuildingListJson",
            ReferenceModel: O_BuildingModel,
            setWithCallback: (instance: CustomerDefectModel) => {
                // Extract codes from BuildingListJson (handle both old and new format)
                if (instance.BuildingListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.BuildingListJson);
                        if (Array.isArray(selectedItems)) {
                            return selectedItems.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        { Name: "Ex_BuildingList", FromField: "BuildingListJson", ReferenceModel: O_BuildingModel },
        {
            Name: "Ex_BuildingNamesList",
            FromField: "BuildingListJson",
            ReferenceModel: O_BuildingModel,
            setWithCallback: async (instance: CustomerDefectModel) => {
                // Return array of all selected building names (with overrides if available)
                if (instance.BuildingListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.BuildingListJson);
                        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
                            const allOptions = await O_BuildingModel.GetList();
                            return selectedItems.map(item => {
                                // Check if it's the new structure with objects
                                if (typeof item === "object" && item !== null && "Code" in item) {
                                    const buildingItem = item as O_BuildingModel;
                                    // Use override if available, otherwise get from options
                                    if (buildingItem.NameOverride) {
                                        return buildingItem.NameOverride;
                                    }
                                    const option = allOptions.ResultList?.find(opt => opt.Code === buildingItem.Code);
                                    return option?.Name || "";
                                } else {
                                    // Old structure - just codes
                                    const option = allOptions.ResultList?.find(opt => opt.Code === item);
                                    return option?.Name || "";
                                }
                            });
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        {
            Name: "Ex_AreaCodesList",
            FromField: "AreaListJson",
            ReferenceModel: O_AreaModel,
            setWithCallback: (instance: CustomerDefectModel) => {
                // Extract codes from AreaListJson (handle both old and new format)
                if (instance.AreaListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.AreaListJson);
                        if (Array.isArray(selectedItems)) {
                            return selectedItems.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        { Name: "Ex_AreaList", FromField: "AreaListJson", ReferenceModel: O_AreaModel },
        {
            Name: "Ex_AreaNamesList",
            FromField: "AreaListJson",
            ReferenceModel: O_AreaModel,
            setWithCallback: async (instance: CustomerDefectModel) => {
                // Return array of all selected area names (with overrides if available)
                if (instance.AreaListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.AreaListJson);
                        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
                            const allOptions = await O_AreaModel.GetList();
                            return selectedItems.map(item => {
                                // Check if it's the new structure with objects
                                if (typeof item === "object" && item !== null && "Code" in item) {
                                    const areaItem = item as O_AreaModel;
                                    // Use override if available, otherwise get from options
                                    if (areaItem.NameOverride) {
                                        return areaItem.NameOverride;
                                    }
                                    const option = allOptions.ResultList?.find(opt => opt.Code === areaItem.Code);
                                    return option?.Name || "";
                                } else {
                                    // Old structure - just codes
                                    const option = allOptions.ResultList?.find(opt => opt.Code === item);
                                    return option?.Name || "";
                                }
                            });
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        {
            Name: "Ex_LocationCodesList",
            FromField: "LocationListJson",
            ReferenceModel: O_LocationModel,
            setWithCallback: (instance: CustomerDefectModel) => {
                // Extract codes from LocationListJson (handle both old and new format)
                if (instance.LocationListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.LocationListJson);
                        if (Array.isArray(selectedItems)) {
                            return selectedItems.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        { Name: "Ex_LocationList", FromField: "LocationListJson", ReferenceModel: O_LocationModel },
        {
            Name: "Ex_LocationNamesList",
            FromField: "LocationListJson",
            ReferenceModel: O_LocationModel,
            setWithCallback: async (instance: CustomerDefectModel) => {
                // Return array of all selected location names (with overrides if available)
                if (instance.LocationListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.LocationListJson);
                        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
                            const allOptions = await O_LocationModel.GetList();
                            return selectedItems.map(item => {
                                // Check if it's the new structure with objects
                                if (typeof item === "object" && item !== null && "Code" in item) {
                                    const locationItem = item as O_LocationModel;
                                    // Use override if available, otherwise get from options
                                    if (locationItem.NameOverride) {
                                        return locationItem.NameOverride;
                                    }
                                    const option = allOptions.ResultList?.find(opt => opt.Code === locationItem.Code);
                                    return option?.Name || "";
                                } else {
                                    // Old structure - just codes
                                    const option = allOptions.ResultList?.find(opt => opt.Code === item);
                                    return option?.Name || "";
                                }
                            });
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        { Name: "Ex_OrientationName", FromField: "OrientationCode", ReferenceModel: O_DefectOrientationModel },
        { Name: "Ex_DefectFindingName", FromField: "DefectFindingCode", ReferenceModel: O_DefectFindingModel },
        { Name: "Ex_DefectFindingInformation", FromField: "DefectFindingCode", ReferenceModel: O_DefectFindingModel, ReferenceField: "Information" },

        {
            Name: "Ex_SeverityCodesList",
            FromField: "SeverityListJson",
            ReferenceModel: O_SeverityModel,
            setWithCallback: (instance: CustomerDefectModel) => {
                // Extract codes from SeverityListJson (handle both old and new format)
                if (instance.SeverityListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.SeverityListJson);
                        if (Array.isArray(selectedItems)) {
                            return selectedItems.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        {
            Name: "Ex_SeverityList",
            FromField: "SeverityListJson",
            ReferenceModel: O_SeverityModel,
            setWithCallback: (instance: CustomerDefectModel) => {
                if (instance.SeverityListJson) {
                    try {
                        return JSON.parse(instance.SeverityListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_SeverityNamesList",
            FromField: "SeverityListJson",
            ReferenceModel: O_SeverityModel,
            setWithCallback: async (instance: CustomerDefectModel) => {
                // Return array of all selected severity names (with overrides if available)
                if (instance.SeverityListJson) {
                    try {
                        const selectedItems = JSON.parse(instance.SeverityListJson);
                        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
                            const allOptions = await O_SeverityModel.GetList();
                            return selectedItems.map(item => {
                                // Check if it's the new structure with objects
                                if (typeof item === "object" && item !== null && "Code" in item) {
                                    const severityItem = item as O_SeverityModel;
                                    // Use override if available, otherwise get from options
                                    if (severityItem.NameOverride) {
                                        return severityItem.NameOverride;
                                    }
                                    const option = allOptions.ResultList?.find(opt => opt.Code === severityItem.Code);
                                    return option?.Name || "";
                                } else {
                                    // Old structure - just codes
                                    const option = allOptions.ResultList?.find(opt => opt.Code === item);
                                    return option?.Name || "";
                                }
                            });
                        }
                    } catch {
                        return [];
                    }
                }
                return [];
            }
        },
        {
            Name: "Ex_ImageFileIds",
            FromField: "Id",
            ReferenceModel: CustomerDefectModel,
            setWithCallback: async (obj: CustomerDefectModel) => {
                try {
                    // Get DefectImages for this defect and extract ImageFileIds
                    const defectImages = await DefectImageBusiness.GetByDefectId(obj.Id);
                    return defectImages.map((img: any) => img.ImageFileId);
                } catch (error) {
                    console.error("Error loading image file IDs for defect:", error);
                    return [];
                }
            }
        }
    ];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<CustomerDefectModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.CustomerId = "";
        this.Name = undefined;
        this.BuildingListJson = undefined;
        this.AreaListJson = undefined;
        this.LocationListJson = undefined;
        this.OrientationCode = undefined;
        this.DefectFindingCode = undefined;
        this.DefectFindingNameOverride = undefined;
        this.DefectFindingInformationOverride = undefined;
        this.SeverityListJson = undefined;
        this.SortOrder = 999;
        this.Ex_CustomerName = undefined;
        this.Ex_BuildingCodesList = undefined;
        this.Ex_BuildingList = undefined;
        this.Ex_BuildingNamesList = undefined;
        this.Ex_AreaCodesList = undefined;
        this.Ex_AreaList = undefined;
        this.Ex_AreaNamesList = undefined;
        this.Ex_LocationCodesList = undefined;
        this.Ex_LocationList = undefined;
        this.Ex_LocationNamesList = undefined;
        this.Ex_OrientationName = undefined;
        this.Ex_DefectFindingName = undefined;
        this.Ex_SeverityCodesList = undefined;
        this.Ex_SeverityList = undefined;
        this.Ex_SeverityNamesList = undefined;
        this.Ex_ImageFileIds = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new CustomerDefectModel());
    }

    static jcFieldTypeforField(fieldName: keyof CustomerDefectModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "CustomerId":
                return FieldTypeEnum.Dropdown;
            case "Name":
                return FieldTypeEnum.Text;
            case "BuildingListJson":
                return FieldTypeEnum.MultiDropdown;
            case "AreaListJson":
                return FieldTypeEnum.MultiDropdown;
            case "LocationListJson":
                return FieldTypeEnum.MultiDropdown;
            case "OrientationCode":
                return FieldTypeEnum.Dropdown;
            case "DefectFindingCode":
                return FieldTypeEnum.Dropdown;
            case "SeverityListJson":
                return FieldTypeEnum.MultiDropdown;
            case "SortOrder":
                return FieldTypeEnum.NumberStepper;
            case "DefectFindingNameOverride":
                return FieldTypeEnum.Text;
            case "DefectFindingInformationOverride":
                return FieldTypeEnum.Textarea;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.Name || ""} | ${this.Ex_DefectFindingName || ""}`;
    }
}
