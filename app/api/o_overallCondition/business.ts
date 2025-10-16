import { JC_Utils_Business } from "@/app/Utils";
import { O_OverallConditionModel } from "@/app/models/O_OverallCondition";
import { sql } from "@vercel/postgres";

export class O_OverallConditionBusiness {
    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_OverallConditionModel, code);
        return { exists: result !== null };
    }

    static async Create(data: O_OverallConditionModel) {
        await sql`
            INSERT INTO public."O_OverallCondition"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_OverallConditionModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_OverallConditionModel) {
        await sql`
            UPDATE public."O_OverallCondition"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_OverallConditionModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_OverallConditionModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_OverallCondition"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }
}
