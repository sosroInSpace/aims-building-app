import { O_StoreysBusiness } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { code, sortOrder } = await request.json();
        await O_StoreysBusiness.UpdateSortOrder(code, sortOrder);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
