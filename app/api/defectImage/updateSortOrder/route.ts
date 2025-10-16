import { DefectImageBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Update sort order for DefectImage
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: { Id: string; SortOrder: number }[] = await request.json();
        const result = await DefectImageBusiness.UpdateSortOrder(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
