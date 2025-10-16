import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy image requests to avoid CORS issues
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.Id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = new URL(request.url).searchParams;
        const key = params.get("key");

        if (!key) {
            return NextResponse.json({ error: "Missing 'key' parameter" }, { status: 400 });
        }

        // Get the image from S3 using AWS SDK
        const { GetObjectCommand, S3Client } = await import("@aws-sdk/client-s3");

        const s3Client = new S3Client({
            region: process.env.AWS_REGION || "ap-southeast-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // Convert the stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        // Return the image with proper headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": response.ContentType || "image/webp",
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "public, max-age=300", // 5 minutes cache
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    } catch (error) {
        console.error("Error proxying image:", error);
        return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
    }
}
