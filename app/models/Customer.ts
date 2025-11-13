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
import { FileModel } from "./File";
import { O_AreasInspectedModel } from "./O_AreasInspected";
import { O_BuildingTypeModel } from "./O_BuildingType";
import { O_FloorModel } from "./O_Floor";
import { O_FurnishedModel } from "./O_Furnished";
import { O_FurtherInspectionsModel } from "./O_FurtherInspections";
import { O_InaccessibleAreasModel } from "./O_InaccessibleAreas";
import { O_NumBedroomsModel } from "./O_NumBedrooms";
import { O_ObstructionsModel } from "./O_Obstructions";
import { O_OccupiedModel } from "./O_Occupied";
import { O_OrientationModel } from "./O_Orientation";
import { O_OtherBuildingElementsModel } from "./O_OtherBuildingElements";
import { O_OtherTimberBldgElementsModel } from "./O_OtherTimberBldgElements";
import { O_OverallConditionModel } from "./O_OverallCondition";
import { O_ReportTypeModel } from "./O_ReportType";
import { O_RiskOfUndetectedDefectsModel } from "./O_RiskOfUndetectedDefects";
import { O_RoofModel } from "./O_Roof";
import { O_StoreysModel } from "./O_Storeys";
import { O_WallsModel } from "./O_Walls";
import { O_WeatherModel } from "./O_Weather";
import { UserModel } from "./User";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class CustomerModel extends _Base implements _ModelRequirements {
    static tableName: string = "Customer";
    static apiRoute: string = "customer";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "ClientName";

    static cacheMinutes_get = 10;
    static cacheMinutes_getList = 20;

    // - -------- - //
    // - SERVICES - //
    // - -------- - //

    static async Get(id: string) {
        return await JC_Get<CustomerModel>(CustomerModel, CustomerModel.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${CustomerModel.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<CustomerModel>(CustomerModel, `${CustomerModel.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async GetListWithDefectCounts(sortField?: string, sortAsc?: boolean) {
        const { JC_GetRawCached } = await import("../apiServices/JC_GetRaw");
        const params = {
            sortField: sortField || "ModifiedAt",
            sortAsc: sortAsc !== undefined ? sortAsc.toString() : "false"
        };
        const cacheKey = `Customer_getListWithDefectCounts_${JSON.stringify(params)}`;
        return await JC_GetRawCached<(CustomerModel & { DefectCount: number })[]>(`${CustomerModel.apiRoute}/getListWithDefectCounts`, params, cacheKey, CustomerModel.cacheMinutes_getList);
    }
    static async GetSummaryData(customerId: string) {
        const { JC_GetRawCached } = await import("../apiServices/JC_GetRaw");
        const params = { customerId };
        const cacheKey = `Customer_getSummaryData_${customerId}`;
        return await JC_GetRawCached<
            CustomerModel & {
                OverallConditionOptions: any[];
                FurtherInspectionsOptions: any[];
                ObstructionsOptions: any[];
                InaccessibleAreasOptions: any[];
                AreasInspectedOptions: any[];
                RiskOfUndetectedDefectsOptions: any[];
            }
        >(`${CustomerModel.apiRoute}/getSummaryData`, params, cacheKey, CustomerModel.cacheMinutes_get);
    }
    static async GetPropertyData(customerId: string) {
        const { JC_GetRawCached } = await import("../apiServices/JC_GetRaw");
        const params = { customerId };
        const cacheKey = `Customer_getPropertyData_${customerId}`;
        return await JC_GetRawCached<
            CustomerModel & {
                BuildingTypeOptions: any[];
                OrientationOptions: any[];
                NumBedroomsOptions: any[];
                StoreysOptions: any[];
                FurnishedOptions: any[];
                OccupiedOptions: any[];
                FloorOptions: any[];
                OtherBuildingElementsOptions: any[];
                OtherTimberBldgElementsOptions: any[];
                RoofOptions: any[];
                WallsOptions: any[];
                WeatherOptions: any[];
            }
        >(`${CustomerModel.apiRoute}/getPropertyData`, params, cacheKey, CustomerModel.cacheMinutes_get);
    }
    static async GetListForEmployees(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<CustomerModel>(CustomerModel, `${CustomerModel.apiRoute}/getListForEmployees`, paging, {}, abortSignal);
    }
    static async GetListForEmployeesOfAdmin(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<CustomerModel>(CustomerModel, `${CustomerModel.apiRoute}/getListForEmployeesOfAdmin`, paging, {}, abortSignal);
    }
    static async GetListForEmployeesWithDefectCounts(sortField?: string, sortAsc?: boolean) {
        const { JC_GetRawCached } = await import("../apiServices/JC_GetRaw");
        const params = {
            sortField: sortField || "ModifiedAt",
            sortAsc: sortAsc !== undefined ? sortAsc.toString() : "false"
        };
        const cacheKey = `Customer_getListForEmployeesWithDefectCounts_${JSON.stringify(params)}`;
        return await JC_GetRawCached<(CustomerModel & { DefectCount: number })[]>(`${CustomerModel.apiRoute}/getListForEmployeesWithDefectCounts`, params, cacheKey, CustomerModel.cacheMinutes_getList);
    }
    static async GetListWithDefectCountsByUserId(userId: string, sortField?: string, sortAsc?: boolean) {
        const { JC_GetRawCached } = await import("../apiServices/JC_GetRaw");
        const params = {
            userId: userId,
            sortField: sortField || "ModifiedAt",
            sortAsc: sortAsc !== undefined ? sortAsc.toString() : "false"
        };
        const cacheKey = `Customer_getListWithDefectCountsByUserId_${JSON.stringify(params)}`;
        return await JC_GetRawCached<(CustomerModel & { DefectCount: number })[]>(`${CustomerModel.apiRoute}/getListWithDefectCountsByUserId`, params, cacheKey, CustomerModel.cacheMinutes_getList);
    }
    static async Create(data: CustomerModel) {
        let response = await JC_Put<CustomerModel>(CustomerModel, CustomerModel.apiRoute, data);
        return response;
    }
    static async CreateList(dataList: CustomerModel[]) {
        return await JC_PutRaw<CustomerModel[]>(`${CustomerModel.apiRoute}?list=true`, dataList, undefined, "Customer");
    }
    static async Update(data: CustomerModel) {
        return await JC_Post<CustomerModel>(CustomerModel, CustomerModel.apiRoute, data);
    }
    static async UpdateList(dataList: CustomerModel[]) {
        return await JC_PostRaw<CustomerModel[]>(`${CustomerModel.apiRoute}?list=true`, dataList, undefined, "Customer");
    }
    static async UpdateSortOrder(id: string, sortOrder: number) {
        return await JC_PostRaw(`${CustomerModel.apiRoute}?sortOrder=true`, { id, sortOrder }, undefined, "Customer");
    }
    static async Delete(id: string) {
        return await JC_Delete(CustomerModel, CustomerModel.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_Delete(CustomerModel, `${CustomerModel.apiRoute}?ids=${ids.join(",")}`, "");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    UserId: string;
    ReportTypeCode?: string;
    ClientName: string;
    ClientPhone?: string;
    ClientEmail?: string;
    ClientPrincipalName?: string;
    MainImageFileId: string;
    Address: string;
    PostalAddress: string;
    InspectionDate?: Date;
    InspectorName: string;
    InspectorPhone?: string;
    InspectorQualification?: string;
    BuildingTypeListJson?: string;
    CompanyStrataTitle?: string;
    NumBedroomsListJson?: string;
    OrientationListJson?: string;
    StoreysListJson?: string;
    FurnishedListJson?: string;
    OccupiedListJson?: string;
    FloorListJson?: string;
    OtherBuildingElementsListJson?: string;
    OtherTimberBldgElementsListJson?: string;
    RoofListJson?: string;
    WallsListJson?: string;
    WeatherListJson?: string;
    RoomsListJson?: string;
    Summary?: string;
    SpecialConditions?: string;
    OverallConditionListJson?: string;
    FutherInspectionsListJson?: string;
    ObstructionsListJson?: string;
    InaccessibleAreasListJson?: string;
    AreasInspectedListJson?: string;
    RiskOfUndetectedDefectsListJson?: string;
    CustomOrder?: boolean;
    SortOrder: number;

    // Extended
    Ex_BuildingTypeCodesList?: string[];
    Ex_BuildingTypeList?: O_BuildingTypeModel[];

    Ex_ReportTypeName?: string;
    Ex_UserFirstName?: string;
    Ex_UserLastName?: string;
    Ex_UserEmail?: string;
    Ex_UserPhone?: string;
    Ex_UserCompanyName?: string;
    Ex_UserQualification?: string;
    Ex_MainImageFileKey?: string;
    Ex_MainImageFileSignedUrl?: string;
    Ex_FutherInspectionsCodesList?: string[];
    Ex_FutherInspectionsList?: O_FurtherInspectionsModel[];
    Ex_AreasInspectedCodesList?: string[];
    Ex_AreasInspectedList?: O_AreasInspectedModel[];
    Ex_InaccessibleAreasCodesList?: string[];
    Ex_InaccessibleAreasList?: O_InaccessibleAreasModel[];
    Ex_ObstructionsCodesList?: string[];
    Ex_ObstructionsList?: O_ObstructionsModel[];
    Ex_NumBedroomsCodesList?: string[];
    Ex_NumBedroomsList?: O_NumBedroomsModel[];
    Ex_OrientationCodesList?: string[];
    Ex_OrientationList?: O_OrientationModel[];
    Ex_StoreysCodesList?: string[];
    Ex_StoreysList?: O_StoreysModel[];
    Ex_FurnishedCodesList?: string[];
    Ex_FurnishedList?: O_FurnishedModel[];
    Ex_OccupiedCodesList?: string[];
    Ex_OccupiedList?: O_OccupiedModel[];
    Ex_FloorCodesList?: string[];
    Ex_FloorList?: O_FloorModel[];
    Ex_OtherBuildingElementsCodesList?: string[];
    Ex_OtherBuildingElementsList?: O_OtherBuildingElementsModel[];
    Ex_OtherTimberBldgElementsCodesList?: string[];
    Ex_OtherTimberBldgElementsList?: O_OtherTimberBldgElementsModel[];
    Ex_RoofCodesList?: string[];
    Ex_RoofList?: O_RoofModel[];
    Ex_WallsCodesList?: string[];
    Ex_WallsList?: O_WallsModel[];
    Ex_WeatherCodesList?: string[];
    Ex_WeatherList?: O_WeatherModel[];
    Ex_OverallConditionCodesList?: string[];
    Ex_OverallConditionList?: O_OverallConditionModel[];
    Ex_OverallConditionNamesList?: string[];
    Ex_RiskOfUndetectedDefectsCodesList?: string[];
    Ex_RiskOfUndetectedDefectsList?: O_RiskOfUndetectedDefectsModel[];

    ExtendedFields: _ExtendedField[] = [
        {
            Name: "Ex_BuildingTypeCodesList",
            FromField: "BuildingTypeListJson",
            ReferenceModel: O_BuildingTypeModel,
            setWithCallback: (instance: CustomerModel) => {
                // Deserialize BuildingTypeListJson into Ex_BuildingTypeCodesList
                if (instance.BuildingTypeListJson) {
                    try {
                        return JSON.parse(instance.BuildingTypeListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        { Name: "Ex_UserFirstName", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "FirstName" },
        { Name: "Ex_UserLastName", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "LastName" },
        { Name: "Ex_UserEmail", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "Email" },
        { Name: "Ex_UserPhone", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "Phone" },
        { Name: "Ex_UserCompanyName", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "CompanyName" },
        { Name: "Ex_UserQualification", FromField: "UserId", ReferenceModel: UserModel, ReferenceField: "Qualification" },

        { Name: "Ex_ReportTypeName", FromField: "ReportTypeCode", ReferenceModel: O_ReportTypeModel },
        {
            Name: "Ex_FutherInspectionsCodesList",
            FromField: "FutherInspectionsListJson",
            ReferenceModel: O_FurtherInspectionsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.FutherInspectionsListJson) {
                    try {
                        return JSON.parse(instance.FutherInspectionsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_FutherInspectionsList",
            FromField: "FutherInspectionsListJson",
            ReferenceModel: O_FurtherInspectionsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_FutherInspectionsCodesList || instance.Ex_FutherInspectionsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_FurtherInspectionsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_FutherInspectionsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching FurtherInspections options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_ObstructionsCodesList",
            FromField: "ObstructionsListJson",
            ReferenceModel: O_ObstructionsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.ObstructionsListJson) {
                    try {
                        return JSON.parse(instance.ObstructionsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_ObstructionsList",
            FromField: "ObstructionsListJson",
            ReferenceModel: O_ObstructionsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_ObstructionsCodesList || instance.Ex_ObstructionsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_ObstructionsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_ObstructionsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Obstructions options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_InaccessibleAreasCodesList",
            FromField: "InaccessibleAreasListJson",
            ReferenceModel: O_InaccessibleAreasModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.InaccessibleAreasListJson) {
                    try {
                        return JSON.parse(instance.InaccessibleAreasListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_InaccessibleAreasList",
            FromField: "InaccessibleAreasListJson",
            ReferenceModel: O_InaccessibleAreasModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_InaccessibleAreasCodesList || instance.Ex_InaccessibleAreasCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_InaccessibleAreasModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_InaccessibleAreasCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching InaccessibleAreas options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_AreasInspectedCodesList",
            FromField: "AreasInspectedListJson",
            ReferenceModel: O_AreasInspectedModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.AreasInspectedListJson) {
                    try {
                        return JSON.parse(instance.AreasInspectedListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_AreasInspectedList",
            FromField: "AreasInspectedListJson",
            ReferenceModel: O_AreasInspectedModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_AreasInspectedCodesList || instance.Ex_AreasInspectedCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_AreasInspectedModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_AreasInspectedCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching AreasInspected options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_MainImageFileKey",
            FromField: "MainImageFileId",
            ReferenceModel: FileModel,
            ReferenceField: "Key"
        },
        {
            Name: "Ex_MainImageFileSignedUrl",
            FromField: "MainImageFileId",
            ReferenceModel: FileModel,
            setWithCallback: async (obj: CustomerModel) => {
                try {
                    // Use the Ex_MainImageFileKey that should already be populated
                    if (obj.Ex_MainImageFileKey) {
                        // Generate signed URL using the File's Key
                        return await JC_Utils_Files.getSignedUrlForKey(obj.Ex_MainImageFileKey);
                    }
                    return null;
                } catch (error) {
                    console.error("Error generating signed URL for customer main image:", error);
                    return null;
                }
            }
        },
        {
            Name: "Ex_NumBedroomsCodesList",
            FromField: "NumBedroomsListJson",
            ReferenceModel: O_NumBedroomsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.NumBedroomsListJson) {
                    try {
                        return JSON.parse(instance.NumBedroomsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OrientationCodesList",
            FromField: "OrientationListJson",
            ReferenceModel: O_OrientationModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.OrientationListJson) {
                    try {
                        return JSON.parse(instance.OrientationListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_StoreysCodesList",
            FromField: "StoreysListJson",
            ReferenceModel: O_StoreysModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.StoreysListJson) {
                    try {
                        return JSON.parse(instance.StoreysListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_FurnishedCodesList",
            FromField: "FurnishedListJson",
            ReferenceModel: O_FurnishedModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.FurnishedListJson) {
                    try {
                        return JSON.parse(instance.FurnishedListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OccupiedCodesList",
            FromField: "OccupiedListJson",
            ReferenceModel: O_OccupiedModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.OccupiedListJson) {
                    try {
                        return JSON.parse(instance.OccupiedListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_FloorCodesList",
            FromField: "FloorListJson",
            ReferenceModel: O_FloorModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.FloorListJson) {
                    try {
                        return JSON.parse(instance.FloorListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OtherBuildingElementsCodesList",
            FromField: "OtherBuildingElementsListJson",
            ReferenceModel: O_OtherBuildingElementsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.OtherBuildingElementsListJson) {
                    try {
                        return JSON.parse(instance.OtherBuildingElementsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OtherTimberBldgElementsCodesList",
            FromField: "OtherTimberBldgElementsListJson",
            ReferenceModel: O_OtherTimberBldgElementsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.OtherTimberBldgElementsListJson) {
                    try {
                        return JSON.parse(instance.OtherTimberBldgElementsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_RoofCodesList",
            FromField: "RoofListJson",
            ReferenceModel: O_RoofModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.RoofListJson) {
                    try {
                        return JSON.parse(instance.RoofListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_WallsCodesList",
            FromField: "WallsListJson",
            ReferenceModel: O_WallsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.WallsListJson) {
                    try {
                        return JSON.parse(instance.WallsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_WeatherCodesList",
            FromField: "WeatherListJson",
            ReferenceModel: O_WeatherModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.WeatherListJson) {
                    try {
                        return JSON.parse(instance.WeatherListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OverallConditionCodesList",
            FromField: "OverallConditionListJson",
            ReferenceModel: O_OverallConditionModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.OverallConditionListJson) {
                    try {
                        return JSON.parse(instance.OverallConditionListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_OverallConditionList",
            FromField: "OverallConditionListJson",
            ReferenceModel: O_OverallConditionModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OverallConditionCodesList || instance.Ex_OverallConditionCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OverallConditionModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_OverallConditionCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching OverallCondition options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_OverallConditionNamesList",
            FromField: "OverallConditionListJson",
            ReferenceModel: O_OverallConditionModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OverallConditionCodesList || instance.Ex_OverallConditionCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OverallConditionModel.GetList();
                    const filteredOptions = allOptions.ResultList.filter(option => instance.Ex_OverallConditionCodesList!.includes(option.Code));
                    return filteredOptions.map(option => option.Name);
                } catch (error) {
                    console.error("Error fetching OverallCondition options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_RiskOfUndetectedDefectsCodesList",
            FromField: "RiskOfUndetectedDefectsListJson",
            ReferenceModel: O_RiskOfUndetectedDefectsModel,
            setWithCallback: (instance: CustomerModel) => {
                if (instance.RiskOfUndetectedDefectsListJson) {
                    try {
                        return JSON.parse(instance.RiskOfUndetectedDefectsListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        // List fields that fetch full objects based on CodesList
        {
            Name: "Ex_BuildingTypeList",
            FromField: "BuildingTypeListJson",
            ReferenceModel: O_BuildingTypeModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_BuildingTypeCodesList || instance.Ex_BuildingTypeCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_BuildingTypeModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_BuildingTypeCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching BuildingType options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_NumBedroomsList",
            FromField: "NumBedroomsListJson",
            ReferenceModel: O_NumBedroomsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_NumBedroomsCodesList || instance.Ex_NumBedroomsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_NumBedroomsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_NumBedroomsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching NumBedrooms options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_OrientationList",
            FromField: "OrientationListJson",
            ReferenceModel: O_OrientationModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OrientationCodesList || instance.Ex_OrientationCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OrientationModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_OrientationCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Orientation options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_StoreysList",
            FromField: "StoreysListJson",
            ReferenceModel: O_StoreysModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_StoreysCodesList || instance.Ex_StoreysCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_StoreysModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_StoreysCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Storeys options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_FurnishedList",
            FromField: "FurnishedListJson",
            ReferenceModel: O_FurnishedModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_FurnishedCodesList || instance.Ex_FurnishedCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_FurnishedModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_FurnishedCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Furnished options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_OccupiedList",
            FromField: "OccupiedListJson",
            ReferenceModel: O_OccupiedModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OccupiedCodesList || instance.Ex_OccupiedCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OccupiedModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_OccupiedCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Occupied options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_FloorList",
            FromField: "FloorListJson",
            ReferenceModel: O_FloorModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_FloorCodesList || instance.Ex_FloorCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_FloorModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_FloorCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Floor options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_OtherBuildingElementsList",
            FromField: "OtherBuildingElementsListJson",
            ReferenceModel: O_OtherBuildingElementsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OtherBuildingElementsCodesList || instance.Ex_OtherBuildingElementsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OtherBuildingElementsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_OtherBuildingElementsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching OtherBuildingElements options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_OtherTimberBldgElementsList",
            FromField: "OtherTimberBldgElementsListJson",
            ReferenceModel: O_OtherTimberBldgElementsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_OtherTimberBldgElementsCodesList || instance.Ex_OtherTimberBldgElementsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_OtherTimberBldgElementsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_OtherTimberBldgElementsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching OtherTimberBldgElements options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_RoofList",
            FromField: "RoofListJson",
            ReferenceModel: O_RoofModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_RoofCodesList || instance.Ex_RoofCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_RoofModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_RoofCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Roof options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_WallsList",
            FromField: "WallsListJson",
            ReferenceModel: O_WallsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_WallsCodesList || instance.Ex_WallsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_WallsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_WallsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Walls options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_WeatherList",
            FromField: "WeatherListJson",
            ReferenceModel: O_WeatherModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_WeatherCodesList || instance.Ex_WeatherCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_WeatherModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_WeatherCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching Weather options:", error);
                    return [];
                }
            }
        },
        {
            Name: "Ex_RiskOfUndetectedDefectsList",
            FromField: "RiskOfUndetectedDefectsListJson",
            ReferenceModel: O_RiskOfUndetectedDefectsModel,
            setWithCallback: async (instance: CustomerModel) => {
                if (!instance.Ex_RiskOfUndetectedDefectsCodesList || instance.Ex_RiskOfUndetectedDefectsCodesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_RiskOfUndetectedDefectsModel.GetList();
                    return allOptions.ResultList.filter(option => instance.Ex_RiskOfUndetectedDefectsCodesList!.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching RiskOfUndetectedDefects options:", error);
                    return [];
                }
            }
        }
    ];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<CustomerModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.UserId = "";
        this.ClientName = "";
        this.ClientPhone = undefined;
        this.ClientEmail = undefined;
        this.ClientPrincipalName = undefined;
        this.MainImageFileId = "";
        this.Address = "";
        this.PostalAddress = "";
        this.InspectionDate = new Date();
        this.InspectorName = "";
        this.InspectorPhone = undefined;
        this.InspectorQualification = undefined;
        this.BuildingTypeListJson = undefined;
        this.CompanyStrataTitle = undefined;
        this.NumBedroomsListJson = undefined;
        this.OrientationListJson = undefined;
        this.StoreysListJson = undefined;
        this.FurnishedListJson = undefined;
        this.OccupiedListJson = undefined;
        this.FloorListJson = undefined;
        this.OtherBuildingElementsListJson = undefined;
        this.OtherTimberBldgElementsListJson = undefined;
        this.RoofListJson = undefined;
        this.WallsListJson = undefined;
        this.WeatherListJson = undefined;
        this.RoomsListJson = undefined;
        this.Summary = undefined;
        this.SpecialConditions = undefined;
        this.OverallConditionListJson = undefined;
        this.FutherInspectionsListJson = undefined;
        this.ObstructionsListJson = undefined;
        this.InaccessibleAreasListJson = undefined;
        this.AreasInspectedListJson = undefined;
        this.RiskOfUndetectedDefectsListJson = undefined;
        this.CustomOrder = undefined;
        this.ReportTypeCode = undefined;
        this.SortOrder = 999;
        this.Ex_BuildingTypeCodesList = undefined;
        this.Ex_NumBedroomsCodesList = undefined;
        this.Ex_OrientationCodesList = undefined;
        this.Ex_StoreysCodesList = undefined;
        this.Ex_FurnishedCodesList = undefined;
        this.Ex_OccupiedCodesList = undefined;
        this.Ex_FloorCodesList = undefined;
        this.Ex_OtherBuildingElementsCodesList = undefined;
        this.Ex_OtherTimberBldgElementsCodesList = undefined;
        this.Ex_RoofCodesList = undefined;
        this.Ex_WallsCodesList = undefined;
        this.Ex_WeatherCodesList = undefined;
        this.Ex_OverallConditionCodesList = undefined;
        this.Ex_OverallConditionList = undefined;
        this.Ex_OverallConditionNamesList = undefined;
        this.Ex_FutherInspectionsCodesList = undefined;
        this.Ex_FutherInspectionsList = undefined;
        this.Ex_AreasInspectedCodesList = undefined;
        this.Ex_AreasInspectedList = undefined;
        this.Ex_InaccessibleAreasCodesList = undefined;
        this.Ex_InaccessibleAreasList = undefined;
        this.Ex_ObstructionsCodesList = undefined;
        this.Ex_ObstructionsList = undefined;
        this.Ex_RiskOfUndetectedDefectsCodesList = undefined;
        this.Ex_ReportTypeName = undefined;
        this.Ex_UserFirstName = undefined;
        this.Ex_UserLastName = undefined;
        this.Ex_UserEmail = undefined;
        this.Ex_UserPhone = undefined;
        this.Ex_UserCompanyName = undefined;
        this.Ex_UserQualification = undefined;
        this.Ex_MainImageFileKey = undefined;
        this.Ex_MainImageFileSignedUrl = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new CustomerModel());
    }

    static jcFieldTypeforField(fieldName: keyof CustomerModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "UserId":
                return FieldTypeEnum.Text;
            case "ClientName":
                return FieldTypeEnum.Text;
            case "ClientPhone":
                return FieldTypeEnum.Text;
            case "ClientEmail":
                return FieldTypeEnum.Email;
            case "ClientPrincipalName":
                return FieldTypeEnum.Text;
            case "MainImageFileId":
                return FieldTypeEnum.Photo;
            case "Address":
                return FieldTypeEnum.Textarea;
            case "PostalAddress":
                return FieldTypeEnum.Textarea;
            case "InspectionDate":
                return FieldTypeEnum.Date;
            case "InspectorName":
                return FieldTypeEnum.Text;
            case "InspectorPhone":
                return FieldTypeEnum.Text;
            case "InspectorQualification":
                return FieldTypeEnum.Text;
            case "BuildingTypeListJson":
                return FieldTypeEnum.MultiDropdown;
            case "CompanyStrataTitle":
                return FieldTypeEnum.Text;
            case "NumBedroomsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "OrientationListJson":
                return FieldTypeEnum.MultiDropdown;
            case "StoreysListJson":
                return FieldTypeEnum.MultiDropdown;
            case "FurnishedListJson":
                return FieldTypeEnum.MultiDropdown;
            case "OccupiedListJson":
                return FieldTypeEnum.MultiDropdown;
            case "FloorListJson":
                return FieldTypeEnum.MultiDropdown;
            case "OtherBuildingElementsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "OtherTimberBldgElementsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "RoofListJson":
                return FieldTypeEnum.MultiDropdown;
            case "WallsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "WeatherListJson":
                return FieldTypeEnum.MultiDropdown;
            case "RoomsListJson":
                return FieldTypeEnum.Textarea;
            case "Summary":
                return FieldTypeEnum.Textarea;
            case "SpecialConditions":
                return FieldTypeEnum.Textarea;
            case "OverallConditionListJson":
                return FieldTypeEnum.MultiDropdown;
            case "FutherInspectionsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "ObstructionsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "InaccessibleAreasListJson":
                return FieldTypeEnum.MultiDropdown;
            case "AreasInspectedListJson":
                return FieldTypeEnum.MultiDropdown;
            case "RiskOfUndetectedDefectsListJson":
                return FieldTypeEnum.MultiDropdown;
            case "SortOrder":
                return FieldTypeEnum.NumberStepper;
            default:
                return FieldTypeEnum.Text;
        }
    }

    toString() {
        return `${this.ClientName} | ${this.Address}`;
    }
}
