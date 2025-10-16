import { JC_Utils_Business } from "@/app/Utils";
import { GlobalSettingsModel } from "@/app/models/GlobalSettings";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Check if GlobalSettings exists and is not deleted
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const code = params.get("code");

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 });
        }

        // Check if globalSettings exists and is not deleted
        const exists = await JC_Utils_Business.sqlItemExists(GlobalSettingsModel, code);
        return NextResponse.json({ result: exists }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
