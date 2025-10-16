import { O_OrientationModel } from "@/app/models/O_Orientation";
import { sql } from "@vercel/postgres";

export class O_OrientationBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<O_OrientationModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Orientation"
            WHERE "Code" = ${code}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<O_OrientationModel>`
            SELECT "Code",
                   "Name",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_Orientation"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder", "Name"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_OrientationModel) {
        await sql`
            INSERT INTO public."O_Orientation"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_OrientationModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_OrientationModel) {
        await sql`
            UPDATE public."O_Orientation"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_OrientationModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(code: string, sortOrder: number) {
        await sql`
            UPDATE public."O_Orientation"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }
}
