"use client";

// Styles
import styles from "./JC_LoadingAnimation.module.scss";
// Utils
import { JC_Utils } from "@/app/Utils";
// Next Components
import Image from "next/image";
// React
import { useEffect, useState, useRef } from "react";

export default function JC_LoadingAnimation() {
    // State variables
    const [isVisible, setIsVisible] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Timing variables (in milliseconds)
    const startFadeOutDelay = 500;
    const fadeOutDuration = 800;

    useEffect(() => {
        // Start fading out the animation after delay
        const fadeTimer = setTimeout(() => {
            // Add fadeOut class to container element
            if (containerRef.current) {
                containerRef.current.classList.add(styles.fadeOut);
            }

            // Hide the component after fade-out animation completes
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
            }, fadeOutDuration); // Match the fadeOut animation duration

            return () => clearTimeout(hideTimer);
        }, startFadeOutDelay);

        return () => {
            clearTimeout(fadeTimer);
        };
    }, []);

    // If not visible, don't render anything
    if (!isVisible) return null;

    return (
        <div ref={containerRef} className={styles.loadingContainer}>
            <div className={styles.animationWrapper}>
                <Image className={styles.animationImage} src={JC_Utils.getResponsiveGifPath("/logos/LoadingAnimation.webp")} width={0} height={0} alt="Loading" unoptimized priority />
            </div>
        </div>
    );
}
