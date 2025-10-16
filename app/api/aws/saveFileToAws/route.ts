import { JC_Utils_Files } from "@/app/Utils";
import { FileBusiness } from "@/app/api/file/business";
import { auth } from "@/app/auth";
import { FileModel } from "@/app/models/File";
import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge Runtime)
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const { fileData, key, contentType, fileName, notes, replaceFileId } = await request.json();

        if (!fileData || !key || !contentType || !fileName) {
            return NextResponse.json({ error: "Missing required fields: fileData, key, contentType, or fileName" }, { status: 400 });
        }

        // Get current authenticated user
        const session = await auth();
        if (!session?.user?.Id) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }

        // Convert base64 to buffer
        const buffer = JC_Utils_Files.base64ToBuffer(fileData);

        // Upload file to S3 (this will overwrite the existing file if same key)
        await JC_Utils_Files.uploadFile({
            buffer,
            key,
            contentType
        });

        let fileRecord: FileModel;

        if (replaceFileId) {
            // Update existing file record
            const existingFile = await FileBusiness.Get(replaceFileId);
            if (!existingFile) {
                return NextResponse.json({ error: "File record not found for replacement" }, { status: 404 });
            }

            // Update the existing file record with new data
            existingFile.MimeType = contentType;
            existingFile.SizeBytes = buffer.length;
            existingFile.Notes = notes || `File replaced in AWS S3: ${fileName}`;
            existingFile.ModifiedAt = new Date();

            await FileBusiness.Update(existingFile);
            fileRecord = existingFile;
        } else {
            // Create new File record in database
            fileRecord = new FileModel({
                UserId: session.user.Id,
                FileName: fileName,
                StorageProvider: "AWS_S3",
                Bucket: process.env.AWS_S3_BUCKET_NAME || "",
                Key: key,
                MimeType: contentType,
                SizeBytes: buffer.length,
                IsPublic: false,
                Notes: notes || `File uploaded to AWS S3: ${fileName}`
            });

            await FileBusiness.Create(fileRecord);
        }

        return NextResponse.json(
            {
                success: true,
                message: replaceFileId ? "File replaced successfully in AWS and database" : "File saved successfully to AWS and database",
                fileId: fileRecord.Id,
                fileName: fileName,
                key: key
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving file to AWS:", error);
        return NextResponse.json({ error: "Failed to save file to AWS" }, { status: 500 });
    }
}
