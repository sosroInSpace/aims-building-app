import { O_WeatherBusiness } from "../business";
import { O_WeatherModel } from "@/app/models/O_Weather";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: O_WeatherModel[] = await request.json();
        await O_WeatherBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
