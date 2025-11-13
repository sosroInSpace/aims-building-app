import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all employee users for the current admin user with report counts in a single optimized SQL call
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();

        // Get current user session
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Get sort parameters
        const sortField = searchParams.get("sortField") || "ModifiedAt";
        const sortAsc = searchParams.get("sortAsc") === "true";
        const sortDirection = sortAsc ? "ASC" : "DESC";

        // Build ORDER BY clause
        const allowedSortFields = ["FirstName", "LastName", "Email", "Phone", "CompanyName", "CreatedAt", "ModifiedAt", "ReportCount", "QualificationCount"];
        let orderByClause = `u."ModifiedAt" DESC`;
        if (allowedSortFields.includes(sortField)) {
            if (sortField === "ReportCount") {
                orderByClause = `COALESCE(report_counts.report_count, 0) ${sortDirection}`;
            } else if (sortField === "QualificationCount") {
                orderByClause = `qualification_counts.qualification_count ${sortDirection}`;
            } else {
                orderByClause = `u."${sortField}" ${sortDirection}`;
            }
        }

        // Single optimized SQL query to get users with report counts
        const queryText = `
            SELECT
                u."Id",
                u."FirstName",
                u."LastName",
                u."Email",
                u."PasswordHash",
                u."LoginFailedAttempts",
                u."LoginLockoutDate",
                u."ChangePasswordToken",
                u."ChangePasswordTokenDate",
                u."Phone",
                u."EmployeeOfUserId",
                u."CompanyName",
                u."ABN",
                u."Qualification",
                u."IsEmailSubscribed",
                u."IsDiscountUser",
                u."StripeCustomerId",
                u."LogoFileId",
                u."IsVerified",
                u."VerificationToken",
                u."Enable2fa",
                u."TwoFactorCode",
                u."TwoFactorCodeExpiry",
                u."ReportTypeListJson",
                u."CreatedAt",
                u."ModifiedAt",
                u."Deleted",
                COALESCE(report_counts.report_count, 0) as "ReportCount",
                CASE
                    WHEN u."ReportTypeListJson" IS NULL OR u."ReportTypeListJson" = '' OR u."ReportTypeListJson" = '[]'
                    THEN 0
                    ELSE json_array_length(u."ReportTypeListJson"::json)
                END as "QualificationCount"
            FROM public."User" u
            LEFT JOIN (
                SELECT
                    "UserId",
                    COUNT(*) as report_count
                FROM public."Customer"
                WHERE "Deleted" = 'False'
                GROUP BY "UserId"
            ) report_counts ON u."Id" = report_counts."UserId"
            WHERE u."EmployeeOfUserId" = $1
              AND u."Deleted" = 'False'
            ORDER BY ${orderByClause}
        `;

        const result = await sql.query(queryText, [session.user.id]);

        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
