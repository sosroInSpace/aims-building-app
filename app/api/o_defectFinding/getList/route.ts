import { O_DefectFindingBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all O_DefectFinding
export async function GET() {
    try {
        unstable_noStore();
        const result = await O_DefectFindingBusiness.GetList();
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
