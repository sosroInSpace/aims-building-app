"use client";

import { FieldTypeEnum } from "../../enums/FieldType";
import { JC_FieldModel } from "../../models/ComponentModels/JC_Field";
import { _ModelRequirements } from "../../models/_ModelRequirements";
import JC_Button from "../JC_Button/JC_Button";
import JC_Checkbox from "../JC_Checkbox/JC_Checkbox";
import JC_DatePicker from "../JC_DatePicker/JC_DatePicker";
import JC_Field from "../JC_Field/JC_Field";
import { JC_ListHeader } from "../JC_List/JC_ListHeader";
import JC_Modal from "../JC_Modal/JC_Modal";
import JC_ModalConfirmation from "../JC_ModalConfirmation/JC_ModalConfirmation";
import JC_ModalPhotos, { JC_ModalPhotosModel } from "../JC_ModalPhotos/JC_ModalPhotos";
import JC_PhotoUpload from "../JC_PhotoUpload/JC_PhotoUpload";
import styles from "./JC_FormTablet.module.scss";
import { JC_Utils, JC_Utils_Dates } from "@/app/Utils";
import { JC_Delete } from "@/app/apiServices/JC_Delete";
import { JC_Post } from "@/app/apiServices/JC_Post";
import { CustomerModel } from "@/app/models/Customer";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LeadingActions, SwipeableList, SwipeableListItem, SwipeAction, TrailingActions } from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";

export interface JC_FormListModel<T> {
    headers: JC_ListHeader[];
    items: T[];
    row: (item: T) => (JC_FieldModel & { selectedByDefault?: boolean; headingLabel?: string })[];
    deleteRecordCallback?: (item: T) => void;
    deleteConfirmationTitle?: string;
    deleteConfirmationText?: (item: T) => string;
}

export interface JC_FormTabletModel {
    headerLabel: string;
    fieldsPaneHeader: string;
    sections: JC_FormTabletSection[];
    formList?: JC_FormListModel<any>;
    defaultSort?: (a: any, b: any) => number; // Custom sort function for formList items when not using SortOrder
    submitButtonText?: string;
    onSubmit?: () => void;
    isLoading?: boolean;
    showSaveButton?: boolean;
    backButtonLink?: string;
    backButtonCallback?: () => void;
    panesSwitched?: boolean;
    noSelectionViewOverride?: React.ReactElement;
    noSelectionHeaderOverride?: string;
    customNode?: React.ReactElement;
    fieldsCustomNode?: React.ReactElement;
    additionalFooterButtons?: Array<{
        text: string;
        onClick: () => void;
        isLoading?: boolean;
    }>;
    fieldsPaneWidth?: number;
    inputPaneWidth?: number;
    onBlurCallback?: () => void;
    onChangeDelayCallback?: () => void;
    onFormListItemChangeDelayCallback?: (itemIndex: number, updatedItem?: any) => void; // New callback for individual item updates
    onImageUploaded?: () => void;
    onPhotoFieldClick?: (
        field: JC_FieldModel,
        item: any
    ) => {
        files?: JC_ModalPhotosModel[];
        title: string;
        getFilesCallback: () => Promise<JC_ModalPhotosModel[]>;
        onFinishedCallback: () => Promise<void>;
        onSortOrderChanged?: (files: JC_ModalPhotosModel[]) => Promise<void>;
        onImageDeleted?: (fileId: string) => Promise<void>;
        onImageUploaded?: (fileId: string, fileName: string) => Promise<void>;
        s3KeyPath?: string;
    };
    customerId?: string;
    customer?: any; // Customer object to read/update CustomOrder field
    useContainerHeight?: boolean; // Use height: 100% instead of height: 100vh
    hideHeader?: boolean; // Hide the header section
}

export interface JC_FormTabletSection {
    Heading: string;
    Fields: (JC_FieldModel & { selectedByDefault?: boolean; headingLabel?: string; modelConstructor?: any })[];
}

interface JC_FormTabletProps {
    model: JC_FormTabletModel;
}

export default function JC_FormTablet({ model }: JC_FormTabletProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const changeDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Find field with selectedByDefault
    const getDefaultSelectedFieldId = (): string | null => {
        for (const section of model.sections) {
            for (const field of section.Fields) {
                if ((field as any).selectedByDefault) {
                    return field.inputId;
                }
            }
        }
        return null;
    };

    // All hooks must be called at the very beginning before any conditional logic
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(getDefaultSelectedFieldId());
    const [submitClicked, setSubmitClicked] = useState<boolean>(false);
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [dateModalField, setDateModalField] = useState<JC_FieldModel | null>(null);
    const [tempDateValue, setTempDateValue] = useState<Date>(new Date());

    // Text field modal state for formList
    const [textFieldModalOpen, setTextFieldModalOpen] = useState(false);
    const [textFieldModalField, setTextFieldModalField] = useState<JC_FieldModel | null>(null);
    const [textFieldModalTitle, setTextFieldModalTitle] = useState<string>("");
    const [tempTextValue, setTempTextValue] = useState<string>("");

    // Selected form list field for showing dropdown options in inputPane
    const [selectedFormListField, setSelectedFormListField] = useState<JC_FieldModel | null>(null);
    const [selectedFormListFieldColumnIndex, setSelectedFormListFieldColumnIndex] = useState<number | null>(null);
    const [selectedFormListCellKey, setSelectedFormListCellKey] = useState<string | null>(null);

    // Photo Modal state
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
    const [photoModalTitle, setPhotoModalTitle] = useState<string>("Photos");
    const [photoModalFiles, setPhotoModalFiles] = useState<JC_ModalPhotosModel[]>([]);
    const [photoModalS3KeyPath, setPhotoModalS3KeyPath] = useState<string>("");
    const [photoModalGetFilesCallback, setPhotoModalGetFilesCallback] = useState<(() => Promise<JC_ModalPhotosModel[]>) | null>(null);
    const [photoModalOnFinishedCallback, setPhotoModalOnFinishedCallback] = useState<(() => Promise<void>) | null>(null);
    const [photoModalOnSortOrderChanged, setPhotoModalOnSortOrderChanged] = useState<((files: JC_ModalPhotosModel[]) => Promise<void>) | null>(null);
    const [photoModalOnImageDeleted, setPhotoModalOnImageDeleted] = useState<((fileId: string) => Promise<void>) | null>(null);
    const [photoModalOnImageUploaded, setPhotoModalOnImageUploaded] = useState<((fileId: string, fileName: string) => Promise<void>) | null>(null);

    // Option Edit Modal state
    const [optionEditModalOpen, setOptionEditModalOpen] = useState<boolean>(false);
    const [optionEditModalOption, setOptionEditModalOption] = useState<any>(null);
    const [optionEditModalFields, setOptionEditModalFields] = useState<JC_FieldModel[]>([]);
    const [optionEditModalLoading, setOptionEditModalLoading] = useState<boolean>(false);

    // Option Delete Modal state
    const [optionDeleteConfirmationOpen, setOptionDeleteConfirmationOpen] = useState<boolean>(false);
    const [optionToDelete, setOptionToDelete] = useState<any>(null);
    const [optionDeleteLoading, setOptionDeleteLoading] = useState<boolean>(false);

    // Manual Override Modal state
    const [manualOverrideModalOpen, setManualOverrideModalOpen] = useState<boolean>(false);
    const [manualOverrideModalItem, setManualOverrideModalItem] = useState<any>(null);
    const [manualOverrideModalItemIndex, setManualOverrideModalItemIndex] = useState<number>(-1);
    const [manualOverrideModalFieldIndex, setManualOverrideModalFieldIndex] = useState<number>(-1);
    const [manualOverrideModalFields, setManualOverrideModalFields] = useState<JC_FieldModel[]>([]);
    const [manualOverrideModalLoading, setManualOverrideModalLoading] = useState<boolean>(false);
    const [manualOverrideModalActionButton, setManualOverrideModalActionButton] = useState<{ label: string; callback: (item: any) => Promise<any> } | null>(null);
    const [manualOverrideModalActionLoading, setManualOverrideModalActionLoading] = useState<boolean>(false);

    // Search state for dropdown options
    const [optionsSearchText, setOptionsSearchText] = useState<string>("");
    const [formListOptionsSearchText, setFormListOptionsSearchText] = useState<string>("");

    // ModelConstructor functionality state
    const [modelConstructorOptions, setModelConstructorOptions] = useState<any[]>([]);
    const [modelConstructorLoading, setModelConstructorLoading] = useState<boolean>(false);
    const [saveAsOptionModalOpen, setSaveAsOptionModalOpen] = useState<boolean>(false);
    const [saveAsOptionName, setSaveAsOptionName] = useState<string>("");
    const [saveAsOptionDescription, setSaveAsOptionDescription] = useState<string>("");
    const [saveAsOptionLoading, setSaveAsOptionLoading] = useState<boolean>(false);
    const [confirmSelectionModalOpen, setConfirmSelectionModalOpen] = useState<boolean>(false);
    const [selectedModelOption, setSelectedModelOption] = useState<any>(null);

    // ModelConstructor option delete confirmation state
    const [modelConstructorDeleteConfirmationOpen, setModelConstructorDeleteConfirmationOpen] = useState<boolean>(false);
    const [modelConstructorOptionToDelete, setModelConstructorOptionToDelete] = useState<any>(null);
    const [modelConstructorDeleteLoading, setModelConstructorDeleteLoading] = useState<boolean>(false);

    // Custom Order checkbox state - initialize from customer's CustomOrder field
    // NULL or TRUE = use custom order (SortOrder), FALSE = use default sort
    const [useCustomOrder, setUseCustomOrder] = useState<boolean>(() => {
        return model.customer?.CustomOrder !== false; // Default to true unless explicitly false
    });

    // Sync useCustomOrder state when customer changes
    useEffect(() => {
        if (model.customer) {
            setUseCustomOrder(model.customer.CustomOrder !== false);
        }
    }, [model.customer]);

    // Handle Custom Order checkbox change
    const handleCustomOrderChange = async () => {
        const newValue = !useCustomOrder;
        setUseCustomOrder(newValue);

        // Exit move mode when Custom Order is toggled
        if (moveMode) {
            setMoveMode(false);
            setItemToMove(null);
            setMoveItemIndex(-1);
        }

        // Update customer's CustomOrder field if customer is available
        if (model.customer && model.customerId) {
            try {
                // Update the customer object
                model.customer.CustomOrder = newValue;

                // Save to database using JC service function
                await CustomerModel.Update(model.customer);
            } catch (error) {
                console.error("Error updating CustomOrder preference:", error);
                // Revert the state change on error
                setUseCustomOrder(!newValue);
                JC_Utils.showToastError("Failed to save sort preference");
            }
        }
    };

    // Delete confirmation modal state
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    // Move mode state
    const [moveMode, setMoveMode] = useState<boolean>(false);
    const [itemToMove, setItemToMove] = useState<any>(null);
    const [moveItemIndex, setMoveItemIndex] = useState<number>(-1);

    // ALL USEEFFECTS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS

    // Handle click outside to deselect field
    useEffect(() => {
        const getTileStructure = () => {
            const tiles: Array<{
                id: string;
                label: string;
                isHeading: boolean;
                field?: JC_FieldModel;
            }> = [];

            model.sections.forEach((section, sectionIndex) => {
                // Add section heading
                if (!JC_Utils.stringNullOrEmpty(section.Heading)) {
                    tiles.push({
                        id: `section-${sectionIndex}`,
                        label: section.Heading,
                        isHeading: true
                    });
                }

                // Add fields
                section.Fields.forEach(field => {
                    tiles.push({
                        id: field.inputId,
                        label: field.label || "",
                        isHeading: false,
                        field: field
                    });
                });
            });

            return tiles;
        };

        const tileStructure = getTileStructure();

        const isInlineEditableField = (fieldType: FieldTypeEnum): boolean => {
            return fieldType === FieldTypeEnum.Text || fieldType === FieldTypeEnum.Email || fieldType === FieldTypeEnum.Number || fieldType === FieldTypeEnum.Password;
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (selectedFieldId) {
                const selectedTile = tileStructure.find(t => t.id === selectedFieldId);
                const selectedField = selectedTile?.field;

                // Handle click outside for inline editable fields
                if (selectedField && isInlineEditableField(selectedField.type)) {
                    // Don't deselect if clicking on the currently selected input
                    if (target.id === `inline-input-${selectedFieldId}`) {
                        return;
                    }

                    // Deselect for any other click
                    setSelectedFieldId(null);
                }

                // Do not handle click outside for Date fields - let them stay selected
            }

            // Exit move mode when clicking outside
            if (moveMode && containerRef.current && !containerRef.current.contains(target)) {
                setMoveMode(false);
                setItemToMove(null);
                setMoveItemIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedFieldId, model.sections, moveMode]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (changeDelayTimeoutRef.current) {
                clearTimeout(changeDelayTimeoutRef.current);
            }
        };
    }, []);

    // Update selectedFormListField when options change
    useEffect(() => {
        if (selectedFormListCellKey && selectedFormListFieldColumnIndex !== null && model.formList) {
            const itemIndex = parseInt(selectedFormListCellKey.split("-")[0]);
            const fieldIndex = parseInt(selectedFormListCellKey.split("-")[1]);

            if (itemIndex < model.formList.items.length) {
                const item = model.formList.items[itemIndex];
                const rowFields = model.formList.row(item);

                if (fieldIndex < rowFields.length) {
                    const field = rowFields[fieldIndex];
                    setSelectedFormListField(field);
                }
            }
        }
    }, [selectedFormListCellKey, selectedFormListFieldColumnIndex, model.formList]);

    // Create tile structure from sections and fields - memoized to prevent infinite re-renders
    const tileStructure = useMemo(() => {
        const tiles: Array<{
            id: string;
            label: string;
            isHeading: boolean;
            field?: JC_FieldModel;
        }> = [];

        model.sections.forEach((section, sectionIndex) => {
            // Add section heading
            tiles.push({
                id: `section-${sectionIndex}`,
                label: section.Heading,
                isHeading: true
            });

            // Add fields for this section
            section.Fields.forEach(field => {
                tiles.push({
                    id: field.inputId,
                    label: field.label || field.inputId,
                    isHeading: false,
                    field: field
                });
            });
        });

        return tiles;
    }, [model.sections]);

    // Validate multi-select fields when selected to remove invalid selections
    useEffect(() => {
        const validateMultiSelectField = (field: JC_FieldModel) => {
            if (field.type === FieldTypeEnum.MultiDropdown && field.value && field.options && field.onChange) {
                try {
                    const selectedItems = JSON.parse(field.value as string);
                    if (Array.isArray(selectedItems)) {
                        // Extract codes from both old format (codes) and new format (objects)
                        const selectedCodes = selectedItems.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));

                        // Filter out invalid selections
                        const validCodes = selectedCodes.filter(code => {
                            return field.options?.find(opt => {
                                const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                return (opt as any)[primaryKey] === code;
                            });
                        });

                        // Update field value if invalid selections were found
                        if (validCodes.length !== selectedCodes.length) {
                            const newValue = JSON.stringify(validCodes);
                            field.onChange(newValue);
                        }
                    }
                } catch (error) {
                    // If parsing fails, clear the field
                    field.onChange("[]");
                }
            }
        };

        const selectedTile = tileStructure.find(t => t.id === selectedFieldId);
        const selectedField = selectedTile?.field;

        // Validate selected form list field
        if (selectedFormListField) {
            validateMultiSelectField(selectedFormListField);
        }

        // Validate selected regular field
        if (selectedField) {
            validateMultiSelectField(selectedField);
        }
    }, [selectedFormListField, selectedFieldId, model.sections, tileStructure]);

    // Auto-select input for Text and Textarea fields when selected
    useEffect(() => {
        const selectedTile = tileStructure.find(t => t.id === selectedFieldId);
        const selectedField = selectedTile?.field;

        if (selectedFieldId && selectedField && [FieldTypeEnum.Text, FieldTypeEnum.Textarea].includes(selectedField.type)) {
            // Use setTimeout to ensure the input is rendered before trying to focus/select
            setTimeout(() => {
                const inputElement = document.getElementById(selectedField.inputId) as HTMLInputElement | HTMLTextAreaElement;
                if (inputElement) {
                    inputElement.focus();
                    inputElement.select();
                }
            }, 0);
        }
    }, [selectedFieldId, tileStructure]); // Only trigger when selectedFieldId changes, not when field value changes

    // Load modelConstructor options when selectedField changes
    useEffect(() => {
        const selectedTile = tileStructure.find(t => t.id === selectedFieldId);
        const selectedField = selectedTile?.field;

        if (selectedField && selectedField.modelConstructor) {
            loadModelConstructorOptions(selectedField.modelConstructor);
        } else {
            setModelConstructorOptions([]);
        }
    }, [selectedFieldId, model.sections, tileStructure]);

    // Check if field type supports inline editing - needed for useEffect
    const isInlineEditableField = (fieldType: FieldTypeEnum): boolean => {
        return fieldType === FieldTypeEnum.Text || fieldType === FieldTypeEnum.Email || fieldType === FieldTypeEnum.Number || fieldType === FieldTypeEnum.Password;
    };

    // Check if field type is a text field that should open modal in formList mode
    const isTextFieldType = (fieldType: FieldTypeEnum): boolean => {
        return fieldType === FieldTypeEnum.Text || fieldType === FieldTypeEnum.Email || fieldType === FieldTypeEnum.Number || fieldType === FieldTypeEnum.Password || fieldType === FieldTypeEnum.Textarea;
    };

    // Truncate text to 50 characters with ellipsis
    const truncateText = (text: string | null | undefined): string => {
        if (!text) return "-";
        const textStr = text.toString();
        return textStr.length > 50 ? textStr.substring(0, 50) + "..." : textStr;
    };

    // Validation: Check if both sections and formList are set
    const hasFormList = !!model.formList;
    const hasSections = model.sections.some(section => section.Fields && section.Fields.length > 0);

    if (hasFormList && hasSections) {
        JC_Utils.showToastError("Cannot have both sections with fields and formList in the same JC_FormTablet");
        return null;
    }

    // Get all fields from all sections and formList
    const getAllFields = (): JC_FieldModel[] => {
        const allFields: JC_FieldModel[] = [];

        // Add fields from sections
        model.sections.forEach(section => {
            section.Fields.forEach(field => {
                allFields.push(field);
            });
        });

        // Add fields from formList
        if (model.formList) {
            model.formList.items.forEach(item => {
                const rowFields = model.formList!.row(item);
                rowFields.forEach(field => {
                    allFields.push(field);
                });
            });
        }

        return allFields;
    };

    // Get first validation error message
    const getFirstValidationError = (): string => {
        const allFields = getAllFields();
        for (const field of allFields) {
            if (field.validate) {
                const errorMessage = field.validate(field.value);
                if (!JC_Utils.stringNullOrEmpty(errorMessage)) {
                    return errorMessage;
                }
            }
        }
        return "";
    };

    // Check if a field has validation error
    const fieldHasError = (field: JC_FieldModel): boolean => {
        if (!submitClicked || !field.validate) return false;
        const errorMessage = field.validate(field.value);
        return !JC_Utils.stringNullOrEmpty(errorMessage);
    };

    // Filter options based on search text
    const filterOptions = (options: any[], searchText: string, searchFields?: string[]): any[] => {
        if (!searchText.trim()) return options;

        const searchLower = searchText.toLowerCase();
        return options.filter(option => {
            // If specific search fields are provided, search on those fields
            if (searchFields && searchFields.length > 0) {
                return searchFields.some(fieldName => {
                    const fieldValue = (option as any)[fieldName];
                    return fieldValue?.toString().toLowerCase().includes(searchLower);
                });
            }

            // Default behavior: search on primary display field
            const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
            const displayValue = (option as any)[primaryDisplayField];
            return displayValue?.toString().toLowerCase().includes(searchLower);
        });
    };

    // Load options from modelConstructor
    const loadModelConstructorOptions = async (modelConstructor: any) => {
        try {
            setModelConstructorLoading(true);
            const result = await modelConstructor.GetList();
            setModelConstructorOptions(result.ResultList || []);
        } catch (error) {
            console.error("Error loading model constructor options:", error);
            JC_Utils.showToastError("Failed to load options");
            setModelConstructorOptions([]);
        } finally {
            setModelConstructorLoading(false);
        }
    };

    // Handle model option selection
    const handleModelOptionSelect = (option: any) => {
        setSelectedModelOption(option);
        setConfirmSelectionModalOpen(true);
    };

    // Handle confirm selection
    const handleConfirmSelection = () => {
        if (selectedModelOption && selectedField) {
            // Use Description if exists, otherwise use Name
            const displayValue = (selectedModelOption as any).Description || (selectedModelOption as any).Name;
            handleFieldChange(displayValue);

            // Force field re-render by deselecting and reselecting
            if (selectedFieldId && [FieldTypeEnum.Text, FieldTypeEnum.Textarea].includes(selectedField.type)) {
                const currentFieldId = selectedFieldId;
                setSelectedFieldId(null);
                setTimeout(() => {
                    setSelectedFieldId(currentFieldId);
                }, 0);
            }
        }
        setConfirmSelectionModalOpen(false);
        setSelectedModelOption(null);
    };

    // Handle opening save as option modal
    const handleOpenSaveAsOptionModal = () => {
        if (!selectedField || !selectedField.modelConstructor) return;

        const modelConstructor = selectedField.modelConstructor;
        const newOption = new modelConstructor();
        const currentValue = selectedField.value as string;

        // Auto-populate fields based on current field value and model structure
        if (newOption.hasOwnProperty("Description") && currentValue) {
            // If model has Description field, use current value as Description
            setSaveAsOptionDescription(currentValue);
            setSaveAsOptionName(""); // Leave Name empty for user to fill
        } else if (newOption.hasOwnProperty("Name") && currentValue) {
            // If model only has Name field, use current value as Name
            setSaveAsOptionName(currentValue);
        } else {
            // Reset to empty if no current value
            setSaveAsOptionName("");
            setSaveAsOptionDescription("");
        }

        setSaveAsOptionModalOpen(true);
    };

    // Handle save as option
    const handleSaveAsOption = async () => {
        if (!selectedField || !selectedField.modelConstructor) return;

        try {
            setSaveAsOptionLoading(true);

            const modelConstructor = selectedField.modelConstructor;
            const newOption = new modelConstructor();

            // Set the fields based on what's available in the model
            if (newOption.hasOwnProperty("Name")) {
                newOption.Name = saveAsOptionName;
            }
            if (newOption.hasOwnProperty("Description")) {
                newOption.Description = saveAsOptionDescription;
            }

            // Generate a unique code
            newOption.Code = `CUSTOM_${Date.now()}`;

            await (modelConstructor as any).Create(newOption);

            // Reload options
            await loadModelConstructorOptions(modelConstructor);

            // Close modal and reset form
            setSaveAsOptionModalOpen(false);
            setSaveAsOptionName("");
            setSaveAsOptionDescription("");

            JC_Utils.showToastSuccess("Option saved successfully");
        } catch (error) {
            console.error("Error saving option:", error);
            JC_Utils.showToastError("Failed to save option");
        } finally {
            setSaveAsOptionLoading(false);
        }
    };

    // Handle modelConstructor option delete confirmation
    const handleModelConstructorDeleteConfirmation = (option: any) => {
        setModelConstructorOptionToDelete(option);
        setModelConstructorDeleteConfirmationOpen(true);
    };

    // Handle confirmed modelConstructor option delete
    const handleConfirmedModelConstructorDelete = async () => {
        if (!modelConstructorOptionToDelete || !selectedField || !selectedField.modelConstructor) return;

        setModelConstructorDeleteLoading(true);
        try {
            const modelConstructor = selectedField.modelConstructor;
            const primaryKey = (modelConstructorOptionToDelete.constructor as any).primaryKey || "Code";
            const keyValue = (modelConstructorOptionToDelete as any)[primaryKey];

            await (modelConstructor as any).Delete(keyValue);

            // Reload options
            await loadModelConstructorOptions(modelConstructor);

            // Close modal
            setModelConstructorDeleteConfirmationOpen(false);
            setModelConstructorOptionToDelete(null);

            JC_Utils.showToastSuccess("Option deleted successfully");
        } catch (error) {
            console.error("Error deleting option:", error);
            JC_Utils.showToastError("Failed to delete option");
        } finally {
            setModelConstructorDeleteLoading(false);
        }
    };

    // Handle cancel modelConstructor option delete
    const handleCancelModelConstructorDelete = () => {
        // Don't allow cancel during loading
        if (modelConstructorDeleteLoading) return;

        setModelConstructorDeleteConfirmationOpen(false);
        setModelConstructorOptionToDelete(null);
    };

    // Handle tile selection
    const handleTileClick = (tileId: string) => {
        const tile = tileStructure.find(t => t.id === tileId);
        if (tile && !tile.isHeading) {
            // Don't allow interaction with read-only fields
            if (tile.field && tile.field.readOnly) {
                return;
            }

            // For Date fields, open modal instead of selecting
            if (tile.field && tile.field.type === FieldTypeEnum.Date) {
                setDateModalField(tile.field);
                setTempDateValue(tile.field.value ? new Date(tile.field.value) : new Date());
                setDateModalOpen(true);
                return;
            }

            // For non-inline editable fields, allow deselection by clicking the same tile
            if (selectedFieldId === tileId && tile.field && !isInlineEditableField(tile.field.type)) {
                setSelectedFieldId(null);
                // Clear search text when deselecting
                setOptionsSearchText("");
                return;
            }

            // For inline editable fields, select the tile but don't show field editor in right pane
            // and focus the input instead
            if (tile.field && isInlineEditableField(tile.field.type)) {
                setSelectedFieldId(tileId);
                // Focus the input field
                setTimeout(() => {
                    const inputElement = document.getElementById(`inline-input-${tileId}`) as HTMLInputElement;
                    if (inputElement) {
                        inputElement.focus();
                        inputElement.select();
                    }
                }, 0);
            } else {
                setSelectedFieldId(tileId);
                // Clear search text when selecting a new field
                setOptionsSearchText("");
            }
        }
    };

    // Get selected tile
    const selectedTile = tileStructure.find(t => t.id === selectedFieldId);
    const selectedField = selectedTile?.field;

    // Handle field value changes
    const handleFieldChange = (newValue: string) => {
        if (selectedField && selectedField.onChange) {
            selectedField.onChange(newValue);
        }
        // Trigger delayed callback
        setTimeout(triggerDelayedCallback, 0);
    };

    // Handle delayed callback for field changes
    const triggerDelayedCallback = () => {
        // Clear existing timeout
        if (changeDelayTimeoutRef.current) {
            clearTimeout(changeDelayTimeoutRef.current);
        }

        // Set new timeout
        if (model.onChangeDelayCallback) {
            changeDelayTimeoutRef.current = setTimeout(() => {
                model.onChangeDelayCallback!();
            }, 500);
        }
    };

    // Handle delayed callback for formList item changes
    const triggerFormListItemDelayedCallback = (itemIndex: number, updatedItem?: any) => {
        // Clear existing timeout
        if (changeDelayTimeoutRef.current) {
            clearTimeout(changeDelayTimeoutRef.current);
        }

        // Set new timeout for item-specific callback
        if (model.onFormListItemChangeDelayCallback) {
            changeDelayTimeoutRef.current = setTimeout(() => {
                // Call the callback with itemIndex and the updated item
                model.onFormListItemChangeDelayCallback!(itemIndex, updatedItem);
            }, 1000); // Increased delay to allow React state updates to complete
        }
    };

    // Handle field blur events
    const handleFieldBlur = (newValue: string) => {
        // Call the field's specific onBlur if it exists
        if (selectedField && selectedField.onBlur) {
            selectedField.onBlur(newValue);
        }
        // Call the global onBlurCallback if it exists
        if (model.onBlurCallback) {
            model.onBlurCallback();
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        if (!submitClicked) {
            setSubmitClicked(true);
        }

        // Check if all fields are valid
        const allFields = getAllFields();
        const allFieldsValid = allFields.every(field => field.validate == null || JC_Utils.stringNullOrEmpty(field.validate(field.value)));

        if (allFieldsValid && model.onSubmit) {
            model.onSubmit();
            setSubmitClicked(false);
        }
    };

    // Handle back button click
    const handleBackButtonClick = () => {
        if (model.backButtonCallback) {
            model.backButtonCallback();
        }
        if (model.backButtonLink) {
            // If both callback and link are provided, navigate after callback
            // If only link is provided, navigate immediately
            window.location.href = model.backButtonLink;
        }
    };

    // Handle date modal set button
    const handleDateModalSet = () => {
        if (dateModalField && dateModalField.onChange) {
            dateModalField.onChange(tempDateValue);
        }
        // Trigger delayed callback
        setTimeout(triggerDelayedCallback, 0);
        setDateModalOpen(false);
        setDateModalField(null);
    };

    // Handle date modal cancel
    const handleDateModalCancel = () => {
        setDateModalOpen(false);
        setDateModalField(null);
    };

    // Handle text field modal open
    const handleTextFieldModalOpen = (field: JC_FieldModel, columnTitle: string) => {
        setTextFieldModalField(field);
        setTextFieldModalTitle(columnTitle);
        setTempTextValue(field.value?.toString() || "");
        setTextFieldModalOpen(true);
    };

    // Handle text field modal set button
    const handleTextFieldModalSet = () => {
        if (textFieldModalField && textFieldModalField.onChange) {
            textFieldModalField.onChange(tempTextValue);
        }
        // Trigger delayed callback
        setTimeout(triggerDelayedCallback, 0);
        setTextFieldModalOpen(false);
        setTextFieldModalField(null);
    };

    // Handle text field modal cancel
    const handleTextFieldModalCancel = () => {
        setTextFieldModalOpen(false);
        setTextFieldModalField(null);
    };

    // Handle option edit modal open
    const handleOptionEditModalOpen = (option: _ModelRequirements & any, editableFields: string[]) => {
        setOptionEditModalOption(option);

        // Create JC_FieldModel objects for each editable field
        const fields: JC_FieldModel[] = editableFields.map(fieldName => {
            // Get the field type from the option's model using jcFieldTypeforField
            let fieldType = FieldTypeEnum.Text; // Default fallback

            // Try to get the field type from the option's constructor (model class)
            if (option.constructor && typeof (option.constructor as any).jcFieldTypeforField === "function") {
                const modelFieldType = (option.constructor as any).jcFieldTypeforField(fieldName);
                if (modelFieldType !== undefined) {
                    fieldType = modelFieldType;
                }
            }

            return {
                inputId: `option-edit-${fieldName}`,
                type: fieldType,
                label: fieldName,
                value: option[fieldName] || "",
                onChange: (newValue: any) => {
                    // Update the option object
                    setOptionEditModalOption((prev: any) => ({
                        ...prev,
                        [fieldName]: newValue
                    }));
                },
                onEnter: () => {
                    // Use setTimeout to ensure state updates are processed before saving
                    setTimeout(() => {
                        handleOptionEditModalSave();
                    }, 0);
                }
            };
        });

        setOptionEditModalFields(fields);
        setOptionEditModalOpen(true);
    };

    // Handle option edit modal save
    const handleOptionEditModalSave = async () => {
        if (!optionEditModalOption || !selectedFormListField) return;

        setOptionEditModalLoading(true);
        try {
            // Get the API route from the field's optionsModel or from the option's constructor
            let apiRoute = selectedFormListField.optionsModel?.apiRoute;
            let modelConstructor = selectedFormListField.optionsModel;

            // If field doesn't have optionsModel, try to get it from the option's constructor
            if (!apiRoute && optionEditModalOption.constructor) {
                const optionConstructor = optionEditModalOption.constructor as any;
                apiRoute = optionConstructor.apiRoute;
                modelConstructor = optionConstructor;
            }

            if (!apiRoute) {
                throw new Error("Could not determine API route for option update - field missing optionsModel and option missing constructor with apiRoute property");
            }

            // Update the option via API
            await JC_Post(modelConstructor!, apiRoute, optionEditModalOption);

            // Call the field-level onOptionUpdated callback if available
            if (selectedFormListField?.onOptionUpdated) {
                selectedFormListField.onOptionUpdated(optionEditModalOption);
            }

            // Close modal
            setOptionEditModalOpen(false);
            setOptionEditModalOption(null);
            setOptionEditModalFields([]);
        } catch (error) {
            console.error("Error updating option:", error);
            JC_Utils.showToastError("Failed to update option");
        } finally {
            setOptionEditModalLoading(false);
        }
    };

    // Handle option edit modal cancel
    const handleOptionEditModalCancel = () => {
        // Don't allow cancel during loading
        if (optionEditModalLoading) return;

        setOptionEditModalOpen(false);
        setOptionEditModalOption(null);
        setOptionEditModalFields([]);
    };

    // Handle option delete confirmation
    const handleOptionDeleteConfirmation = (option: any) => {
        setOptionToDelete(option);
        setOptionDeleteConfirmationOpen(true);
    };

    // Handle confirmed option delete
    const handleConfirmedOptionDelete = async () => {
        if (!optionToDelete) return;

        // Determine which field we're working with (form list field or regular field)
        const currentField = selectedFormListField || selectedField;
        if (!currentField) return;

        setOptionDeleteLoading(true);
        try {
            // Get the API route from the field's optionsModel or from the option's constructor
            let apiRoute = currentField.optionsModel?.apiRoute;
            let primaryKey = currentField.optionsModel?.primaryKey || "Code";
            let modelConstructor = currentField.optionsModel;

            // If field doesn't have optionsModel, try to get it from the option's constructor
            if (!apiRoute && optionToDelete.constructor) {
                const optionConstructor = optionToDelete.constructor as any;
                apiRoute = optionConstructor.apiRoute;
                primaryKey = optionConstructor.primaryKey || "Code";
                modelConstructor = optionConstructor;
            }

            const optionId = optionToDelete[primaryKey];

            if (!apiRoute) {
                throw new Error("Could not determine API route for option delete - field missing optionsModel and option missing constructor with apiRoute property");
            }

            if (!optionId) {
                throw new Error(`Could not determine option ID - option missing ${primaryKey} property`);
            }

            // Delete the option via API
            await JC_Delete(modelConstructor!, apiRoute, optionId);

            // Call the field-level onOptionUpdated callback if available to refresh the options list
            // For deletions, the parent component should handle removing the option from the list
            if (currentField?.onOptionUpdated) {
                currentField.onOptionUpdated(optionToDelete);
            }

            // Close modal
            setOptionDeleteConfirmationOpen(false);
            setOptionToDelete(null);

            JC_Utils.showToastSuccess("Option deleted successfully");
        } catch (error) {
            console.error("Error deleting option:", error);
            JC_Utils.showToastError("Failed to delete option");
        } finally {
            setOptionDeleteLoading(false);
        }
    };

    // Handle cancel option delete
    const handleCancelOptionDelete = () => {
        // Don't allow cancel during loading
        if (optionDeleteLoading) return;

        setOptionDeleteConfirmationOpen(false);
        setOptionToDelete(null);
    };

    // Handle manual override modal open
    const handleManualOverrideModalOpen = (item: any, itemIndex: number, fieldIndex: number, manualOverrideFields: { field: string; label: string }[], actionButton?: { label: string; callback: (item: any) => Promise<any> }) => {
        setManualOverrideModalItem(item);
        setManualOverrideModalItemIndex(itemIndex);
        setManualOverrideModalFieldIndex(fieldIndex);
        setManualOverrideModalActionButton(actionButton || null);

        // Get the current field configuration and row data to access the options
        const currentHeader = model.formList?.headers[fieldIndex];
        const currentRowFields = model.formList?.row(item);
        const currentFieldData = currentRowFields ? currentRowFields[fieldIndex] : null;

        // Create JC_FieldModel objects for each manual override field
        const fields: JC_FieldModel[] = manualOverrideFields.map(fieldConfig => {
            const fieldName = fieldConfig.field;
            const fieldLabel = fieldConfig.label;

            // Get the field type from the item's model using jcFieldTypeforField
            let fieldType = FieldTypeEnum.Text; // Default fallback

            // Try to get the field type from the item's constructor (model class)
            if (item.constructor && typeof (item.constructor as any).jcFieldTypeforField === "function") {
                try {
                    const modelFieldType = (item.constructor as any).jcFieldTypeforField(fieldName);
                    if (modelFieldType !== undefined && modelFieldType !== null) {
                        fieldType = modelFieldType;
                    }
                } catch (error) {
                    console.warn(`Failed to get field type for ${fieldName} from model:`, error);
                }
            } else {
                // Fallback: manually determine field type for known fields when constructor is lost
                if (fieldName === "DefectFindingInformationOverride" || fieldName === "InformationOverride") {
                    fieldType = FieldTypeEnum.Textarea;
                } else if (fieldName === "DefectFindingNameOverride" || fieldName === "NameOverride") {
                    fieldType = FieldTypeEnum.Text;
                }
                console.log(`Manual override fallback field type for ${fieldName}:`, fieldType);
            }

            // Determine the field value - if empty, populate with original option content
            let fieldValue = item[fieldName] || "";

            // For DefectFinding fields, only auto-populate if BOTH name and information are empty
            // For other fields, auto-populate if the field is empty
            let shouldAutoPopulate = false;
            if (fieldName === "DefectFindingNameOverride" || fieldName === "DefectFindingInformationOverride") {
                // Check if both DefectFindingNameOverride and DefectFindingInformationOverride are empty
                const nameOverride = item["DefectFindingNameOverride"] || "";
                const informationOverride = item["DefectFindingInformationOverride"] || "";
                shouldAutoPopulate = !nameOverride && !informationOverride;
            } else {
                // For other fields, auto-populate if the current field is empty
                shouldAutoPopulate = !fieldValue;
            }

            // If the field should be auto-populated, try to populate it with the original option's content
            if (shouldAutoPopulate && currentHeader && currentFieldData && currentFieldData.options) {
                try {
                    // Get the selected option codes from the dropdown field
                    const dropdownFieldKey = currentHeader.sortKey; // e.g., "DefectFindingCode" or "DefectFindingListJson"
                    const selectedValue = item[dropdownFieldKey];

                    if (selectedValue) {
                        // Handle both single dropdown (DefectFindingCode) and multi-select (DefectFindingListJson) cases
                        let selectedCodes: any[] = [];

                        // Check if it's a JSON string (multi-select) or a single value (dropdown)
                        if (typeof selectedValue === "string" && selectedValue.startsWith("[")) {
                            // Multi-select case - parse JSON
                            selectedCodes = JSON.parse(selectedValue);
                        } else if (selectedValue) {
                            // Single dropdown case - wrap in array
                            selectedCodes = [selectedValue];
                        }

                        if (selectedCodes.length > 0) {
                            // Special handling for DefectFinding fields - populate with all selected options
                            if (fieldName === "DefectFindingNameOverride" || fieldName === "DefectFindingInformationOverride") {
                                const allSelectedOptions = selectedCodes
                                    .map(selectedItem => {
                                        const selectedCode = typeof selectedItem === "object" && selectedItem !== null && selectedItem.Code ? selectedItem.Code : selectedItem;

                                        return currentFieldData.options?.find((opt: any) => {
                                            const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                            return (opt as any)[primaryKey] === selectedCode;
                                        });
                                    })
                                    .filter(Boolean); // Remove any null/undefined options

                                if (allSelectedOptions.length > 0) {
                                    if (fieldName === "DefectFindingNameOverride") {
                                        // Comma-separated names of all selected options
                                        const primaryDisplayField = (allSelectedOptions[0]?.constructor as any)?.primaryDisplayField || "Name";
                                        fieldValue = allSelectedOptions.map(opt => (opt as any)[primaryDisplayField] || "").join(", ");
                                    } else if (fieldName === "DefectFindingInformationOverride") {
                                        // " - " separated information of all selected options
                                        fieldValue = allSelectedOptions.map(opt => (opt as any)["Information"] || "").join(" - ");
                                    }
                                }
                            } else {
                                // Default behavior for other fields - use first selected option
                                const firstSelectedItem = selectedCodes[0];
                                const firstSelectedCode = typeof firstSelectedItem === "object" && firstSelectedItem !== null && firstSelectedItem.Code ? firstSelectedItem.Code : firstSelectedItem;

                                const selectedOption = currentFieldData.options.find((opt: any) => {
                                    const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                    return (opt as any)[primaryKey] === firstSelectedCode;
                                });

                                if (selectedOption) {
                                    // Map the field name to the corresponding option property
                                    if (fieldName.includes("Name")) {
                                        const primaryDisplayField = (selectedOption.constructor as any).primaryDisplayField || "Name";
                                        fieldValue = (selectedOption as any)[primaryDisplayField] || "";
                                    } else if (fieldName.includes("Information")) {
                                        fieldValue = (selectedOption as any)["Information"] || "";
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to populate field ${fieldName} with original option content:`, error);
                }
            }

            return {
                inputId: `manual-override-${fieldName}`,
                type: fieldType,
                label: fieldLabel,
                value: fieldValue,
                onChange: (newValue: any) => {
                    // Update the item object while preserving its constructor
                    setManualOverrideModalItem((prev: any) => {
                        if (prev) {
                            // Create a new instance of the same class to preserve the constructor
                            const updatedItem = Object.create(Object.getPrototypeOf(prev));
                            Object.assign(updatedItem, prev, { [fieldName]: newValue });
                            return updatedItem;
                        }
                        return prev;
                    });

                    // Also update the field value in the manualOverrideModalFields array
                    // This ensures that field.value reflects the current user input
                    setManualOverrideModalFields((prevFields: JC_FieldModel[]) => {
                        return prevFields.map(f => (f.inputId === `manual-override-${fieldName}` ? { ...f, value: newValue } : f));
                    });
                },
                onEnter: () => {
                    // Use setTimeout to ensure state updates are processed before saving
                    setTimeout(() => {
                        handleManualOverrideModalSave();
                    }, 0);
                }
            };
        });

        setManualOverrideModalFields(fields);
        setManualOverrideModalOpen(true);
    };

    // Handle manual override modal save
    const handleManualOverrideModalSave = async () => {
        if (!manualOverrideModalItem || manualOverrideModalItemIndex === -1 || manualOverrideModalFieldIndex === -1 || !model.formList) return;

        setManualOverrideModalLoading(true);
        try {
            // Get the current item from the form list
            const currentItem = model.formList.items[manualOverrideModalItemIndex];

            // Update each manual override field by creating a new object with the changes
            // This ensures React detects the state change properly
            let updatedFields: { [key: string]: any } = {};

            // For multi-select JSON fields, the data is already properly stored
            // We need to ensure the JSON field is included in the update
            const currentFieldKey = model.formList?.headers[manualOverrideModalFieldIndex]?.sortKey;
            if (manualOverrideModalItem && currentFieldKey && manualOverrideModalItem[currentFieldKey]) {
                updatedFields[currentFieldKey] = manualOverrideModalItem[currentFieldKey];
            }

            // Capture all changes from the modal item (including AI-updated fields)
            if (manualOverrideModalItem && currentItem) {
                Object.keys(manualOverrideModalItem).forEach(key => {
                    // Only include fields that have actually changed and are not undefined
                    if (manualOverrideModalItem[key] !== undefined && manualOverrideModalItem[key] !== currentItem[key]) {
                        updatedFields[key] = manualOverrideModalItem[key];
                    }
                });
            }

            // Also handle any other manual override fields for backward compatibility
            manualOverrideModalFields.forEach(field => {
                // Extract the actual field name from the inputId (format: "manual-override-{fieldName}")
                const fieldName = field.inputId.replace("manual-override-", "");
                const fieldValue = field.value;
                if (fieldValue !== undefined) {
                    updatedFields[fieldName] = fieldValue;
                }
            });

            // For multi-select JSON structures, we don't need to clear the selections
            // The override values are stored within the same field structure
            // The manual override display logic will handle showing override values when they exist

            // Add modification timestamp
            updatedFields.ModifiedAt = new Date();

            // Create a new object with the updated values (preserving constructor)
            let updatedItem = currentItem;
            if (currentItem && typeof currentItem === "object") {
                updatedItem = Object.create(Object.getPrototypeOf(currentItem));
                Object.assign(updatedItem, currentItem, updatedFields);

                // Replace the item in the form list items array
                model.formList.items[manualOverrideModalItemIndex] = updatedItem;
            }

            // Trigger the form list item change callback to save the updated item
            // Pass the updated item to the callback so parent can update its state
            triggerFormListItemDelayedCallback(manualOverrideModalItemIndex, updatedItem);

            // Force a re-render by updating the component state
            // This ensures the UI reflects the changes immediately
            setManualOverrideModalFields([...manualOverrideModalFields]);

            // Close modal
            setManualOverrideModalOpen(false);
            setManualOverrideModalItem(null);
            setManualOverrideModalItemIndex(-1);
            setManualOverrideModalFieldIndex(-1);
            setManualOverrideModalFields([]);
        } catch (error) {
            console.error("Error updating manual override fields:", error);
            JC_Utils.showToastError("Failed to update manual override fields");
        } finally {
            setManualOverrideModalLoading(false);
        }
    };

    // Handle manual override modal action button
    const handleManualOverrideModalAction = async () => {
        if (!manualOverrideModalActionButton || !manualOverrideModalItem) return;

        setManualOverrideModalActionLoading(true);
        try {
            // Call the action button callback
            const result = await manualOverrideModalActionButton.callback(manualOverrideModalItem);

            // If the callback returns an object, populate the manual fields with it
            if (result && typeof result === "object") {
                // Handle special case where AI returns DefectFindingListJson (for selecting option + overrides)
                if (result.DefectFindingListJson) {
                    // Update the DefectFindingListJson field and set DefectFindingCode to "Other"
                    setManualOverrideModalItem((prev: any) => {
                        if (prev) {
                            const updatedItem = Object.create(Object.getPrototypeOf(prev));
                            Object.assign(updatedItem, prev, {
                                DefectFindingListJson: result.DefectFindingListJson
                            });
                            return updatedItem;
                        }
                        return prev;
                    });
                }

                // Update manual override fields
                setManualOverrideModalFields(prevFields =>
                    prevFields.map(field => {
                        // Extract the actual field name from the inputId (format: "manual-override-{fieldName}")
                        const fieldName = field.inputId.replace("manual-override-", "");
                        const newValue = result[fieldName];

                        if (newValue !== undefined) {
                            // Update the field value
                            const updatedField = { ...field, value: newValue };

                            // Also update the modal item to reflect the new value
                            setManualOverrideModalItem((prev: any) => {
                                if (prev) {
                                    const updatedItem = Object.create(Object.getPrototypeOf(prev));
                                    Object.assign(updatedItem, prev, { [fieldName]: newValue });
                                    return updatedItem;
                                }
                                return prev;
                            });

                            return updatedField;
                        }
                        return field;
                    })
                );
            }
        } catch (error) {
            console.error("Error in manual override action:", error);
            JC_Utils.showToastError("Failed to execute action");
        } finally {
            setManualOverrideModalActionLoading(false);
        }
    };

    // Handle manual override modal cancel
    const handleManualOverrideModalCancel = () => {
        // Don't allow cancel during loading
        if (manualOverrideModalLoading || manualOverrideModalActionLoading) return;

        setManualOverrideModalOpen(false);
        setManualOverrideModalItem(null);
        setManualOverrideModalItemIndex(-1);
        setManualOverrideModalFieldIndex(-1);
        setManualOverrideModalFields([]);
        setManualOverrideModalActionButton(null);
        setManualOverrideModalActionLoading(false);
    };

    // Handle delete confirmation
    const handleDeleteConfirmation = (item: any) => {
        setItemToDelete(item);
        setDeleteConfirmationOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmedDelete = async () => {
        if (!itemToDelete || !model.formList?.deleteRecordCallback) return;

        setDeleteLoading(true);
        try {
            // Call the delete callback provided by the parent
            model.formList.deleteRecordCallback(itemToDelete);

            // Close the modal
            setDeleteConfirmationOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Error in delete callback:", error);
            // Don't show error here - let the parent handle it
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteConfirmationOpen(false);
        setItemToDelete(null);
    };

    // Helper function to check if model has SortOrder field
    const modelHasSortOrder = (item: any): boolean => {
        return item && typeof item.SortOrder === "number";
    };

    // Helper function to normalize sort orders using the utility function
    const normalizeSortOrders = async (items: any[]) => {
        // Store original sort orders to compare
        const originalSortOrders = items.map(item => ({ id: item.Id || item.Code, sortOrder: item.SortOrder }));

        // Organize sort orders using the utility function
        JC_Utils.organiseSortOrders(items);

        // Check which items were updated
        const itemsToUpdate: any[] = [];
        items.forEach(item => {
            const originalSortOrder = originalSortOrders.find(orig => (item.Id && orig.id === item.Id) || (item.Code && orig.id === item.Code))?.sortOrder;

            if (originalSortOrder !== item.SortOrder) {
                itemsToUpdate.push(item);
            }
        });

        // Update sort orders if needed
        if (itemsToUpdate.length > 0) {
            await updateSortOrders(itemsToUpdate);
            return true;
        }

        return false;
    };

    // Handle move confirmation
    const handleMoveConfirmation = (item: any, itemIndex: number) => {
        setItemToMove(item);
        setMoveItemIndex(itemIndex);
        setMoveMode(true);
        // Clear any selected cell when entering move mode
        setSelectedFormListCellKey("");
    };

    // Handle move up
    const handleMoveUp = async () => {
        if (!itemToMove || !model.formList || moveItemIndex <= 0) return;

        try {
            const items = model.formList.items;

            // First, ensure all items have proper sequential sort orders
            await normalizeSortOrders(items);

            const currentItem = items[moveItemIndex];
            const previousItem = items[moveItemIndex - 1];

            // Swap sort orders
            const tempSortOrder = currentItem.SortOrder;
            currentItem.SortOrder = previousItem.SortOrder;
            previousItem.SortOrder = tempSortOrder;

            // Update sort orders via API
            await updateSortOrders([currentItem, previousItem]);

            // Update move item index to reflect new position
            setMoveItemIndex(moveItemIndex - 1);

            JC_Utils.showToastSuccess("Item moved up successfully");
        } catch (error) {
            console.error("Error moving item up:", error);
            JC_Utils.showToastError("Failed to move item up");
        }
    };

    // Handle move down
    const handleMoveDown = async () => {
        if (!itemToMove || !model.formList || moveItemIndex >= model.formList.items.length - 1) return;

        try {
            const items = model.formList.items;

            // First, ensure all items have proper sequential sort orders
            await normalizeSortOrders(items);

            const currentItem = items[moveItemIndex];
            const nextItem = items[moveItemIndex + 1];

            // Swap sort orders
            const tempSortOrder = currentItem.SortOrder;
            currentItem.SortOrder = nextItem.SortOrder;
            nextItem.SortOrder = tempSortOrder;

            // Update sort orders via API
            await updateSortOrders([currentItem, nextItem]);

            // Update move item index to reflect new position
            setMoveItemIndex(moveItemIndex + 1);

            JC_Utils.showToastSuccess("Item moved down successfully");
        } catch (error) {
            console.error("Error moving item down:", error);
            JC_Utils.showToastError("Failed to move item down");
        }
    };

    // Helper function to update sort orders via API
    const updateSortOrders = async (items: any[]) => {
        if (!model.formList || items.length === 0) return;

        // Determine the API route from the model's apiRoute property
        const firstItem = items[0];
        const modelConstructor = firstItem.constructor as any;
        const apiRoute = modelConstructor.apiRoute ? `${modelConstructor.apiRoute}/updateSortOrder` : null;

        if (!apiRoute) {
            throw new Error(`Unable to determine API route - model ${modelConstructor.name} missing apiRoute property`);
        }

        // Try array format first (most endpoints support this)
        try {
            let updateData: any[] = [];

            // Check if item has Code field (option models) or Id field (other models)
            if (firstItem.Code !== undefined) {
                // Option model - use Code
                updateData = items.map(item => ({ Code: item.Code, SortOrder: item.SortOrder }));
            } else if (firstItem.Id !== undefined) {
                // Regular model - use Id
                updateData = items.map(item => ({ Id: item.Id, SortOrder: item.SortOrder }));
            } else {
                throw new Error("Unable to determine primary key for sort order update");
            }

            // Make API call with array format
            const response = await fetch(`/api/${apiRoute}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error("Failed to update sort order with array format");
            }
        } catch (error) {
            // If array format fails, try individual calls with single item format
            console.warn("Array format failed, trying individual calls:", error);

            for (const item of items) {
                let singleUpdateData: any = {};

                if (item.Code !== undefined) {
                    // Option model - use lowercase field names for single item format
                    singleUpdateData = { code: item.Code, sortOrder: item.SortOrder };
                } else if (item.Id !== undefined) {
                    // Regular model - use lowercase field names for single item format
                    singleUpdateData = { id: item.Id, sortOrder: item.SortOrder };
                }

                const response = await fetch(`/api/${apiRoute}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(singleUpdateData)
                });

                if (!response.ok) {
                    throw new Error(`Failed to update sort order for item ${item.Code || item.Id}`);
                }
            }
        }

        // Clear localStorage for the model after successful sort order update
        const tableName = modelConstructor.tableName;
        if (tableName) {
            JC_Utils.clearLocalStorageForTable(tableName, firstItem);
        }
    };

    return (
        <div ref={containerRef} className={`${styles.mainContainer} ${model.useContainerHeight ? styles.containerHeight : ""}`}>
            {/* Header */}
            {!model.hideHeader && (
                <div className={styles.header}>
                    {(model.backButtonLink || model.backButtonCallback) && (
                        <div className={styles.backButton} onClick={handleBackButtonClick}>
                            <Image src="/icons/Arrow.webp" alt="Back" width={0} height={0} className={styles.backButtonIcon} unoptimized />
                        </div>
                    )}
                    <h2 className={styles.headerLabel}>{model.headerLabel}</h2>
                </div>
            )}

            {/* Content Area */}
            {/* Content Area - Always use two-pane layout */}
            <div className={`${styles.contentArea} ${model.panesSwitched ? styles.switched : ""}`}>
                {/* Left Pane - Field Tiles or Form List */}
                <div className={`${styles.fieldsPane} ${hasFormList ? styles.formListFieldsPane : ""}`} style={hasFormList ? { width: "max-content", flex: "none", minWidth: "200px" } : model.fieldsPaneWidth ? { width: `${model.fieldsPaneWidth}px`, minWidth: `${model.fieldsPaneWidth}px`, flex: "none" } : model.inputPaneWidth ? { flex: "1" } : undefined}>
                    <div className={styles.fieldsPaneHeader}>
                        {model.fieldsPaneHeader}
                        {/* Custom Order checkbox - only show if formList and defaultSort are both provided */}
                        {model.formList && model.defaultSort && (
                            <div className={styles.customOrderCheckbox}>
                                <JC_Checkbox label="Custom Order" checked={useCustomOrder} onChange={handleCustomOrderChange} />
                            </div>
                        )}
                    </div>
                    {model.fieldsCustomNode ? (
                        // Custom Node Mode - Render custom content
                        <div style={{ display: "flex", justifyContent: "center", width: "100%", overflowY: "auto" }}>{model.fieldsCustomNode}</div>
                    ) : hasFormList ? (
                        // Form List Mode - Render table in left pane
                        <div className={styles.formListTableContainer}>
                            <table className={styles.formListTable}>
                                <thead>
                                    <tr>
                                        {model.formList!.headers.map(header => (
                                            <th key={header.sortKey} className={styles.formListHeader}>
                                                {header.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={model.formList!.headers.length} style={{ padding: 0 }}>
                                            <SwipeableList>
                                                {model
                                                    .formList!.items.sort((a, b) => {
                                                        // Use custom order (SortOrder) when checkbox is checked
                                                        if (useCustomOrder) {
                                                            // Sort by SortOrder if both items have it
                                                            if (modelHasSortOrder(a) && modelHasSortOrder(b)) {
                                                                return a.SortOrder - b.SortOrder;
                                                            }
                                                            // Items with SortOrder come first
                                                            if (modelHasSortOrder(a) && !modelHasSortOrder(b)) {
                                                                return -1;
                                                            }
                                                            if (!modelHasSortOrder(a) && modelHasSortOrder(b)) {
                                                                return 1;
                                                            }
                                                            // If neither has SortOrder, maintain original order
                                                            return 0;
                                                        } else {
                                                            // Use default sort function when checkbox is not checked
                                                            return model.defaultSort ? model.defaultSort(a, b) : 0;
                                                        }
                                                    })
                                                    .map((item, itemIndex) => {
                                                        const rowFields = model.formList!.row(item);

                                                        // Create leading actions for swipe-to-move (swipe right)
                                                        // Only show move action when Custom Order is enabled AND item has SortOrder
                                                        const leadingActions =
                                                            modelHasSortOrder(item) && useCustomOrder ? (
                                                                <LeadingActions>
                                                                    <SwipeAction destructive={false} onClick={() => handleMoveConfirmation(item, itemIndex)}>
                                                                        <div
                                                                            className={styles.moveButton}
                                                                            style={{
                                                                                backgroundColor: "#007bff",
                                                                                color: "white",
                                                                                fontWeight: "bold",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                minWidth: "80px",
                                                                                border: "none",
                                                                                borderRadius: "0",
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            Move
                                                                        </div>
                                                                    </SwipeAction>
                                                                </LeadingActions>
                                                            ) : undefined;

                                                        // Create trailing actions for swipe-to-delete
                                                        const trailingActions = model.formList!.deleteRecordCallback ? (
                                                            <TrailingActions>
                                                                <SwipeAction destructive={false} onClick={() => handleDeleteConfirmation(item)}>
                                                                    <div
                                                                        className={styles.deleteButton}
                                                                        style={{
                                                                            backgroundColor: "#be3d3d",
                                                                            color: "white",
                                                                            fontWeight: "bold",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            minWidth: "80px",
                                                                            border: "none",
                                                                            borderRadius: "0",
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </div>
                                                                </SwipeAction>
                                                            </TrailingActions>
                                                        ) : undefined;

                                                        return (
                                                            <SwipeableListItem key={itemIndex} leadingActions={leadingActions} trailingActions={trailingActions} blockSwipe={false} threshold={0.25}>
                                                                <table style={{ width: "100%", tableLayout: "fixed" }}>
                                                                    <tbody>
                                                                        <tr className={`${styles.formListRow} ${moveMode && moveItemIndex === itemIndex ? styles.selectedFormListRow : ""}`}>
                                                                            {rowFields.map((field, fieldIndex) => {
                                                                                const cellKey = `${itemIndex}-${fieldIndex}`;
                                                                                const isSelected = selectedFormListCellKey === cellKey;
                                                                                return (
                                                                                    <td
                                                                                        key={fieldIndex}
                                                                                        className={`${styles.formListCell} ${isSelected ? styles.selectedFormListCell : ""}`}
                                                                                        onClick={() => {
                                                                                            // Exit move mode when selecting a field
                                                                                            if (moveMode) {
                                                                                                setMoveMode(false);
                                                                                                setItemToMove(null);
                                                                                                setMoveItemIndex(-1);
                                                                                            }

                                                                                            setSelectedFormListCellKey(cellKey);
                                                                                            if ((field.type === FieldTypeEnum.Dropdown || field.type === FieldTypeEnum.MultiDropdown) && field.options) {
                                                                                                setSelectedFormListField(field);
                                                                                                setSelectedFormListFieldColumnIndex(fieldIndex);
                                                                                                // Clear search text when selecting a new dropdown field
                                                                                                setFormListOptionsSearchText("");
                                                                                            } else if (isTextFieldType(field.type)) {
                                                                                                const columnTitle = model.formList!.headers[fieldIndex]?.label || "Edit Field";
                                                                                                handleTextFieldModalOpen(field, columnTitle);
                                                                                            } else if (field.type === FieldTypeEnum.MultiPhoto) {
                                                                                                // Use generic photo field callback if provided
                                                                                                if (model.onPhotoFieldClick) {
                                                                                                    const photoData = model.onPhotoFieldClick(field, item);

                                                                                                    setPhotoModalFiles(photoData.files || []);
                                                                                                    setPhotoModalTitle(photoData.title);
                                                                                                    setPhotoModalGetFilesCallback(() => photoData.getFilesCallback);
                                                                                                    setPhotoModalOnFinishedCallback(() => photoData.onFinishedCallback);
                                                                                                    setPhotoModalOnSortOrderChanged(photoData.onSortOrderChanged ? () => photoData.onSortOrderChanged! : null);
                                                                                                    setPhotoModalOnImageDeleted(photoData.onImageDeleted ? () => photoData.onImageDeleted! : null);
                                                                                                    setPhotoModalOnImageUploaded(photoData.onImageUploaded ? () => photoData.onImageUploaded! : null);
                                                                                                    setPhotoModalS3KeyPath(photoData.s3KeyPath || "");
                                                                                                    setIsPhotoModalOpen(true);
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {field.type === FieldTypeEnum.Custom && field.customNode ? (
                                                                                            field.customNode
                                                                                        ) : (field.type === FieldTypeEnum.Dropdown || field.type === FieldTypeEnum.MultiDropdown) && field.options ? (
                                                                                            (() => {
                                                                                                const currentHeader = model.formList!.headers[fieldIndex];
                                                                                                const hasManualOverrideFields = currentHeader?.manualOverrideFields && currentHeader.manualOverrideFields.length > 0;

                                                                                                let displayValue: string;

                                                                                                if (field.type === FieldTypeEnum.MultiDropdown) {
                                                                                                    // Handle multi-select display
                                                                                                    let selectedItems: any[] = [];
                                                                                                    try {
                                                                                                        selectedItems = field.value ? JSON.parse(field.value as string) : [];
                                                                                                    } catch {
                                                                                                        selectedItems = [];
                                                                                                    }

                                                                                                    if (selectedItems.length === 0) {
                                                                                                        displayValue = field.manualOverrideDisplayValue || "-";
                                                                                                    } else {
                                                                                                        // Check if we have the new object structure or old code structure
                                                                                                        const hasObjectStructure = selectedItems.length > 0 && typeof selectedItems[0] === "object" && selectedItems[0] !== null && selectedItems[0].Code;

                                                                                                        if (hasObjectStructure) {
                                                                                                            // New structure with override support
                                                                                                            if (selectedItems.length === 1) {
                                                                                                                const item = selectedItems[0];
                                                                                                                // Show override name if available, otherwise show original option name
                                                                                                                if (item.NameOverride) {
                                                                                                                    displayValue = item.NameOverride;
                                                                                                                } else {
                                                                                                                    // Find original option name
                                                                                                                    const option = field.options.find((opt: any) => {
                                                                                                                        const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                                                                        return (opt as any)[primaryKey] === item.Code;
                                                                                                                    });
                                                                                                                    if (option) {
                                                                                                                        const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                                                        displayValue = (option as any)[primaryDisplayField];
                                                                                                                    } else {
                                                                                                                        displayValue = item.Code;
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                // Multiple items - always show count regardless of overrides
                                                                                                                displayValue = `${selectedItems.length} selected`;
                                                                                                            }
                                                                                                        } else {
                                                                                                            // Old structure - just codes
                                                                                                            const selectedOptions = field.options.filter((opt: any) => {
                                                                                                                const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                                                                return selectedItems.includes((opt as any)[primaryKey]);
                                                                                                            });

                                                                                                            // Check if we need to remove invalid selections
                                                                                                            const validCodes = selectedItems.filter((code: any) => {
                                                                                                                return field.options?.find((opt: any) => {
                                                                                                                    const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                                                                    return (opt as any)[primaryKey] === code;
                                                                                                                });
                                                                                                            });

                                                                                                            // Update field value if invalid selections were found
                                                                                                            if (validCodes.length !== selectedItems.length && field.onChange) {
                                                                                                                const newValue = JSON.stringify(validCodes);
                                                                                                                field.onChange(newValue);
                                                                                                            }

                                                                                                            if (selectedOptions.length === 1) {
                                                                                                                const primaryDisplayField = (selectedOptions[0].constructor as any).primaryDisplayField || "Name";
                                                                                                                displayValue = (selectedOptions[0] as any)[primaryDisplayField];
                                                                                                            } else if (selectedOptions.length > 1) {
                                                                                                                displayValue = `${selectedOptions.length} selected`;
                                                                                                            } else {
                                                                                                                displayValue = field.manualOverrideDisplayValue || "-";
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    // Handle single-select display
                                                                                                    // Check if there's a manual override value first
                                                                                                    if (field.manualOverrideDisplayValue) {
                                                                                                        displayValue = field.manualOverrideDisplayValue;
                                                                                                    } else {
                                                                                                        // Use normal option lookup
                                                                                                        const option = field.options.find(opt => {
                                                                                                            const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                                                            return (opt as any)[primaryKey] === field.value;
                                                                                                        });

                                                                                                        displayValue = option
                                                                                                            ? (() => {
                                                                                                                  const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                                                  return (option as any)[primaryDisplayField];
                                                                                                              })()
                                                                                                            : field.value || "-";
                                                                                                    }
                                                                                                }

                                                                                                return hasManualOverrideFields ? (
                                                                                                    <div className={`${styles.formListCellWithEdit}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                                                        <div
                                                                                                            className={styles.optionEditIcon}
                                                                                                            onClick={e => {
                                                                                                                e.stopPropagation();
                                                                                                                handleManualOverrideModalOpen(item, itemIndex, fieldIndex, currentHeader.manualOverrideFields!, currentHeader.manualEditActionButton);
                                                                                                            }}
                                                                                                        >
                                                                                                            <Image src="/icons/Pencil.webp" alt="Edit" width={12} height={12} unoptimized />
                                                                                                        </div>
                                                                                                        <span style={{ flex: 1 }}>{truncateText(displayValue)}</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    truncateText(displayValue)
                                                                                                );
                                                                                            })()
                                                                                        ) : field.type === FieldTypeEnum.Date ? (
                                                                                            <input
                                                                                                type="date"
                                                                                                value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                                                                                                onChange={e => {
                                                                                                    if (field.onChange) {
                                                                                                        field.onChange(new Date(e.target.value));
                                                                                                    }
                                                                                                    setTimeout(() => triggerFormListItemDelayedCallback(itemIndex), 0);
                                                                                                }}
                                                                                                onBlur={e => {
                                                                                                    if (field.onBlur) {
                                                                                                        field.onBlur(e.target.value);
                                                                                                    }
                                                                                                    if (model.onBlurCallback) {
                                                                                                        model.onBlurCallback();
                                                                                                    }
                                                                                                }}
                                                                                                className={styles.formListInput}
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            />
                                                                                        ) : field.type === FieldTypeEnum.MultiPhoto ? (
                                                                                            truncateText((field.value || "0").toString())
                                                                                        ) : isTextFieldType(field.type) ? (
                                                                                            truncateText((field.value || field.placeholder || "-").toString())
                                                                                        ) : (
                                                                                            <input
                                                                                                type={field.type === FieldTypeEnum.Email ? "email" : field.type === FieldTypeEnum.Number ? "number" : field.type === FieldTypeEnum.Password ? "password" : "text"}
                                                                                                value={field.value || ""}
                                                                                                placeholder={field.placeholder || "-"}
                                                                                                readOnly={field.readOnly}
                                                                                                onChange={e => {
                                                                                                    if (field.onChange) {
                                                                                                        field.onChange(e.target.value);
                                                                                                    }
                                                                                                    setTimeout(() => triggerFormListItemDelayedCallback(itemIndex), 0);
                                                                                                }}
                                                                                                onBlur={e => {
                                                                                                    if (field.onBlur) {
                                                                                                        field.onBlur(e.target.value);
                                                                                                    }
                                                                                                    if (model.onBlurCallback) {
                                                                                                        model.onBlurCallback();
                                                                                                    }
                                                                                                }}
                                                                                                className={styles.formListInput}
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            />
                                                                                        )}
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </SwipeableListItem>
                                                        );
                                                    })}
                                            </SwipeableList>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // Regular Sections Mode - Render field tiles
                        <div className={styles.tileContainer}>
                            {tileStructure.map(tile => (
                                <div key={tile.id} data-tile-id={tile.id} className={`${styles.tile} ${tile.isHeading ? styles.headingTile : `${styles.fieldTile} ${selectedFieldId === tile.id ? styles.selectedTile : ""} ${tile.field && fieldHasError(tile.field) ? styles.errorTile : ""} ${tile.field && tile.field.readOnly ? styles.readOnlyTile : ""}`}`} onClick={tile.field && tile.field.readOnly ? undefined : () => handleTileClick(tile.id)}>
                                    {tile.isHeading ? (
                                        tile.label
                                    ) : (
                                        <>
                                            <div className={styles.fieldLabel}>{tile.label}</div>
                                            {tile.field && isInlineEditableField(tile.field.type) ? (
                                                <input
                                                    id={`inline-input-${tile.id}`}
                                                    type={tile.field.type === FieldTypeEnum.Email ? "email" : tile.field.type === FieldTypeEnum.Number ? "number" : tile.field.type === FieldTypeEnum.Password ? "password" : "text"}
                                                    value={tile.field?.value || ""}
                                                    readOnly={tile.field?.readOnly}
                                                    onChange={e => {
                                                        if (tile.field?.onChange && !tile.field?.readOnly) {
                                                            tile.field.onChange(e.target.value);
                                                        }
                                                        // Trigger delayed callback
                                                        setTimeout(triggerDelayedCallback, 0);
                                                    }}
                                                    onBlur={e => {
                                                        // Call the field's specific onBlur if it exists
                                                        if (tile.field?.onBlur && !tile.field?.readOnly) {
                                                            tile.field.onBlur(e.target.value);
                                                        }
                                                        // Call the global onBlurCallback if it exists
                                                        if (model.onBlurCallback) {
                                                            model.onBlurCallback();
                                                        }
                                                    }}
                                                    onClick={e => {
                                                        if (!tile.field?.readOnly) {
                                                            e.stopPropagation();
                                                            // Only select all text if the field wasn't already selected
                                                            const wasAlreadySelected = selectedFieldId === tile.id;
                                                            setSelectedFieldId(tile.id);
                                                            const target = e.target as HTMLInputElement;
                                                            target.focus();
                                                            if (!wasAlreadySelected) {
                                                                target.select();
                                                            }
                                                        }
                                                    }}
                                                    className={`${styles.fieldValueInput} ${tile.field?.readOnly ? styles.readOnlyInput : ""}`}
                                                    placeholder="-"
                                                />
                                            ) : (
                                                <div className={`${styles.fieldValue} ${selectedFieldId === tile.id && tile.field && !isInlineEditableField(tile.field.type) ? styles.selectedFieldValue : ""}`}>
                                                    {tile.field?.type === FieldTypeEnum.Dropdown && tile.field?.options && tile.field?.value
                                                        ? (() => {
                                                              const option = tile.field.options.find(option => {
                                                                  const primaryKey = (option.constructor as any).primaryKey || "Code";
                                                                  return (option as any)[primaryKey] === tile.field?.value;
                                                              });
                                                              if (option) {
                                                                  const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                  return (option as any)[primaryDisplayField];
                                                              }
                                                              return tile.field.value as string;
                                                          })()
                                                        : tile.field?.type === FieldTypeEnum.MultiDropdown && tile.field?.options
                                                          ? (() => {
                                                                // For MultiDropdown, look for the corresponding extended field (List<...> field)
                                                                const extendedFieldKey = `Ex_${tile.field.inputId.charAt(0).toUpperCase() + tile.field.inputId.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}CodesList`;

                                                                // Try to find the extended field value in the tile's data
                                                                let selectedCodes: string[] = [];

                                                                // Check if we have access to the extended field through the tile
                                                                if ((tile as any)[extendedFieldKey]) {
                                                                    selectedCodes = (tile as any)[extendedFieldKey];
                                                                } else if (tile.field.value) {
                                                                    // Fallback: parse the JSON value
                                                                    try {
                                                                        const parsedValue = JSON.parse(tile.field.value as string);
                                                                        if (Array.isArray(parsedValue)) {
                                                                            // Handle both old format (codes) and new format (objects)
                                                                            selectedCodes = parsedValue.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                                                                        } else {
                                                                            selectedCodes = [];
                                                                        }
                                                                    } catch {
                                                                        selectedCodes = [];
                                                                    }
                                                                }

                                                                if (selectedCodes.length === 0) {
                                                                    return "-";
                                                                } else if (selectedCodes.length <= 3) {
                                                                    // Show names for 3 or fewer selections
                                                                    // Filter out invalid selections and update field value if needed
                                                                    const validCodes: string[] = [];
                                                                    const selectedOptions = selectedCodes
                                                                        .map(code => {
                                                                            const option = tile.field!.options!.find(opt => {
                                                                                const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                                return (opt as any)[primaryKey] === code;
                                                                            });
                                                                            if (option) {
                                                                                validCodes.push(code);
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField];
                                                                            }
                                                                            return null; // Invalid selection
                                                                        })
                                                                        .filter(Boolean); // Remove null values

                                                                    // Update field value if invalid selections were found
                                                                    if (validCodes.length !== selectedCodes.length && tile.field!.onChange) {
                                                                        const newValue = JSON.stringify(validCodes);
                                                                        tile.field!.onChange(newValue);
                                                                    }

                                                                    return selectedOptions.join(", ");
                                                                } else {
                                                                    // Show count for more than 3 selections
                                                                    // Filter out invalid selections and update field value if needed
                                                                    const validCodes = selectedCodes.filter(code => {
                                                                        return tile.field!.options!.find(opt => {
                                                                            const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                            return (opt as any)[primaryKey] === code;
                                                                        });
                                                                    });

                                                                    // Update field value if invalid selections were found
                                                                    if (validCodes.length !== selectedCodes.length && tile.field!.onChange) {
                                                                        const newValue = JSON.stringify(validCodes);
                                                                        tile.field!.onChange(newValue);
                                                                    }

                                                                    return `${validCodes.length} selections`;
                                                                }
                                                            })()
                                                          : tile.field?.type === FieldTypeEnum.Date && tile.field?.value
                                                            ? JC_Utils_Dates.formatDateFull(new Date(tile.field.value))
                                                            : tile.field?.displayValue || (tile.field?.value as string) || "-"}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Pane - Field Editor */}
                <div
                    className={`${styles.inputPane} ${hasFormList ? styles.formListInputPane : ""}`}
                    style={
                        hasFormList
                            ? (() => {
                                  // Check if selected column has wideOptionsColumn flag and make inputPane wider
                                  const isWideOptionsColumnSelected = selectedFormListFieldColumnIndex !== null && model.formList?.headers[selectedFormListFieldColumnIndex]?.wideOptionsColumn === true;
                                  return isWideOptionsColumnSelected ? { flexGrow: "1", minWidth: "500px" } : { flexGrow: "1", maxWidth: "200px" };
                              })()
                            : model.inputPaneWidth
                              ? { width: `${model.inputPaneWidth}px`, flex: "none" }
                              : model.fieldsPaneWidth
                                ? { flex: "1" }
                                : undefined
                    }
                >
                    <div className={styles.inputPaneHeader}>
                        <div className={styles.inputPaneHeaderText}>{hasFormList ? (selectedFormListField && (selectedFormListField.type === FieldTypeEnum.Dropdown || selectedFormListField.type === FieldTypeEnum.MultiDropdown) && selectedFormListFieldColumnIndex !== null ? model.formList!.headers[selectedFormListFieldColumnIndex]?.label || "-" : model.noSelectionHeaderOverride || "-") : selectedField && !isInlineEditableField(selectedField.type) ? (selectedField as any).headingLabel || selectedField.label || selectedField.inputId : model.noSelectionHeaderOverride || "-"}</div>
                        {/* Add New Option Button */}
                        {((hasFormList && selectedFormListField && (selectedFormListField.type === FieldTypeEnum.Dropdown || selectedFormListField.type === FieldTypeEnum.MultiDropdown) && selectedFormListField.addNewOptionCallback) || (!hasFormList && selectedField && (selectedField.type === FieldTypeEnum.Dropdown || selectedField.type === FieldTypeEnum.MultiDropdown) && selectedField.addNewOptionCallback)) && (
                            <button
                                className={styles.addNewOptionButton}
                                onClick={() => {
                                    if (hasFormList && selectedFormListField?.addNewOptionCallback) {
                                        selectedFormListField.addNewOptionCallback();
                                    } else if (!hasFormList && selectedField?.addNewOptionCallback) {
                                        selectedField.addNewOptionCallback();
                                    }
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>
                    {hasFormList ? (
                        // Form List Mode - Show move controls if in move mode, otherwise show dropdown options if a dropdown field is selected
                        moveMode && itemToMove ? (
                            <div className={styles.fieldEditor}>
                                <div className={styles.moveControlsContainer}>
                                    <JC_Button text="Up" onClick={handleMoveUp} isDisabled={moveItemIndex <= 0} overrideClass={styles.moveUpButton} />
                                    <JC_Button text="Down" onClick={handleMoveDown} isDisabled={moveItemIndex >= (model.formList?.items.length || 0) - 1} overrideClass={styles.moveDownButton} />
                                </div>
                            </div>
                        ) : selectedFormListField && (selectedFormListField.type === FieldTypeEnum.Dropdown || selectedFormListField.type === FieldTypeEnum.MultiDropdown) && selectedFormListField.options ? (
                            <div className={styles.fieldEditor}>
                                {/* Search Bar */}
                                <div className={styles.optionsSearchContainer}>
                                    {(() => {
                                        // Get current header to determine search fields and placeholder
                                        const currentHeader = selectedFormListFieldColumnIndex !== null ? model.formList!.headers[selectedFormListFieldColumnIndex] : null;
                                        const searchFields = currentHeader?.optionsEditableFields && currentHeader.optionsEditableFields.length === 2 ? currentHeader.optionsEditableFields : undefined;
                                        const placeholder = searchFields ? `Filter by ${searchFields.join(" or ")}` : "Filter by Name";

                                        return <JC_Field inputId="formlist-options-search" type={FieldTypeEnum.Text} placeholder={placeholder} value={formListOptionsSearchText} onChange={newValue => setFormListOptionsSearchText(newValue as string)} overrideClass={styles.optionsSearchField} inputOverrideClass={styles.optionsSearchInput} />;
                                    })()}
                                </div>
                                {/* Options List */}
                                <div className={styles.optionsList}>
                                    <SwipeableList>
                                        {(() => {
                                            // Get current header to determine search fields
                                            const currentHeader = selectedFormListFieldColumnIndex !== null ? model.formList!.headers[selectedFormListFieldColumnIndex] : null;
                                            const searchFields = currentHeader?.optionsEditableFields && currentHeader.optionsEditableFields.length === 2 ? currentHeader.optionsEditableFields : undefined;

                                            return filterOptions(selectedFormListField.options, formListOptionsSearchText, searchFields).map(option => {
                                                // Check if this column has editable fields
                                                const hasEditableFields = currentHeader?.optionsEditableFields && currentHeader.optionsEditableFields.length > 0;

                                                const primaryKey = (option.constructor as any).primaryKey || "Code";
                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                const keyValue = (option as any)[primaryKey];
                                                const displayValue = (option as any)[primaryDisplayField];

                                                const isSelected =
                                                    selectedFormListField.type === FieldTypeEnum.MultiDropdown
                                                        ? (() => {
                                                              try {
                                                                  const selectedItems = selectedFormListField.value ? JSON.parse(selectedFormListField.value as string) : [];
                                                                  if (Array.isArray(selectedItems)) {
                                                                      // Handle both old format (codes) and new format (objects)
                                                                      return selectedItems.some(item => {
                                                                          if (typeof item === "object" && item !== null && item.Code) {
                                                                              return item.Code === keyValue;
                                                                          } else {
                                                                              return item === keyValue;
                                                                          }
                                                                      });
                                                                  }
                                                                  return false;
                                                              } catch {
                                                                  return false;
                                                              }
                                                          })()
                                                        : selectedFormListField.value === keyValue;

                                                // Check if DefectFinding manual overrides exist and should disable options
                                                const isDefectFindingField = currentHeader?.sortKey === "DefectFindingListJson";
                                                const currentItemIndex = selectedFormListCellKey ? parseInt(selectedFormListCellKey.split("-")[0]) : null;
                                                const currentItem = currentItemIndex !== null && model.formList ? model.formList.items[currentItemIndex] : null;
                                                const hasDefectFindingOverrides = isDefectFindingField && currentItem && ((currentItem as any).DefectFindingNameOverride || (currentItem as any).DefectFindingInformationOverride);

                                                // Create trailing actions for swipe-to-delete (for all option selection fields)
                                                const trailingActions = (
                                                    <TrailingActions>
                                                        <SwipeAction destructive={false} onClick={() => handleOptionDeleteConfirmation(option)}>
                                                            <div
                                                                className={styles.deleteButton}
                                                                style={{
                                                                    backgroundColor: "#be3d3d",
                                                                    color: "white",
                                                                    fontWeight: "bold",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    minWidth: "80px",
                                                                    border: "none",
                                                                    borderRadius: "0",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                Delete
                                                            </div>
                                                        </SwipeAction>
                                                    </TrailingActions>
                                                );

                                                return (
                                                    <SwipeableListItem key={keyValue} trailingActions={trailingActions} blockSwipe={false} threshold={0.25}>
                                                        <div
                                                            className={`${styles.optionTile} ${isSelected ? styles.selectedOption : ""} ${hasEditableFields ? styles.optionTileWithEdit : ""} ${selectedFormListField.type === FieldTypeEnum.MultiDropdown ? styles.multiSelectOption : ""} ${hasDefectFindingOverrides ? styles.disabledOption : ""}`}
                                                            onClick={() => {
                                                                // Check if options should be disabled due to manual overrides
                                                                if (hasDefectFindingOverrides) {
                                                                    JC_Utils.showToastError("You must clear the Manual Override first!");
                                                                    return;
                                                                }
                                                                if (selectedFormListField.onChange) {
                                                                    if (selectedFormListField.type === FieldTypeEnum.MultiDropdown) {
                                                                        // Handle multi-select - extract codes and let onChange handler create proper object structure
                                                                        let currentSelectionCodes: string[] = [];
                                                                        try {
                                                                            const currentSelection = selectedFormListField.value ? JSON.parse(selectedFormListField.value as string) : [];
                                                                            if (Array.isArray(currentSelection)) {
                                                                                // Extract codes from both old format (codes) and new format (objects)
                                                                                currentSelectionCodes = currentSelection.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                                                                            }
                                                                        } catch {
                                                                            currentSelectionCodes = [];
                                                                        }

                                                                        // Toggle selection with simple codes
                                                                        const existingIndex = currentSelectionCodes.indexOf(keyValue);
                                                                        if (existingIndex > -1) {
                                                                            // Remove existing selection
                                                                            currentSelectionCodes.splice(existingIndex, 1);
                                                                        } else {
                                                                            // Add new selection
                                                                            currentSelectionCodes.push(keyValue);
                                                                        }

                                                                        // Pass simple codes array to onChange handler - it will create the proper object structure
                                                                        const newValue = JSON.stringify(currentSelectionCodes);
                                                                        selectedFormListField.onChange(newValue);

                                                                        // Update the selectedFormListField value to reflect the new selection
                                                                        setSelectedFormListField(prev =>
                                                                            prev
                                                                                ? {
                                                                                      ...prev,
                                                                                      value: newValue,
                                                                                      type: prev.type // Explicitly preserve the type
                                                                                  }
                                                                                : null
                                                                        );
                                                                    } else {
                                                                        // Handle single-select (existing logic)
                                                                        selectedFormListField.onChange(keyValue);
                                                                        // Update the selectedFormListField value to reflect the new selection
                                                                        // Preserve all original field properties, especially the type
                                                                        setSelectedFormListField(prev =>
                                                                            prev
                                                                                ? {
                                                                                      ...prev,
                                                                                      value: keyValue,
                                                                                      type: prev.type // Explicitly preserve the type
                                                                                  }
                                                                                : null
                                                                        );
                                                                    }
                                                                }
                                                                // Get the current item from the selected cell key
                                                                if (selectedFormListCellKey && model.formList) {
                                                                    const itemIndex = parseInt(selectedFormListCellKey.split("-")[0]);
                                                                    if (itemIndex < model.formList.items.length) {
                                                                        setTimeout(() => triggerFormListItemDelayedCallback(itemIndex), 0);
                                                                    }
                                                                }
                                                                // Keep the field selected - don't clear selection
                                                            }}
                                                        >
                                                            {hasEditableFields && (
                                                                <div
                                                                    className={styles.optionEditIcon}
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        handleOptionEditModalOpen(option, currentHeader.optionsEditableFields!);
                                                                    }}
                                                                >
                                                                    <Image src="/icons/Pencil.webp" alt="Edit" width={12} height={12} unoptimized />
                                                                </div>
                                                            )}
                                                            <div className={styles.optionTileContent}>
                                                                {currentHeader?.optionsEditableFields && currentHeader.optionsEditableFields.length === 2 ? (
                                                                    // Two-line display: first field bold, second field normal
                                                                    <div className={styles.twoLineOptionContent}>
                                                                        <div className={styles.primaryLine}>{(option as any)[currentHeader.optionsEditableFields[0]] || "-"}</div>
                                                                        <div className={styles.secondaryLine}>{(option as any)[currentHeader.optionsEditableFields[1]] || "-"}</div>
                                                                    </div>
                                                                ) : (
                                                                    // Single line display (existing behavior)
                                                                    displayValue
                                                                )}
                                                            </div>
                                                        </div>
                                                    </SwipeableListItem>
                                                );
                                            });
                                        })()}
                                    </SwipeableList>
                                </div>
                            </div>
                        ) : model.noSelectionViewOverride ? (
                            model.noSelectionViewOverride
                        ) : (
                            <div className={styles.emptyState}></div>
                        )
                    ) : selectedField && !isInlineEditableField(selectedField.type) ? (
                        <div className={styles.fieldEditor}>
                            {selectedField.type === FieldTypeEnum.Custom && selectedField.customNode ? (
                                <div className={styles.customNodeContainer}>{selectedField.customNode}</div>
                            ) : selectedField.type === FieldTypeEnum.Photo ? (
                                <JC_PhotoUpload
                                    fileId={selectedField.value as string}
                                    onImageUploaded={(fileId: string, _fileName: string) => {
                                        handleFieldChange(fileId);
                                    }}
                                    s3KeyPath={selectedField.s3KeyPath}
                                />
                            ) : (selectedField.type === FieldTypeEnum.Dropdown || selectedField.type === FieldTypeEnum.MultiDropdown) && selectedField.options ? (
                                <>
                                    {/* Search Bar */}
                                    <div className={styles.optionsSearchContainer}>
                                        <JC_Field inputId="options-search" type={FieldTypeEnum.Text} placeholder="Filter by Name" value={optionsSearchText} onChange={newValue => setOptionsSearchText(newValue as string)} overrideClass={styles.optionsSearchField} inputOverrideClass={styles.optionsSearchInput} />
                                    </div>
                                    {/* Options List */}
                                    <div className={styles.optionsList}>
                                        <SwipeableList>
                                            {filterOptions(selectedField.options, optionsSearchText).map(option => {
                                                const primaryKey = (option.constructor as any).primaryKey || "Code";
                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                const keyValue = (option as any)[primaryKey];
                                                const displayValue = (option as any)[primaryDisplayField];

                                                const isSelected =
                                                    selectedField.type === FieldTypeEnum.MultiDropdown
                                                        ? (() => {
                                                              try {
                                                                  const selectedItems = selectedField.value ? JSON.parse(selectedField.value as string) : [];
                                                                  if (Array.isArray(selectedItems)) {
                                                                      // Handle both old format (codes) and new format (objects)
                                                                      return selectedItems.some(item => {
                                                                          if (typeof item === "object" && item !== null && item.Code) {
                                                                              return item.Code === keyValue;
                                                                          } else {
                                                                              return item === keyValue;
                                                                          }
                                                                      });
                                                                  }
                                                                  return false;
                                                              } catch {
                                                                  return false;
                                                              }
                                                          })()
                                                        : selectedField.value === keyValue;

                                                // Create trailing actions for swipe-to-delete (for all regular field options)
                                                const trailingActions = (
                                                    <TrailingActions>
                                                        <SwipeAction destructive={false} onClick={() => handleOptionDeleteConfirmation(option)}>
                                                            <div
                                                                className={styles.deleteButton}
                                                                style={{
                                                                    backgroundColor: "#be3d3d",
                                                                    color: "white",
                                                                    fontWeight: "bold",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    minWidth: "80px",
                                                                    border: "none",
                                                                    borderRadius: "0",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                Delete
                                                            </div>
                                                        </SwipeAction>
                                                    </TrailingActions>
                                                );

                                                return (
                                                    <SwipeableListItem key={keyValue} trailingActions={trailingActions} blockSwipe={false} threshold={0.25}>
                                                        <div
                                                            className={`${styles.optionTile} ${isSelected ? styles.selectedOption : ""} ${selectedField.type === FieldTypeEnum.MultiDropdown ? styles.multiSelectOption : ""}`}
                                                            onClick={() => {
                                                                if (selectedField.type === FieldTypeEnum.MultiDropdown) {
                                                                    // Handle multi-select - work with simple codes, let onChange handler convert to objects if needed
                                                                    let currentSelection: string[] = [];
                                                                    try {
                                                                        const parsedValue = selectedField.value ? JSON.parse(selectedField.value as string) : [];
                                                                        if (Array.isArray(parsedValue)) {
                                                                            // Extract codes from both old format (codes) and new format (objects)
                                                                            currentSelection = parsedValue.map(item => (typeof item === "object" && item !== null && item.Code ? item.Code : item));
                                                                        }
                                                                    } catch {
                                                                        currentSelection = [];
                                                                    }

                                                                    // Toggle selection
                                                                    const index = currentSelection.indexOf(keyValue);
                                                                    if (index > -1) {
                                                                        currentSelection.splice(index, 1);
                                                                    } else {
                                                                        currentSelection.push(keyValue);
                                                                    }

                                                                    const newValue = JSON.stringify(currentSelection);
                                                                    handleFieldChange(newValue);
                                                                } else {
                                                                    // Handle single select
                                                                    handleFieldChange(keyValue);
                                                                }
                                                            }}
                                                        >
                                                            {displayValue}
                                                        </div>
                                                    </SwipeableListItem>
                                                );
                                            })}
                                        </SwipeableList>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <JC_Field inputId={selectedField.inputId} type={selectedField.type} label="" value={selectedField.value || ""} placeholder={selectedField.placeholder} readOnly={selectedField.readOnly} onChange={handleFieldChange} onBlur={handleFieldBlur} onEnter={selectedField.onEnter} onEscape={selectedField.onEscape} validate={selectedField.validate} required={selectedField.required} overrideClass={[FieldTypeEnum.Text, FieldTypeEnum.Textarea].includes(selectedField.type) ? styles.textFieldOverride : undefined} inputOverrideClass={[FieldTypeEnum.Text, FieldTypeEnum.Textarea].includes(selectedField.type) ? styles.textFieldInputOverride : undefined} />

                                    {/* ModelConstructor functionality */}
                                    {selectedField.modelConstructor && (
                                        <div className={styles.modelConstructorContainer}>
                                            {/* Save as Option Button */}
                                            <div className={styles.saveAsOptionContainer}>
                                                <JC_Button text="Save as Option" onClick={handleOpenSaveAsOptionModal} overrideClass={styles.saveAsOptionButton} />
                                            </div>

                                            {/* Options List */}
                                            <div className={styles.modelConstructorOptions}>
                                                {modelConstructorLoading ? (
                                                    <div className={styles.loadingContainer}>Loading options...</div>
                                                ) : (
                                                    <SwipeableList>
                                                        {modelConstructorOptions.map(option => {
                                                            const primaryKey = (option.constructor as any).primaryKey || "Code";
                                                            const keyValue = (option as any)[primaryKey];
                                                            const hasName = (option as any).Name;
                                                            const hasDescription = (option as any).Description;

                                                            // Create trailing actions for swipe-to-delete
                                                            const trailingActions = (
                                                                <TrailingActions>
                                                                    <SwipeAction destructive={false} onClick={() => handleModelConstructorDeleteConfirmation(option)}>
                                                                        <div
                                                                            className={styles.deleteButton}
                                                                            style={{
                                                                                backgroundColor: "#be3d3d",
                                                                                color: "white",
                                                                                fontWeight: "bold",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                minWidth: "80px",
                                                                                border: "none",
                                                                                borderRadius: "0",
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </div>
                                                                    </SwipeAction>
                                                                </TrailingActions>
                                                            );

                                                            return (
                                                                <SwipeableListItem key={keyValue} trailingActions={trailingActions} blockSwipe={false} threshold={0.25}>
                                                                    <div className={styles.modelConstructorOption} onClick={() => handleModelOptionSelect(option)}>
                                                                        <div className={styles.optionText}>
                                                                            {hasName && hasDescription ? (
                                                                                <div className={styles.twoLineOptionContent}>
                                                                                    <div className={styles.primaryLine}>{hasName}</div>
                                                                                    <div className={styles.secondaryLine}>{hasDescription}</div>
                                                                                </div>
                                                                            ) : (
                                                                                hasName || hasDescription || "-"
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </SwipeableListItem>
                                                            );
                                                        })}
                                                    </SwipeableList>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : model.customNode ? (
                        model.customNode
                    ) : model.noSelectionViewOverride ? (
                        model.noSelectionViewOverride
                    ) : (
                        <div className={styles.emptyState}>Select a field to edit</div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {(model.showSaveButton !== false || model.additionalFooterButtons) && (
                <div className={styles.footer}>
                    {/* Left Container - Additional Footer Buttons */}
                    <div className={styles.leftFooterContainer}>{model.additionalFooterButtons && model.additionalFooterButtons.map((button, index) => <JC_Button key={index} text={button.text} onClick={button.onClick} isLoading={button.isLoading || false} />)}</div>

                    {/* Right Container - Error Message and Submit Button */}
                    <div className={styles.rightFooterContainer}>
                        {/* Error Message */}
                        {submitClicked && !JC_Utils.stringNullOrEmpty(getFirstValidationError()) && <div className={styles.errorMessage}>{getFirstValidationError()}</div>}

                        {/* Submit Button */}
                        {model.showSaveButton !== false && <JC_Button text={model.submitButtonText || "Save"} onClick={handleSubmit} isLoading={model.isLoading || false} />}
                    </div>
                </div>
            )}

            {/* Date Modal */}
            <JC_Modal isOpen={dateModalOpen} onCancel={handleDateModalCancel} title="Select Date">
                <div className={styles.dateModalContent}>
                    <JC_DatePicker inputId="date-modal-picker" theDate={tempDateValue} onChange={(newDate: Date) => setTempDateValue(newDate)} calendarOnly={true} />
                    <div className={styles.dateModalButtons}>
                        <JC_Button text="Set" onClick={handleDateModalSet} />
                    </div>
                </div>
            </JC_Modal>

            {/* Text Field Modal */}
            <JC_Modal isOpen={textFieldModalOpen} onCancel={handleTextFieldModalCancel} title={textFieldModalTitle}>
                <div className={styles.textFieldModalContent}>
                    {textFieldModalField && <JC_Field inputId="text-field-modal-input" type={textFieldModalField.type} label="" value={tempTextValue} placeholder={textFieldModalField.placeholder} readOnly={textFieldModalField.readOnly} onChange={(newValue: any) => setTempTextValue(newValue)} validate={textFieldModalField.validate} required={textFieldModalField.required} autoFocus={true} />}
                    <div className={styles.textFieldModalButtons}>
                        <JC_Button text="Set" onClick={handleTextFieldModalSet} />
                    </div>
                </div>
            </JC_Modal>

            {/* Photo Modal */}
            <JC_ModalPhotos isOpen={isPhotoModalOpen} onCancel={() => setIsPhotoModalOpen(false)} title={photoModalTitle} files={photoModalFiles} getFilesCallback={photoModalGetFilesCallback || (() => Promise.resolve([]))} onFinishedCallback={photoModalOnFinishedCallback || (() => Promise.resolve())} onSortOrderChanged={photoModalOnSortOrderChanged || undefined} onImageDeleted={photoModalOnImageDeleted || undefined} onImageUploaded={photoModalOnImageUploaded || undefined} s3KeyPath={photoModalS3KeyPath} />

            {/* Option Edit Modal */}
            <JC_Modal isOpen={optionEditModalOpen} onCancel={handleOptionEditModalCancel} title="Edit Option">
                <div className={styles.optionEditModalContent}>
                    {optionEditModalFields.map((field, index) => (
                        <JC_Field key={field.inputId} inputId={field.inputId} type={field.type} label={field.label} value={field.value} placeholder={field.placeholder} readOnly={field.readOnly} onChange={field.onChange} onEnter={field.onEnter} validate={field.validate} required={field.required} autoFocus={index === 0} />
                    ))}
                    <div className={styles.optionEditModalButtons}>
                        <JC_Button text="Save" onClick={handleOptionEditModalSave} isLoading={optionEditModalLoading} />
                    </div>
                </div>
            </JC_Modal>

            {/* Manual Override Modal */}
            <JC_Modal isOpen={manualOverrideModalOpen} onCancel={handleManualOverrideModalCancel} title="Manual Override">
                <div className={styles.optionEditModalContent}>
                    <div className={styles.optionEditModalScrollableContent}>
                        {(() => {
                            // Check if this is a multi-select field with selected options
                            const currentField = model.formList?.headers[manualOverrideModalFieldIndex];
                            const isMultiSelect = currentField && model.formList?.items[manualOverrideModalItemIndex] && model.formList.items[manualOverrideModalItemIndex][currentField.sortKey]?.includes("[");

                            if (isMultiSelect && manualOverrideModalItem) {
                                // Get the selected options for multi-select field
                                const fieldValue = manualOverrideModalItem[currentField.sortKey];
                                let selectedCodes: string[] = [];
                                try {
                                    selectedCodes = fieldValue ? JSON.parse(fieldValue) : [];
                                } catch {
                                    selectedCodes = [];
                                }

                                if (selectedCodes.length > 0) {
                                    // Find the corresponding field in the form list to get options
                                    const formListField = model.formList?.items[manualOverrideModalItemIndex] && model.formList.row(model.formList.items[manualOverrideModalItemIndex])[manualOverrideModalFieldIndex];

                                    // Special handling for DefectFinding fields - show single Name and Information fields
                                    const isDefectFindingField = manualOverrideModalFields.some(field => field.inputId.includes("DefectFindingNameOverride") || field.inputId.includes("DefectFindingInformationOverride"));

                                    if (isDefectFindingField) {
                                        // For DefectFinding fields, show single Name and Information fields (not per option)
                                        return manualOverrideModalFields.map(field => <JC_Field key={field.inputId} inputId={field.inputId} type={field.type} label={field.label} value={field.value} placeholder={field.placeholder} readOnly={field.readOnly} onChange={field.onChange} onEnter={field.onEnter} validate={field.validate} required={field.required} inputOverrideClass={field.inputId.includes("DefectFindingInformationOverride") ? styles.informationTextareaOverride : field.inputId.includes("DefectFindingNameOverride") ? styles.nameFieldOverride : undefined} />);
                                    }

                                    // For other multi-select fields, show Name and Information fields for each selected option
                                    return (
                                        <div className={styles.manualOverrideMultiSelectContainer}>
                                            {selectedCodes.map((item, index) => {
                                                // Handle both old format (just codes) and new format (objects with Code, NameOverride, InformationOverride)
                                                const code = typeof item === "object" && item !== null ? (item as any).Code : item;
                                                const currentOverrides = typeof item === "object" && item !== null ? (item as any) : { Code: item, NameOverride: null, InformationOverride: null };

                                                // Find the original option name
                                                let originalOptionName = code; // fallback to code if option not found
                                                if (formListField && formListField.options) {
                                                    const option = formListField.options.find((opt: any) => {
                                                        const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                        return (opt as any)[primaryKey] === code;
                                                    });
                                                    if (option) {
                                                        const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                        originalOptionName = (option as any)[primaryDisplayField] || code;
                                                    }
                                                }

                                                return (
                                                    <div key={code} className={styles.optionGroup}>
                                                        <div className={styles.optionHeader}>
                                                            Option {index + 1} (Originally &quot;{originalOptionName}&quot;)
                                                        </div>
                                                        <div className={styles.optionFields}>
                                                            {manualOverrideModalFields.map(field => {
                                                                // Create a unique field ID for this option
                                                                const uniqueFieldId = `${field.inputId}-option-${index}`;

                                                                // Get the current value for this specific option and field
                                                                const currentValue = (() => {
                                                                    // Extract the actual field name from the inputId (format: "manual-override-{fieldName}")
                                                                    const fieldName = field.inputId.replace("manual-override-", "");

                                                                    // Check if we have override values in the current item structure
                                                                    if (fieldName === "DefectFindingNameOverride" && currentOverrides.NameOverride) {
                                                                        return currentOverrides.NameOverride;
                                                                    } else if (fieldName === "DefectFindingInformationOverride" && currentOverrides.InformationOverride) {
                                                                        return currentOverrides.InformationOverride;
                                                                    } else if (fieldName === "BuildingNameOverride" && currentOverrides.NameOverride) {
                                                                        return currentOverrides.NameOverride;
                                                                    } else if (fieldName === "AreaNameOverride" && currentOverrides.NameOverride) {
                                                                        return currentOverrides.NameOverride;
                                                                    } else if (fieldName === "LocationNameOverride" && currentOverrides.NameOverride) {
                                                                        return currentOverrides.NameOverride;
                                                                    } else if (fieldName === "SeverityNameOverride" && currentOverrides.NameOverride) {
                                                                        return currentOverrides.NameOverride;
                                                                    }

                                                                    // If no override value exists, populate with original option data
                                                                    if (formListField && formListField.options) {
                                                                        const option = formListField.options.find((opt: any) => {
                                                                            const primaryKey = (opt.constructor as any).primaryKey || "Code";
                                                                            return (opt as any)[primaryKey] === code;
                                                                        });

                                                                        if (option) {
                                                                            // Map field names to option properties
                                                                            if (fieldName === "DefectFindingNameOverride") {
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField] || "";
                                                                            } else if (fieldName === "DefectFindingInformationOverride") {
                                                                                return (option as any).Information || "";
                                                                            } else if (fieldName === "BuildingNameOverride") {
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField] || "";
                                                                            } else if (fieldName === "AreaNameOverride") {
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField] || "";
                                                                            } else if (fieldName === "LocationNameOverride") {
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField] || "";
                                                                            } else if (fieldName === "SeverityNameOverride") {
                                                                                const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
                                                                                return (option as any)[primaryDisplayField] || "";
                                                                            }
                                                                        }
                                                                    }

                                                                    return "";
                                                                })();

                                                                return (
                                                                    <div key={uniqueFieldId} className={styles.fieldContainer}>
                                                                        <JC_Field
                                                                            inputId={uniqueFieldId}
                                                                            type={field.type}
                                                                            label={field.label}
                                                                            value={currentValue}
                                                                            placeholder={field.placeholder}
                                                                            readOnly={field.readOnly}
                                                                            inputOverrideClass={field.inputId.includes("DefectFindingInformationOverride") ? styles.informationTextareaOverride : field.inputId.includes("DefectFindingNameOverride") ? styles.nameFieldOverride : undefined}
                                                                            onChange={newValue => {
                                                                                // Update the multi-select JSON structure with the new override value
                                                                                setManualOverrideModalItem((prev: any) => {
                                                                                    const currentFieldKey = currentField?.sortKey;
                                                                                    if (prev && currentFieldKey && prev[currentFieldKey]) {
                                                                                        try {
                                                                                            const currentList = JSON.parse(prev[currentFieldKey]);
                                                                                            if (Array.isArray(currentList) && currentList[index]) {
                                                                                                const updatedList = [...currentList];
                                                                                                const fieldName = field.inputId.replace("manual-override-", "");

                                                                                                // Ensure the item is an object with the appropriate structure
                                                                                                if (typeof updatedList[index] === "string") {
                                                                                                    // Initialize based on field type
                                                                                                    if (currentFieldKey === "DefectFindingListJson") {
                                                                                                        updatedList[index] = {
                                                                                                            Code: updatedList[index],
                                                                                                            NameOverride: null,
                                                                                                            InformationOverride: null
                                                                                                        };
                                                                                                    } else if (currentFieldKey === "BuildingListJson" || currentFieldKey === "AreaListJson" || currentFieldKey === "LocationListJson" || currentFieldKey === "SeverityListJson") {
                                                                                                        updatedList[index] = {
                                                                                                            Code: updatedList[index],
                                                                                                            NameOverride: null
                                                                                                        };
                                                                                                    }
                                                                                                }

                                                                                                // Update the appropriate override field
                                                                                                if (fieldName === "DefectFindingNameOverride") {
                                                                                                    updatedList[index].NameOverride = newValue || null;
                                                                                                } else if (fieldName === "DefectFindingInformationOverride") {
                                                                                                    updatedList[index].InformationOverride = newValue || null;
                                                                                                } else if (fieldName === "BuildingNameOverride") {
                                                                                                    updatedList[index].NameOverride = newValue || null;
                                                                                                } else if (fieldName === "AreaNameOverride") {
                                                                                                    updatedList[index].NameOverride = newValue || null;
                                                                                                } else if (fieldName === "LocationNameOverride") {
                                                                                                    updatedList[index].NameOverride = newValue || null;
                                                                                                } else if (fieldName === "SeverityNameOverride") {
                                                                                                    updatedList[index].NameOverride = newValue || null;
                                                                                                }

                                                                                                // Create a new instance of the same class to preserve the constructor
                                                                                                const updatedItem = Object.create(Object.getPrototypeOf(prev));
                                                                                                Object.assign(updatedItem, prev, {
                                                                                                    [currentFieldKey]: JSON.stringify(updatedList)
                                                                                                });
                                                                                                return updatedItem;
                                                                                            }
                                                                                        } catch (error) {
                                                                                            console.error(`Error updating ${currentFieldKey}:`, error);
                                                                                        }
                                                                                    }
                                                                                    return prev;
                                                                                });
                                                                            }}
                                                                            onEnter={field.onEnter}
                                                                            validate={field.validate}
                                                                            required={field.required}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                }
                            }

                            // Default behavior for single-select or when no options are selected
                            return manualOverrideModalFields.map(field => <JC_Field key={field.inputId} inputId={field.inputId} type={field.type} label={field.label} value={field.value} placeholder={field.placeholder} readOnly={field.readOnly} onChange={field.onChange} onEnter={field.onEnter} validate={field.validate} required={field.required} inputOverrideClass={field.inputId.includes("DefectFindingInformationOverride") ? styles.informationTextareaOverride : field.inputId.includes("DefectFindingNameOverride") ? styles.nameFieldOverride : undefined} />);
                        })()}
                    </div>
                    <div className={styles.optionEditModalButtons}>
                        {manualOverrideModalActionButton && <JC_Button text={manualOverrideModalActionButton.label} onClick={handleManualOverrideModalAction} isLoading={manualOverrideModalActionLoading} />}
                        <JC_Button text="Save" onClick={handleManualOverrideModalSave} isLoading={manualOverrideModalLoading} />
                    </div>
                </div>
            </JC_Modal>

            {/* Option Delete Confirmation Modal */}
            <JC_ModalConfirmation
                title="Delete Option"
                text={optionToDelete ? `Are you sure you want to delete the option "${(optionToDelete as any)[(optionToDelete.constructor as any).primaryDisplayField || "Name"] || "Unknown"}"?` : "Are you sure you want to delete this option?"}
                isOpen={optionDeleteConfirmationOpen}
                onCancel={handleCancelOptionDelete}
                submitButtons={[
                    {
                        text: "Delete",
                        onSubmit: handleConfirmedOptionDelete
                    }
                ]}
                isLoading={optionDeleteLoading}
            />

            {/* Delete Confirmation Modal */}
            {model.formList?.deleteRecordCallback && (
                <JC_ModalConfirmation
                    title={model.formList.deleteConfirmationTitle || "Delete Record"}
                    text={model.formList.deleteConfirmationText && itemToDelete ? model.formList.deleteConfirmationText(itemToDelete) : "Are you sure you want to delete this record?"}
                    isOpen={deleteConfirmationOpen}
                    onCancel={handleCancelDelete}
                    submitButtons={[
                        {
                            text: "Delete",
                            onSubmit: handleConfirmedDelete
                        }
                    ]}
                    isLoading={deleteLoading}
                />
            )}

            {/* Save as Option Modal */}
            <JC_Modal
                isOpen={saveAsOptionModalOpen}
                onCancel={() => {
                    setSaveAsOptionModalOpen(false);
                    setSaveAsOptionName("");
                    setSaveAsOptionDescription("");
                }}
                title="Save as Option"
            >
                <div className={styles.saveAsOptionModalContent}>
                    {selectedField?.modelConstructor && new selectedField.modelConstructor().hasOwnProperty("Name") && <JC_Field inputId="save-as-option-name" type={FieldTypeEnum.Text} label="Name" value={saveAsOptionName} onChange={newValue => setSaveAsOptionName(newValue as string)} required={true} autoFocus={true} />}
                    {selectedField?.modelConstructor && new selectedField.modelConstructor().hasOwnProperty("Description") && <JC_Field inputId="save-as-option-description" type={FieldTypeEnum.Textarea} label="Description" value={saveAsOptionDescription} onChange={newValue => setSaveAsOptionDescription(newValue as string)} />}
                    <div className={styles.saveAsOptionModalButtons}>
                        <JC_Button text="Save" onClick={handleSaveAsOption} isLoading={saveAsOptionLoading} />
                    </div>
                </div>
            </JC_Modal>

            {/* Confirm Selection Modal */}
            <JC_ModalConfirmation
                isOpen={confirmSelectionModalOpen}
                onCancel={() => {
                    setConfirmSelectionModalOpen(false);
                    setSelectedModelOption(null);
                }}
                title="Confirm Selection"
                text="Would you like to set the value to this selection?"
                submitButtons={[
                    {
                        text: "Yes",
                        onSubmit: handleConfirmSelection
                    }
                ]}
            />

            {/* ModelConstructor Option Delete Confirmation Modal */}
            <JC_ModalConfirmation
                title="Delete Option"
                text={modelConstructorOptionToDelete ? `Are you sure you want to delete the option "${(modelConstructorOptionToDelete as any).Name || (modelConstructorOptionToDelete as any).Description || "Unknown"}"?` : "Are you sure you want to delete this option?"}
                isOpen={modelConstructorDeleteConfirmationOpen}
                onCancel={handleCancelModelConstructorDelete}
                submitButtons={[
                    {
                        text: "Delete",
                        onSubmit: handleConfirmedModelConstructorDelete
                    }
                ]}
                isLoading={modelConstructorDeleteLoading}
            />
        </div>
    );
}
