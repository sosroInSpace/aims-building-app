"use client";

import styles from "./JC_Checkbox.module.scss";
import { JC_Utils } from "@/app/Utils";
import React from "react";

export default function JC_Checkbox(
    _: Readonly<{
        label?: string;
        checked?: boolean;
        onChange?: () => void;
        disabled?: boolean;
        readOnly?: boolean;
    }>,
) {
    // Handle click with readOnly check
    const handleClick = () => {
        if (_.readOnly) return; // Don't trigger onChange if readOnly
        if (_.onChange) _.onChange();
    };

    const color = "#fff";

    return (
        <div
            className={`
                ${styles.mainContainer}
                ${_.onChange != null && !_.readOnly ? styles.clickable : ""}
                ${_.readOnly ? styles.readOnly : ""}
            `}
            onClick={handleClick}
        >
            <div className={styles.checkbox}>
                {_.checked && <div className={styles.innerCheckedSquare} />}
            </div>
            {!JC_Utils.stringNullOrEmpty(_.label) && (
                <label style={{ color: color }}>{_.label}</label>
            )}
        </div>
    );
}
