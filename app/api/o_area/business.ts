import { JC_Utils_Business } from "@/app/Utils";
import { O_AreaModel } from "@/app/models/O_Area";
import { sql } from "@vercel/postgres";

export class O_AreaBusiness {
    static async Get(code: string) {
        return await JC_Utils_Business.sqlGet(O_AreaModel, code);
    }

    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_AreaModel, code);
        return { exists: result !== null };
    }

    static async GetList(paging?: any) {
        return await JC_Utils_Business.sqlGetList(O_AreaModel, undefined, paging);
    }

    static async Create(data: O_AreaModel) {
        await sql`
            INSERT INTO public."O_Area"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_AreaModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_AreaModel) {
        await sql`
            UPDATE public."O_Area"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_AreaModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_AreaModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_Area"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }
}
