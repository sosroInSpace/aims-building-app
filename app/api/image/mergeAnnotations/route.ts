import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge Runtime)
export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
    try {
        // This endpoint is deprecated - all annotation rendering should be done on the frontend
        // Return an error to force the frontend to use the pixel-based approach
        return NextResponse.json(
            {
                error: "Backend annotation merging is deprecated. Please use frontend pixel rendering instead.",
                usePixelRendering: true
            },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error in deprecated mergeAnnotations endpoint:", error);
        return NextResponse.json(
            {
                error: "Backend annotation merging is deprecated. Please use frontend pixel rendering instead.",
                usePixelRendering: true
            },
            { status: 500 }
        );
    }
}
