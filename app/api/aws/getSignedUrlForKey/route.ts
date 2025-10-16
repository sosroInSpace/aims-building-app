import { JC_Utils_Files } from "@/app/Utils";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get signed URL for uploading a file with a specific key
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const key = params.get("key");
        const contentType = params.get("contentType");
        const expiresInSeconds = params.get("expiresInSeconds");

        if (!key) {
            return NextResponse.json({ error: "Missing 'key' parameter" }, { status: 400 });
        }

        if (!contentType) {
            return NextResponse.json({ error: "Missing 'contentType' parameter" }, { status: 400 });
        }

        const expiry = expiresInSeconds ? parseInt(expiresInSeconds) : undefined;
        const signedUrl = await JC_Utils_Files.getSignedUrlForUpload(key, contentType, expiry);

        return NextResponse.json({ result: signedUrl }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
