import { FileBusiness } from "../business";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get Files by UserId
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const userId = params.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing 'userId' parameter" }, { status: 400 });
        }

        const result = await FileBusiness.GetByUserId(userId);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
