import { FileBusiness } from "../business";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update multiple Files
export async function POST(request: NextRequest) {
    try {
        const dataList: FileModel[] = await request.json();
        await FileBusiness.UpdateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
