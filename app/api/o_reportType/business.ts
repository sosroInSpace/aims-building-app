import { JC_Utils_Business } from "@/app/Utils";
import { O_ReportTypeModel } from "@/app/models/O_ReportType";
import { sql } from "@vercel/postgres";

export class O_ReportTypeBusiness {
    static async Get(code: string) {
        return await JC_Utils_Business.sqlGet(O_ReportTypeModel, code);
    }

    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_ReportTypeModel, code);
        return { exists: result !== null };
    }

    static async GetList(paging?: any) {
        return await JC_Utils_Business.sqlGetList(O_ReportTypeModel, undefined, paging);
    }

    static async Create(data: O_ReportTypeModel) {
        await sql`
            INSERT INTO public."O_ReportType"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_ReportTypeModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_ReportTypeModel) {
        await sql`
            UPDATE public."O_ReportType"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_ReportTypeModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_ReportTypeModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }
}
