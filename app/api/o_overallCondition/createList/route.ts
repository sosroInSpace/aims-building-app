import { O_OverallConditionBusiness } from "../business";
import { O_OverallConditionModel } from "@/app/models/O_OverallCondition";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create multiple O_OverallCondition
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_OverallConditionModel[] = await request.json();
        const result = await O_OverallConditionBusiness.CreateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
