import { CustomerModel } from "@/app/models/Customer";
import { sql } from "@vercel/postgres";

export class CustomerBusiness {
    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: CustomerModel) {
        await sql`
            INSERT INTO public."Customer"
            (
                "Id",
                "UserId",
                "ReportTypeCode",
                "ClientName",
                "ClientPhone",
                "ClientEmail",
                "ClientPrincipalName",
                "MainImageFileId",
                "Address",
                "PostalAddress",
                "InspectionDate",
                "InspectorName",
                "InspectorPhone",
                "InspectorQualification",
                "BuildingTypeListJson",
                "CompanyStrataTitle",
                "NumBedroomsListJson",
                "OrientationListJson",
                "StoreysListJson",
                "FurnishedListJson",
                "OccupiedListJson",
                "FloorListJson",
                "OtherBuildingElementsListJson",
                "OtherTimberBldgElementsListJson",
                "RoofListJson",
                "WallsListJson",
                "WeatherListJson",
                "RoomsListJson",
                "Summary",
                "SpecialConditions",
                "OverallConditionListJson",
                "FutherInspectionsListJson",
                "ObstructionsListJson",
                "InaccessibleAreasListJson",
                "AreasInspectedListJson",
                "RiskOfUndetectedDefectsListJson",
                "CustomOrder",
                "SortOrder",
                "CreatedAt"
            )
            VALUES
            (
                ${data.Id},
                ${data.UserId},
                ${data.ReportTypeCode || null},
                ${data.ClientName},
                ${data.ClientPhone || null},
                ${data.ClientEmail || null},
                ${data.ClientPrincipalName || null},
                ${data.MainImageFileId || null},
                ${data.Address},
                ${data.PostalAddress},
                ${data.InspectionDate ? new Date(data.InspectionDate).toISOString() : null},
                ${data.InspectorName},
                ${data.InspectorPhone || null},
                ${data.InspectorQualification || null},
                ${data.BuildingTypeListJson},
                ${data.CompanyStrataTitle},
                ${data.NumBedroomsListJson},
                ${data.OrientationListJson},
                ${data.StoreysListJson},
                ${data.FurnishedListJson},
                ${data.OccupiedListJson},
                ${data.FloorListJson},
                ${data.OtherBuildingElementsListJson},
                ${data.OtherTimberBldgElementsListJson},
                ${data.RoofListJson},
                ${data.WallsListJson},
                ${data.WeatherListJson},
                ${data.RoomsListJson},
                ${data.Summary || null},
                ${data.SpecialConditions || null},
                ${data.OverallConditionListJson || null},
                ${data.FutherInspectionsListJson || null},
                ${data.ObstructionsListJson || null},
                ${data.InaccessibleAreasListJson || null},
                ${data.AreasInspectedListJson || null},
                ${data.RiskOfUndetectedDefectsListJson || null},
                ${data.CustomOrder || null},
                ${data.SortOrder},
                ${new Date().toUTCString()}
            )
        `;
    }

    static async CreateList(dataList: CustomerModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: CustomerModel) {
        await sql`
            UPDATE public."Customer"
            SET "UserId" = ${data.UserId},
                "ReportTypeCode" = ${data.ReportTypeCode || null},
                "ClientName" = ${data.ClientName},
                "ClientPhone" = ${data.ClientPhone || null},
                "ClientEmail" = ${data.ClientEmail || null},
                "ClientPrincipalName" = ${data.ClientPrincipalName || null},
                "MainImageFileId" = ${data.MainImageFileId || null},
                "Address" = ${data.Address},
                "PostalAddress" = ${data.PostalAddress},
                "InspectionDate" = ${data.InspectionDate ? new Date(data.InspectionDate).toISOString() : null},
                "InspectorName" = ${data.InspectorName},
                "InspectorPhone" = ${data.InspectorPhone || null},
                "InspectorQualification" = ${data.InspectorQualification || null},
                "BuildingTypeListJson" = ${data.BuildingTypeListJson},
                "CompanyStrataTitle" = ${data.CompanyStrataTitle},
                "NumBedroomsListJson" = ${data.NumBedroomsListJson || null},
                "OrientationListJson" = ${data.OrientationListJson || null},
                "StoreysListJson" = ${data.StoreysListJson || null},
                "FurnishedListJson" = ${data.FurnishedListJson || null},
                "OccupiedListJson" = ${data.OccupiedListJson || null},
                "FloorListJson" = ${data.FloorListJson || null},
                "OtherBuildingElementsListJson" = ${data.OtherBuildingElementsListJson || null},
                "OtherTimberBldgElementsListJson" = ${data.OtherTimberBldgElementsListJson || null},
                "RoofListJson" = ${data.RoofListJson || null},
                "WallsListJson" = ${data.WallsListJson || null},
                "WeatherListJson" = ${data.WeatherListJson || null},
                "RoomsListJson" = ${data.RoomsListJson},
                "Summary" = ${data.Summary || null},
                "SpecialConditions" = ${data.SpecialConditions || null},
                "OverallConditionListJson" = ${data.OverallConditionListJson || null},
                "FutherInspectionsListJson" = ${data.FutherInspectionsListJson || null},
                "ObstructionsListJson" = ${data.ObstructionsListJson || null},
                "InaccessibleAreasListJson" = ${data.InaccessibleAreasListJson || null},
                "AreasInspectedListJson" = ${data.AreasInspectedListJson || null},
                "RiskOfUndetectedDefectsListJson" = ${data.RiskOfUndetectedDefectsListJson || null},
                "CustomOrder" = ${data.CustomOrder},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: CustomerModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(id: string, sortOrder: number) {
        await sql`
            UPDATE public."Customer"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Id" = ${id}
        `;
    }
}
