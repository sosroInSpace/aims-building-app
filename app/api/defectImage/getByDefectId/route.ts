import { JC_Utils_Business } from "@/app/Utils";
import { DefectImageModel } from "@/app/models/DefectImage";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get DefectImages by DefectId with signed URLs
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const defectId = params.get("defectId");

        if (!defectId) {
            return NextResponse.json({ error: "Missing 'defectId' parameter" }, { status: 400 });
        }

        // Use sqlGetList to get DefectImage records for the defect
        const whereClause = `main."DefectId" = '${defectId}'`;

        const result = await JC_Utils_Business.sqlGetList<DefectImageModel>(DefectImageModel, whereClause, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "SortOrder", SortAsc: true }]
        });

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
