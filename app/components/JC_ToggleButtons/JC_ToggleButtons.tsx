"use client";

import styles from "./JC_ToggleButtons.module.scss";
import { JC_Utils } from "@/app/Utils";
import { JC_ToggleButtonsModel } from "@/app/models/ComponentModels/JC_ToggleButtons";
import React, { useState, useEffect } from "react";

export default function JC_ToggleButtons(_: Readonly<JC_ToggleButtonsModel>) {
    // - STATE - //
    const [selectedOption, setSelectedOption] = useState<string | undefined>(_.selectedId);

    // Update selected option when prop changes
    useEffect(() => {
        if (_.selectedId !== selectedOption) {
            setSelectedOption(_.selectedId);
        }
    }, [_.selectedId, selectedOption]);

    // - HANDLE - //
    function handleOptionClick(id: string) {
        if (id !== selectedOption) {
            setSelectedOption(id);
            if (_.onChange) {
                _.onChange(id);
            }
        }
    }

    // - MAIN - //
    return (
        <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            <div className={styles.buttonsContainer}>
                {_.options.map(option => {
                    const primaryKey = (option.constructor as any).primaryKey || "Code";
                    const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                    const optionId = (option as any)[primaryKey];
                    const optionLabel = (option as any)[primaryDisplayField];

                    return (
                        <div key={optionId} className={`${styles.toggleButton} ${optionId === selectedOption ? styles.selected : ""}`} onClick={() => handleOptionClick(optionId)}>
                            {optionLabel}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
