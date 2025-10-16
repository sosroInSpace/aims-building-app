import { O_FurtherInspectionsBusiness } from "../business";
import { O_FurtherInspectionsModel } from "@/app/models/O_FurtherInspections";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update multiple O_FurtherInspections
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_FurtherInspectionsModel[] = await request.json();
        const result = await O_FurtherInspectionsBusiness.UpdateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
