import { O_DefectFindingBusiness } from "../business";
import { O_DefectFindingModel } from "@/app/models/O_DefectFinding";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: O_DefectFindingModel[] = await request.json();
        await O_DefectFindingBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
