import { O_FloorModel } from "@/app/models/O_Floor";
import { sql } from "@vercel/postgres";

export class O_FloorBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<O_FloorModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Floor"
            WHERE "Code" = ${code}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<O_FloorModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Floor"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder", "Name"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_FloorModel) {
        await sql`
            INSERT INTO public."O_Floor"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_FloorModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_FloorModel) {
        await sql`
            UPDATE public."O_Floor"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_FloorModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(code: string, sortOrder: number) {
        await sql`
            UPDATE public."O_Floor"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }
}
