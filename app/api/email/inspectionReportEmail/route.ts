import { EmailBusiness_AWS, EmailBusiness_Resend } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { customer, pdfBase64 } = await request.json();

        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.sendInspectionReportEmail(customer, pdfBase64);
        } else {
            await EmailBusiness_AWS.sendInspectionReportEmail(customer, pdfBase64);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
