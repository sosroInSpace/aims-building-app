import { O_FloorBusiness } from "../business";
import { O_FloorModel } from "@/app/models/O_Floor";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_FloorModel[] = await request.json();
        await O_FloorBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
