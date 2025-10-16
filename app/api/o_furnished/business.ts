import { O_FurnishedModel } from "@/app/models/O_Furnished";
import { sql } from "@vercel/postgres";

export class O_FurnishedBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<O_FurnishedModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Furnished"
            WHERE "Code" = ${code}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<O_FurnishedModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Furnished"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder", "Name"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_FurnishedModel) {
        await sql`
            INSERT INTO public."O_Furnished"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_FurnishedModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_FurnishedModel) {
        await sql`
            UPDATE public."O_Furnished"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_FurnishedModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(code: string, sortOrder: number) {
        await sql`
            UPDATE public."O_Furnished"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }
}
