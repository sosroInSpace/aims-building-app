"use client";

import styles from "./JC_Header.module.scss";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface JC_HeaderButtonProps {
    linkToPage?: string;
    emailTo?: string;
    text: string;
    iconName: string;
    iconWidth?: number;
    userFullName?: string;
}

export default function JC_HeaderButton({ linkToPage, emailTo, text, iconName, iconWidth, userFullName }: JC_HeaderButtonProps) {
    const pathName = usePathname();

    // Helper function to check if we're on a specific page or its sub-pages
    const isOnPage = (page: string) => {
        // Check for exact matches first
        if (pathName == page || pathName == `/${page}`) {
            return true;
        }

        // Check if we're on a sub-page (e.g., /property/edit/123 should match "property")
        const normalizedPath = pathName.startsWith("/") ? pathName : `/${pathName}`;
        const normalizedPage = page.startsWith("/") ? page : `/${page}`;

        return normalizedPath.startsWith(`${normalizedPage}/`);
    };

    // If emailTo is provided, render as a mailto link
    if (emailTo) {
        // Create subject line with user's full name if provided
        const subject = userFullName ? `Aims Building Reports Support - ${userFullName}` : "Aims Building Reports Support";
        const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}`;

        return (
            <a href={mailtoUrl} className={styles.navButton}>
                <div className={styles.navButtonContent}>
                    <Image src={`/icons/${iconName}.webp`} alt={text} width={0} height={0} className={styles.navIcon} style={iconWidth ? { width: `${iconWidth}px`, height: `${iconWidth}px` } : undefined} unoptimized />
                    <span className={styles.navLabel}>{text}</span>
                </div>
            </a>
        );
    }

    // Default behavior for page links
    return (
        <Link href={`/${linkToPage}`} className={`${styles.navButton} ${linkToPage && isOnPage(linkToPage) ? styles.active : ""}`}>
            <div className={styles.navButtonContent}>
                <Image src={`/icons/${iconName}.webp`} alt={text} width={0} height={0} className={styles.navIcon} style={iconWidth ? { width: `${iconWidth}px`, height: `${iconWidth}px` } : undefined} unoptimized />
                <span className={styles.navLabel}>{text}</span>
            </div>
        </Link>
    );
}
