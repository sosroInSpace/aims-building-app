import { GlobalSettingsBusiness } from "../business";
import { GlobalSettingsModel } from "@/app/models/GlobalSettings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: GlobalSettingsModel[] = await request.json();
        await GlobalSettingsBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
