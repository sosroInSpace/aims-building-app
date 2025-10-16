import { ReportBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get Reports by CustomerId
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const customerId = params.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "Missing 'customerId' parameter" }, { status: 400 });
        }

        const result = await ReportBusiness.GetByCustomerId(customerId);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
