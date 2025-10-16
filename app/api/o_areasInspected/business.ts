import { JC_Utils_Business } from "@/app/Utils";
import { O_AreasInspectedModel } from "@/app/models/O_AreasInspected";
import { sql } from "@vercel/postgres";

export class O_AreasInspectedBusiness {
    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_AreasInspectedModel, code);
        return { exists: result !== null };
    }

    static async Create(data: O_AreasInspectedModel) {
        await sql`
            INSERT INTO public."O_AreasInspected"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_AreasInspectedModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_AreasInspectedModel) {
        await sql`
            UPDATE public."O_AreasInspected"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_AreasInspectedModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_AreasInspectedModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_AreasInspected"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }
}
