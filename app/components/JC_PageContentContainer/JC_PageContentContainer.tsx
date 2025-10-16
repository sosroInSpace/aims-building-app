"use client";

import styles from "./JC_PageContentContainer.module.scss";
import React, { ReactNode } from "react";

interface JC_PageContentContainerProps {
    children: ReactNode;
    overrideClass?: string;
    hasBorder?: boolean;
    maxWidth?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    padding?: string;
}

export default function JC_PageContentContainer({ children, overrideClass = "", hasBorder = true, maxWidth, minWidth = "300px", minHeight = "200px", padding }: JC_PageContentContainerProps) {
    const containerStyle = {
        maxWidth: maxWidth !== undefined ? (typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth) : undefined,
        minWidth: minWidth !== undefined ? (typeof minWidth === "number" ? `${minWidth}px` : minWidth) : undefined,
        minHeight: minHeight !== undefined ? (typeof minHeight === "number" ? `${minHeight}px` : minHeight) : undefined,
        padding: padding
    };

    return (
        <div className={`${styles.contentContainer} ${hasBorder ? styles.withBorder : ""} ${overrideClass}`} style={containerStyle}>
            {children}
        </div>
    );
}
