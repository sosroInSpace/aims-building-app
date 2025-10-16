"use client";

import styles from "./JC_ImageGridView.module.scss";
import { JC_Utils } from "@/app/Utils";
import Image from "next/image";
import React from "react";

export default function JC_ImageGridView(
    _: Readonly<{
        overrideClass?: string;
        imagePaths: string[];
    }>
) {
    return (
        <div
            className={`
            ${styles.mainContainer}
            ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}
            ${_.imagePaths.length == 2 ? styles.twoItems : _.imagePaths.length == 3 ? styles.threeItems : _.imagePaths.length == 4 ? styles.fourItems : ""}
        `}
        >
            {_.imagePaths.map(path => (
                <Image key={path} className={styles.imageItem} src={path} width={0} height={0} alt="Product thumbnail" unoptimized />
            ))}
        </div>
    );
}
