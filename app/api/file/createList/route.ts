import { FileBusiness } from "../business";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Create multiple Files
export async function PUT(request: NextRequest) {
    try {
        const dataList: FileModel[] = await request.json();
        await FileBusiness.CreateList(dataList);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
