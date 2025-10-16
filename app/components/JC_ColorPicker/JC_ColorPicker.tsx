"use client";

import JC_Button from "../JC_Button/JC_Button";
import styles from "./JC_ColorPicker.module.scss";
import { LocalStorageKeyEnum } from "@/app/enums/LocalStorageKey";
import React, { useState, useEffect, useRef } from "react";
import { ChromePicker, ColorResult } from "react-color";

export default function JC_ColorPicker(
    _: Readonly<{
        value: string;
        onChange: (color: string) => void;
        onClose: () => void;
    }>
) {
    const [colorHistory, setColorHistory] = useState<string[]>([]);
    const [currentColor, setCurrentColor] = useState<string>(_.value || "#000000");
    const [selectedHistoryColor, setSelectedHistoryColor] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Load color history from localStorage on component mount
    useEffect(() => {
        try {
            const savedColors = localStorage.getItem(LocalStorageKeyEnum.JC_ColorHistory);
            if (savedColors) {
                setColorHistory(JSON.parse(savedColors));
            }
        } catch (error) {
            console.error("Error loading color history:", error);
        }

        // Add click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                _.onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [_]);

    // Function to add a color to history
    const addColorToHistory = (color: string) => {
        if (!color) return;

        // Create a new array with the selected color at the beginning
        // and the rest of the colors (up to 7 more) following
        const updatedHistory = [color, ...colorHistory.filter(c => c !== color)].slice(0, 8);

        // Update state and localStorage
        setColorHistory(updatedHistory);
        localStorage.setItem(LocalStorageKeyEnum.JC_ColorHistory, JSON.stringify(updatedHistory));
    };

    // Handle color change from ChromePicker (just update the current color, don't apply it yet)
    const handleColorChange = (colorResult: ColorResult) => {
        const hexColor = colorResult.hex;
        setCurrentColor(hexColor);
        // Clear selected history color when using the color picker
        setSelectedHistoryColor(null);
    };

    // Handle color selection from history
    const handleHistoryColorSelect = (color: string) => {
        setCurrentColor(color);
        setSelectedHistoryColor(color);
    };

    // Handle Set button click
    const handleSetColor = () => {
        _.onChange(currentColor);
        addColorToHistory(currentColor);
        _.onClose();
    };

    return (
        <div className={styles.colorPickerContainer} ref={pickerRef}>
            {/* Global style to hide RGB/HSL fields */}
            <style jsx global>{`
                /* Hide the yellow RGB/HSL input fields section */
                .flexbox-fix[style*="padding: 0px 10px 10px"] {
                    display: none !important;
                }
            `}</style>
            {/* Color history - only show if there's at least one item */}
            {colorHistory.length > 0 && (
                <div className={styles.colorHistoryContainer}>
                    {colorHistory.slice(0, 8).map((color, index) => (
                        <div key={`${color}-${index}`} className={`${styles.colorHistoryItem} ${selectedHistoryColor === color ? styles.selected : ""}`} style={{ backgroundColor: color }} onClick={() => handleHistoryColorSelect(color)} title={color} />
                    ))}
                </div>
            )}

            {/* React Color ChromePicker */}
            <div className={styles.colorPickerContent}>
                <div className={styles.reactColorPickerWrapper}>
                    <div className={styles.hideFields}>
                        <ChromePicker color={currentColor} onChange={handleColorChange} disableAlpha={true} />
                    </div>
                </div>

                {/* Set button */}
                <div className={styles.setButtonContainer}>
                    <JC_Button text="Set" isSmall onClick={handleSetColor} />
                </div>
            </div>
        </div>
    );
}
