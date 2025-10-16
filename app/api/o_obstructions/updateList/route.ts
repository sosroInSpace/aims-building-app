import { O_ObstructionsBusiness } from "../business";
import { O_ObstructionsModel } from "@/app/models/O_Obstructions";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update multiple O_Obstructions
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const dataList: O_ObstructionsModel[] = await request.json();
        const result = await O_ObstructionsBusiness.UpdateList(dataList);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
