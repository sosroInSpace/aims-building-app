import { O_StoreysBusiness } from "../business";
import { O_StoreysModel } from "@/app/models/O_Storeys";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_StoreysModel[] = await request.json();
        await O_StoreysBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
