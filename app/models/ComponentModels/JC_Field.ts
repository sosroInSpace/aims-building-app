import { _ModelConstructor, _ModelRequirements } from "../_ModelRequirements";
import { JC_Utils, JC_Utils_Validation } from "@/app/Utils";
import { FieldTypeEnum } from "@/app/enums/FieldType";

export interface JC_FieldModel {
    overrideClass?: string;
    inputOverrideClass?: string;
    inputId: string;
    type: FieldTypeEnum;
    label?: string;
    iconName?: string;
    placeholder?: string;
    readOnly?: boolean;
    richTextEnableColor?: boolean;
    richTextEnableBold?: boolean;
    richTextEnableItalic?: boolean;
    richTextEnableDegree?: boolean;
    value?: string | number; // This only works if an "inputId" is supplied
    displayValue?: string;
    defaultValue?: string | number;
    increment?: number; // For NumberStepper - the amount to increment/decrement by
    decimalPlaces?: number; // For Number and NumberStepper - the number of decimal places to display
    optionsModel?: _ModelConstructor; // For Dropdown - the model constructor to access static fields like apiRoute
    addNewOptionCallback?: () => void; // For Dropdown - callback to add new option
    options?: _ModelRequirements[]; // For Dropdown - the options to display
    selectedOptionIds?: string[]; // For MultiDropdown - array of selected option IDs
    onOptionUpdated?: (updatedOption: _ModelRequirements) => void; // For Dropdown - callback when an option is updated
    manualOverrideDisplayValue?: string; // For Dropdown - display value when no option is selected but manual override exists
    enableSearch?: boolean; // For Dropdown - whether to enable search functionality
    s3KeyPath?: string; // For Photo field type - the S3 key path for image uploads
    customNode?: React.ReactNode; // For Custom field type - the custom component to render
    modelConstructor?: _ModelConstructor; // For fields with predefined options - the model constructor to get options from
    onClick?: () => void;
    onChange?: (newValue: any) => void;
    onBlur?: (newValue: string) => void;
    onEnter?: (event: any) => void;
    onEscape?: (event: any) => void;
    validate?: (value: string | number | Date | undefined) => string;
    required?: boolean;
    autoFocus?: boolean;
}

// - Defaults For Specific Fields - //

// First Name
export function D_FieldModel_FirstName(): JC_FieldModel {
    return {
        inputId: "first-name-input",
        type: FieldTypeEnum.Text,
        label: "First Name",
        iconName: "User",
        validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a first name." : "")
    };
}

// Last Name
export function D_FieldModel_LastName(): JC_FieldModel {
    return {
        inputId: "last-name-input",
        type: FieldTypeEnum.Text,
        label: "Last Name",
        iconName: "User",
        validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a last name." : "")
    };
}

// Email
export function D_FieldModel_Email(): JC_FieldModel {
    return {
        inputId: "email-input",
        type: FieldTypeEnum.Email,
        label: "Email",
        iconName: "Email",
        validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter an email." : !JC_Utils_Validation.validEmail(v) ? "Enter a valid email" : "")
    };
}

// Phone
export function D_FieldModel_Phone(hideOptionalText: boolean = false): JC_FieldModel {
    return {
        inputId: "contact-email-input",
        type: FieldTypeEnum.Text,
        label: hideOptionalText ? "Phone" : "Phone (optional)",
        iconName: "Phone",
        validate: (v: any) => (!JC_Utils.stringNullOrEmpty(v) && !JC_Utils_Validation.validPhone(v) ? "Enter a valid phone number" : "")
    };
}

// Company
export function D_FieldModel_Company(hideOptionalText: boolean = false): JC_FieldModel {
    return {
        inputId: "company-input",
        type: FieldTypeEnum.Text,
        label: hideOptionalText ? "Company" : "Company (optional)",
        iconName: "Building",
        validate: (v: any) => ""
    };
}

// ABN
export function D_FieldModel_ABN(hideOptionalText: boolean = false): JC_FieldModel {
    return {
        inputId: "abn-input",
        type: FieldTypeEnum.Text,
        label: hideOptionalText ? "ABN" : "ABN (optional)",
        iconName: "Hash",
        validate: (v: any) => ""
    };
}
