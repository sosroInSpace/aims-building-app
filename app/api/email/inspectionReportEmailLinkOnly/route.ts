import { EmailBusiness_AWS, EmailBusiness_Resend } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { customer } = await request.json();

        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.sendInspectionReportEmailLinkOnly(customer);
        } else {
            await EmailBusiness_AWS.sendInspectionReportEmailLinkOnly(customer);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
