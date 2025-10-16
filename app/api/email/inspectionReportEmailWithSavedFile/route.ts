import { EmailBusiness_AWS, EmailBusiness_Resend } from "../business";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { customer, s3Key } = await request.json();

        if (!s3Key) {
            return NextResponse.json({ error: "Missing s3Key parameter" }, { status: 400 });
        }

        if (process.env.USE_RESEND === "true") {
            await EmailBusiness_Resend.sendInspectionReportEmailWithSavedFile(customer, s3Key);
        } else {
            await EmailBusiness_AWS.sendInspectionReportEmailWithSavedFile(customer, s3Key);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
