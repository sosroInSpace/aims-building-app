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
    const [image, setImage] = useState<{
        fileId: string;
        signedUrl: string;
        fileName: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isGettingRandomImage, setIsGettingRandomImage] =
        useState<boolean>(false);
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
                    fileName:
                        file.FileName || `Image ${file.Id.substring(0, 8)}`,
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
        if (
            typeof navigator !== "undefined" &&
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        ) {
            try {
                // Try to access camera to check if it's available
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                // Camera is available, stop the stream and trigger file input
                stream.getTracks().forEach((track) => track.stop());
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            } catch (error) {
                // Camera not available or permission denied, show error toast
                console.log("Camera not available:", error);
                JC_Utils.showToastError(
                    "No camera device detected or camera access denied",
                );
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

    const handleGalleryChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsCapturingPhoto(true);
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = e.target?.result as string;
                    if (base64) {
                        try {
                            // Resize image to 800x600 before saving
                            const resizedBase64 =
                                await JC_Utils_Files.resizeBase64Image(
                                    base64,
                                    800,
                                    600,
                                );
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

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsCapturingPhoto(true);
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = e.target?.result as string;
                    if (base64) {
                        try {
                            // Resize image to 800x600 before saving
                            const resizedBase64 =
                                await JC_Utils_Files.resizeBase64Image(
                                    base64,
                                    800,
                                    600,
                                );
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
            const s3Key = _.s3KeyPath
                ? `${_.s3KeyPath}/${fileName}`
                : `Images/${fileName}`;

            // Call the generic AWS save API
            const result = await JC_PostRaw<
                {
                    fileData: string;
                    key: string;
                    contentType: MimeType;
                    fileName: string;
                    notes: string;
                },
                {
                    success: boolean;
                    fileId: string;
                    fileName: string;
                    key: string;
                    message: string;
                }
            >("aws/saveFileToAws", {
                fileData: photoBase64,
                key: s3Key,
                contentType: MimeType.WEBP,
                fileName: fileName,
                notes: `Image uploaded via JC_PhotoUpload`,
            });

            if (result.success) {
                // Notify parent component that an image was uploaded
                await _.onImageUploaded(result.fileId, fileName);

                // Update the current image
                // Note: signedUrl will be empty initially, but will be loaded when the parent refreshes the file list
                const newImage = {
                    fileId: result.fileId,
                    signedUrl: "", // Will be populated when parent calls loadImage() after onImageUploaded
                    fileName: fileName,
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
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />

            {/* Hidden file input for gallery */}
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryChange}
                style={{ display: "none" }}
            />

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
                    <Image
                        src={image.signedUrl}
                        alt={image.fileName}
                        width={0}
                        height={0}
                        className={styles.image}
                        unoptimized
                    />
                ) : (
                    <div className={styles.noImagePlaceholder}>
                        <svg
                            width="150px"
                            height="150px"
                            viewBox="0 0 1024 1024"
                            className="icon"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M220.5 245.4c-32.8 32.8-55.1 73.2-65.2 117.3h16.5c18.8-75.3 75.1-135.9 148-160.7v-16.9c-37.1 11.6-71 32-99.3 60.3z"
                                fill="#E73B37"
                            />
                            <path
                                d="M959.9 540.8c0 113.6-92.1 205.8-205.7 205.9H590.9v-44h163.3c43.2 0 83.8-16.9 114.3-47.4 30.6-30.6 47.4-71.2 47.4-114.5 0-43.2-16.8-83.9-47.4-114.4S797.2 379 754 379c-11.5 0-22.8 1.2-33.8 3.5-15 3.2-29.4 8.4-42.8 15.7-1-15.4-3.3-30.7-6.8-45.6v-0.1c-3.6-15.6-8.6-30.8-14.9-45.7-14.4-33.9-34.9-64.4-61.1-90.6-26.2-26.2-56.6-46.7-90.6-61.1-35.1-14.8-72.4-22.4-110.9-22.4s-75.8 7.5-110.9 22.4c-33.9 14.3-64.4 34.9-90.6 61.1-26.2 26.2-46.7 56.7-61.1 90.6-14.9 35.1-22.4 72.4-22.4 110.9s7.5 75.8 22.4 110.9c14.3 33.9 34.9 64.4 61.1 90.6 26.2 26.2 56.7 46.7 90.6 61.1 35.1 14.8 72.4 22.4 110.9 22.4h39.7v44h-41C210.7 746 64.1 599 64.1 417.7c0-181.7 147.3-329 329-329 154.6 0 284.3 106.6 319.5 250.3v0.1c13.4-2.7 27.2-4.2 41.4-4.2 113.7 0.1 205.9 92.2 205.9 205.9z"
                                fill="#539fc1"
                            />
                            <path
                                d="M692.9 636.1h-22.6L519.8 485.6v449.6h-16V485.8L353.4 636.1h-22.6l181-181z"
                                fill="#E73B37"
                            />
                        </svg>
                        <br />
                        No Image
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonsContainer}>
                <div
                    className={styles.galleryIconContainer}
                    onClick={handleGallery}
                    style={{
                        opacity:
                            isCapturingPhoto || isGettingRandomImage ? 0.6 : 1,
                        pointerEvents:
                            isCapturingPhoto || isGettingRandomImage
                                ? "none"
                                : "auto",
                    }}
                >
                    <div className={styles.galleryIcon}>
                        <svg
                            width="25px"
                            height="25px"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                opacity="0.5"
                                d="M21.9998 12.6978C21.9983 14.1674 21.9871 15.4165 21.9036 16.4414C21.8067 17.6308 21.6081 18.6246 21.1636 19.45C20.9676 19.814 20.7267 20.1401 20.4334 20.4334C19.601 21.2657 18.5405 21.6428 17.1966 21.8235C15.8835 22 14.2007 22 12.0534 22H11.9466C9.79929 22 8.11646 22 6.80345 21.8235C5.45951 21.6428 4.39902 21.2657 3.56664 20.4334C2.82871 19.6954 2.44763 18.777 2.24498 17.6376C2.04591 16.5184 2.00949 15.1259 2.00192 13.3967C2 12.9569 2 12.4917 2 12.0009V11.9466C1.99999 9.79929 1.99998 8.11646 2.17651 6.80345C2.3572 5.45951 2.73426 4.39902 3.56664 3.56664C4.39902 2.73426 5.45951 2.3572 6.80345 2.17651C7.97111 2.01952 9.47346 2.00215 11.302 2.00024C11.6873 1.99983 12 2.31236 12 2.69767C12 3.08299 11.6872 3.3952 11.3019 3.39561C9.44749 3.39757 8.06751 3.41446 6.98937 3.55941C5.80016 3.7193 5.08321 4.02339 4.5533 4.5533C4.02339 5.08321 3.7193 5.80016 3.55941 6.98937C3.39683 8.19866 3.39535 9.7877 3.39535 12C3.39535 12.2702 3.39535 12.5314 3.39567 12.7844L4.32696 11.9696C5.17465 11.2278 6.45225 11.2704 7.24872 12.0668L11.2392 16.0573C11.8785 16.6966 12.8848 16.7837 13.6245 16.2639L13.9019 16.0689C14.9663 15.3209 16.4064 15.4076 17.3734 16.2779L20.0064 18.6476C20.2714 18.091 20.4288 17.3597 20.5128 16.3281C20.592 15.3561 20.6029 14.1755 20.6044 12.6979C20.6048 12.3126 20.917 12 21.3023 12C21.6876 12 22.0002 12.3125 21.9998 12.6978Z"
                                fill="#539fc1"
                            />
                            <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M17.5 11C15.3787 11 14.318 11 13.659 10.341C13 9.68198 13 8.62132 13 6.5C13 4.37868 13 3.31802 13.659 2.65901C14.318 2 15.3787 2 17.5 2C19.6213 2 20.682 2 21.341 2.65901C22 3.31802 22 4.37868 22 6.5C22 8.62132 22 9.68198 21.341 10.341C20.682 11 19.6213 11 17.5 11ZM19.7121 4.28794C20.096 4.67187 20.096 5.29434 19.7121 5.67826L19.6542 5.7361C19.5984 5.7919 19.5205 5.81718 19.4428 5.80324C19.3939 5.79447 19.3225 5.77822 19.2372 5.74864C19.0668 5.68949 18.843 5.5778 18.6326 5.36742C18.4222 5.15704 18.3105 4.93324 18.2514 4.76276C18.2218 4.67751 18.2055 4.60607 18.1968 4.55721C18.1828 4.47953 18.2081 4.40158 18.2639 4.34578L18.3217 4.28794C18.7057 3.90402 19.3281 3.90402 19.7121 4.28794ZM17.35 8.0403C17.2057 8.18459 17.1336 8.25673 17.054 8.31878C16.9602 8.39197 16.8587 8.45472 16.7512 8.50591C16.6602 8.54932 16.5634 8.58158 16.3698 8.64611L15.349 8.98639C15.2537 9.01814 15.1487 8.99335 15.0777 8.92234C15.0067 8.85134 14.9819 8.74631 15.0136 8.65104L15.3539 7.63021C15.4184 7.43662 15.4507 7.33983 15.4941 7.24876C15.5453 7.14133 15.608 7.0398 15.6812 6.94596C15.7433 6.86642 15.8154 6.79427 15.9597 6.65L17.7585 4.85116C17.802 4.80767 17.8769 4.82757 17.8971 4.88568C17.9707 5.09801 18.109 5.37421 18.3674 5.63258C18.6258 5.89095 18.902 6.02926 19.1143 6.10292C19.1724 6.12308 19.1923 6.19799 19.1488 6.24148L17.35 8.0403Z"
                                fill="#539fc1"
                            />
                        </svg>
                    </div>
                    <span className={styles.galleryText}>Gallery</span>
                </div>
                <div
                    className={styles.cameraIconContainer}
                    onClick={handleTakePhoto}
                    style={{
                        opacity:
                            isCapturingPhoto || isGettingRandomImage ? 0.6 : 1,
                        pointerEvents:
                            isCapturingPhoto || isGettingRandomImage
                                ? "none"
                                : "auto",
                    }}
                >
                    <div className={styles.cameraIcon}>
                        <svg
                            style={{ position: "relative", top: "5px" }}
                            className="take-photo"
                            fill="#000000"
                            width="30px"
                            height="30px"
                            viewBox="0 0 32 32"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M16 12.906a4.47 4.47 0 0 0 0 8.938 4.47 4.47 0 0 0 4.469-4.469A4.47 4.47 0 0 0 16 12.906zm0 7.063a2.577 2.577 0 1 1-.002-5.154A2.577 2.577 0 0 1 16 19.969z" />
                            <path
                                d="M25.625 9.812h-4.812l-2.062-2.75h-5.5l-2.062 2.75H6.375C5.618 9.812 5 10.43 5 11.188v12.375c0 .756.618 1.375 1.375 1.375h19.25c.757 0 1.375-.617 1.375-1.375V11.188c0-.758-.618-1.376-1.375-1.376zM16 23.477a6.103 6.103 0 1 1 .001-12.205A6.103 6.103 0 0 1 16 23.477zm9.625-10.399h-2.75v-1.375h2.75v1.375z"
                                fill="#539fc1"
                            />
                        </svg>
                    </div>
                    <span className={styles.cameraText}>
                        {isCapturingPhoto
                            ? "Processing Photo..."
                            : "Take Photo"}
                    </span>
                </div>
            </div>
        </div>
    );
}
