import { O_RoofBusiness } from "../business";
import { O_RoofModel } from "@/app/models/O_Roof";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: O_RoofModel[] = await request.json();
        await O_RoofBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
