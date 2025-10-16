import { JC_Utils_Files } from "@/app/Utils";
import { FileBusiness } from "@/app/api/file/business";
import { auth } from "@/app/auth";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge Runtime)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.Id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const createNew = formData.get("createNew") === "true";
        const replaceFileId = formData.get("replaceFileId") as string;

        if (!file) {
            return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate filename and key
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const baseFileName = replaceFileId ? `annotated-${replaceFileId}` : `annotated-${timestamp}`;
        const fileName = `${baseFileName}.webp`;
        const key = `Inspection Report/Images/${fileName}`;

        console.log("Uploading annotated image:", { fileName, key, createNew, replaceFileId });

        let fileId: string;

        // Upload the annotated image to S3
        await JC_Utils_Files.uploadFile({
            buffer: buffer,
            key: key,
            contentType: "image/webp"
        });

        if (createNew || !replaceFileId) {
            // Create a new file record
            const newFile = new FileModel();
            newFile.UserId = session.user.Id;
            newFile.FileName = fileName;
            newFile.StorageProvider = "AWS";
            newFile.Bucket = process.env.AWS_S3_BUCKET_NAME || "";
            newFile.Key = key;
            newFile.MimeType = "image/webp";
            newFile.SizeBytes = buffer.length;
            newFile.IsPublic = false;
            newFile.Notes = "Annotated image created on frontend";
            newFile.CreatedAt = new Date();
            newFile.ModifiedAt = new Date();

            await FileBusiness.Create(newFile);
            fileId = newFile.Id;
        } else {
            // Update the existing file record
            const existingFile = await FileBusiness.Get(replaceFileId);
            if (existingFile) {
                existingFile.Key = key;
                existingFile.FileName = fileName;
                existingFile.MimeType = "image/webp";
                existingFile.SizeBytes = buffer.length;
                existingFile.Notes = "Annotated image updated on frontend";
                existingFile.ModifiedAt = new Date();

                await FileBusiness.Update(existingFile);
                fileId = existingFile.Id;
            } else {
                return NextResponse.json({ success: false, message: "File not found for update" }, { status: 404 });
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: createNew ? "New annotated image created successfully" : "Image annotations updated successfully",
                fileId: fileId,
                fileName: fileName,
                key: key
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error uploading annotated image:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to upload annotated image",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
