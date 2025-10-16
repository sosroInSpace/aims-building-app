import { JC_Utils_Business } from "../../Utils";
import { FileModel } from "@/app/models/File";
import { sql } from "@vercel/postgres";

export class FileBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(id: string) {
        const result = await sql`
            SELECT "file"."Id"
                  ,"file"."UserId"
                  ,CONCAT("user"."FirstName", ' ', "user"."LastName") "Ex_UserName"
                  ,"user"."Email" "Ex_UserEmail"
                  ,"file"."FileName"
                  ,"file"."StorageProvider"
                  ,"file"."Bucket"
                  ,"file"."Key"
                  ,"file"."MimeType"
                  ,"file"."SizeBytes"
                  ,"file"."IsPublic"
                  ,"file"."Notes"
                  ,"file"."CreatedAt"
                  ,"file"."ModifiedAt"
                  ,"file"."Deleted"
            FROM public."File" "file"
            INNER JOIN public."User" "user" ON "file"."UserId" = "user"."Id"
            WHERE "file"."Id" = ${id}
              AND "file"."Deleted" = FALSE
        `;

        return result.rows.length > 0 ? new FileModel(result.rows[0]) : null;
    }

    static async GetList() {
        const result = await sql`
            SELECT "file"."Id"
                  ,"file"."UserId"
                  ,CONCAT("user"."FirstName", ' ', "user"."LastName") "Ex_UserName"
                  ,"user"."Email" "Ex_UserEmail"
                  ,"file"."FileName"
                  ,"file"."StorageProvider"
                  ,"file"."Bucket"
                  ,"file"."Key"
                  ,"file"."MimeType"
                  ,"file"."SizeBytes"
                  ,"file"."IsPublic"
                  ,"file"."Notes"
                  ,"file"."CreatedAt"
                  ,"file"."ModifiedAt"
                  ,"file"."Deleted"
            FROM public."File" "file"
            INNER JOIN public."User" "user" ON "file"."UserId" = "user"."Id"
            WHERE "file"."Deleted" = FALSE
            ORDER BY "file"."CreatedAt" DESC
        `;

        return result.rows.map(row => new FileModel(row));
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(data: FileModel) {
        await sql`
            INSERT INTO public."File"
            (
                "Id",
                "UserId",
                "FileName",
                "StorageProvider",
                "Bucket",
                "Key",
                "MimeType",
                "SizeBytes",
                "IsPublic",
                "Notes",
                "CreatedAt"
            )
            VALUES
            (
                ${data.Id},
                ${data.UserId},
                ${data.FileName},
                ${data.StorageProvider},
                ${data.Bucket},
                ${data.Key},
                ${data.MimeType},
                ${data.SizeBytes},
                ${data.IsPublic},
                ${data.Notes || null},
                ${new Date().toUTCString()}
            )
        `;
    }

    static async CreateList(dataList: FileModel[]) {
        for (const data of dataList) {
            await this.Create(data);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(data: FileModel) {
        await sql`
            UPDATE public."File"
            SET "UserId" = ${data.UserId},
                "FileName" = ${data.FileName},
                "StorageProvider" = ${data.StorageProvider},
                "Bucket" = ${data.Bucket},
                "Key" = ${data.Key},
                "MimeType" = ${data.MimeType},
                "SizeBytes" = ${data.SizeBytes},
                "IsPublic" = ${data.IsPublic},
                "Notes" = ${data.Notes || null},
                "ModifiedAt" = ${new Date().toUTCString()}
            WHERE "Id" = ${data.Id}
        `;
    }

    static async UpdateList(dataList: FileModel[]) {
        for (const data of dataList) {
            await this.Update(data);
        }
    }

    // - ------------- - //
    // - CUSTOM METHODS - //
    // - ------------- - //

    static async GetByUserId(userId: string) {
        const result = await sql`
            SELECT "file"."Id"
                  ,"file"."UserId"
                  ,CONCAT("user"."FirstName", ' ', "user"."LastName") "Ex_UserName"
                  ,"user"."Email" "Ex_UserEmail"
                  ,"file"."FileName"
                  ,"file"."StorageProvider"
                  ,"file"."Bucket"
                  ,"file"."Key"
                  ,"file"."MimeType"
                  ,"file"."SizeBytes"
                  ,"file"."IsPublic"
                  ,"file"."Notes"
                  ,"file"."CreatedAt"
                  ,"file"."ModifiedAt"
                  ,"file"."Deleted"
            FROM public."File" "file"
            INNER JOIN public."User" "user" ON "file"."UserId" = "user"."Id"
            WHERE "file"."UserId" = ${userId}
              AND "file"."Deleted" = FALSE
            ORDER BY "file"."CreatedAt" DESC
        `;

        return result.rows.map(row => new FileModel(row));
    }

    static async GetListByIdsList(fileIds: string[]) {
        if (fileIds.length === 0) {
            return [];
        }

        // Use the sqlGetList utility with a WHERE clause for the IDs
        const idsPlaceholders = fileIds.map(id => `'${id}'`).join(",");
        const whereClause = `main."Id" IN (${idsPlaceholders})`;

        const result = await JC_Utils_Business.sqlGetList<FileModel>(FileModel, whereClause, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "CreatedAt", SortAsc: true }] // Keep ascending for upload order
        });

        return result.ResultList || [];
    }
}
