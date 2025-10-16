import { O_RiskOfUndetectedDefectsBusiness } from "../business";
import { O_RiskOfUndetectedDefectsModel } from "@/app/models/O_RiskOfUndetectedDefects";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update multiple O_RiskOfUndetectedDefects
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_RiskOfUndetectedDefectsModel[] = await request.json();
        const result = await O_RiskOfUndetectedDefectsBusiness.UpdateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
