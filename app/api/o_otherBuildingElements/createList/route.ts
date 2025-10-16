import { O_OtherBuildingElementsBusiness } from "../business";
import { O_OtherBuildingElementsModel } from "@/app/models/O_OtherBuildingElements";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_OtherBuildingElementsModel[] = await request.json();
        await O_OtherBuildingElementsBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
