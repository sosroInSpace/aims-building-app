import { GlobalSettingsBusiness } from "../business";
import { GlobalSettingsModel } from "@/app/models/GlobalSettings";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const settings: GlobalSettingsModel[] = await request.json();
        await GlobalSettingsBusiness.CreateList(settings);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
