"use client";

import JC_Button from "../JC_Button/JC_Button";
import JC_Modal from "../JC_Modal/JC_Modal";
import styles from "./JC_ImageAnnotator.module.scss";
import { JC_Utils } from "@/app/Utils";
import { LocalStorageKeyEnum } from "@/app/enums/LocalStorageKey";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface AnnotationTool {
    type: "arrow" | "circle" | "square" | "text";
    color: string;
    size: number;
}

export interface Annotation {
    id: string;
    type: "arrow" | "circle" | "square" | "text";
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    size: number;
    text?: string;
}

export default function JC_ImageAnnotator(
    _: Readonly<{
        imageUrl: string;
        onSave: (annotations: Annotation[], createNew?: boolean, fileId?: string) => void;
        onCancel: () => void;
        isSaving?: boolean;
        currentFileId?: string; // The fileId of the current image being edited
        onSavingStateChange?: (isSaving: boolean) => void; // Callback to trigger parent loading state
    }>
) {
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [currentTool, setCurrentTool] = useState<AnnotationTool>(() => {
        // Load saved color from localStorage, default to red if not found
        const savedColor = JC_Utils.safeLocalStorageGetItem(LocalStorageKeyEnum.JC_AnnotationColor) || "#ff0000";
        return {
            type: "arrow",
            color: savedColor,
            size: 24
        };
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    const [isTypingText, setIsTypingText] = useState(false);
    const [textInputValue, setTextInputValue] = useState("");
    const [pendingTextAnnotation, setPendingTextAnnotation] = useState<Omit<Annotation, "text"> | null>(null);

    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    // Draw annotation function
    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation, scale: number, offsetX: number, offsetY: number) => {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.font = `${annotation.size * scale * 1.5}px Arial`;

        const scaledX = annotation.x * scale + offsetX;
        const scaledY = annotation.y * scale + offsetY;

        switch (annotation.type) {
            case "arrow":
                // For arrow, use width/height if available, otherwise use size for a default horizontal arrow
                if (annotation.width !== undefined && annotation.height !== undefined) {
                    const scaledWidth = annotation.width * scale;
                    const scaledHeight = annotation.height * scale;

                    // Draw arrow from start point to end point
                    const endX = scaledX + scaledWidth;
                    const endY = scaledY + scaledHeight;

                    // Draw main arrow line
                    ctx.beginPath();
                    ctx.moveTo(scaledX, scaledY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // Calculate arrowhead
                    const arrowLength = Math.min(20 * scale, Math.sqrt(scaledWidth * scaledWidth + scaledHeight * scaledHeight) * 0.3);
                    const angle = Math.atan2(scaledHeight, scaledWidth);
                    const arrowAngle = Math.PI / 6; // 30 degrees

                    // Draw arrowhead
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - arrowLength * Math.cos(angle - arrowAngle), endY - arrowLength * Math.sin(angle - arrowAngle));
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - arrowLength * Math.cos(angle + arrowAngle), endY - arrowLength * Math.sin(angle + arrowAngle));
                    ctx.stroke();
                } else {
                    // Default horizontal arrow for annotations without direction (fallback only)
                    const scaledSize = annotation.size * scale;
                    const arrowLength = scaledSize * 0.3;
                    const arrowAngle = Math.PI / 6; // 30 degrees

                    // Draw main arrow line (horizontal, pointing right)
                    ctx.beginPath();
                    ctx.moveTo(scaledX - scaledSize / 2, scaledY);
                    ctx.lineTo(scaledX + scaledSize / 2, scaledY);
                    ctx.stroke();

                    // Draw arrowhead
                    ctx.beginPath();
                    ctx.moveTo(scaledX + scaledSize / 2, scaledY);
                    ctx.lineTo(scaledX + scaledSize / 2 - arrowLength * Math.cos(arrowAngle), scaledY - arrowLength * Math.sin(arrowAngle));
                    ctx.moveTo(scaledX + scaledSize / 2, scaledY);
                    ctx.lineTo(scaledX + scaledSize / 2 - arrowLength * Math.cos(arrowAngle), scaledY + arrowLength * Math.sin(arrowAngle));
                    ctx.stroke();
                }
                break;
            case "circle":
                // For circle, use width/height if available (during drawing), otherwise use size
                if (annotation.width !== undefined && annotation.height !== undefined) {
                    const radiusX = Math.abs(annotation.width * scale) / 2;
                    const radiusY = Math.abs(annotation.height * scale) / 2;
                    const radius = Math.max(radiusX, radiusY); // Use larger radius for circle

                    ctx.beginPath();
                    ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                } else {
                    // Fixed size circle for completed annotations
                    const radius = (annotation.size * scale) / 2;
                    ctx.beginPath();
                    ctx.arc(scaledX, scaledY, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                break;
            case "square":
                // For square/rectangle, use width/height if available, otherwise use size
                if (annotation.width !== undefined && annotation.height !== undefined) {
                    const scaledWidth = Math.abs(annotation.width * scale);
                    const scaledHeight = Math.abs(annotation.height * scale);

                    // Draw rectangle centered on the start point, expanding outward
                    ctx.strokeRect(scaledX - scaledWidth / 2, scaledY - scaledHeight / 2, scaledWidth, scaledHeight);
                } else {
                    // Fixed size square for completed annotations that don't have width/height preserved
                    const scaledSize = annotation.size * scale;
                    ctx.strokeRect(scaledX - scaledSize / 2, scaledY - scaledSize / 2, scaledSize, scaledSize);
                }
                break;
            case "text":
                if (annotation.text) {
                    // Set text rendering properties for clean text without background
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "start";
                    // Only fill the text, no stroke or background
                    ctx.fillText(annotation.text, scaledX, scaledY);
                }
                break;
        }
    };

    // Redraw annotations function
    const redrawAnnotations = useCallback(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas || !imageDimensions || !containerRef.current) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scale factors between image natural size and display size
        const containerRect = containerRef.current.getBoundingClientRect();
        const scaleX = containerRect.width / imageDimensions.width;
        const scaleY = containerRect.height / imageDimensions.height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate image display position (centered)
        const displayWidth = imageDimensions.width * scale;
        const displayHeight = imageDimensions.height * scale;
        const offsetX = (containerRect.width - displayWidth) / 2;
        const offsetY = (containerRect.height - displayHeight) / 2;

        // Draw all annotations scaled to display size
        [...annotations, currentAnnotation].filter(Boolean).forEach(annotation => {
            if (!annotation) return;
            drawAnnotation(ctx, annotation, scale, offsetX, offsetY);
        });

        // Draw text preview
        if (isTypingText && pendingTextAnnotation) {
            const scaledX = pendingTextAnnotation.x * scale + offsetX;
            const scaledY = pendingTextAnnotation.y * scale + offsetY;

            if (textInputValue) {
                // Draw the current text directly without background
                const textAnnotation: Annotation = {
                    ...pendingTextAnnotation,
                    text: textInputValue,
                    size: currentTool.size // Use current tool size
                };
                drawAnnotation(ctx, textAnnotation, scale, offsetX, offsetY);
            } else {
                // Draw grey box when no text has been entered yet
                const boxSize = currentTool.size * scale * 1.5; // Same size as text would be
                ctx.fillStyle = "rgba(128, 128, 128, 0.5)"; // Semi-transparent grey
                ctx.fillRect(scaledX - 2, scaledY - boxSize / 2, boxSize, boxSize);
            }
        }
    }, [imageDimensions, annotations, currentAnnotation, isTypingText, pendingTextAnnotation, textInputValue, currentTool.size]);

    // Setup canvas overlay when image loads
    useEffect(() => {
        if (isImageLoaded && imageDimensions && overlayCanvasRef.current && containerRef.current) {
            const canvas = overlayCanvasRef.current;
            const container = containerRef.current;

            // Set canvas size to match container
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Redraw all annotations
            redrawAnnotations();
        }
    }, [isImageLoaded, imageDimensions, annotations, textInputValue, isTypingText, currentTool.size, pendingTextAnnotation, redrawAnnotations]);

    // Text handling functions
    const handleTextSubmit = useCallback(() => {
        if (pendingTextAnnotation && textInputValue.trim()) {
            const newAnnotation: Annotation = {
                ...pendingTextAnnotation,
                text: textInputValue.trim(),
                size: currentTool.size // Use current tool size when saving
            };
            setAnnotations(prev => [...prev, newAnnotation]);
        }
        setIsTypingText(false);
        setTextInputValue("");
        setPendingTextAnnotation(null);
    }, [pendingTextAnnotation, textInputValue, currentTool.size]);

    const handleTextCancel = useCallback(() => {
        setIsTypingText(false);
        setTextInputValue("");
        setPendingTextAnnotation(null);
    }, []);

    // Handle canvas end function
    const handleCanvasEnd = useCallback(() => {
        if (!isDrawing || !currentAnnotation) return;

        // Only add annotation if it has meaningful size (at least 5 pixels in either direction)
        const hasSize = currentAnnotation.width !== undefined && currentAnnotation.height !== undefined && (Math.abs(currentAnnotation.width) > 5 || Math.abs(currentAnnotation.height) > 5);

        if (hasSize) {
            // For completed annotations, preserve width/height for rectangles and arrows, convert others to fixed size
            const finalAnnotation: Annotation = {
                ...currentAnnotation,
                // For rectangles (squares) and arrows, preserve the drawn dimensions
                // For other shapes, convert to fixed size and remove width/height
                ...(currentAnnotation.type === "square" || currentAnnotation.type === "arrow"
                    ? {
                          // Keep the drawn width and height for rectangles and arrows
                          width: currentAnnotation.width,
                          height: currentAnnotation.height
                      }
                    : {
                          // For other shapes, use the larger dimension as the size and remove width/height
                          size: currentAnnotation.width !== undefined && currentAnnotation.height !== undefined ? Math.max(Math.abs(currentAnnotation.width), Math.abs(currentAnnotation.height), currentTool.size) : currentTool.size,
                          width: undefined,
                          height: undefined
                      })
            };
            setAnnotations(prev => [...prev, finalAnnotation]);
        }

        setIsDrawing(false);
        setCurrentAnnotation(null);
        setStartPoint(null);
    }, [isDrawing, currentAnnotation, currentTool.size]);

    // Add global mouse and touch event listeners to handle end events outside canvas
    useEffect(() => {
        const handleGlobalEnd = () => {
            if (isDrawing) {
                handleCanvasEnd();
            }
        };

        if (isDrawing) {
            document.addEventListener("mouseup", handleGlobalEnd);
            document.addEventListener("touchend", handleGlobalEnd);
            return () => {
                document.removeEventListener("mouseup", handleGlobalEnd);
                document.removeEventListener("touchend", handleGlobalEnd);
            };
        }
    }, [isDrawing, handleCanvasEnd]);

    // Add global click and touch listener to handle text deactivation when clicking/touching outside
    useEffect(() => {
        const handleGlobalInteraction = (event: MouseEvent | TouchEvent) => {
            if (isTypingText && pendingTextAnnotation) {
                // Check if the interaction was outside the canvas
                const canvas = overlayCanvasRef.current;
                const target = event.target as Node;
                if (canvas && !canvas.contains(target)) {
                    // Save the current text when clicking/touching outside
                    handleTextSubmit();
                }
            }
        };

        if (isTypingText) {
            document.addEventListener("click", handleGlobalInteraction);
            document.addEventListener("touchstart", handleGlobalInteraction);
            return () => {
                document.removeEventListener("click", handleGlobalInteraction);
                document.removeEventListener("touchstart", handleGlobalInteraction);
            };
        }
    }, [isTypingText, pendingTextAnnotation, handleTextSubmit]);

    // Focus hidden input when text mode is activated (for mobile keyboard)
    useEffect(() => {
        if (isTypingText && hiddenInputRef.current) {
            // Small delay to ensure the input is rendered
            setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 100);
        }
    }, [isTypingText]);

    // Add keyboard event listeners for text input (fallback for desktop)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isTypingText) return;

            // Don't prevent default if the hidden input is focused (mobile)
            if (document.activeElement === hiddenInputRef.current) {
                return;
            }

            event.preventDefault(); // Prevent default browser behavior

            if (event.key === "Escape") {
                handleTextCancel();
            } else if (event.key === "Backspace") {
                setTextInputValue(prev => prev.slice(0, -1));
            } else if (event.key.length === 1) {
                // Only add printable characters
                setTextInputValue(prev => prev + event.key);
            }
        };

        if (isTypingText) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [isTypingText, handleTextCancel]);

    const handleImageLoad = () => {
        if (imageRef.current) {
            const img = imageRef.current;
            setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
            setIsImageLoaded(true);
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error("Image failed to load:", e);
        console.error("Image URL:", _.imageUrl);
    };

    const getImageCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!overlayCanvasRef.current || !imageDimensions || !containerRef.current) return null;

        const canvas = overlayCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Handle both mouse and touch events
        let clientX: number, clientY: number;
        if ("touches" in event) {
            // Touch event
            if (event.touches.length === 0) return null;
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // Calculate scale factors and offsets
        const containerRect = containerRef.current.getBoundingClientRect();
        const scaleX = containerRect.width / imageDimensions.width;
        const scaleY = containerRect.height / imageDimensions.height;
        const scale = Math.min(scaleX, scaleY);

        const displayWidth = imageDimensions.width * scale;
        const displayHeight = imageDimensions.height * scale;
        const offsetX = (containerRect.width - displayWidth) / 2;
        const offsetY = (containerRect.height - displayHeight) / 2;

        // Convert canvas coordinates to image coordinates
        const imageX = (canvasX - offsetX) / scale;
        const imageY = (canvasY - offsetY) / scale;

        // Check if click is within image bounds
        if (imageX < 0 || imageX > imageDimensions.width || imageY < 0 || imageY > imageDimensions.height) {
            return null;
        }

        return { x: imageX, y: imageY };
    };

    const handleCanvasStart = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        // Prevent default touch behavior (scrolling, zooming)
        if ("touches" in event) {
            event.preventDefault();
        }

        const coords = getImageCoordinates(event);
        if (!coords) return;

        // If we're currently typing text and user clicks elsewhere
        if (isTypingText && pendingTextAnnotation && textInputValue.trim()) {
            // Save the current text if there is any
            handleTextSubmit();
        }

        if (currentTool.type === "text") {
            // Always clear text input and create new annotation at click location
            setTextInputValue("");
            setIsTypingText(true);
            setPendingTextAnnotation({
                id: Date.now().toString() + Math.random(), // Unique ID to force re-render
                type: "text",
                x: coords.x,
                y: coords.y,
                color: currentTool.color,
                size: currentTool.size
            });
            return;
        }

        // Start drawing for shapes
        setIsDrawing(true);
        setStartPoint(coords);

        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: currentTool.type,
            x: coords.x,
            y: coords.y,
            width: 0,
            height: 0,
            color: currentTool.color,
            size: currentTool.size
        };
        setCurrentAnnotation(newAnnotation);
    };

    const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        handleCanvasStart(event);
    };

    const handleCanvasTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
        handleCanvasStart(event);
    };

    const handleCanvasMove = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint || !currentAnnotation) return;

        // Prevent default touch behavior (scrolling, zooming)
        if ("touches" in event) {
            event.preventDefault();
        }

        const coords = getImageCoordinates(event);
        if (!coords) return;

        // Calculate width and height from start point to current position
        const width = coords.x - startPoint.x;
        const height = coords.y - startPoint.y;

        const updatedAnnotation = {
            ...currentAnnotation,
            width: width,
            height: height
        };

        setCurrentAnnotation(updatedAnnotation);
        redrawAnnotations();
    };

    const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        handleCanvasMove(event);
    };

    const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
        handleCanvasMove(event);
    };

    const handleCanvasMouseUp = () => {
        handleCanvasEnd();
    };

    const handleCanvasTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
        // Prevent default touch behavior
        event.preventDefault();
        handleCanvasEnd();
    };

    const handleCanvasMouseLeave = () => {
        // If user drags outside canvas, complete the current annotation
        if (isDrawing && currentAnnotation) {
            handleCanvasMouseUp();
        }
    };

    const handleUndo = () => {
        setAnnotations(prev => prev.slice(0, -1));
    };

    const mergeAnnotationsWithImage = useCallback(async (): Promise<Blob> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Extract the S3 key from the signed URL
                const url = new URL(_.imageUrl);
                const pathParts = url.pathname.split("/");
                // Remove the first empty part and join the rest to get the key, then decode it
                const key = decodeURIComponent(pathParts.slice(1).join("/"));

                // Use the proxy endpoint to avoid CORS issues
                const proxyUrl = `/api/image/proxy?key=${encodeURIComponent(key)}`;

                const img = document.createElement("img");
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    // Create a new canvas for merging
                    const mergeCanvas = document.createElement("canvas");
                    const mergeCtx = mergeCanvas.getContext("2d");

                    if (!mergeCtx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    // Set canvas size to match the original image
                    mergeCanvas.width = img.naturalWidth;
                    mergeCanvas.height = img.naturalHeight;

                    // Draw the original image
                    mergeCtx.drawImage(img, 0, 0);

                    // Draw all annotations on top
                    annotations.forEach(annotation => {
                        // Ensure clean canvas state for each annotation
                        mergeCtx.save();
                        drawAnnotation(mergeCtx, annotation, 1, 0, 0); // Scale 1, no offset for final image
                        mergeCtx.restore();
                    });

                    // Convert to blob
                    mergeCanvas.toBlob(
                        blob => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error("Failed to create blob from canvas"));
                            }
                        },
                        "image/webp",
                        0.8
                    );
                };

                img.onerror = () => {
                    reject(new Error("Failed to load image"));
                };

                img.src = proxyUrl;
            } catch (error) {
                reject(new Error(`Failed to process image URL: ${error}`));
            }
        });
    }, [annotations, _.imageUrl]);

    const uploadMergedImage = async (blob: Blob, createNew: boolean, replaceFileId?: string) => {
        try {
            // Create FormData to upload the merged image
            const formData = new FormData();
            formData.append("file", blob, "annotated-image.webp");
            formData.append("createNew", createNew.toString());

            if (replaceFileId) {
                formData.append("replaceFileId", replaceFileId);
            }

            // Upload to a new endpoint that just handles file upload
            const response = await fetch("/api/image/uploadAnnotated", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to upload annotated image");
            }

            const result = await response.json();

            // Call the original onSave with the result
            _.onSave([], createNew, result.fileId);
        } catch (error) {
            console.error("Error uploading merged image:", error);
            // No fallback - all annotation rendering should be done on frontend
            JC_Utils.showToastError("Failed to save annotated image");
        }
    };

    const handleSave = async () => {
        if (annotations.length === 0) {
            _.onSave([]);
            return;
        }

        setShowSaveModal(true);
    };

    const handleSaveOverExisting = async () => {
        setShowSaveModal(false);

        // Immediately trigger parent loading state
        _.onSavingStateChange?.(true);

        // Process and upload the image, then call parent's save function
        try {
            const mergedImageBlob = await mergeAnnotationsWithImage();
            await uploadMergedImage(mergedImageBlob, false, _.currentFileId);
        } catch (error) {
            console.error("Error in handleSaveOverExisting:", error);
            JC_Utils.showToastError("Failed to save annotated image");
            _.onSavingStateChange?.(false);
        }
    };

    const handleCreateNew = async () => {
        setShowSaveModal(false);

        // Immediately trigger parent loading state
        _.onSavingStateChange?.(true);

        // Process and upload the image, then call parent's save function
        try {
            const mergedImageBlob = await mergeAnnotationsWithImage();
            await uploadMergedImage(mergedImageBlob, true);
        } catch (error) {
            console.error("Error in handleCreateNew:", error);
            JC_Utils.showToastError("Failed to save annotated image");
            _.onSavingStateChange?.(false);
        }
    };

    const handleCancelSave = () => {
        setShowSaveModal(false);
    };
    const clearAnnotations = () => {
        setAnnotations([]);
    };

    const handleColorChange = (color: string) => {
        setCurrentTool(prev => ({ ...prev, color }));
        // Save color to localStorage for persistence
        JC_Utils.safeLocalStorageSetItem(LocalStorageKeyEnum.JC_AnnotationColor, color);
    };

    return (
        <div className={styles.annotatorContainer}>
            <div className={styles.imageContainer} ref={containerRef}>
                {!isImageLoaded && (
                    <div className={styles.loadingMessage}>
                        Loading image...
                        <br />
                        <small>URL: {_.imageUrl}</small>
                    </div>
                )}
                <Image ref={imageRef} src={_.imageUrl} alt="Image to annotate" className={styles.image} onLoad={handleImageLoad} onError={handleImageError} style={{ display: isImageLoaded ? "block" : "none" }} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" unoptimized />
                {isImageLoaded && <canvas ref={overlayCanvasRef} className={styles.annotationCanvas} onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseLeave} onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd} />}

                {/* Hidden input for mobile keyboard support */}
                <input
                    ref={hiddenInputRef}
                    type="text"
                    value={textInputValue}
                    onChange={e => setTextInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            handleTextCancel();
                        } else if (e.key === "Enter") {
                            e.preventDefault();
                            handleTextSubmit();
                        }
                    }}
                    onBlur={() => {
                        // Save text when input loses focus (mobile behavior)
                        if (isTypingText && pendingTextAnnotation && textInputValue.trim()) {
                            handleTextSubmit();
                        }
                    }}
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        top: "-9999px",
                        opacity: 0,
                        pointerEvents: "none"
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            </div>

            {/* Save Modal */}
            <JC_Modal isOpen={showSaveModal} onCancel={handleCancelSave} title="Save Annotated Image">
                <div className={styles.saveModalContent}>
                    <p>How would you like to save the annotated image?</p>
                    <div className={styles.saveModalButtons}>
                        <JC_Button text="Cancel" onClick={handleCancelSave} isSecondary={true} />
                        <JC_Button text="Save Existing" onClick={handleSaveOverExisting} isSecondary={false} />
                        <JC_Button text="Create New" onClick={handleCreateNew} isSecondary={true} />
                    </div>
                </div>
            </JC_Modal>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolSection}>
                    <label>Tool:</label>
                    <div className={styles.toolButtons}>
                        {(["arrow", "circle", "square", "text"] as const).map(tool => (
                            <button key={tool} className={`${styles.toolButton} ${currentTool.type === tool ? styles.active : ""} ${tool === "square" ? styles.squareButton : tool === "arrow" ? styles.arrowButton : ""}`} onClick={() => setCurrentTool(prev => ({ ...prev, type: tool }))}>
                                {tool === "arrow" ? "→" : tool === "circle" ? "○" : tool === "square" ? "" : "T"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.toolSection}>
                    <label>Font Size:</label>
                    <input type="range" min="16" max="80" value={currentTool.size} onChange={e => setCurrentTool(prev => ({ ...prev, size: parseInt(e.target.value) }))} className={styles.sizeSlider} />
                    <span className={styles.sizeValue}>{currentTool.size}</span>
                </div>

                <div className={styles.toolSection}>
                    <label>Color:</label>
                    <input type="color" value={currentTool.color} onChange={e => handleColorChange(e.target.value)} className={styles.colorPicker} />
                </div>

                <button onClick={handleUndo} className={styles.undoButton} disabled={annotations.length === 0}>
                    Undo
                </button>
                <button onClick={clearAnnotations} className={styles.clearButton}>
                    Clear All
                </button>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={_.onCancel} title="Cancel annotation">
                    ×
                </button>
                <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleSave} disabled={_.isSaving || annotations.length === 0} title={_.isSaving ? "Saving..." : "Save annotated image"}>
                    {_.isSaving ? "..." : "✓"}
                </button>
            </div>
        </div>
    );
}
