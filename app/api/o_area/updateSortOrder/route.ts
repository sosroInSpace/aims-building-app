import { O_AreaBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update sort order for multiple O_Area
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: { Code: string; SortOrder: number }[] = await request.json();
        const result = await O_AreaBusiness.UpdateSortOrder(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
