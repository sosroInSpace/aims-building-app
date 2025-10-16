"use client";

import JC_ColorPicker from "../JC_ColorPicker/JC_ColorPicker";
import JC_Dropdown from "../JC_Dropdown/JC_Dropdown";
import styles from "./JC_Field.module.scss";
import { JC_Utils } from "@/app/Utils";
import { DropdownTypeEnum } from "@/app/enums/DropdownType";
import { FieldTypeEnum } from "@/app/enums/FieldType";
import { JC_FieldModel } from "@/app/models/ComponentModels/JC_Field";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "next/image";
import React, { useState, useEffect } from "react";

// Helper function to format numbers with optional hiding of trailing zeros
function formatNumberWithDecimalPlaces(value: number, decimalPlaces: number = 2, hideTrailingZeros: boolean = true): string {
    // First format with fixed decimal places
    const formatted = value.toFixed(decimalPlaces);

    // If we want to hide trailing zeros
    if (hideTrailingZeros && decimalPlaces > 0) {
        // Split the number into integer and decimal parts
        const parts = formatted.split(".");
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // If there's a decimal part
        if (decimalPart) {
            // Remove trailing zeros from the decimal part
            const trimmedDecimal = decimalPart.replace(/0+$/, "");

            // If all decimal digits were zeros, return just the integer part
            if (trimmedDecimal === "") {
                return integerPart;
            }

            // Otherwise return the integer part with the trimmed decimal
            return `${integerPart}.${trimmedDecimal}`;
        }
    }

    return formatted;
}

// Format on change
function formatNumberInputChange(event: any, decimalPlaces: number = 2): string {
    let inputString = event.target.value;
    // Only allow numbers, decimal point, and minus sign
    if (!["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "-"].includes(inputString.slice(-1))) {
        inputString = inputString.slice(0, inputString.length - 1);
    }

    // Ensure minus sign is only at the beginning
    if (inputString.indexOf("-") > 0) {
        inputString = inputString.replace(/-/g, "");
    }

    // Only allow one minus sign
    if ((inputString.match(/-/g) || []).length > 1) {
        inputString = inputString.substring(0, inputString.lastIndexOf("-"));
    }

    // Only allow specified decimal places
    if (inputString.indexOf(".") > -1) {
        inputString = inputString.substring(0, inputString.indexOf(".") + decimalPlaces + 1);
    }

    // During editing, we want to preserve all digits including leading and trailing zeros
    // This ensures that when typing "00" it doesn't get converted to "0" and lose cursor position
    return inputString;
}

// Format on blur
function formatNumberInputBlur(event: any, defaultValue: number, decimalPlaces: number = 2, onChange?: (newValue: string) => void): number {
    let inputString = event.target.value;
    // Remove . at end
    if (inputString.slice(-1) == ".") {
        inputString = inputString.slice(0, inputString.length - 1);
    }
    // IF two .'s, only keep 1st one and remove rest of string after 2nd .
    if (inputString.split(".").length > 2) {
        inputString = inputString.split(".")[0] + "." + inputString.split(".")[1];
    }

    // Format to specified decimal places if there's a value
    if (!JC_Utils.stringNullOrEmpty(inputString)) {
        const num = parseFloat(inputString);
        if (!isNaN(num)) {
            // Use the helper function to format with hiding of trailing zeros on blur
            inputString = formatNumberWithDecimalPlaces(num, decimalPlaces, true);
        }
    }

    if (JC_Utils.stringNullOrEmpty(inputString) && defaultValue != null) {
        onChange != null && onChange(String(defaultValue));
        return defaultValue;
    } else {
        return +inputString;
    }
}

// NumberStepper component
interface NumberStepperFieldProps {
    value: string | number;
    setValue: (value: string | number) => void;
    onChange?: (value: string) => void;
    increment: number;
    inputId: string;
    disabled?: boolean;
    decimalPlaces?: number;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const NumberStepperField = ({ value, setValue, onChange, increment, inputId, disabled = false, decimalPlaces = 2, inputRef }: NumberStepperFieldProps) => {
    // Function to increment value
    const incrementValue = () => {
        const newValue = Number(value) + increment;
        // Format the value using our helper function to handle trailing zeros
        const formattedValue = formatNumberWithDecimalPlaces(newValue, decimalPlaces, true);
        setValue(formattedValue);
        onChange && onChange(formattedValue);
    };

    // Function to decrement value
    const decrementValue = () => {
        const newValue = Number(value) - increment;
        // Format the value using our helper function to handle trailing zeros
        const formattedValue = formatNumberWithDecimalPlaces(newValue, decimalPlaces, true);
        setValue(formattedValue);
        onChange && onChange(formattedValue);
    };

    return (
        <>
            <div className={styles.inputContainer}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder=""
                    value={value}
                    onChange={e => {
                        const newValue = e.target.value;
                        setValue(newValue);
                        onChange && onChange(newValue);
                    }}
                    onBlur={e => {
                        // Format the value on blur to remove trailing zeros
                        if (e.target.value) {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num)) {
                                const formattedValue = formatNumberWithDecimalPlaces(num, decimalPlaces, true);
                                setValue(formattedValue);
                                onChange && onChange(formattedValue);
                            }
                        }
                    }}
                    onKeyDown={event => {
                        // Handle Enter key for incrementing and decrementing
                        if (event.key === "ArrowUp") {
                            incrementValue();
                            event.preventDefault();
                        } else if (event.key === "ArrowDown") {
                            decrementValue();
                            event.preventDefault();
                        }
                    }}
                    disabled={disabled}
                    id={inputId}
                />
            </div>
            <div className={styles.stepperButtons}>
                <div className={`${styles.stepButton} ${styles.upButton}`} onClick={incrementValue}>
                    <Image src="/icons/Chevron.webp" width={0} height={0} alt="Up" style={{ transform: "rotate(180deg)" }} unoptimized />
                </div>
                <div className={styles.stepButton} onClick={decrementValue}>
                    <Image src="/icons/Chevron.webp" width={0} height={0} alt="Down" unoptimized />
                </div>
            </div>
        </>
    );
};

// Color picker
let colorPickerOpen = false;

export default function JC_Field(_: Readonly<JC_FieldModel>) {
    // - STATE - //

    const [thisValue, setThisValue] = useState<string | number>(_.value ?? "");
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [prevReadOnly, setPrevReadOnly] = useState<boolean | undefined>(_.readOnly);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Format the value when it changes from parent
    useEffect(() => {
        console.log("JC_Field - useEffect for value change, field:", _.inputId, "value:", _.value);

        if (_.value !== undefined && (_.type === FieldTypeEnum.Number || _.type === FieldTypeEnum.NumberStepper)) {
            const decimalPlaces = _.decimalPlaces || 2;

            if (_.readOnly) {
                // For read-only fields, format with hiding trailing zeros
                if (typeof _.value === "number") {
                    setThisValue(formatNumberWithDecimalPlaces(_.value, decimalPlaces, true));
                } else if (typeof _.value === "string" && !isNaN(parseFloat(_.value))) {
                    setThisValue(formatNumberWithDecimalPlaces(parseFloat(_.value), decimalPlaces, true));
                } else {
                    setThisValue(_.value);
                }
            } else {
                // For editable fields, just use the raw value without formatting
                // This preserves zeros during editing
                setThisValue(_.value);
            }
        } else {
            // For non-number types, just use the value as is
            setThisValue(_.value ?? "");
        }
    }, [_.value, _.type, _.decimalPlaces, _.readOnly, _.inputId]);

    // Handle selection of text when field changes from read-only to editable
    useEffect(() => {
        // Check if readOnly state changed from true to false
        if (prevReadOnly === true && _.readOnly === false) {
            // Select all text in the input field after a short delay to ensure the DOM is updated
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                } else if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.select();
                }
            }, 10);
        }

        // Update previous readOnly state
        setPrevReadOnly(_.readOnly);
    }, [_.readOnly, prevReadOnly]);

    // Handle auto-focus when component mounts or autoFocus prop changes
    useEffect(() => {
        if (_.autoFocus && !_.readOnly) {
            // Focus the input field after a short delay to ensure the DOM is updated
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                } else if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 100);
        }
    }, [_.autoFocus, _.readOnly]);

    // - STYLES - //

    let inputStyle = "";
    switch (_.type) {
        case FieldTypeEnum.Text:
            inputStyle = styles.textType;
            break;
        case FieldTypeEnum.Email:
            inputStyle = styles.textType;
            break;
        case FieldTypeEnum.Number:
            inputStyle = styles.numberType;
            break;
        case FieldTypeEnum.NumberStepper:
            inputStyle = styles.numberStepper;
            break;
        case FieldTypeEnum.Password:
            inputStyle = styles.passwordType;
            break;
        case FieldTypeEnum.Textarea:
            inputStyle = styles.textareaType;
            break;
        case FieldTypeEnum.RichText:
            inputStyle = styles.richTextType;
            break;
        case FieldTypeEnum.Dropdown:
            inputStyle = styles.dropdownType;
            break;
    }

    // - HANDLES - //

    // onChange
    function handleOnChange(event: any) {
        if (_.type == FieldTypeEnum.Number) {
            event.target.value = formatNumberInputChange(event, _.decimalPlaces || 2);
        }
        setThisValue(event.target.value);
        _.onChange != null && _.onChange(event.target.value);
    }

    // onBlur
    function handleOnBlur(event: any) {
        if (_.type == FieldTypeEnum.Number) {
            event.target.value = formatNumberInputBlur(event, _.defaultValue as number, _.decimalPlaces || 2, _.onChange);
        }
        _.onBlur != null && _.onBlur(event.target.value);
    }

    // onKeyDown
    function handleKeyDown(event: any) {
        if (event.code == "Enter" && _.onEnter != null) _.onEnter(event);
        if (event.code == "Escape" && _.onEscape != null) _.onEscape(event);
    }

    // - BUILD - //

    // Rich Text Buttons
    const MenuBar = () => {
        const { editor } = useCurrentEditor();
        if (!editor) return null;

        // Handle color change
        const handleColorChange = (color: string) => {
            // Apply the color to the selection
            editor.chain().focus().setColor(color).run();

            // Apply the change to the editor and trigger the onChange
            _.onChange!(editor.getHTML());

            // Don't close the picker here, let the Set button handle that
        };

        return (
            <div className={styles.richTextButtons}>
                {_.richTextEnableColor && (
                    <div className={styles.colorPickerWrapper}>
                        {/* Color button */}
                        <button
                            className={styles.colorButton}
                            style={{
                                backgroundColor: editor.getAttributes("textStyle").color || "#000000",
                                border: "1px solid #303030"
                            }}
                            onMouseDown={() => {
                                setShowColorPicker(!showColorPicker);
                                colorPickerOpen = true;
                            }}
                        />

                        {/* Custom color picker */}
                        {showColorPicker && (
                            <JC_ColorPicker
                                value={editor.getAttributes("textStyle").color || "#000000"}
                                onChange={handleColorChange}
                                onClose={() => {
                                    setShowColorPicker(false);
                                    colorPickerOpen = false;
                                }}
                            />
                        )}
                    </div>
                )}
                {_.richTextEnableBold && (
                    <button className={editor.isActive("bold") ? styles.isActive : ""} onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}>
                        B
                    </button>
                )}
                {_.richTextEnableItalic && (
                    <button className={editor.isActive("italic") ? styles.isActive : ""} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}>
                        <i>I</i>
                    </button>
                )}
                {_.richTextEnableDegree && (
                    <button
                        onClick={() => {
                            // Insert degree symbol at current cursor position
                            editor.chain().focus().insertContent("°").run();
                        }}
                    >
                        °
                    </button>
                )}
                {/* <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                >
                    Undo
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                >
                    Redo
                </button> */}
            </div>
        );
    };

    // - MAIN - //

    return (
        <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Label */}
            {!JC_Utils.stringNullOrEmpty(_.label) && (
                <div className={`${styles.label} ${_.type === FieldTypeEnum.NumberStepper ? styles.numberStepperLabel : ""} ${_.type === FieldTypeEnum.Number ? styles.numberLabel : ""}`}>
                    {_.label}
                    {_.validate != null && !JC_Utils.stringNullOrEmpty(_.validate(_.value)) && <span className={styles.errorSpan}>{_.validate(_.value)}</span>}
                </div>
            )}

            {/* Input */}
            <div
                className={`
                    ${styles.inputContainer} ${inputStyle}
                    ${_.readOnly ? styles.readOnly : ""}
                    ${!JC_Utils.stringNullOrEmpty(_.inputOverrideClass) ? _.inputOverrideClass : ""}
                `}
                onClick={_.onClick}
            >
                {_.type == FieldTypeEnum.RichText ? (
                    <EditorProvider
                        slotBefore={<MenuBar />}
                        extensions={[StarterKit.configure(), Color, TextStyle]}
                        content={_.value?.toString()}
                        onBlur={props => {
                            // Always update on blur to ensure changes are saved
                            _.onChange!(props.editor.getHTML());
                            if (colorPickerOpen) {
                                colorPickerOpen = false;
                            }
                        }}
                        onUpdate={(props: any) => _.onChange!(props.editor.getHTML())}
                    />
                ) : _.type == FieldTypeEnum.Textarea ? (
                    <textarea key={_.inputId} ref={textareaRef} defaultValue={_.value} onChange={handleOnChange} onBlur={handleOnBlur} disabled={_.readOnly} id={_.inputId} />
                ) : _.type == FieldTypeEnum.NumberStepper ? (
                    <NumberStepperField value={thisValue} setValue={setThisValue} onChange={_.onChange} increment={_.increment || 1} inputId={_.inputId} disabled={_.readOnly} decimalPlaces={_.decimalPlaces || 2} inputRef={inputRef} />
                ) : _.type == FieldTypeEnum.Dropdown ? (
                    <JC_Dropdown
                        type={DropdownTypeEnum.Default}
                        placeholder="Select an option"
                        options={_.options || []}
                        selectedOptionId={thisValue as string}
                        enableSearch={_.enableSearch !== undefined ? _.enableSearch : false}
                        onSelection={newValue => {
                            console.log("JC_Field - onSelection called with newValue:", newValue, "for field:", _.inputId);
                            // Update local state first
                            setThisValue(newValue);
                            // Then call parent onChange handler immediately
                            if (_.onChange) {
                                console.log("JC_Field - calling parent onChange with newValue:", newValue);
                                _.onChange(newValue);
                            }
                        }}
                        disabled={_.readOnly}
                        readOnly={_.readOnly}
                        validate={_.validate}
                    />
                ) : _.type == FieldTypeEnum.MultiDropdown ? (
                    <JC_Dropdown
                        type={DropdownTypeEnum.Multi}
                        placeholder="Select options"
                        options={_.options || []}
                        selectedOptionId={thisValue as string}
                        enableSearch={_.enableSearch !== undefined ? _.enableSearch : false}
                        onSelection={newOptionId => {
                            console.log("JC_Field - MultiDropdown onSelection called with newOptionId:", newOptionId);
                            // Handle multi-selection logic here
                            let currentSelection: string[] = [];
                            try {
                                currentSelection = thisValue ? JSON.parse(thisValue as string) : [];
                            } catch {
                                currentSelection = [];
                            }

                            // Toggle selection
                            const index = currentSelection.indexOf(newOptionId);
                            if (index > -1) {
                                currentSelection.splice(index, 1);
                            } else {
                                currentSelection.push(newOptionId);
                            }

                            const newValue = JSON.stringify(currentSelection);
                            setThisValue(newValue);
                            if (_.onChange) _.onChange(newValue);
                        }}
                        disabled={_.readOnly}
                        readOnly={_.readOnly}
                        validate={_.validate}
                    />
                ) : (
                    <input key={_.inputId} ref={inputRef} type={_.type == FieldTypeEnum.Email ? "email" : _.type == FieldTypeEnum.Password ? "password" : "text"} placeholder={_.placeholder} value={thisValue} onChange={handleOnChange} onBlur={handleOnBlur} onKeyDown={event => handleKeyDown(event)} disabled={_.readOnly} id={_.inputId} />
                )}
            </div>
        </div>
    );
}
