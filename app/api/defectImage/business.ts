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
        const rows = (
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

        // Normalize sortOrders to be sequential (1, 2, 3, ...) if they aren't already
        await this.NormalizeSortOrders(rows);

        return rows;
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
        // Only calculate next sortOrder if not provided from frontend
        // Default value is 999, so any value <= 0 or >= 999 means not properly set
        let sortOrder = data.SortOrder;
        if (!sortOrder || sortOrder <= 0 || sortOrder >= 999) {
            sortOrder = await this.GetNextSortOrder(data.DefectId);
        }

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

    // Normalize sortOrders to be sequential (1, 2, 3, ...) if they aren't already
    static async NormalizeSortOrders(rows: DefectImageModel[]) {
        if (rows.length === 0) return;

        // Check if sortOrders are already sequential starting from 1
        let needsNormalization = false;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].SortOrder !== i + 1) {
                needsNormalization = true;
                break;
            }
        }

        if (!needsNormalization) return;

        // Update each row with sequential sortOrder and update in DB
        for (let i = 0; i < rows.length; i++) {
            const newSortOrder = i + 1;
            if (rows[i].SortOrder !== newSortOrder) {
                rows[i].SortOrder = newSortOrder;
                await sql`
                    UPDATE public."DefectImage"
                    SET "SortOrder" = ${newSortOrder},
                        "ModifiedAt" = ${new Date().toUTCString()}
                    WHERE "Id" = ${rows[i].Id}
                `;
            }
        }
    }
}
