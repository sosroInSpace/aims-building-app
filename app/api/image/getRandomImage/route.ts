import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get random image from Picsum Photos and return as base64
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();

        // Add a random parameter to avoid caching issues
        const randomParam = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://picsum.photos/800/600?random=${randomParam}`;

        // Fetch the image from Picsum Photos
        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent": "AIMS-Inspection-App/1.0"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Get the image as an array buffer
        const imageBuffer = await response.arrayBuffer();

        // Convert to base64
        const base64 = Buffer.from(imageBuffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json(
            {
                result: dataUrl,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching random image:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch random image",
                success: false
            },
            { status: 500 }
        );
    }
}
