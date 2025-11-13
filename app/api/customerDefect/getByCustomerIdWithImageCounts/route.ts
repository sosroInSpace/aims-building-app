import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get CustomerDefects by CustomerId with image counts in a single SQL query
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user;
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "Missing 'customerId' parameter" }, { status: 400 });
        }

        // Get sort parameters
        const sortField = searchParams.get("sortField") || "SortOrder";
        const sortAsc = searchParams.get("sortAsc") === "true";
        const sortDirection = sortAsc ? "ASC" : "DESC";

        // Build the ORDER BY clause dynamically
        let orderByClause = "";
        if (sortField === "SortOrder") {
            orderByClause = `cd."SortOrder" ${sortDirection}, cd."CreatedAt" DESC`;
        } else if (sortField === "CreatedAt") {
            orderByClause = `cd."CreatedAt" ${sortDirection}`;
        } else if (sortField === "ModifiedAt") {
            orderByClause = `cd."ModifiedAt" ${sortDirection} NULLS LAST`;
        } else if (sortField === "Name") {
            orderByClause = `cd."Name" ${sortDirection}`;
        } else {
            // Default to SortOrder
            orderByClause = `cd."SortOrder" ${sortDirection}, cd."CreatedAt" DESC`;
        }

        // Build the complete SQL query with dynamic ORDER BY
        const queryText = `
            SELECT 
                cd."Id",
                cd."CustomerId",
                cd."Name",
                cd."BuildingListJson",
                cd."AreaListJson",
                cd."LocationListJson",
                cd."OrientationCode",
                cd."DefectFindingCode",
                cd."DefectFindingNameOverride",
                cd."DefectFindingInformationOverride",
                cd."SeverityListJson",
                cd."SortOrder",
                cd."CreatedAt",
                cd."ModifiedAt",
                cd."Deleted",
                COALESCE(image_counts.image_count, 0) as "ImageCount"
            FROM public."CustomerDefect" cd
            LEFT JOIN (
                SELECT 
                    "DefectId",
                    COUNT(*) as image_count
                FROM public."DefectImage"
                WHERE "Deleted" = 'False'
                GROUP BY "DefectId"
            ) image_counts ON cd."Id" = image_counts."DefectId"
            WHERE cd."CustomerId" = $1
              AND cd."Deleted" = 'False'
            ORDER BY ${orderByClause}
        `;

        const result = await sql.query(queryText, [customerId]);

        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
