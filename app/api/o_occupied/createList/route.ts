import { O_OccupiedBusiness } from "../business";
import { O_OccupiedModel } from "@/app/models/O_Occupied";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_OccupiedModel[] = await request.json();
        await O_OccupiedBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
