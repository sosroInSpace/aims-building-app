import { O_DefectOrientationBusiness } from "../business";
import { O_DefectOrientationModel } from "@/app/models/O_DefectOrientation";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create multiple O_DefectOrientation
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_DefectOrientationModel[] = await request.json();
        const result = await O_DefectOrientationBusiness.CreateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
