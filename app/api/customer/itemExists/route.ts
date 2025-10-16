import { JC_Utils_Business } from "@/app/Utils";
import { CustomerModel } from "@/app/models/Customer";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Check if Customer exists and is not deleted
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }

        // Check if customer exists and is not deleted
        const exists = await JC_Utils_Business.sqlItemExists(CustomerModel, id);
        return NextResponse.json({ result: exists }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
