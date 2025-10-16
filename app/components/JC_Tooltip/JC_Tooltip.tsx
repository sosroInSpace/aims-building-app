"use client";

import styles from "./JC_Tooltip.module.scss";
import { TooltipPositionEnum } from "@/app/enums/TooltipPosition";
import React from "react";

export default function JC_Tooltip(
    _: Readonly<{
        content: React.ReactNode;
        iconName?: string;
        position: TooltipPositionEnum;
        children?: React.ReactNode;
        absoluteFillSpace?: boolean;
    }>
) {
    let positionStyle: React.CSSProperties;
    switch (_.position) {
        case TooltipPositionEnum.Top:
            positionStyle = {
                top: "-10px",
                left: "50%",
                transform: "translate(-50%, -100%)"
            };
            break;
        case TooltipPositionEnum.Right:
            positionStyle = {
                right: "-10px",
                top: "50%",
                transform: "translate(100%, -50%)"
            };
            break;
        case TooltipPositionEnum.Left:
            positionStyle = {
                left: "-10px",
                top: "50%",
                transform: "translate(-100%, -50%)"
            };
            break;
        default: // TooltipPositionEnum.Bottom
            positionStyle = {
                bottom: "-10px",
                left: "50%",
                transform: "translate(-50%, 100%)"
            };
            break;
    }

    return (
        <div className={`${styles.mainContainer} ${_.absoluteFillSpace ? styles.absoluteFill : ""}`}>
            <div className={styles.tooltip} style={positionStyle}>
                {_.content}
            </div>
            {_.children}
        </div>
    );
}
