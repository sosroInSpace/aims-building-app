"use client";

import styles from "./JC_DropdownExpandedList.module.scss";
import { DropdownTypeEnum } from "@/app/enums/DropdownType";
import { _ModelRequirements } from "@/app/models/_ModelRequirements";
import React, { useEffect, useRef, useState } from "react";

interface JC_DropdownExpandedListProps<T extends _ModelRequirements = _ModelRequirements> {
    options: T[];
    selectedOptionId?: string;
    type: DropdownTypeEnum;
    position: { top: number; left: number; width: number };
    onOptionMouseOver?: (optionId: string) => void;
    onOptionMouseOut?: (optionId: string) => void;
    onSelection: (newOptionId: string) => void;
    buildOptionContent: (option: T, isMain?: boolean) => React.ReactNode;
}

export default function JC_DropdownExpandedList<T extends _ModelRequirements = _ModelRequirements>({ options, selectedOptionId, type, position, onOptionMouseOver, onOptionMouseOut, onSelection, buildOptionContent }: JC_DropdownExpandedListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastItemRef = useRef<HTMLDivElement>(null);

    // Max height is defined in SCSS as $height

    function isOptionSelected(optionId: string) {
        if (!selectedOptionId) return false;
        return type === DropdownTypeEnum.Default && optionId === selectedOptionId;
    }

    // Function removed as we're now calling onSelection directly from the onClick handler

    // No need to calculate container height as it's handled by CSS

    return (
        <>
            {/* Main dropdown container */}
            <div
                className={styles.dropdownPortal}
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`
                }}
            >
                <div ref={containerRef} className={styles.scrollContainer}>
                    {options.map((option, index) => {
                        const primaryKey = (option.constructor as any).primaryKey || "Code";
                        const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                        const keyValue = (option as any)[primaryKey];
                        const displayValue = (option as any)[primaryDisplayField];

                        return (
                            <div
                                key={keyValue}
                                ref={index === options.length - 1 ? lastItemRef : null}
                                className={`${styles.dropdownOption} ${isOptionSelected(keyValue) ? styles.selected : ""}`}
                                onClick={e => {
                                    e.stopPropagation(); // Stop event from bubbling up
                                    console.log("JC_DropdownExpandedList - DIV clicked:", keyValue, displayValue);
                                    // Call onSelection directly
                                    onSelection(keyValue);
                                    // Prevent default to avoid any browser behavior
                                    e.preventDefault();
                                }}
                                onMouseOver={e => {
                                    if (!isOptionSelected(keyValue)) {
                                        e.currentTarget.style.backgroundColor = "#dedede";
                                    }
                                    if (onOptionMouseOver) {
                                        onOptionMouseOver(keyValue);
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isOptionSelected(keyValue)) {
                                        e.currentTarget.style.backgroundColor = "#F8F8F8";
                                    }
                                    if (onOptionMouseOut) {
                                        onOptionMouseOut(keyValue);
                                    }
                                }}
                            >
                                {buildOptionContent(option)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
