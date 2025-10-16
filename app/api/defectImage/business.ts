import { DefectImageModel } from "@/app/models/DefectImage";
import { sql } from "@vercel/postgres";

export class DefectImageBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(id: string) {
        return (
            await sql<DefectImageModel>`
            SELECT "Id",
                   "DefectId",
                   "ImageName",
                   "ImageFileId",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."DefectImage"
            WHERE "Id" = ${id}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<DefectImageModel>`
            SELECT "Id",
                   "DefectId",
                   "ImageName",
                   "ImageFileId",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."DefectImage"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder" ASC
        `
        ).rows;
    }

    static async GetByDefectId(defectId: string) {
        return (
            await sql<DefectImageModel>`
            SELECT "Id",
                   "DefectId",
                   "ImageName",
                   "ImageFileId",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."DefectImage"
            WHERE "DefectId" = ${defectId}
              AND "Deleted" = 'False'
            ORDER BY "SortOrder" ASC
        `
        ).rows;
    }

    static async GetByImageFileId(imageFileId: string) {
        return (
            await sql<DefectImageModel>`
            SELECT "Id",
                   "DefectId",
                   "ImageName",
                   "ImageFileId",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."DefectImage"
            WHERE "ImageFileId" = ${imageFileId}
              AND "Deleted" = 'False'
            ORDER BY "SortOrder" ASC
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: DefectImageModel) {
        // If SortOrder is not provided or is the default value, get the next sort order
        let sortOrder = data.SortOrder;
        sortOrder = await this.GetNextSortOrder(data.DefectId);

        await sql`
            INSERT INTO public."DefectImage"
            (
                "Id",
                "DefectId",
                "ImageName",
                "ImageFileId",
                "SortOrder",
                "CreatedAt"
            )
            VALUES
            (
                ${data.Id},
                ${data.DefectId},
                ${data.ImageName},
                ${data.ImageFileId},
                ${sortOrder},
                ${new Date().toUTCString()}
            )
        `;

        // Return the created record with the actual SortOrder
        return await this.Get(data.Id);
    }

    static async CreateList(dataList: DefectImageModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: DefectImageModel) {
        await sql`
            UPDATE public."DefectImage"
            SET "DefectId" = ${data.DefectId},
                "ImageName" = ${data.ImageName},
                "ImageFileId" = ${data.ImageFileId},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: DefectImageModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(data: { Id: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."DefectImage"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Id" = ${item.Id}
            `;
        }
    }

    static async GetNextSortOrder(defectId: string) {
        let latestSortOrder = (
            await sql`
            SELECT MAX("SortOrder") "LatestSortOrder"
            FROM public."DefectImage"
            WHERE "DefectId" = ${defectId}
              AND "Deleted" = 'False'
        `
        ).rows[0]["LatestSortOrder"];

        // If no records exist, start with 1
        if (latestSortOrder === null || latestSortOrder === undefined) {
            latestSortOrder = 0;
        }

        return latestSortOrder + 1;
    }
}
