import { UserPersistedDataBusiness } from "../business";
import { UserPersistedDataModel } from "@/app/models/UserPersistedData";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const dataList: UserPersistedDataModel[] = await request.json();
        await UserPersistedDataBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
