"use client";

import styles from "./JC_Spinner.module.scss";
import { JC_Utils } from "@/app/Utils";
import React from "react";

export default function JC_Spinner(
    _: Readonly<{
        overrideClass?: string;
        isPageBody?: boolean;
        isSmall?: boolean;
    }>
) {
    return (
        <div
            className={`
            ${styles.spinnerContainer}
            ${_.isPageBody ? styles.emptyPage : ""}
            ${_.isSmall ? styles.small : ""}
            ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}
        `}
        >
            <div className={styles.spinner} />
        </div>
    );
}
