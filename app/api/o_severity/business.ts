import { JC_Utils_Business } from "@/app/Utils";
import { O_SeverityModel } from "@/app/models/O_Severity";
import { sql } from "@vercel/postgres";

export class O_SeverityBusiness {
    static async Get(code: string) {
        return await JC_Utils_Business.sqlGet(O_SeverityModel, code);
    }

    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_SeverityModel, code);
        return { exists: result !== null };
    }

    static async GetList(paging?: any) {
        return await JC_Utils_Business.sqlGetList(O_SeverityModel, undefined, paging);
    }

    static async Create(data: O_SeverityModel) {
        await sql`
            INSERT INTO public."O_Severity"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_SeverityModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_SeverityModel) {
        await sql`
            UPDATE public."O_Severity"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_SeverityModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_SeverityModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_Severity"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }
}
