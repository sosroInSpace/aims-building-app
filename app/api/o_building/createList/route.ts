import { O_BuildingBusiness } from "../business";
import { O_BuildingModel } from "@/app/models/O_Building";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create multiple O_Building
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_BuildingModel[] = await request.json();
        const result = await O_BuildingBusiness.CreateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
