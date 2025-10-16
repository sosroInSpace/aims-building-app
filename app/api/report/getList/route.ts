import { JC_Utils_Business } from "@/app/Utils";
import { ReportModel } from "@/app/models/Report";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all Report
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();

        const { searchParams } = new URL(request.url);
        const paging = JC_Utils_Business.getPagingFromParams(searchParams, ReportModel);
        let result = await JC_Utils_Business.sqlGetList<ReportModel>(ReportModel, undefined, paging);

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
