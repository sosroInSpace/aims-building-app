import styles from "./JC_Title.module.scss";
import { JC_Utils } from "@/app/Utils";
import React from "react";

export default function JC_Title(
    _: Readonly<{
        overrideClass?: string;
        title: string;
        isSecondary?: boolean;
    }>
) {
    return <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""} ${_.isSecondary ? styles.secondary : ""}`}>{_.title}</div>;
}
