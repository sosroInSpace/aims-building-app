"use client";

import styles from "./JC_PhotoUpload.module.scss";
import { JC_Utils, JC_Utils_Files } from "@/app/Utils";
import { JC_PostRaw } from "@/app/apiServices/JC_PostRaw";
import JC_Spinner from "@/app/components/JC_Spinner/JC_Spinner";
import { MimeType } from "@/app/enums/MimeType";
import { FileModel } from "@/app/models/File";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface JC_PhotoUploadProps {
    fileId?: string;
    onImageUploaded: (fileId: string, fileName: string) => void;
    s3KeyPath?: string;
}

export default function JC_PhotoUpload(_: Readonly<JC_PhotoUploadProps>) {
    // - STATE - //
    const [image, setImage] = useState<{ fileId: string; signedUrl: string; fileName: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isGettingRandomImage, setIsGettingRandomImage] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // - FUNCTIONS - //
    const loadImage = useCallback(async () => {
        if (!_.fileId) {
            setImage(null);
            return;
        }

        setIsLoading(true);
        try {
            // Use the FileModel.GetListByIdsList method which includes signed URLs
            const filesResponse = await FileModel.GetListByIdsList([_.fileId]);
            const file = filesResponse?.ResultList?.[0];

            if (file) {
                const loadedImage = {
                    fileId: file.Id,
                    signedUrl: file.Ex_FileSignedUrl || "",
                    fileName: file.FileName || `Image ${file.Id.substring(0, 8)}`
                };
                setImage(loadedImage);
            } else {
                setImage(null);
            }
        } catch (error) {
            console.error("Error loading image:", error);
            JC_Utils.showToastError("Failed to load image");
            setImage(null);
        } finally {
            setIsLoading(false);
        }
    }, [_.fileId]);

    // - EFFECTS - //
    useEffect(() => {
        loadImage();
    }, [loadImage]);

    const handleTakePhoto = async () => {
        // Check if camera/media devices are available
        if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                // Try to access camera to check if it's available
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Camera is available, stop the stream and trigger file input
                stream.getTracks().forEach(track => track.stop());
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            } catch (error) {
                // Camera not available or permission denied, show error toast
                console.log("Camera not available:", error);
                JC_Utils.showToastError("No camera device detected or camera access denied");
            }
        } else {
            // No media devices support, show error toast
            console.log("No media devices support");
            JC_Utils.showToastError("No camera device detected");
        }
    };

    const handleGallery = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.click();
        }
    };

    const handleGalleryChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsCapturingPhoto(true);
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = async e => {
                    const base64 = e.target?.result as string;
                    if (base64) {
                        try {
                            // Resize image to 800x600 before saving
                            const resizedBase64 = await JC_Utils_Files.resizeBase64Image(base64, 800, 600);
                            await savePhotoToAws(resizedBase64);
                        } catch (resizeError) {
                            console.error("Error resizing image:", resizeError);
                            // If resize fails, save original image
                            await savePhotoToAws(base64);
                        }
                    }
                    setIsCapturingPhoto(false);
                };
                reader.onerror = () => {
                    console.error("Error reading file");
                    JC_Utils.showToastError("Failed to read file");
                    setIsCapturingPhoto(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error processing file:", error);
                JC_Utils.showToastError("Failed to process file");
                setIsCapturingPhoto(false);
            }
        }
    };

    const handleDefaultImage = async () => {
        setIsCapturingPhoto(true);
        setIsGettingRandomImage(true);
        try {
            const base64Image = await JC_Utils_Files.getRandomImage();
            if (base64Image) {
                await savePhotoToAws(base64Image);
            }
        } catch (error) {
            console.error("Error using random image:", error);
            JC_Utils.showToastError("Failed to use random image");
        } finally {
            setIsCapturingPhoto(false);
            setIsGettingRandomImage(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsCapturingPhoto(true);
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = async e => {
                    const base64 = e.target?.result as string;
                    if (base64) {
                        try {
                            // Resize image to 800x600 before saving
                            const resizedBase64 = await JC_Utils_Files.resizeBase64Image(base64, 800, 600);
                            await savePhotoToAws(resizedBase64);
                        } catch (resizeError) {
                            console.error("Error resizing image:", resizeError);
                            // If resize fails, save original image
                            await savePhotoToAws(base64);
                        }
                    }
                    setIsCapturingPhoto(false);
                };
                reader.onerror = () => {
                    console.error("Error reading file");
                    JC_Utils.showToastError("Failed to read file");
                    setIsCapturingPhoto(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error processing file:", error);
                JC_Utils.showToastError("Failed to process file");
                setIsCapturingPhoto(false);
            }
        }
    };

    const savePhotoToAws = async (photoBase64: string) => {
        setIsSaving(true);
        try {
            // Generate unique image name with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const imageName = `image-${timestamp}`;
            const imageExtension = "webp";
            const fileName = `${imageName}.${imageExtension}`;

            // Generate S3 key using provided path or default
            const s3Key = _.s3KeyPath ? `${_.s3KeyPath}/${fileName}` : `Images/${fileName}`;

            // Call the generic AWS save API
            const result = await JC_PostRaw<{ fileData: string; key: string; contentType: MimeType; fileName: string; notes: string }, { success: boolean; fileId: string; fileName: string; key: string; message: string }>("aws/saveFileToAws", {
                fileData: photoBase64,
                key: s3Key,
                contentType: MimeType.WEBP,
                fileName: fileName,
                notes: `Image uploaded via JC_PhotoUpload`
            });

            if (result.success) {
                // Notify parent component that an image was uploaded
                await _.onImageUploaded(result.fileId, fileName);

                // Update the current image
                // Note: signedUrl will be empty initially, but will be loaded when the parent refreshes the file list
                const newImage = {
                    fileId: result.fileId,
                    signedUrl: "", // Will be populated when parent calls loadImage() after onImageUploaded
                    fileName: fileName
                };

                setImage(newImage);
            }
        } catch (error) {
            console.error("Error saving photo:", error);
            JC_Utils.showToastError("Failed to save photo");
        } finally {
            setIsSaving(false);
        }
    };

    // - RENDER - //
    return (
        <div className={styles.container}>
            {/* Hidden file input for camera */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

            {/* Hidden file input for gallery */}
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryChange} style={{ display: "none" }} />

            {/* Image Display */}
            <div className={styles.imageContainer}>
                {isLoading ? (
                    <JC_Spinner />
                ) : isGettingRandomImage ? (
                    <div className={styles.savingContainer}>
                        <JC_Spinner />
                        <div className={styles.savingText}>
                            No device detected.
                            <br />
                            Getting random image...
                        </div>
                    </div>
                ) : isSaving ? (
                    <div className={styles.savingContainer}>
                        <JC_Spinner />
                        <div className={styles.savingText}>Saving photo...</div>
                    </div>
                ) : image?.signedUrl ? (
                    <Image src={image.signedUrl} alt={image.fileName} width={0} height={0} className={styles.image} unoptimized />
                ) : (
                    <div className={styles.noImagePlaceholder}>No Image</div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonsContainer}>
                <div className={styles.galleryIconContainer} onClick={handleGallery} style={{ opacity: isCapturingPhoto || isGettingRandomImage ? 0.6 : 1, pointerEvents: isCapturingPhoto || isGettingRandomImage ? "none" : "auto" }}>
                    <div className={styles.galleryIcon}>🖼️</div>
                    <span className={styles.galleryText}>Gallery</span>
                </div>
                <div className={styles.cameraIconContainer} onClick={handleTakePhoto} style={{ opacity: isCapturingPhoto || isGettingRandomImage ? 0.6 : 1, pointerEvents: isCapturingPhoto || isGettingRandomImage ? "none" : "auto" }}>
                    <div className={styles.cameraIcon}>📷</div>
                    <span className={styles.cameraText}>{isCapturingPhoto ? "Processing Photo..." : "Take Photo"}</span>
                </div>
            </div>
        </div>
    );
}
