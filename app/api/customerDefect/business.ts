import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { sql } from "@vercel/postgres";

export class CustomerDefectBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(id: string) {
        return (
            await sql<CustomerDefectModel>`
            SELECT "Id",
                   "CustomerId",
                   "Name",
                   "BuildingListJson",
                   "AreaListJson",
                   "LocationListJson",
                   "OrientationCode",
                   "DefectFindingCode",
                   "DefectFindingNameOverride",
                   "DefectFindingInformationOverride",
                   "SeverityListJson",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."CustomerDefect"
            WHERE "Id" = ${id}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<CustomerDefectModel>`
            SELECT "Id",
                   "CustomerId",
                   "Name",
                   "BuildingListJson",
                   "AreaListJson",
                   "LocationListJson",
                   "OrientationCode",
                   "DefectFindingCode",
                   "DefectFindingNameOverride",
                   "DefectFindingInformationOverride",
                   "SeverityListJson",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."CustomerDefect"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder" ASC, "CreatedAt" DESC
        `
        ).rows;
    }

    static async GetByCustomerId(customerId: string) {
        return (
            await sql<CustomerDefectModel>`
            SELECT "Id",
                   "CustomerId",
                   "Name",
                   "BuildingListJson",
                   "AreaListJson",
                   "LocationListJson",
                   "OrientationCode",
                   "DefectFindingCode",
                   "DefectFindingNameOverride",
                   "DefectFindingInformationOverride",
                   "SeverityListJson",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."CustomerDefect"
            WHERE "CustomerId" = ${customerId}
              AND "Deleted" = 'False'
            ORDER BY "SortOrder" ASC, "CreatedAt" DESC
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: CustomerDefectModel) {
        await sql`
            INSERT INTO public."CustomerDefect"
            (
                "Id",
                "CustomerId",
                "Name",
                "BuildingListJson",
                "AreaListJson",
                "LocationListJson",
                "OrientationCode",
                "DefectFindingCode",
                "DefectFindingNameOverride",
                "DefectFindingInformationOverride",
                "SeverityListJson",
                "SortOrder",
                "CreatedAt"
            )
            VALUES
            (
                ${data.Id},
                ${data.CustomerId},
                ${data.Name},
                ${data.BuildingListJson},
                ${data.AreaListJson},
                ${data.LocationListJson},
                ${data.OrientationCode},
                ${data.DefectFindingCode},
                ${data.DefectFindingNameOverride},
                ${data.DefectFindingInformationOverride},
                ${data.SeverityListJson},
                ${data.SortOrder},
                ${new Date().toUTCString()}
            )
        `;
    }

    static async CreateList(dataList: CustomerDefectModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: CustomerDefectModel) {
        await sql`
            UPDATE public."CustomerDefect"
            SET "CustomerId" = ${data.CustomerId},
                "Name" = ${data.Name},
                "BuildingListJson" = ${data.BuildingListJson},
                "AreaListJson" = ${data.AreaListJson},
                "LocationListJson" = ${data.LocationListJson},
                "OrientationCode" = ${data.OrientationCode},
                "DefectFindingCode" = ${data.DefectFindingCode},
                "DefectFindingNameOverride" = ${data.DefectFindingNameOverride},
                "DefectFindingInformationOverride" = ${data.DefectFindingInformationOverride},
                "SeverityListJson" = ${data.SeverityListJson},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: CustomerDefectModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(data: { Id: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."CustomerDefect"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Id" = ${item.Id}
            `;
        }
    }
}
