import { JC_Utils_Business } from "@/app/Utils";
import { O_FurtherInspectionsModel } from "@/app/models/O_FurtherInspections";
import { sql } from "@vercel/postgres";

export class O_FurtherInspectionsBusiness {
    static async ItemExists(code: string) {
        const result = await JC_Utils_Business.sqlGet(O_FurtherInspectionsModel, code);
        return { exists: result !== null };
    }

    static async Create(data: O_FurtherInspectionsModel) {
        await sql`
            INSERT INTO public."O_FurtherInspections"
            ("Code", "Name", "SortOrder", "CreatedAt")
            VALUES
            (${data.Code}, ${data.Name}, ${data.SortOrder}, ${new Date().toUTCString()})
        `;
    }

    static async CreateList(dataList: O_FurtherInspectionsModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    static async Update(data: O_FurtherInspectionsModel) {
        await sql`
            UPDATE public."O_FurtherInspections"
            SET "Name" = ${data.Name},
                "SortOrder" = ${data.SortOrder},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Code" = ${data.Code}
        `;
    }

    static async UpdateList(dataList: O_FurtherInspectionsModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async Delete(code: string) {
        await JC_Utils_Business.sqlDelete(O_FurtherInspectionsModel, code);
    }

    static async DeleteList(codes: string[]) {
        for (const code of codes) {
            await this.Delete(code);
        }
    }

    static async UpdateSortOrder(data: { Code: string; SortOrder: number }[]) {
        for (const item of data) {
            await sql`
                UPDATE public."O_FurtherInspections"
                SET "SortOrder" = ${item.SortOrder},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Code" = ${item.Code}
            `;
        }
    }
}
