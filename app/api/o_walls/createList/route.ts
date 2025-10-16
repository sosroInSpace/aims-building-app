import { O_WallsBusiness } from "../business";
import { O_WallsModel } from "@/app/models/O_Walls";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_WallsModel[] = await request.json();
        await O_WallsBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
