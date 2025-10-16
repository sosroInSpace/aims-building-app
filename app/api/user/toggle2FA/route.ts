import { UserBusiness } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userId, enable2fa } = await request.json();
        
        // Toggle 2FA setting
        await UserBusiness.Toggle2FA(userId, enable2fa);
        
        // If disabling 2FA, clear any existing codes
        if (!enable2fa) {
            const user = await UserBusiness.Get(userId);
            if (user) {
                await UserBusiness.Clear2FACode(user.Email);
            }
        }
        
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
