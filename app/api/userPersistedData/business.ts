import { UserPersistedDataModel } from "@/app/models/UserPersistedData";
import { sql } from "@vercel/postgres";

export class UserPersistedDataBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(id: string) {
        return (
            await sql<UserPersistedDataModel>`
            SELECT "Id",
                   "UserId",
                   "Code",
                   "Value"
            FROM public."UserPersistedData"
            WHERE "Id" = ${id}
        `
        ).rows[0];
    }

    static async GetByUserIdAndCode(userId: string, code: string) {
        return (
            await sql<UserPersistedDataModel>`
            SELECT "Id",
                   "UserId",
                   "Code",
                   "Value"
            FROM public."UserPersistedData"
            WHERE "UserId" = ${userId}
              AND "Code" = ${code}
        `
        ).rows[0];
    }

    static async GetByUserId(userId: string) {
        return (
            await sql<UserPersistedDataModel>`
            SELECT "Id",
                   "UserId",
                   "Code",
                   "Value"
            FROM public."UserPersistedData"
            WHERE "UserId" = ${userId}
            ORDER BY "Code"
        `
        ).rows;
    }

    static async GetList() {
        return (
            await sql<UserPersistedDataModel>`
            SELECT "Id",
                   "UserId",
                   "Code",
                   "Value"
            FROM public."UserPersistedData"
            ORDER BY "UserId", "Code"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: UserPersistedDataModel) {
        await sql`
            INSERT INTO public."UserPersistedData"
            (
                "Id",
                "UserId",
                "Code",
                "Value"
            )
            VALUES
            (
                ${data.Id},
                ${data.UserId},
                ${data.Code},
                ${data.Value}
            )
        `;
    }

    static async CreateList(dataList: UserPersistedDataModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: UserPersistedDataModel) {
        await sql`
            UPDATE public."UserPersistedData"
            SET "Value" = ${data.Value}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: UserPersistedDataModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    static async UpdateValue(userId: string, code: string, value: string) {
        await sql`
            UPDATE public."UserPersistedData"
            SET "Value" = ${value}
            WHERE "UserId" = ${userId}
              AND "Code" = ${code}
        `;
    }

    // - ------ - //
    // - DELETE - //
    // - ------ - //

    static async DeleteByUserIdAndCode(userId: string, code: string) {
        await sql`
            DELETE FROM public."UserPersistedData"
            WHERE "UserId" = ${userId}
              AND "Code" = ${code}
        `;
    }
}
