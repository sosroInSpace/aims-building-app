"use client";

import styles from "./JC_AutoSlideshow.module.scss";
import { JC_Utils } from "@/app/Utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function JC_AutoSlideshow(
    _: Readonly<{
        overrideClass?: string;
        brightness?: number;
        imageSrcList: string[];
    }>
) {
    // - STATE - //

    const [currentIndex, setCurrentIndex] = useState<number>(2);

    let zIndexDefault = 2;
    let moddedIndex = currentIndex % _.imageSrcList.length;
    let previousModdedIndex = (currentIndex - 1) % _.imageSrcList.length;

    useEffect(() => {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 3000);
    }, [currentIndex]);

    // - MAIN - //

    return (
        <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Images */}
            {_.imageSrcList.map((imageSrc, index) => {
                let isFadingIn = moddedIndex == index;
                let isFadingOut = previousModdedIndex == index;
                return (
                    <Image
                        key={imageSrc}
                        style={{ zIndex: isFadingIn ? zIndexDefault : zIndexDefault - 1 }}
                        className={`${styles.image}
                                ${isFadingIn ? styles.fadingIn : ""}
                                ${isFadingOut ? styles.fadingOut : ""}`}
                        src={`${imageSrc}.webp`}
                        alt={`Slideshow image ${index + 1}`}
                        width={0}
                        height={0}
                        unoptimized
                    />
                );
            })}

            {/* Darken */}
            {_.brightness != null && <div className={styles.darkenImage} style={{ zIndex: zIndexDefault + 1, opacity: 1 - _.brightness }} />}
        </div>
    );
}
