import { JC_Utils_Dates } from "@/app/Utils";
import { sql } from "@vercel/postgres";
import { UserModel } from "../../models/User";

export class UserBusiness {
    // - --- - //
    // - GET - //
    // - --- - //

    static async Get(userId: string) {
        return (
            await sql<UserModel>`
            SELECT "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "LoginFailedAttempts",
                "LoginLockoutDate",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "TwoFactorCode",
                "TwoFactorCodeExpiry",
                "ReportTypeListJson",
                "CreatedAt",
                "ModifiedAt",
                "Deleted"
            FROM public."User"
            WHERE "Id" = ${userId}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetUserByStripeId(stripeCustomerId: string) {
        return (
            await sql<UserModel>`
            SELECT "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "LoginFailedAttempts",
                "LoginLockoutDate",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "TwoFactorCode",
                "TwoFactorCodeExpiry",
                "ReportTypeListJson",
                "CreatedAt",
                "ModifiedAt",
                "Deleted"
            FROM public."User"
            WHERE "StripeCustomerId" = ${stripeCustomerId}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetByEmail(userEmail: string) {
        return (
            await sql<UserModel>`
            SELECT "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "LoginFailedAttempts",
                "LoginLockoutDate",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "TwoFactorCode",
                "TwoFactorCodeExpiry",
                "ReportTypeListJson",
                "CreatedAt",
                "ModifiedAt",
                "Deleted"
            FROM public."User"
            WHERE LOWER("Email") = LOWER(${userEmail})
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetByToken(userToken: string) {
        return (
            await sql<UserModel>`
            SELECT "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "LoginFailedAttempts",
                "LoginLockoutDate",
                "ChangePasswordToken",
                "ChangePasswordTokenDate",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "TwoFactorCode",
                "TwoFactorCodeExpiry",
                "ReportTypeListJson",
                "CreatedAt",
                "ModifiedAt",
                "Deleted"
            FROM public."User"
            WHERE "ChangePasswordToken" = ${userToken}
              AND "Deleted" = 'False'
        `
        ).rows[0];
    }

    static async GetList() {
        return (
            await sql<UserModel>`
            SELECT "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "LoginFailedAttempts",
                "LoginLockoutDate",
                "ChangePasswordToken",
                "ChangePasswordTokenDate",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "TwoFactorCode",
                "TwoFactorCodeExpiry",
                "ReportTypeListJson",
                "CreatedAt",
                "ModifiedAt",
                "Deleted"
            FROM public."User"
            WHERE "Deleted" = 'False'
            ORDER BY "CreatedAt" DESC
        `
        ).rows;
    }

    // - ------ - //
    // - CREATE - //
    // - ------ - //

    static async Create(userData: UserModel) {
        await sql`
            INSERT INTO public."User"
            (
                "Id",
                "FirstName",
                "LastName",
                "Email",
                "PasswordHash",
                "Phone",
                "EmployeeOfUserId",
                "CompanyName",
                "ABN",
                "Qualification",
                "IsEmailSubscribed",
                "IsDiscountUser",
                "StripeCustomerId",
                "LogoFileId",
                "IsVerified",
                "VerificationToken",
                "Enable2fa",
                "ReportTypeListJson",
                "CreatedAt"
            )
            VALUES
            (
                ${userData.Id},
                ${userData.FirstName},
                ${userData.LastName},
                ${userData.Email},
                ${userData.PasswordHash},
                ${userData.Phone},
                ${userData.EmployeeOfUserId},
                ${userData.CompanyName},
                ${userData.ABN},
                ${userData.Qualification},
                ${userData.IsEmailSubscribed},
                ${userData.IsDiscountUser},
                ${userData.StripeCustomerId},
                ${userData.LogoFileId},
                ${userData.IsVerified},
                ${userData.VerificationToken},
                ${userData.Enable2fa},
                ${userData.ReportTypeListJson},
                ${new Date().toUTCString()}
            )
        `;
    }

    static async CreateList(userDataList: UserModel[]) {
        for (const userData of userDataList) {
            await this.Create(userData);
        }
    }

    // - ------ - //
    // - UPDATE - //
    // - ------ - //

    static async Update(userData: UserModel) {
        await sql`
            UPDATE public."User"
            SET "FirstName"         = ${userData.FirstName},
                "LastName"          = ${userData.LastName},
                "Email"             = ${userData.Email},
                "Phone"             = ${userData.Phone},
                "CompanyName"       = ${userData.CompanyName},
                "ABN"               = ${userData.ABN},
                "Qualification"     = ${userData.Qualification},
                "IsEmailSubscribed" = ${userData.IsEmailSubscribed},
                "StripeCustomerId"  = ${userData.StripeCustomerId},
                "LogoFileId"        = ${userData.LogoFileId},
                "Enable2fa"         = ${userData.Enable2fa},
                "ReportTypeListJson" = ${userData.ReportTypeListJson},
                "ModifiedAt"        = ${new Date().toUTCString()},
                "Deleted"           = ${userData.Deleted}
            WHERE "Id" = ${userData.Id}
        `;
    }

    static async UpdateList(userDataList: UserModel[]) {
        for (const userData of userDataList) {
            await this.Update(userData);
        }
    }

    static async UpdatePassword(userId: string, newHash: string) {
        await sql`
            UPDATE public."User"
            SET "PasswordHash" = ${newHash},
                "ChangePasswordToken" = NULL,
                "ChangePasswordTokenDate" = NULL
            WHERE "Id" = ${userId}
        `;
    }

    static async UpdateStripeCustomerId(userId: string, newCustomerId: string) {
        await sql`
            UPDATE public."User"
            SET "StripeCustomerId" = ${newCustomerId}
            WHERE "Id" = ${userId}
        `;
    }

    static async IncrementFailedAttemptsByEmail(email: string) {
        await sql`
            UPDATE public."User"
            SET "LoginFailedAttempts" = "LoginFailedAttempts"+1
            WHERE LOWER("Email") = LOWER(${email});
        `;
        let newFaildAttempts = (
            await sql`
            SELECT "LoginFailedAttempts"
            FROM public."User"
            WHERE LOWER("Email") = LOWER(${email})
              AND "Deleted" = 'False'
        `
        ).rows[0].LoginFailedAttempts;
        // IF new LoginFailedAttempts >= 5, lockout user and reset LoginFailedAttempts
        if (newFaildAttempts >= 5) {
            await sql`
                UPDATE public."User"
                SET "LoginLockoutDate" = ${new Date().toUTCString()},
                    "LoginFailedAttempts" = 0
                WHERE LOWER("Email") = LOWER(${email});
            `;
            return true; // Return true if now locked out
        }
        return false;
    }

    static async ResetFailedAttemptsByEmail(email: string) {
        await sql`
            UPDATE public."User"
            SET "LoginFailedAttempts" = 0
            WHERE LOWER("Email") = LOWER(${email});
        `;
    }

    static async SetResetPasswordToken(email: string, newToken: string) {
        await sql`
            UPDATE public."User"
            SET "ChangePasswordToken" = ${newToken},
                "ChangePasswordTokenDate" = ${JC_Utils_Dates.formatDateForPostgres(new Date())}
            WHERE LOWER("Email") = LOWER(${email});
        `;
    }

    static async SetUserVerificationToken(userId: string, verificationToken: string) {
        await sql`
            UPDATE public."User"
            SET "VerificationToken" = ${verificationToken}
            WHERE "Id" = ${userId}
        `;
    }

    static async SetUserIsVerified(userId: string) {
        await sql`
            UPDATE public."User"
            SET "IsVerified" = true
            WHERE "Id" = ${userId}
        `;
    }

    // - 2FA METHODS - //

    static async Generate2FACode(): Promise<string> {
        // Generate a 6-digit code
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async Set2FACode(email: string, code: string) {
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10); // Code expires in 10 minutes

        await sql`
            UPDATE public."User"
            SET "TwoFactorCode" = ${code},
                "TwoFactorCodeExpiry" = ${JC_Utils_Dates.formatDateForPostgres(expiryTime)}
            WHERE LOWER("Email") = LOWER(${email})
        `;
    }

    static async Validate2FACode(email: string, code: string): Promise<boolean> {
        const user = (
            await sql<UserModel>`
            SELECT "TwoFactorCode", "TwoFactorCodeExpiry"
            FROM public."User"
            WHERE LOWER("Email") = LOWER(${email})
              AND "Deleted" = 'False'
        `
        ).rows[0];

        if (!user || !user.TwoFactorCode || !user.TwoFactorCodeExpiry) {
            return false;
        }

        // Check if code matches and hasn't expired
        const isCodeValid = user.TwoFactorCode === code;
        const isNotExpired = new Date() < new Date(user.TwoFactorCodeExpiry);

        return isCodeValid && isNotExpired;
    }

    static async Clear2FACode(email: string) {
        await sql`
            UPDATE public."User"
            SET "TwoFactorCode" = NULL,
                "TwoFactorCodeExpiry" = NULL
            WHERE LOWER("Email") = LOWER(${email})
        `;
    }

    static async Toggle2FA(userId: string, enable2fa: boolean) {
        await sql`
            UPDATE public."User"
            SET "Enable2fa" = ${enable2fa}
            WHERE "Id" = ${userId}
        `;
    }
}
