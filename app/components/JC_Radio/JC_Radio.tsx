"use client";

import styles from "./JC_Radio.module.scss";
import { JC_Utils } from "@/app/Utils";
import { _ModelRequirements } from "@/app/models/_ModelRequirements";
import React, { useState } from "react";

// Individual Radio Button Component
export function JC_RadioButton(
    _: Readonly<{
        label?: string;
        checked?: boolean;
        onChange?: () => void;
    }>
) {
    return (
        <div className={`${styles.mainContainer} ${_.onChange != null ? styles.clickable : ""}`} onClick={_.onChange}>
            <div className={styles.radio}>{_.checked && <div className={styles.innerCheckedCircle} />}</div>
            {!JC_Utils.stringNullOrEmpty(_.label) && <label>{_.label}</label>}
        </div>
    );
}

// Radio Group Component
export default function JC_Radio<T extends _ModelRequirements = _ModelRequirements>(
    _: Readonly<{
        overrideClass?: string;
        label?: string;
        options: T[];
        selectedOptionId?: string;
        onSelection: (newOptionId: string) => void;
        validate?: (value: string | number | undefined) => string;
    }>
) {
    // STATE
    const [selectedOption, setSelectedOption] = useState<T | undefined>(
        !JC_Utils.stringNullOrEmpty(_.selectedOptionId)
            ? _.options.find(x => {
                  const primaryKey = (x.constructor as any).primaryKey || "Code";
                  return (x as any)[primaryKey] === _.selectedOptionId;
              })
            : undefined
    );

    // HANDLES
    function handleSelection(optionId: string) {
        const newSelectedOption = _.options.find(x => {
            const primaryKey = (x.constructor as any).primaryKey || "Code";
            return (x as any)[primaryKey] === optionId;
        });
        setSelectedOption(newSelectedOption);
        _.onSelection(optionId);
    }

    // BUILD
    function buildOptionContent(option: T) {
        const primaryKey = (option.constructor as any).primaryKey || "Code";
        const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
        const optionId = (option as any)[primaryKey];
        const optionLabel = (option as any)[primaryDisplayField];
        const isDisabled = (option as any).Disabled === true;

        const handleClick = () => {
            if (!isDisabled) {
                handleSelection(optionId);
            }
        };

        return (
            <div className={`${styles.mainContainer} ${!isDisabled ? styles.clickable : styles.disabled}`} key={optionId} onClick={handleClick}>
                <div className={styles.radio}>{selectedOption && (selectedOption as any)[primaryKey] === optionId && <div className={styles.innerCheckedCircle} />}</div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{!JC_Utils.stringNullOrEmpty(optionLabel) && <label>{optionLabel}</label>}</div>
            </div>
        );
    }

    // MAIN
    return (
        <div className={`${styles.radioGroupContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Label */}
            {!JC_Utils.stringNullOrEmpty(_.label) && (
                <div className={styles.label}>
                    {_.label}
                    {_.validate != null && !JC_Utils.stringNullOrEmpty(_.validate(_.selectedOptionId)) && <span className={styles.errorSpan}>{_.validate(_.selectedOptionId)}</span>}
                </div>
            )}

            {/* Options */}
            <div className={styles.optionsContainer}>{_.options.map(option => buildOptionContent(option))}</div>
        </div>
    );
}
