"use client";

import JC_Spinner from "../JC_Spinner/JC_Spinner";
import styles from "./JC_Button.module.scss";
import { JC_Utils } from "@/app/Utils";
import { ButtonIconPosition } from "@/app/enums/ButtonIconPosition";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function JC_Button(
    _: Readonly<{
        overrideClass?: string;
        enableResponsive?: boolean;
        text?: string;
        iconName?: string;
        iconPosition?: ButtonIconPosition;
        iconOverrideClass?: string;
        isSecondary?: boolean;
        isSmall?: boolean;
        isCircular?: boolean;
        linkToPage?: string;
        linkInNewTab?: boolean;
        onClick?: React.MouseEventHandler;
        onMouseDown?: React.MouseEventHandler;
        isDisabled?: boolean;
        isLoading?: boolean;
    }>
) {
    // - STATE - //

    const pathName = usePathname();

    let iconPosition = _.iconPosition ?? ButtonIconPosition.Left;

    let buttonSelected = pathName == _.linkToPage || pathName == `/${_.linkToPage}`;

    let containerClassNames = `${styles.buttonContainer} ` + `${buttonSelected ? styles.buttonSelected : ""} ` + `${_.enableResponsive ? styles.enableResponsive : ""} ` + `${!JC_Utils.stringNullOrEmpty(_.iconName) ? styles.includeIcon : ""} ` + `${JC_Utils.stringNullOrEmpty(_.text) && !JC_Utils.stringNullOrEmpty(_.iconName) ? styles.iconOnly : ""} ` + `${!JC_Utils.stringNullOrEmpty(_.iconName) && iconPosition == ButtonIconPosition.Top ? styles.iconOnTop : ""} ` + `${_.isSecondary ? styles.secondary : ""} ` + `${_.isSmall ? styles.small : ""} ` + `${_.isCircular ? styles.circular : ""} ` + `${_.isDisabled ? styles.disabled : ""} `;

    // - BUILD - //

    let renderChildren = () => (
        <React.Fragment>
            {_.iconName != null && (iconPosition == ButtonIconPosition.Left || iconPosition == ButtonIconPosition.Top) && <Image className={`${styles.buttonIcon} ${!JC_Utils.stringNullOrEmpty(_.iconOverrideClass) ? _.iconOverrideClass : ""}`} src={`/icons/${_.iconName}.webp`} width={0} height={0} alt="Icon" unoptimized />}
            {!JC_Utils.stringNullOrEmpty(_.text) && <div className={styles.buttonText}>{_.text}</div>}
        </React.Fragment>
    );

    // - MAIN - //

    return _.isLoading ? (
        <div className={`${styles.spinnerContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            <JC_Spinner isSmall />
        </div>
    ) : _.linkToPage != null ? (
        <Link className={`${containerClassNames} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`} href={`/${_.linkToPage}`} target={_.linkInNewTab ? "_blank" : ""} onClick={_.isDisabled ? undefined : _.onClick} onMouseDown={_.isDisabled ? undefined : _.onMouseDown} scroll={false}>
            {renderChildren()}
        </Link>
    ) : (
        <div className={`${containerClassNames} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`} onClick={_.isDisabled ? undefined : _.onClick} onMouseDown={_.isDisabled ? undefined : _.onMouseDown}>
            {renderChildren()}
        </div>
    );
}
