import { O_OtherTimberBldgElementsBusiness } from "../business";
import { O_OtherTimberBldgElementsModel } from "@/app/models/O_OtherTimberBldgElements";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_OtherTimberBldgElementsModel[] = await request.json();
        await O_OtherTimberBldgElementsBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
