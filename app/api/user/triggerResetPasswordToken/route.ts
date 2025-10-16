import { EmailBusiness_AWS, EmailBusiness_Resend } from "../../email/business";
import { UserBusiness } from "../business";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        const normalizedEmail = email.toLowerCase();
        // Set token
        let newResetPasswordToken = await bcrypt.hash(normalizedEmail, 12);
        await UserBusiness.SetResetPasswordToken(normalizedEmail, newResetPasswordToken);

        // Send email using the appropriate service
        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.sendResetPasswordEmail(normalizedEmail, newResetPasswordToken);
        } else {
            await EmailBusiness_AWS.sendResetPasswordEmail(normalizedEmail, newResetPasswordToken);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
