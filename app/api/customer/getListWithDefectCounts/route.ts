import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get customers created by the current user with defect counts - optimized for customer page
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user;
        const { searchParams } = new URL(request.url);

        // Get sort parameters
        const sortField = searchParams.get("sortField") || "ModifiedAt";
        const sortAsc = searchParams.get("sortAsc") === "true";
        const sortDirection = sortAsc ? "ASC" : "DESC";

        // Build the ORDER BY clause dynamically
        let orderByClause = "";
        if (sortField === "ModifiedAt") {
            orderByClause = `c."ModifiedAt" ${sortDirection} NULLS FIRST, c."CreatedAt" ${sortDirection} NULLS FIRST`;
        } else if (sortField === "CreatedAt") {
            orderByClause = `c."CreatedAt" ${sortDirection} NULLS FIRST, c."ModifiedAt" ${sortDirection} NULLS FIRST`;
        } else if (sortField === "Address") {
            orderByClause = `c."Address" ${sortDirection}`;
        } else if (sortField === "ClientName") {
            orderByClause = `c."ClientName" ${sortDirection}`;
        } else {
            // Default to ModifiedAt
            orderByClause = `c."ModifiedAt" ${sortDirection} NULLS FIRST, c."CreatedAt" ${sortDirection} NULLS FIRST`;
        }

        // Build the complete SQL query with dynamic ORDER BY
        const queryText = `
            SELECT
                c."Id",
                c."UserId",
                c."ReportTypeCode",
                c."ClientName",
                c."ClientPhone",
                c."ClientEmail",
                c."ClientPrincipalName",
                c."MainImageFileId",
                c."Address",
                c."PostalAddress",
                c."InspectionDate",
                c."InspectorName",
                c."InspectorPhone",
                c."InspectorQualification",
                c."BuildingTypeListJson",
                c."CompanyStrataTitle",
                c."NumBedroomsListJson",
                c."OrientationListJson",
                c."StoreysListJson",
                c."FurnishedListJson",
                c."OccupiedListJson",
                c."FloorListJson",
                c."OtherBuildingElementsListJson",
                c."OtherTimberBldgElementsListJson",
                c."RoofListJson",
                c."WallsListJson",
                c."WeatherListJson",
                c."RoomsListJson",
                c."Summary",
                c."SpecialConditions",
                c."RiskOfUndetectedDefectsListJson",
                c."CreatedAt",
                c."ModifiedAt",
                c."Deleted",
                COALESCE(defect_counts.defect_count, 0) as "DefectCount"
            FROM public."Customer" c
            LEFT JOIN (
                SELECT
                    "CustomerId",
                    COUNT(*) as defect_count
                FROM public."CustomerDefect"
                WHERE "Deleted" = 'False'
                GROUP BY "CustomerId"
            ) defect_counts ON c."Id" = defect_counts."CustomerId"
            WHERE c."UserId" = $1
              AND c."Deleted" = 'False'
            ORDER BY ${orderByClause}
        `;

        const result = await sql.query(queryText, [currentUser.Id]);

        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
