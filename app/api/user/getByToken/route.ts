import { UserBusiness } from "../business";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const params = new URL(request.url).searchParams;
        const userToken = params.get("userToken")!;
        const result = await UserBusiness.GetByToken(userToken);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
