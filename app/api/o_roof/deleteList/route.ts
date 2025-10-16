import { JC_Utils_Business } from "@/app/Utils";
import { O_RoofModel } from "@/app/models/O_Roof";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const { codes } = await request.json();
        if (!codes || !Array.isArray(codes)) {
            return NextResponse.json({ error: "Missing or invalid 'codes' array in request body" }, { status: 400 });
        }

        for (const code of codes) {
            await JC_Utils_Business.sqlDelete(O_RoofModel, code);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
