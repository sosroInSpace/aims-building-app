import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get customer data with all summary page options in a single optimized query
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "Missing customerId parameter" }, { status: 400 });
        }

        const currentUser = session.user;

        // First, get the customer to check who created it
        const customerQuery = `SELECT "UserId" FROM public."Customer" WHERE "Id" = $1 AND "Deleted" = 'False'`;
        const customerResult = await sql.query(customerQuery, [customerId]);

        if (customerResult.rows.length === 0) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const customerUserId = customerResult.rows[0].UserId;

        // Check authorization: user can access if they created the customer OR if they're an admin and the customer was created by their employee
        let isAuthorized = false;

        if (customerUserId === currentUser.Id) {
            // User created this customer themselves
            isAuthorized = true;
        } else if (!currentUser.EmployeeOfUserId) {
            // Current user is an admin, check if customerUserId is one of their employees
            const employeeCheckQuery = `
                SELECT "Id" FROM public."User"
                WHERE "Id" = $1 AND "EmployeeOfUserId" = $2 AND "Deleted" = 'False'
            `;
            const employeeResult = await sql.query(employeeCheckQuery, [customerUserId, currentUser.Id]);
            isAuthorized = employeeResult.rows.length > 0;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Customer not found or access denied" }, { status: 404 });
        }

        // Build the complete SQL query to get customer data and all option data in one call
        const queryText = `
            WITH customer_data AS (
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
                    c."OverallConditionListJson",
                    c."FutherInspectionsListJson",
                    c."ObstructionsListJson",
                    c."InaccessibleAreasListJson",
                    c."AreasInspectedListJson",
                    c."RiskOfUndetectedDefectsListJson",
                    c."CreatedAt",
                    c."ModifiedAt",
                    c."Deleted"
                FROM public."Customer" c
                WHERE c."Id" = $1
                  AND c."Deleted" = 'False'
            ),
            overall_condition_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_OverallCondition"
                WHERE "Deleted" = 'False'
            ),
            further_inspections_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_FurtherInspections"
                WHERE "Deleted" = 'False'
            ),
            obstructions_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Obstructions"
                WHERE "Deleted" = 'False'
            ),
            inaccessible_areas_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_InaccessibleAreas"
                WHERE "Deleted" = 'False'
            ),
            areas_inspected_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_AreasInspected"
                WHERE "Deleted" = 'False'
            ),
            risk_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_RiskOfUndetectedDefects"
                WHERE "Deleted" = 'False'
            )
            SELECT
                cd.*,
                oco.options as "OverallConditionOptions",
                fio.options as "FurtherInspectionsOptions",
                oo.options as "ObstructionsOptions",
                iao.options as "InaccessibleAreasOptions",
                aio.options as "AreasInspectedOptions",
                ro.options as "RiskOfUndetectedDefectsOptions"
            FROM customer_data cd
            CROSS JOIN overall_condition_options oco
            CROSS JOIN further_inspections_options fio
            CROSS JOIN obstructions_options oo
            CROSS JOIN inaccessible_areas_options iao
            CROSS JOIN areas_inspected_options aio
            CROSS JOIN risk_options ro
        `;

        const result = await sql.query(queryText, [customerId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Customer not found or access denied" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
