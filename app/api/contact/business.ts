import { ContactModel } from "@/app/models/Contact";
import { sql } from "@vercel/postgres";

export class ContactBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(id: string) {
        return (
            await sql<ContactModel>`
            SELECT "Id",
                   "UserId",
                   "Name",
                   "Email",
                   "Phone",
                   "Message",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."Contact"
            WHERE "Id" = ${id}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<ContactModel>`
            SELECT "Id",
                   "UserId",
                   "Name",
                   "Email",
                   "Phone",
                   "Message",
                   "CreatedAt",
                   "ModifiedAt",
                   "Deleted"
            FROM public."Contact"
            WHERE "Deleted" = 'False'
            ORDER BY "CreatedAt" DESC
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(contactData: ContactModel) {
        await sql`
            INSERT INTO public."Contact"
            (
                "Id",
                "UserId",
                "Name",
                "Email",
                "Phone",
                "Message",
                "CreatedAt"
            )
            VALUES
            (
                ${contactData.Id},
                ${contactData.UserId},
                ${contactData.Name},
                ${contactData.Email},
                ${contactData.Phone},
                ${contactData.Message},
                ${new Date().toUTCString()}
            )
        `;
    }

    static async CreateList(contactDataList: ContactModel[]) {
        for (const contactData of contactDataList) {
            await this.Create(contactData);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(contactData: ContactModel) {
        await sql`
            UPDATE public."Contact"
            SET "UserId" = ${contactData.UserId},
                "Name" = ${contactData.Name},
                "Email" = ${contactData.Email},
                "Phone" = ${contactData.Phone},
                "Message" = ${contactData.Message},
                "ModifiedAt" = ${new Date().toUTCString()},
                "Deleted" = ${contactData.Deleted}
            WHERE "Id" = ${contactData.Id}
        `;
    }

    static async UpdateList(contactDataList: ContactModel[]) {
        for (const contactData of contactDataList) {
            await this.Update(contactData);
        }
    }
}
