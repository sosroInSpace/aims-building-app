import { O_WallsModel } from "@/app/models/O_Walls";
import { sql } from "@vercel/postgres";

export class O_WallsBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<O_WallsModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Walls"
            WHERE "Code" = ${code}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<O_WallsModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Walls"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder", "Name"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_WallsModel) {
        await sql`
            INSERT INTO public."O_Walls"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_WallsModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_WallsModel) {
        await sql`
            UPDATE public."O_Walls"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_WallsModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(code: string, sortOrder: number) {
        await sql`
            UPDATE public."O_Walls"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }
}
