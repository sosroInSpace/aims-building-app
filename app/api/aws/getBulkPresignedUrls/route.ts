import { JC_Utils_Files } from "@/app/Utils";
import { FileBusiness } from "@/app/api/file/business";
import { auth } from "@/app/auth";
import { MimeType } from "@/app/enums/MimeType";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PresignedUrlResponse {
    filename: string;
    uploadUrl: string;
    key: string;
}

// Generate multiple presigned URLs for bulk upload
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.Id) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const { files, s3KeyPath } = (await request.json()) as { files: { filename: string; contentType: string }[]; s3KeyPath?: string };

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: "Missing or empty 'files' array" }, { status: 400 });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        const presignedUrls: PresignedUrlResponse[] = await Promise.all(
            files.map(async (_, index) => {
                const fileName = `image-${timestamp}-${index}.webp`;
                const key = s3KeyPath ? `${s3KeyPath}/${fileName}` : `Images/${fileName}`;
                const uploadUrl = await JC_Utils_Files.getSignedUrlForUpload(key, "image/webp", 300);
                return { filename: fileName, uploadUrl, key };
            })
        );

        return NextResponse.json({ presignedUrls, userId: session.user.Id }, { status: 200 });
    } catch (error) {
        console.error("Error generating bulk presigned URLs:", error);
        return NextResponse.json({ error: "Failed to generate presigned URLs" }, { status: 500 });
    }
}

// Create File records after successful S3 uploads
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.Id) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        const { uploads } = (await request.json()) as { uploads: { fileName: string; key: string; sizeBytes: number }[] };

        if (!uploads || uploads.length === 0) {
            return NextResponse.json({ error: "No uploads provided" }, { status: 400 });
        }

        const fileRecords = uploads.map(
            u =>
                new FileModel({
                    UserId: session.user.Id,
                    FileName: u.fileName,
                    StorageProvider: "AWS_S3",
                    Bucket: process.env.AWS_S3_BUCKET_NAME || "",
                    Key: u.key,
                    MimeType: MimeType.WEBP,
                    SizeBytes: u.sizeBytes,
                    IsPublic: false,
                    Notes: "Bulk upload"
                })
        );

        await FileBusiness.CreateList(fileRecords);

        return NextResponse.json({ fileIds: fileRecords.map(f => ({ id: f.Id, fileName: f.FileName })) }, { status: 200 });
    } catch (error) {
        console.error("Error creating file records:", error);
        return NextResponse.json({ error: "Failed to create file records" }, { status: 500 });
    }
}

