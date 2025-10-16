import { O_AreaBusiness } from "../business";
import { O_AreaModel } from "@/app/models/O_Area";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create multiple O_Area
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_AreaModel[] = await request.json();
        const result = await O_AreaBusiness.CreateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
