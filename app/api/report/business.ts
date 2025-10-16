import { ReportModel } from "@/app/models/Report";
import { sql } from "@vercel/postgres";

export class ReportBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async GetByUserId(userId: string) {
        return (
            await sql<ReportModel>`
            SELECT "Id",
                   "CustomerId",
                   "UserId",
                   "Name",
                   "FileId",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."Report"
            WHERE "UserId" = ${userId}
              AND "Deleted" = 'False'
            ORDER BY "CreatedAt" DESC
        `
        ).rows;
    }

    static async GetByCustomerId(customerId: string) {
        return (
            await sql<ReportModel>`
            SELECT r."Id",
                   r."CustomerId",
                   r."UserId",
                   r."Name",
                   r."FileId",
                   r."CreatedAt",
                   r."ModifiedAt",
                   r."Deleted",
                   f."Key" AS "Ex_FileKey"
            FROM public."Report" r
            LEFT JOIN public."File" f ON r."FileId" = f."Id"
            WHERE r."CustomerId" = ${customerId}
              AND r."Deleted" = 'False'
            ORDER BY r."CreatedAt" DESC
        `
        ).rows;
    }

    static async GetByCustomerIdAndName(customerId: string, name: string) {
        const result = await sql<ReportModel>`
            SELECT "Id",
                   "CustomerId",
                   "UserId",
                   "Name",
                   "FileId",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."Report"
            WHERE "CustomerId" = ${customerId}
              AND "Name" = ${name}
              AND "Deleted" = 'False'
            LIMIT 1
        `;
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: ReportModel) {
        // Check if a record with the same CustomerId and Name already exists
        const existingReport = await this.GetByCustomerIdAndName(data.CustomerId, data.Name);

        if (existingReport) {
            // Update the existing record (don't change the Id)
            await sql`
                UPDATE public."Report"
                SET "UserId" = ${data.UserId},
                    "FileId" = ${data.FileId},
                    "ModifiedAt" = ${new Date().toUTCString()}
                WHERE "Id" = ${existingReport.Id}
            `;
        } else {
            // Create a new record
            await sql`
                INSERT INTO public."Report"
                (
                    "Id",
                    "CustomerId",
                    "UserId",
                    "Name",
                    "FileId",
                    "CreatedAt"
                )
                VALUES
                (
                    ${data.Id},
                    ${data.CustomerId},
                    ${data.UserId},
                    ${data.Name},
                    ${data.FileId},
                    ${new Date().toUTCString()}
                )
            `;
        }
    }

    static async CreateList(dataList: ReportModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: ReportModel) {
        await sql`
            UPDATE public."Report"
            SET "CustomerId" = ${data.CustomerId},
                "UserId" = ${data.UserId},
                "Name" = ${data.Name},
                "FileId" = ${data.FileId},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${data.Deleted}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: ReportModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }
}
