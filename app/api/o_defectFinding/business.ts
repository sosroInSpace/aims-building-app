import { O_DefectFindingModel } from "@/app/models/O_DefectFinding";
import { sql } from "@vercel/postgres";

export class O_DefectFindingBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<O_DefectFindingModel>`
            SELECT "Code",
                   "Name",
                   "Information",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_DefectFinding"
            WHERE "Code" = ${code}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<O_DefectFindingModel>`
            SELECT "Code",
                   "Name",
                   "Information",
                   "SortOrder",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."O_DefectFinding"
            WHERE "Deleted" = 'False'
            ORDER BY "SortOrder", "Name"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_DefectFindingModel) {
        await sql`
            INSERT INTO public."O_DefectFinding"
            ("Code", "Name", "Information", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.Information}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_DefectFindingModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_DefectFindingModel) {
        await sql`
            UPDATE public."O_DefectFinding"
            SET "Name" = ${data.Name},
                "Information" = ${data.Information},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_DefectFindingModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(code: string, sortOrder: number) {
        await sql`
            UPDATE public."O_DefectFinding"
            SET "SortOrder" = ${sortOrder},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }
}
