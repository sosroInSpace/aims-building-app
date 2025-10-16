import { UserBusiness } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();
        const normalizedEmail = email.toLowerCase();
        
        // Validate the 2FA code
        const isValid = await UserBusiness.Validate2FACode(normalizedEmail, code);
        
        if (isValid) {
            // Clear the 2FA code after successful validation
            await UserBusiness.Clear2FACode(normalizedEmail);
            return NextResponse.json({ valid: true });
        } else {
            return NextResponse.json({ valid: false, error: "Invalid or expired code." }, { status: 400 });
        }
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
