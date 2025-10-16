import { O_NumBedroomsBusiness } from "../business";
import { O_NumBedroomsModel } from "@/app/models/O_NumBedrooms";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: O_NumBedroomsModel[] = await request.json();
        await O_NumBedroomsBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
