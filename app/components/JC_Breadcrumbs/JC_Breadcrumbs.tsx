"use client";

import styles from "./JC_Breadcrumbs.module.scss";
import Link from "next/link";
import React from "react";

export interface BreadcrumbItem {
    label: string;
    path: string;
    isCurrent?: boolean;
}

export default function JC_Breadcrumbs(
    _: Readonly<{
        items: BreadcrumbItem[];
    }>
) {
    return (
        <div className={styles.breadcrumbsContainer}>
            {_.items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className={styles.separator}>/</span>}
                    {item.isCurrent ? (
                        <span className={`${styles.breadcrumbItem} ${styles.current}`}>{item.label}</span>
                    ) : (
                        <Link href={item.path} className={styles.breadcrumbItem}>
                            {item.label}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
