import { JC_Utils_Business } from "@/app/Utils";
import { ReportModel } from "@/app/models/Report";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Missing or invalid 'ids' array in request body" }, { status: 400 });
        }

        for (const id of ids) {
            await JC_Utils_Business.sqlDelete(ReportModel, id);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
