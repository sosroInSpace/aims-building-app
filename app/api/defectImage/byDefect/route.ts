import { DefectImageBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get DefectImages by DefectId
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const defectId = params.get("defectId");

        if (!defectId) {
            return NextResponse.json({ error: "Missing 'defectId' parameter" }, { status: 400 });
        }

        const result = await DefectImageBusiness.GetByDefectId(defectId);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
