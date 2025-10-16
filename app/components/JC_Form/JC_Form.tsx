"use client";

import JC_Button from "../JC_Button/JC_Button";
import JC_Field from "../JC_Field/JC_Field";
import styles from "./JC_Form.module.scss";
import { JC_Utils } from "@/app/Utils";
import { FieldTypeEnum } from "@/app/enums/FieldType";
import { JC_FieldModel } from "@/app/models/ComponentModels/JC_Field";
import React, { useState } from "react";

export default function JC_Form(
    _: Readonly<{
        overrideClass?: string;
        columns?: number;
        submitButtonText?: string;
        onSubmit: () => void;
        onCancel?: () => void;
        isDisabled?: boolean;
        isLoading?: boolean;
        errorMessage?: string;
        mainValidate?: () => string;
        fields: (JC_FieldModel & { customNode?: React.ReactNode })[];
    }>
) {
    // - STATE - //

    const [submitClicked, setSubmitClicked] = useState<boolean>(false);

    // - HANDLE - //

    function handleSubmit() {
        if (!submitClicked) {
            setSubmitClicked(true);
        }
        if ((_.mainValidate == null || JC_Utils.stringNullOrEmpty(_.mainValidate())) && _.fields.every(f => f.validate == null || JC_Utils.stringNullOrEmpty(f.validate(f.value)))) {
            _.onSubmit();
            setSubmitClicked(false);
        }
    }

    // - MAIN - //

    return (
        <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`} style={(_.columns ?? 1) > 1 ? { display: "grid", gridTemplateColumns: `repeat(${_.columns}, max-content)` } : {}}>
            {/* Fields */}
            {_.fields
                .filter(f => !(f.type == FieldTypeEnum.Custom && !f.customNode))
                .map(f =>
                    f.type == FieldTypeEnum.Custom ? (
                        <div key={f.inputId} className={styles.customNodeContainer}>
                            {f.customNode}
                            {/* Show validation error for customNode if validation fails */}
                            {submitClicked && f.validate && !JC_Utils.stringNullOrEmpty(f.validate(f.value)) && <div className={styles.customNodeErrorSpan}>{f.validate(f.value)}</div>}
                        </div>
                    ) : (
                        <JC_Field
                            key={f.inputId}
                            {...f}
                            validate={value => (!submitClicked || f.validate == null ? "" : f.validate(value))} // Only do validation if submit has been clicked
                            onEnter={handleSubmit}
                        />
                    )
                )}

            {/* Error Message */}
            {!JC_Utils.stringNullOrEmpty(_.errorMessage) && (
                <span key={_.errorMessage} className={`${styles.errorSpan} ${(_.columns ?? 1) > 1 ? styles.spanEntireRow : ""}`}>
                    {_.errorMessage}
                </span>
            )}

            {/* Main Validation Error Message */}
            {submitClicked && _.mainValidate != null && !JC_Utils.stringNullOrEmpty(_.mainValidate()) && <span className={`${styles.errorSpan} ${(_.columns ?? 1) > 1 ? styles.spanEntireRow : ""}`}>{_.mainValidate()}</span>}

            {/* Buttons */}
            {_.onCancel ? (
                <div className={`${styles.buttonRow} ${(_.columns ?? 1) > 1 ? styles.spanEntireRow : ""}`}>
                    <JC_Button text="Cancel" onClick={_.onCancel} />
                    <JC_Button text={!JC_Utils.stringNullOrEmpty(_.submitButtonText) ? _.submitButtonText : "Save"} onClick={handleSubmit} isDisabled={_.isDisabled} isLoading={_.isLoading} />
                </div>
            ) : (
                <JC_Button overrideClass={`${styles.submitButtonOverride} ${(_.columns ?? 1) > 1 ? styles.spanEntireRow : ""}`} text={!JC_Utils.stringNullOrEmpty(_.submitButtonText) ? _.submitButtonText : "Save"} onClick={handleSubmit} isDisabled={_.isDisabled} isLoading={_.isLoading} />
            )}
        </div>
    );
}
