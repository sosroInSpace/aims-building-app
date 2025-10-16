import { GlobalSettingsModel } from "@/app/models/GlobalSettings";
import { sql } from "@vercel/postgres";

export class GlobalSettingsBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(code: string) {
        return (
            await sql<GlobalSettingsModel>`
            SELECT "Code",
                   "Description",
                   "Value"
            FROM public."GlobalSettings"
            WHERE "Code" = ${code}
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<GlobalSettingsModel>`
            SELECT "Code",
                   "Description",
                   "Value"
            FROM public."GlobalSettings"
            ORDER BY "Code"
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(setting: GlobalSettingsModel) {
        await sql`
            INSERT INTO public."GlobalSettings"
            ("Code", "Description", "Value")
            VALUES
            (${setting.Code}, ${setting.Description}, ${setting.Value})
        `;
    }

    static async CreateList(settings: GlobalSettingsModel[]) {
        for (const setting of settings) {
            await this.Create(setting);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async UpdateValue(code: string, value: string) {
        await sql`
            UPDATE public."GlobalSettings"
            SET "Value" = ${value}
            WHERE "Code" = ${code}
        `;
    }

    static async Update(setting: GlobalSettingsModel) {
        await sql`
            UPDATE public."GlobalSettings"
            SET "Description" = ${setting.Description},
                "Value" = ${setting.Value}
            WHERE "Code" = ${setting.Code}
        `;
    }

    static async UpdateList(settings: GlobalSettingsModel[]) {
        for (const setting of settings) {
            await this.Update(setting);
        }
    }
}
