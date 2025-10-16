import { DefectImageBusiness } from "../business";
import { DefectImageModel } from "@/app/models/DefectImage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: DefectImageModel[] = await request.json();
        await DefectImageBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
