import { O_FurnishedBusiness } from "../business";
import { O_FurnishedModel } from "@/app/models/O_Furnished";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_FurnishedModel[] = await request.json();
        await O_FurnishedBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
