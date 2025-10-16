import { JC_Utils_Business } from "@/app/Utils";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Delete multiple Files
export async function DELETE(request: NextRequest) {
    try {
        const idList: string[] = await request.json();

        for (const id of idList) {
            await JC_Utils_Business.sqlDelete(FileModel, id);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
