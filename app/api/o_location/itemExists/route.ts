import { JC_Utils_Business } from "@/app/Utils";
import { O_LocationModel } from "@/app/models/O_Location";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Check if O_Location exists and is not deleted
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const code = params.get("code");

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 });
        }

        // Check if o_location exists and is not deleted
        const exists = await JC_Utils_Business.sqlItemExists(O_LocationModel, code);
        return NextResponse.json({ result: exists }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
