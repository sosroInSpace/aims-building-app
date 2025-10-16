import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// Force Node runtime
export const runtime = "nodejs";

// Get DocRaptor API key from environment
const DOC_API_KEY = process.env.DOC_API_KEY!;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const statusId = searchParams.get("id");

        if (!statusId) {
            return NextResponse.json({ error: "Status ID is required" }, { status: 400 });
        }

        if (!DOC_API_KEY) {
            return NextResponse.json({ error: "DocRaptor API key not configured" }, { status: 500 });
        }

        // Check status with DocRaptor
        const response = await axios.get(`https://docraptor.com/status/${statusId}`, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${DOC_API_KEY}:`).toString("base64")}`
            }
        });

        const status = response.data.status;

        if (status === "completed") {
            // Return the download URL
            return NextResponse.json({
                result: {
                    status: "completed",
                    download_url: response.data.download_url
                }
            });
        } else if (status === "failed") {
            return NextResponse.json({
                result: {
                    status: "failed",
                    error: response.data.validation_errors || "PDF generation failed"
                }
            });
        } else {
            // Still processing
            return NextResponse.json({
                result: {
                    status: status // 'queued' or 'working'
                }
            });
        }
    } catch (err: any) {
        console.error("DocRaptor status check error:", err.response?.data || err.message);
        return NextResponse.json({ error: "Failed to check PDF status" }, { status: 500 });
    }
}
