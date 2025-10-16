import { EmailBusiness_AWS, EmailBusiness_Resend } from "../../email/business";
import { UserBusiness } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        const normalizedEmail = email.toLowerCase();

        // Check if user exists and has 2FA enabled
        const user = await UserBusiness.GetByEmail(normalizedEmail);
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (!user.Enable2fa) {
            return NextResponse.json({ error: "2FA is not enabled for this user." }, { status: 400 });
        }

        // Generate and set 2FA code
        const code = await UserBusiness.Generate2FACode();
        await UserBusiness.Set2FACode(normalizedEmail, code);

        // Send email using the appropriate service
        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.send2FAEmail(normalizedEmail, code);
        } else {
            await EmailBusiness_AWS.send2FAEmail(normalizedEmail, code);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
