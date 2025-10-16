"use client";

import JC_Title from "../JC_Title/JC_Title";
import styles from "./JC_Modal.module.scss";
import { JC_Utils } from "@/app/Utils";
import Image from "next/image";
import React from "react";

export default function JC_Modal(
    _: Readonly<{
        overrideClass?: string;
        width?: string;
        children: React.ReactNode;
        title?: string;
        isOpen: boolean;
        onCancel: () => void;
        transparent?: boolean;
    }>
) {
    return _.isOpen ? (
        <React.Fragment>
            <div className={styles.blackOverlay} onClick={_.onCancel} />
            <div style={_.width ? { width: _.width } : {}} className={`${styles.modalContainer} ${_.transparent ? styles.forceTransparent : ""} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
                <div className={styles.closeButton} onClick={_.onCancel}>
                    <Image src="/icons/Cross.webp" alt="Close" width={16} height={16} />
                </div>
                {_.title && <JC_Title title={_.title} />}
                <div className={styles.bodyContent}>{_.children}</div>
            </div>
        </React.Fragment>
    ) : null;
}
