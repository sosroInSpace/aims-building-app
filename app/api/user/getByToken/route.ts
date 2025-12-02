import { NextRequest, NextResponse } from "next/server";
import { UserBusiness } from "../business";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
    try {
        const params = new URL(request.url).searchParams;
        const userToken = params.get("userToken")!;
        const result = await UserBusiness.GetByToken(userToken);

        // Return with no-cache headers
        return NextResponse.json(
            { result },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0"
                }
            }
        );
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
