import { auth } from "@/app/auth";
import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get customer data with all property page options in a single optimized query
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

        // Build the complete SQL query to get customer data and all property option data in one call
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
                  AND c."UserId" = $2
                  AND c."Deleted" = 'False'
            ),
            building_type_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_BuildingType"
                WHERE "Deleted" = 'False'
            ),
            orientation_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Orientation"
                WHERE "Deleted" = 'False'
            ),
            num_bedrooms_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_NumBedrooms"
                WHERE "Deleted" = 'False'
            ),
            storeys_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Storeys"
                WHERE "Deleted" = 'False'
            ),
            furnished_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Furnished"
                WHERE "Deleted" = 'False'
            ),
            occupied_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Occupied"
                WHERE "Deleted" = 'False'
            ),
            floor_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Floor"
                WHERE "Deleted" = 'False'
            ),
            other_building_elements_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_OtherBuildingElements"
                WHERE "Deleted" = 'False'
            ),
            other_timber_bldg_elements_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_OtherTimberBldgElements"
                WHERE "Deleted" = 'False'
            ),
            roof_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Roof"
                WHERE "Deleted" = 'False'
            ),
            walls_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Walls"
                WHERE "Deleted" = 'False'
            ),
            weather_options AS (
                SELECT json_agg(
                    json_build_object(
                        'Code', "Code",
                        'Name', "Name",
                        'SortOrder', "SortOrder"
                    ) ORDER BY "SortOrder", "Name"
                ) as options
                FROM public."O_Weather"
                WHERE "Deleted" = 'False'
            )
            SELECT
                cd.*,
                bto.options as "BuildingTypeOptions",
                oo.options as "OrientationOptions",
                nbo.options as "NumBedroomsOptions",
                so.options as "StoreysOptions",
                fo.options as "FurnishedOptions",
                oco.options as "OccupiedOptions",
                flo.options as "FloorOptions",
                obeo.options as "OtherBuildingElementsOptions",
                otbeo.options as "OtherTimberBldgElementsOptions",
                ro.options as "RoofOptions",
                wo.options as "WallsOptions",
                weo.options as "WeatherOptions"
            FROM customer_data cd
            CROSS JOIN building_type_options bto
            CROSS JOIN orientation_options oo
            CROSS JOIN num_bedrooms_options nbo
            CROSS JOIN storeys_options so
            CROSS JOIN furnished_options fo
            CROSS JOIN occupied_options oco
            CROSS JOIN floor_options flo
            CROSS JOIN other_building_elements_options obeo
            CROSS JOIN other_timber_bldg_elements_options otbeo
            CROSS JOIN roof_options ro
            CROSS JOIN walls_options wo
            CROSS JOIN weather_options weo
        `;

        const result = await sql.query(queryText, [customerId, session.user.Id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Customer not found or access denied" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
