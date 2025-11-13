import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get customers created by a specific user with defect counts - for sub-user selection
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user;
        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");
        const sortField = searchParams.get("sortField") || "ModifiedAt";
        const sortAsc = searchParams.get("sortAsc") === "true";

        if (!targetUserId) {
            return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
        }

        // Only allow access if:
        // 1. User is an admin (EmployeeOfUserId is null) and targetUserId is one of their employees
        // 2. User is requesting their own customers (targetUserId === currentUser.Id)
        let isAuthorized = false;

        if (targetUserId === currentUser.Id) {
            // User is requesting their own customers
            isAuthorized = true;
        } else if (!currentUser.EmployeeOfUserId) {
            // Current user is an admin, check if targetUserId is one of their employees
            const employeeCheckQuery = `
                SELECT "Id" FROM public."User" 
                WHERE "Id" = $1 AND "EmployeeOfUserId" = $2 AND "Deleted" = 'False'
            `;
            const employeeResult = await sql.query(employeeCheckQuery, [targetUserId, currentUser.Id]);
            isAuthorized = employeeResult.rows.length > 0;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Build the ORDER BY clause
        const allowedSortFields = ["Address", "InspectorName", "InspectorPhone", "InspectorQualification", "ClientName", "ClientPhone", "ClientEmail", "ReportTypeCode", "CreatedAt", "ModifiedAt", "DefectCount"];

        let orderByClause = `c."ModifiedAt" DESC`;
        if (allowedSortFields.includes(sortField)) {
            const direction = sortAsc ? "ASC" : "DESC";
            if (sortField === "DefectCount") {
                orderByClause = `COALESCE(defect_counts.defect_count, 0) ${direction}`;
            } else {
                orderByClause = `c."${sortField}" ${direction}`;
            }
        }

        // Query to get customers with defect counts for the specified user
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

        const result = await sql.query(queryText, [targetUserId]);

        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
