import { JC_Utils_Business } from "@/app/Utils";
import { O_SummaryModel } from "@/app/models/O_Summary";
import { sql } from "@vercel/postgres";

export class O_SummaryBusiness {
    static async Get(code: string) {
        return await JC_Utils_Business.sqlGet(O_SummaryModel, code);
    }

    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_SummaryModel, code);
        return { exists: result !== null };
    }

    static async GetList(paging?: any) {
        return await JC_Utils_Business.sqlGetList(O_SummaryModel, undefined, paging);
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: O_SummaryModel) {
        await sql`
            INSERT INTO public."O_Summary"
            ("Code", "Name", "Description", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.Description}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_SummaryModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: O_SummaryModel) {
        await sql`
            UPDATE public."O_Summary"
            SET "Name" = ${data.Name},
                "Description" = ${data.Description},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_SummaryModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_Summary"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }

    // - ------ - //
    // - DELETE - //
    // - ------ - //

    static async Delete(code: string) {
        await sql`
            UPDATE public."O_Summary"
            SET "Deleted" = TRUE,
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Code" = ${code}
        `;
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }
}
