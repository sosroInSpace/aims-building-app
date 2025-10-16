import { JC_Utils_Business } from "@/app/Utils";
import { O_SummaryModel } from "@/app/models/O_Summary";
import { unstable_noStore } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all O_Summary
export async function GET() {
    try {
        unstable_noStore();
        const result = await JC_Utils_Business.sqlGetList(O_SummaryModel, undefined, {
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
