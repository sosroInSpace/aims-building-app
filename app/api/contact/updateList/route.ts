import { ContactBusiness } from "../business";
import { ContactModel } from "@/app/models/Contact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const dataList: ContactModel[] = await request.json();
        await ContactBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
