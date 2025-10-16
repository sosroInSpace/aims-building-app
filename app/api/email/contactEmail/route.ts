import { EmailBusiness_AWS, EmailBusiness_Resend } from "../business";
import { ContactModel } from "@/app/models/Contact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const emailData: ContactModel = await request.json();

        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.sendContactEmail(emailData);
        } else {
            await EmailBusiness_AWS.sendContactEmail(emailData);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
