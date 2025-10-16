import { O_SeverityBusiness } from "../business";
import { O_SeverityModel } from "@/app/models/O_Severity";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update multiple O_Severity
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_SeverityModel[] = await request.json();
        const result = await O_SeverityBusiness.UpdateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
