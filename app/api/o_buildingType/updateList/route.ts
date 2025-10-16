import { O_BuildingTypeBusiness } from "../business";
import { O_BuildingTypeModel } from "@/app/models/O_BuildingType";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: O_BuildingTypeModel[] = await request.json();
        await O_BuildingTypeBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
