"use client";

import JC_Button from "../JC_Button/JC_Button";
import JC_ImageAnnotator, { Annotation } from "../JC_ImageAnnotator/JC_ImageAnnotator";
import JC_ModalConfirmation from "../JC_ModalConfirmation/JC_ModalConfirmation";
import JC_Spinner from "../JC_Spinner/JC_Spinner";
import JC_Title from "../JC_Title/JC_Title";
import styles from "./JC_ModalPhotos.module.scss";
import { JC_Utils, JC_Utils_Files } from "@/app/Utils";
import { JC_PostRaw } from "@/app/apiServices/JC_PostRaw";
import { MimeType } from "@/app/enums/MimeType";
import { FileModel } from "@/app/models/File";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface JC_ModalPhotosModel {
    FileId: string;
    SortOrder: number;
}

export default function JC_ModalPhotos(
    _: Readonly<{
        isOpen: boolean;
        onCancel: () => void;
        title: string;
        files: JC_ModalPhotosModel[];
        // New interface props
        onImageUploaded?: (fileId: string, fileName: string) => void;
        onImageDeleted?: (fileId: string) => Promise<void>;
        onSortOrderChanged?: (files: JC_ModalPhotosModel[]) => void;
        onImagesUploaded?: () => Promise<JC_ModalPhotosModel[]>; // Callback after all selected images are uploaded, returns updated files
        // Legacy interface props (for backward compatibility)
        getFilesCallback?: () => Promise<JC_ModalPhotosModel[]>;
        onFinishedCallback?: () => Promise<void>;
        s3KeyPath?: string;
    }>
) {
    // - STATE - //
    const [images, setImages] = useState<{ fileId: string; signedUrl: string; fileName: string; fileModel: FileModel }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{ fileId: string; signedUrl: string; fileName: string; fileModel: FileModel } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isEditingImage, setIsEditingImage] = useState<boolean>(false);
    const [isSavingAnnotation, setIsSavingAnnotation] = useState<boolean>(false);
    const [pendingReselectionFileId, setPendingReselectionFileId] = useState<string | null>(null);
    const [shouldSelectLastImage, setShouldSelectLastImage] = useState<boolean>(false); // Flag to auto-select last image after upload
    const [loadedFiles, setLoadedFiles] = useState<JC_ModalPhotosModel[]>([]); // Track the actual loaded files data

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const imagesListRef = useRef<HTMLDivElement>(null);
    const selectedImageRef = useRef<HTMLImageElement>(null);

    // - FUNCTIONS - //
    const loadImages = useCallback(async () => {
        setIsLoading(true);
        try {
            // Handle legacy interface - use getFilesCallback if provided
            let filesToLoad = _.files;
            if (_.getFilesCallback && _.files.length === 0) {
                try {
                    filesToLoad = await _.getFilesCallback();
                } catch (error) {
                    console.error("Error loading files from getFilesCallback:", error);
                    filesToLoad = _.files; // Fallback to provided files
                }
            }

            if (filesToLoad.length === 0) {
                setImages([]);
                setSelectedImage(null);
                setLoadedFiles([]);
                return;
            }

            // Store the loaded files data for use in move functions
            setLoadedFiles(filesToLoad);

            // Extract fileIds from the files array
            const fileIds = filesToLoad.map(f => f.FileId);

            // Use the new FileModel.GetListByIdsList method which includes signed URLs
            const filesResponse = await FileModel.GetListByIdsList(fileIds);
            const loadedImages =
                filesResponse?.ResultList?.map((file: FileModel) => ({
                    fileId: file.Id,
                    signedUrl: file.Ex_FileSignedUrl || "",
                    fileName: file.FileName || `Image ${file.Id.substring(0, 8)}`,
                    fileModel: file
                })) || [];

            // Sort images by SortOrder from the files array (which already has the correct sort orders)
            const sortedImages = loadedImages.sort((a, b) => {
                const aFile = filesToLoad.find(f => f.FileId === a.fileId);
                const bFile = filesToLoad.find(f => f.FileId === b.fileId);
                return (aFile?.SortOrder || 0) - (bFile?.SortOrder || 0);
            });

            setImages(sortedImages);

            // Handle image selection after loading
            if (sortedImages.length > 0) {
                // If there's a pending re-selection, try to select that image
                if (pendingReselectionFileId) {
                    const imageToReselect = sortedImages.find(img => img.fileId === pendingReselectionFileId);
                    if (imageToReselect) {
                        setSelectedImage(imageToReselect);

                        // Scroll to the re-selected image with 0.3 second delay
                        setTimeout(() => {
                            if (imagesListRef.current) {
                                const selectedImageIndex = sortedImages.findIndex(img => img.fileId === pendingReselectionFileId);
                                if (selectedImageIndex >= 0) {
                                    // Calculate the scroll position for the selected image
                                    // Each image item has a fixed height, we need to scroll to show the selected image
                                    const imageElements = imagesListRef.current.querySelectorAll(".imageListItem");
                                    if (imageElements[selectedImageIndex]) {
                                        const selectedElement = imageElements[selectedImageIndex] as HTMLElement;

                                        // Calculate scroll position to center the selected image in view
                                        const scrollTop = selectedElement.offsetTop - imagesListRef.current.clientHeight / 2 + selectedElement.clientHeight / 2;
                                        imagesListRef.current.scrollTop = Math.max(0, scrollTop);
                                    }
                                }
                            }
                            setPendingReselectionFileId(null); // Clear the pending re-selection after scrolling
                        }, 300); // 0.3 second delay as requested
                    } else {
                        // Fallback to first image if the pending image is not found
                        setSelectedImage(sortedImages[0]);
                        setPendingReselectionFileId(null);
                    }
                } else if (shouldSelectLastImage) {
                    // Auto-select the last image after upload with 300ms delay
                    setTimeout(() => {
                        if (filesToLoad.length > 0) {
                            // Find the image with the highest SortOrder from filesToLoad
                            const sortedLoadedFiles = [...filesToLoad].sort((a, b) => (b.SortOrder || 0) - (a.SortOrder || 0));
                            const lastFileId = sortedLoadedFiles[0]?.FileId;

                            if (lastFileId) {
                                const lastImage = sortedImages.find(img => img.fileId === lastFileId);
                                if (lastImage) {
                                    setSelectedImage(lastImage);
                                }
                            }
                        }
                        setShouldSelectLastImage(false); // Clear the flag
                    }, 300);
                } else {
                    // Auto-select the first image when images are loaded (normal case)
                    setSelectedImage(sortedImages[0]);

                    // Scroll to top of images list to show the selected image
                    setTimeout(() => {
                        if (imagesListRef.current) {
                            imagesListRef.current.scrollTop = 0;
                        }
                    }, 100); // Small delay to ensure DOM is updated
                }
            } else {
                setSelectedImage(null);
                setPendingReselectionFileId(null); // Clear any pending re-selection
            }
        } catch (error) {
            console.error("Error loading images:", error);
            JC_Utils.showToastError("Failed to load images");
        } finally {
            setIsLoading(false);
        }
    }, [_, pendingReselectionFileId, shouldSelectLastImage]);

    // Handle delete image
    const handleDeleteImage = () => {
        if (!selectedImage) return;
        setDeleteConfirmationOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmedDelete = async () => {
        if (!selectedImage) return;

        setIsDeleting(true);
        try {
            // Call the parent's delete callback if provided
            if (_.onImageDeleted) {
                await _.onImageDeleted(selectedImage.fileId);
            }

            // Remove the image from the local state
            setImages(prevImages => prevImages.filter(img => img.fileId !== selectedImage.fileId));

            // Clear selected image if it was the deleted one
            setSelectedImage(null);

            // Auto-select first remaining image if available
            const remainingImages = images.filter(img => img.fileId !== selectedImage.fileId);
            if (remainingImages.length > 0) {
                setSelectedImage(remainingImages[0]);
            }

            // Call the finished callback to update parent state (e.g., image count)
            if (_.onFinishedCallback) {
                await _.onFinishedCallback();
            }

            JC_Utils.showToastSuccess("Image deleted successfully");
        } catch (error) {
            console.error("Error deleting image:", error);
            JC_Utils.showToastError("Failed to delete image");
        } finally {
            setIsDeleting(false);
            setDeleteConfirmationOpen(false);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteConfirmationOpen(false);
    };

    // - EFFECTS - //
    useEffect(() => {
        if (_.isOpen) {
            // Always call loadImages when modal opens, regardless of files length
            // loadImages will handle both cases: files provided or getFilesCallback
            loadImages();
        } else if (!_.isOpen) {
            // Reset all state when modal closes to completely destroy modal state
            setImages([]);
            setSelectedImage(null);
            setIsLoading(false);
            setIsCapturingPhoto(false);
            setIsSaving(false);
            setShouldSelectLastImage(false);

            setDeleteConfirmationOpen(false);
            setIsDeleting(false);
            // Clear file inputs
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            if (galleryInputRef.current) {
                galleryInputRef.current.value = "";
            }
        }
    }, [_.isOpen, _.files, loadImages]);

    // Additional effect to handle files changes when modal is already open
    useEffect(() => {
        if (_.isOpen) {
            // Always call loadImages when files change and modal is open
            // loadImages will handle both cases: files provided or getFilesCallback
            loadImages();
        }
    }, [_.files, _.isOpen, loadImages]);

    // No need for loadSelectedImage effect anymore since signed URL is in the model

    // loadSelectedImage function removed - signed URL is now available directly in DefectImageModel.Ex_ImageSignedUrl

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
        const files = event.target.files;
        if (files && files.length > 0) {
            setIsCapturingPhoto(true);
            try {
                // Process each selected file
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    // Add a small delay between uploads to ensure different timestamps
                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                    }

                    // Convert file to base64
                    const reader = new FileReader();
                    await new Promise<void>((resolve, reject) => {
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
                            resolve();
                        };
                        reader.onerror = () => {
                            console.error("Error reading file:", file.name);
                            reject(new Error(`Failed to read file: ${file.name}`));
                        };
                        reader.readAsDataURL(file);
                    });
                }
            } catch (error) {
                console.error("Error processing gallery images:", error);
                JC_Utils.showToastError("Failed to process some gallery images");
            } finally {
                setIsCapturingPhoto(false);
            }
        }
        // Reset the input value so the same files can be selected again
        event.target.value = "";
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
                    JC_Utils.showToastError("Failed to read photo file");
                    setIsCapturingPhoto(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error processing photo:", error);
                JC_Utils.showToastError("Failed to process photo");
                setIsCapturingPhoto(false);
            }
        }
        // Reset the input value so the same file can be selected again
        event.target.value = "";
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
                notes: `Image uploaded via JC_ModalPhotos`
            });

            if (result.success) {
                // Set flag to auto-select last image after all operations complete
                setShouldSelectLastImage(true);

                // Handle new interface
                if (_.onImageUploaded) {
                    await _.onImageUploaded(result.fileId, fileName);
                }

                // Notify parent that images have been uploaded and get updated files
                if (_.onImagesUploaded) {
                    await _.onImagesUploaded();
                    // The parent will handle updating the files prop, which will trigger loadImages via useEffect
                }

                // Handle legacy interface
                if (_.onFinishedCallback) {
                    await _.onFinishedCallback();
                }

                // Reload images to include the newly uploaded image
                // The loadImages function will handle auto-selecting the last image due to shouldSelectLastImage flag
                await loadImages();
            }
        } catch (error) {
            console.error("Error saving photo:", error);
            JC_Utils.showToastError("Failed to save photo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageSelect = (image: { fileId: string; signedUrl: string; fileName: string; fileModel: FileModel }) => {
        setSelectedImage(image);
        setIsEditingImage(false); // Exit edit mode when selecting a new image
    };

    const handleEditImage = () => {
        setIsEditingImage(true);
    };

    const handleCancelEdit = () => {
        setIsEditingImage(false);
    };

    const handleSaveAnnotatedImage = async (_annotations: Annotation[], createNew?: boolean, fileId?: string) => {
        if (!selectedImage) return;

        setIsSavingAnnotation(true);
        try {
            let result: { success: boolean; fileId: string; fileName: string; key: string; message: string };

            if (fileId) {
                // Frontend-merged image was already uploaded, just use the fileId
                result = {
                    success: true,
                    fileId: fileId,
                    fileName: `annotated-${fileId}.webp`,
                    key: `Inspection Report/Images/annotated-${fileId}.webp`,
                    message: createNew ? "New annotated image created successfully" : "Image annotations updated successfully"
                };
            } else {
                // This should not happen anymore - all annotation rendering should be done on frontend
                console.error("No fileId provided - frontend should always render annotations as pixels");
                JC_Utils.showToastError("Error: Annotations must be rendered on frontend");
                return;
            }

            if (result.success) {
                // Exit edit mode
                setIsEditingImage(false);

                if (createNew) {
                    // Notify parent component that a new image was created
                    if (_.onImageUploaded) {
                        _.onImageUploaded(result.fileId, result.fileName);
                    }
                    JC_Utils.showToastSuccess("New annotated image created successfully");

                    // Reload images to get the new image
                    await loadImages();

                    // After loading, find and select the newly created image
                    setTimeout(() => {
                        setImages(currentImages => {
                            const newImage = currentImages.find(img => img.fileId === result.fileId);
                            if (newImage) {
                                setSelectedImage(newImage);
                            }
                            return currentImages;
                        });
                    }, 100); // Small delay to ensure images are loaded

                    // Handle legacy interface for new image creation
                    if (_.onFinishedCallback) {
                        await _.onFinishedCallback();
                    }
                } else {
                    JC_Utils.showToastSuccess("Annotated image saved successfully");

                    // For existing image updates, reload images but keep current selection
                    const currentSelectedId = selectedImage.fileId;
                    await loadImages();

                    // Restore selection to the updated image
                    setTimeout(() => {
                        setImages(currentImages => {
                            const updatedImage = currentImages.find(img => img.fileId === currentSelectedId);
                            if (updatedImage) {
                                setSelectedImage(updatedImage);
                            }
                            return currentImages;
                        });
                    }, 100); // Small delay to ensure images are loaded

                    // Handle legacy interface for image update
                    if (_.onFinishedCallback) {
                        await _.onFinishedCallback();
                    }
                }
            }
        } catch (error) {
            console.error("Error saving annotated image:", error);
            JC_Utils.showToastError("Failed to save annotated image");
        } finally {
            setIsSavingAnnotation(false);
        }
    };

    // Handle move image up
    const handleMoveImageUp = () => {
        console.log("handleMoveImageUp called", { selectedImage, imagesLength: images.length, loadedFilesLength: loadedFiles.length });
        if (!selectedImage || images.length <= 1) return;

        const currentIndex = images.findIndex(img => img.fileId === selectedImage.fileId);
        if (currentIndex <= 0) return;

        // Find the current file in the loaded files array
        const currentFileIndex = loadedFiles.findIndex(f => f.FileId === selectedImage.fileId);
        if (currentFileIndex <= 0) return;

        // Create a copy of the loaded files array
        const updatedFiles = [...loadedFiles];

        // Get the two affected files before swapping
        const currentFile = updatedFiles[currentFileIndex];
        const previousFile = updatedFiles[currentFileIndex - 1];

        // Swap sort orders with the previous file
        const tempSortOrder = currentFile.SortOrder;
        currentFile.SortOrder = previousFile.SortOrder;
        previousFile.SortOrder = tempSortOrder;

        // Sort the array by SortOrder to maintain proper order
        updatedFiles.sort((a, b) => a.SortOrder - b.SortOrder);

        // Update the loaded files state
        setLoadedFiles(updatedFiles);

        // Immediately update the local images state to reflect the new order
        const updatedImages = [...images];
        // Swap the images in the local state
        [updatedImages[currentIndex], updatedImages[currentIndex - 1]] = [updatedImages[currentIndex - 1], updatedImages[currentIndex]];
        setImages(updatedImages);

        // Keep the same image selected
        setSelectedImage(updatedImages[currentIndex - 1]);

        // Call the parent callback to handle the backend update - only pass the 2 affected images
        if (_.onSortOrderChanged) {
            _.onSortOrderChanged([currentFile, previousFile]);
        }
    };

    // Handle move image down
    const handleMoveImageDown = () => {
        console.log("handleMoveImageDown called", { selectedImage, imagesLength: images.length, loadedFilesLength: loadedFiles.length });
        if (!selectedImage || images.length <= 1) return;

        const currentIndex = images.findIndex(img => img.fileId === selectedImage.fileId);
        if (currentIndex >= images.length - 1) return;

        // Find the current file in the loaded files array
        const currentFileIndex = loadedFiles.findIndex(f => f.FileId === selectedImage.fileId);
        if (currentFileIndex >= loadedFiles.length - 1) return;

        // Create a copy of the loaded files array
        const updatedFiles = [...loadedFiles];

        // Get the two affected files before swapping
        const currentFile = updatedFiles[currentFileIndex];
        const nextFile = updatedFiles[currentFileIndex + 1];

        // Swap sort orders with the next file
        const tempSortOrder = currentFile.SortOrder;
        currentFile.SortOrder = nextFile.SortOrder;
        nextFile.SortOrder = tempSortOrder;

        // Sort the array by SortOrder to maintain proper order
        updatedFiles.sort((a, b) => a.SortOrder - b.SortOrder);

        // Update the loaded files state
        setLoadedFiles(updatedFiles);

        // Immediately update the local images state to reflect the new order
        const updatedImages = [...images];
        // Swap the images in the local state
        [updatedImages[currentIndex], updatedImages[currentIndex + 1]] = [updatedImages[currentIndex + 1], updatedImages[currentIndex]];
        setImages(updatedImages);

        // Keep the same image selected
        setSelectedImage(updatedImages[currentIndex + 1]);

        // Call the parent callback to handle the backend update - only pass the 2 affected images
        if (_.onSortOrderChanged) {
            _.onSortOrderChanged([currentFile, nextFile]);
        }
    };

    // - RENDER - //
    if (!_.isOpen) return null;

    return (
        <React.Fragment>
            <div className={styles.blackOverlay} onClick={_.onCancel} />
            <div className={styles.modalContainer}>
                <div className={styles.closeButton} onClick={_.onCancel}>
                    <Image src="/icons/Cross.webp" alt="Close" width={16} height={16} />
                </div>
                {_.title && <JC_Title title={_.title} />}
                <div className={styles.bodyContent}>
                    <div className={styles.mainContent}>
                        {/* Selected Image Pane */}
                        <div className={`${styles.selectedImagePane} selectedImagePane`}>
                            {isLoading ? (
                                <JC_Spinner />
                            ) : isSaving || isSavingAnnotation ? (
                                <div className={styles.savingContainer}>
                                    <JC_Spinner />
                                    <div className={styles.savingText}>{isSavingAnnotation ? "Saving annotated image..." : "Saving photo..."}</div>
                                </div>
                            ) : selectedImage?.signedUrl ? (
                                <React.Fragment>
                                    {isEditingImage ? (
                                        <JC_ImageAnnotator imageUrl={selectedImage.signedUrl} onSave={handleSaveAnnotatedImage} onCancel={handleCancelEdit} isSaving={isSavingAnnotation} currentFileId={selectedImage.fileId} onSavingStateChange={setIsSavingAnnotation} />
                                    ) : (
                                        <React.Fragment>
                                            <Image ref={selectedImageRef} src={selectedImage.signedUrl} alt="Selected Image" width={0} height={0} className={styles.selectedImage} unoptimized />
                                            <div className={styles.imageActions}>
                                                <button className={styles.deleteButton} onClick={handleDeleteImage} disabled={isDeleting} title="Delete this image">
                                                    ×
                                                </button>
                                                <button className={styles.editButton} onClick={handleEditImage} title="Annotate this image">
                                                    ✏️
                                                </button>
                                                <button className={styles.moveUpButton} onClick={handleMoveImageUp} disabled={!selectedImage || images.findIndex(img => img.fileId === selectedImage.fileId) === 0} title="Move image up">
                                                    <Image src="/icons/Arrow.webp" alt="Move Up" width={16} height={16} className={styles.upArrow} unoptimized />
                                                </button>
                                                <button className={styles.moveDownButton} onClick={handleMoveImageDown} disabled={!selectedImage || images.findIndex(img => img.fileId === selectedImage.fileId) === images.length - 1} title="Move image down">
                                                    <Image src="/icons/Arrow.webp" alt="Move Down" width={16} height={16} className={styles.downArrow} unoptimized />
                                                </button>
                                            </div>
                                        </React.Fragment>
                                    )}
                                </React.Fragment>
                            ) : (
                                <div className={styles.noImageSelected}>No images yet</div>
                            )}
                        </div>

                        {/* Images List Pane */}
                        <div className={`${styles.imagesListPane} imagesListPane`}>
                            <div className={styles.imagesList} ref={imagesListRef}>
                                {images.map(image => {
                                    const isSelected = selectedImage?.fileId === image.fileId;
                                    return (
                                        <div key={image.fileId} className={`${styles.imageListItem} ${isSelected ? styles.selected : ""} ${isSelected ? styles.notClickable : ""}`} onClick={isSelected ? undefined : () => handleImageSelect(image)}>
                                            {image.signedUrl ? <Image src={image.signedUrl} alt={image.fileName} width={0} height={0} className={styles.listImage} unoptimized /> : <div className={styles.noImagePlaceholder}>No Image</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden file input for camera */}
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

                {/* Hidden file input for gallery */}
                <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: "none" }} />

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <div className={styles.galleryIconContainer} onClick={handleGallery} style={{ opacity: isCapturingPhoto ? 0.6 : 1, pointerEvents: isCapturingPhoto ? "none" : "auto" }}>
                            <div className={styles.galleryIcon}>🖼️</div>
                            <span className={styles.galleryText}>Gallery</span>
                        </div>
                        <div className={styles.cameraIconContainer} onClick={handleTakePhoto} style={{ opacity: isCapturingPhoto ? 0.6 : 1, pointerEvents: isCapturingPhoto ? "none" : "auto" }}>
                            <div className={styles.cameraIcon}>📷</div>
                            <span className={styles.cameraText}>{isCapturingPhoto ? "Processing Photo..." : "Take Photo"}</span>
                        </div>
                    </div>
                    <div className={styles.footerRight}>
                        <JC_Button text="Close" onClick={_.onCancel} isDisabled={isCapturingPhoto || isSaving} />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <JC_ModalConfirmation
                title="Delete Image"
                text="Are you sure you want to delete this image?"
                isOpen={deleteConfirmationOpen}
                onCancel={handleCancelDelete}
                submitButtons={[
                    {
                        text: "Delete",
                        onSubmit: handleConfirmedDelete
                    }
                ]}
                isLoading={isDeleting}
            />
        </React.Fragment>
    );
}
