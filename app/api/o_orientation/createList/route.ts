import { O_OrientationBusiness } from "../business";
import { O_OrientationModel } from "@/app/models/O_Orientation";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_OrientationModel[] = await request.json();
        await O_OrientationBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
