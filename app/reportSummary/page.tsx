"use client";

import { JC_Utils, JC_Utils_Dates } from "../Utils";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_FormTablet, { JC_FormTabletModel } from "../components/JC_FormTablet/JC_FormTablet";
import JC_Modal from "../components/JC_Modal/JC_Modal";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { CustomerModel } from "../models/Customer";
import { O_AreasInspectedModel } from "../models/O_AreasInspected";
import { O_FurtherInspectionsModel } from "../models/O_FurtherInspections";
import { O_InaccessibleAreasModel } from "../models/O_InaccessibleAreas";
import { O_ObstructionsModel } from "../models/O_Obstructions";
import { O_OverallConditionModel } from "../models/O_OverallCondition";
import { O_RiskOfUndetectedDefectsModel } from "../models/O_RiskOfUndetectedDefects";
import { O_SummaryModel } from "../models/O_Summary";
import styles from "./page.module.scss";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ReportSummaryPage() {
    const router = useRouter();
    const session = useSession();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [noCustomerSelected, setNoCustomerSelected] = useState<boolean>(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerModel>(new CustomerModel({ UserId: session.data?.user.Id }));
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Dropdown options
    const [overallConditionOptions, setOverallConditionOptions] = useState<O_OverallConditionModel[]>([]);
    const [furtherInspectionsOptions, setFurtherInspectionsOptions] = useState<O_FurtherInspectionsModel[]>([]);
    const [obstructionsOptions, setObstructionsOptions] = useState<O_ObstructionsModel[]>([]);
    const [inaccessibleAreasOptions, setInaccessibleAreasOptions] = useState<O_InaccessibleAreasModel[]>([]);
    const [areasInspectedOptions, setAreasInspectedOptions] = useState<O_AreasInspectedModel[]>([]);
    const [riskOfUndetectedDefectsOptions, setRiskOfUndetectedDefectsOptions] = useState<O_RiskOfUndetectedDefectsModel[]>([]);

    // Add new option modal states
    const [addOverallConditionModalOpen, setAddOverallConditionModalOpen] = useState(false);
    const [addFurtherInspectionsModalOpen, setAddFurtherInspectionsModalOpen] = useState(false);
    const [addObstructionsModalOpen, setAddObstructionsModalOpen] = useState(false);
    const [addInaccessibleAreasModalOpen, setAddInaccessibleAreasModalOpen] = useState(false);
    const [addAreasInspectedModalOpen, setAddAreasInspectedModalOpen] = useState(false);
    const [addRiskOfUndetectedDefectsModalOpen, setAddRiskOfUndetectedDefectsModalOpen] = useState(false);

    // Add new option loading states
    const [addOverallConditionModalLoading, setAddOverallConditionModalLoading] = useState(false);
    const [addFurtherInspectionsModalLoading, setAddFurtherInspectionsModalLoading] = useState(false);
    const [addObstructionsModalLoading, setAddObstructionsModalLoading] = useState(false);
    const [addInaccessibleAreasModalLoading, setAddInaccessibleAreasModalLoading] = useState(false);
    const [addAreasInspectedModalLoading, setAddAreasInspectedModalLoading] = useState(false);
    const [addRiskOfUndetectedDefectsModalLoading, setAddRiskOfUndetectedDefectsModalLoading] = useState(false);

    // Add new option name states
    const [newOverallConditionName, setNewOverallConditionName] = useState("");
    const [newFurtherInspectionsName, setNewFurtherInspectionsName] = useState("");
    const [newObstructionsName, setNewObstructionsName] = useState("");
    const [newInaccessibleAreasName, setNewInaccessibleAreasName] = useState("");
    const [newAreasInspectedName, setNewAreasInspectedName] = useState("");
    const [newRiskOfUndetectedDefectsName, setNewRiskOfUndetectedDefectsName] = useState("");

    // Load data using optimized single SQL call
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            if (selectedCustomerId) {
                try {
                    // Use the optimized method that gets customer data and all options in one SQL call
                    const summaryData = await CustomerModel.GetSummaryData(selectedCustomerId);

                    // Set customer data
                    setCurrentCustomer(new CustomerModel(summaryData));
                    setCustomerId(selectedCustomerId);

                    // Set all option data from the single query
                    setOverallConditionOptions(summaryData.OverallConditionOptions || []);
                    setFurtherInspectionsOptions(summaryData.FurtherInspectionsOptions || []);
                    setObstructionsOptions(summaryData.ObstructionsOptions || []);
                    setInaccessibleAreasOptions(summaryData.InaccessibleAreasOptions || []);
                    setAreasInspectedOptions(summaryData.AreasInspectedOptions || []);
                    setRiskOfUndetectedDefectsOptions(summaryData.RiskOfUndetectedDefectsOptions || []);
                } catch (error) {
                    console.error("Error loading summary data:", error);
                    // Customer doesn't exist or access denied, clear localStorage
                    localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                    setNoCustomerSelected(true);
                }
            } else {
                // No customer selected
                setNoCustomerSelected(true);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            // Clear localStorage if there's an error
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
            setNoCustomerSelected(true);
        } finally {
            setIsLoading(false);
            setInitialised(true);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle Customers button click
    const handleCustomersClick = () => {
        router.push("/customer");
    };

    // Update customer field
    const updateCustomerField = (field: keyof CustomerModel, value: any) => {
        setCurrentCustomer(prev => {
            const updatedCustomer = new CustomerModel({
                ...prev,
                [field]: value,
                ModifiedAt: new Date()
            });
            return updatedCustomer;
        });
    };

    // Handle field blur - save customer to database
    const handleFieldBlur = async () => {
        setCurrentCustomer(currentCustomerState => {
            if (!currentCustomerState || !currentCustomerState.Id) return currentCustomerState;

            // Save to database with current state
            (async () => {
                try {
                    await CustomerModel.Update(currentCustomerState);
                } catch (error) {
                    console.error("Error saving customer:", error);
                    JC_Utils.showToastError("Failed to save customer changes");
                }
            })();

            return currentCustomerState;
        });
    };

    // Handle option updated callbacks - refresh options list after updates/deletions
    const handleOverallConditionOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_OverallConditionModel.GetList();
            setOverallConditionOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing overall condition options:", error);
        }
    };

    const handleFurtherInspectionsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_FurtherInspectionsModel.GetList();
            setFurtherInspectionsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing further inspections options:", error);
        }
    };

    const handleObstructionsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_ObstructionsModel.GetList();
            setObstructionsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing obstructions options:", error);
        }
    };

    const handleInaccessibleAreasOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_InaccessibleAreasModel.GetList();
            setInaccessibleAreasOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing inaccessible areas options:", error);
        }
    };

    const handleAreasInspectedOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_AreasInspectedModel.GetList();
            setAreasInspectedOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing areas inspected options:", error);
        }
    };

    const handleRiskOfUndetectedDefectsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_RiskOfUndetectedDefectsModel.GetList();
            setRiskOfUndetectedDefectsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing risk of undetected defects options:", error);
        }
    };

    // Add new option callback functions
    const handleAddNewOverallConditionCallback = () => {
        setNewOverallConditionName("");
        setAddOverallConditionModalOpen(true);
    };

    const handleAddNewFurtherInspectionsCallback = () => {
        setNewFurtherInspectionsName("");
        setAddFurtherInspectionsModalOpen(true);
    };

    const handleAddNewObstructionsCallback = () => {
        setNewObstructionsName("");
        setAddObstructionsModalOpen(true);
    };

    const handleAddNewInaccessibleAreasCallback = () => {
        setNewInaccessibleAreasName("");
        setAddInaccessibleAreasModalOpen(true);
    };

    const handleAddNewAreasInspectedCallback = () => {
        setNewAreasInspectedName("");
        setAddAreasInspectedModalOpen(true);
    };

    const handleAddNewRiskOfUndetectedDefectsCallback = () => {
        setNewRiskOfUndetectedDefectsName("");
        setAddRiskOfUndetectedDefectsModalOpen(true);
    };

    // Modal cancel handlers
    const handleAddOverallConditionModalCancel = () => {
        setAddOverallConditionModalOpen(false);
        setNewOverallConditionName("");
    };

    const handleAddFurtherInspectionsModalCancel = () => {
        setAddFurtherInspectionsModalOpen(false);
        setNewFurtherInspectionsName("");
    };

    const handleAddObstructionsModalCancel = () => {
        setAddObstructionsModalOpen(false);
        setNewObstructionsName("");
    };

    const handleAddInaccessibleAreasModalCancel = () => {
        setAddInaccessibleAreasModalOpen(false);
        setNewInaccessibleAreasName("");
    };

    const handleAddAreasInspectedModalCancel = () => {
        setAddAreasInspectedModalOpen(false);
        setNewAreasInspectedName("");
    };

    const handleAddRiskOfUndetectedDefectsModalCancel = () => {
        setAddRiskOfUndetectedDefectsModalOpen(false);
        setNewRiskOfUndetectedDefectsName("");
    };

    // Modal save handlers
    const handleAddOverallConditionModalSave = async () => {
        if (!newOverallConditionName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddOverallConditionModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = overallConditionOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_OverallConditionModel({
                Code: JC_Utils.generateGuid(),
                Name: newOverallConditionName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_OverallConditionModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...overallConditionOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setOverallConditionOptions(updatedOptions);

            // Close modal and show success message
            setAddOverallConditionModalOpen(false);
            setNewOverallConditionName("");
            JC_Utils.showToastSuccess("Overall Condition added successfully");
        } catch (error) {
            console.error("Error adding new overall condition:", error);
            JC_Utils.showToastError("Failed to add new overall condition");
        } finally {
            setAddOverallConditionModalLoading(false);
        }
    };

    const handleAddFurtherInspectionsModalSave = async () => {
        if (!newFurtherInspectionsName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddFurtherInspectionsModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = furtherInspectionsOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_FurtherInspectionsModel({
                Code: JC_Utils.generateGuid(),
                Name: newFurtherInspectionsName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_FurtherInspectionsModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...furtherInspectionsOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setFurtherInspectionsOptions(updatedOptions);

            // Close modal and show success message
            setAddFurtherInspectionsModalOpen(false);
            setNewFurtherInspectionsName("");
            JC_Utils.showToastSuccess("Further Inspections added successfully");
        } catch (error) {
            console.error("Error adding new further inspections:", error);
            JC_Utils.showToastError("Failed to add new further inspections");
        } finally {
            setAddFurtherInspectionsModalLoading(false);
        }
    };

    const handleAddObstructionsModalSave = async () => {
        if (!newObstructionsName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddObstructionsModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = obstructionsOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_ObstructionsModel({
                Code: JC_Utils.generateGuid(),
                Name: newObstructionsName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_ObstructionsModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...obstructionsOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setObstructionsOptions(updatedOptions);

            // Close modal and show success message
            setAddObstructionsModalOpen(false);
            setNewObstructionsName("");
            JC_Utils.showToastSuccess("Obstructions added successfully");
        } catch (error) {
            console.error("Error adding new obstructions:", error);
            JC_Utils.showToastError("Failed to add new obstructions");
        } finally {
            setAddObstructionsModalLoading(false);
        }
    };

    const handleAddInaccessibleAreasModalSave = async () => {
        if (!newInaccessibleAreasName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddInaccessibleAreasModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = inaccessibleAreasOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_InaccessibleAreasModel({
                Code: JC_Utils.generateGuid(),
                Name: newInaccessibleAreasName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_InaccessibleAreasModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...inaccessibleAreasOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setInaccessibleAreasOptions(updatedOptions);

            // Close modal and show success message
            setAddInaccessibleAreasModalOpen(false);
            setNewInaccessibleAreasName("");
            JC_Utils.showToastSuccess("Inaccessible Areas added successfully");
        } catch (error) {
            console.error("Error adding new inaccessible areas:", error);
            JC_Utils.showToastError("Failed to add new inaccessible areas");
        } finally {
            setAddInaccessibleAreasModalLoading(false);
        }
    };

    const handleAddAreasInspectedModalSave = async () => {
        if (!newAreasInspectedName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddAreasInspectedModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = areasInspectedOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_AreasInspectedModel({
                Code: JC_Utils.generateGuid(),
                Name: newAreasInspectedName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_AreasInspectedModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...areasInspectedOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setAreasInspectedOptions(updatedOptions);

            // Close modal and show success message
            setAddAreasInspectedModalOpen(false);
            setNewAreasInspectedName("");
            JC_Utils.showToastSuccess("Areas Inspected added successfully");
        } catch (error) {
            console.error("Error adding new areas inspected:", error);
            JC_Utils.showToastError("Failed to add new areas inspected");
        } finally {
            setAddAreasInspectedModalLoading(false);
        }
    };

    const handleAddRiskOfUndetectedDefectsModalSave = async () => {
        if (!newRiskOfUndetectedDefectsName.trim()) {
            JC_Utils.showToastError("Please enter a name");
            return;
        }

        setAddRiskOfUndetectedDefectsModalLoading(true);
        try {
            // Calculate next sort order
            const maxSortOrder = riskOfUndetectedDefectsOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new option
            const newOption = new O_RiskOfUndetectedDefectsModel({
                Code: JC_Utils.generateGuid(),
                Name: newRiskOfUndetectedDefectsName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_RiskOfUndetectedDefectsModel.Create(newOption);

            // Add to front-end list
            const updatedOptions = [...riskOfUndetectedDefectsOptions, newOption];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setRiskOfUndetectedDefectsOptions(updatedOptions);

            // Close modal and show success message
            setAddRiskOfUndetectedDefectsModalOpen(false);
            setNewRiskOfUndetectedDefectsName("");
            JC_Utils.showToastSuccess("Risk of Undetected Defects added successfully");
        } catch (error) {
            console.error("Error adding new risk of undetected defects:", error);
            JC_Utils.showToastError("Failed to add new risk of undetected defects");
        } finally {
            setAddRiskOfUndetectedDefectsModalLoading(false);
        }
    };

    // Create the form tablet model
    const formTabletModel: JC_FormTabletModel = {
        headerLabel: JC_Utils.formatPageHeaderTitle(currentCustomer.Address, "Report Summary"),
        fieldsPaneHeader: "Report Summary",
        panesSwitched: false,
        inputPaneWidth: 600,
        onBlurCallback: handleFieldBlur,
        onChangeDelayCallback: handleFieldBlur,
        sections: customerId
            ? [
                  {
                      Heading: "Main Image",
                      Fields: [
                          {
                              inputId: "mainImage",
                              type: FieldTypeEnum.Photo,
                              label: "Main Image",
                              value: currentCustomer.MainImageFileId || "",
                              displayValue: currentCustomer.ModifiedAt ? JC_Utils_Dates.formatDateFull(new Date(currentCustomer.ModifiedAt)) : "-",
                              onChange: newValue => updateCustomerField("MainImageFileId", newValue),
                              selectedByDefault: true,
                              s3KeyPath: `Inspection Report/${currentCustomer.ClientName}/MainImage`
                          }
                      ]
                  },
                  {
                      Heading: "Inspection Summary",
                      Fields: [
                          {
                              inputId: "summary",
                              type: FieldTypeEnum.Textarea,
                              label: "Summary",
                              value: currentCustomer.Summary || "",
                              onChange: newValue => updateCustomerField("Summary", newValue),
                              modelConstructor: O_SummaryModel
                          },
                          {
                              inputId: "specialConditions",
                              type: FieldTypeEnum.Textarea,
                              label: "Special Conditions",
                              value: currentCustomer.SpecialConditions || "",
                              onChange: newValue => updateCustomerField("SpecialConditions", newValue)
                          },
                          {
                              inputId: "overallCondition",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Overall Condition",
                              value: currentCustomer.OverallConditionListJson || "[]",
                              optionsModel: O_OverallConditionModel,
                              options: overallConditionOptions,
                              onChange: newValue => updateCustomerField("OverallConditionListJson", newValue),
                              onOptionUpdated: handleOverallConditionOptionUpdated,
                              addNewOptionCallback: handleAddNewOverallConditionCallback
                          },
                          {
                              inputId: "furtherInspections",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Further Inspections",
                              value: currentCustomer.FutherInspectionsListJson || "",
                              optionsModel: O_FurtherInspectionsModel,
                              options: furtherInspectionsOptions,
                              onChange: newValue => updateCustomerField("FutherInspectionsListJson", newValue),
                              onOptionUpdated: handleFurtherInspectionsOptionUpdated,
                              addNewOptionCallback: handleAddNewFurtherInspectionsCallback
                          }
                      ]
                  },
                  {
                      Heading: "Inspection Constraints",
                      Fields: [
                          {
                              inputId: "obstructions",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Obstructions",
                              value: currentCustomer.ObstructionsListJson || "",
                              optionsModel: O_ObstructionsModel,
                              options: obstructionsOptions,
                              onChange: newValue => updateCustomerField("ObstructionsListJson", newValue),
                              onOptionUpdated: handleObstructionsOptionUpdated,
                              addNewOptionCallback: handleAddNewObstructionsCallback
                          },
                          {
                              inputId: "inaccessibleAreas",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Inaccessible Areas",
                              value: currentCustomer.InaccessibleAreasListJson || "",
                              optionsModel: O_InaccessibleAreasModel,
                              options: inaccessibleAreasOptions,
                              onChange: newValue => updateCustomerField("InaccessibleAreasListJson", newValue),
                              onOptionUpdated: handleInaccessibleAreasOptionUpdated,
                              addNewOptionCallback: handleAddNewInaccessibleAreasCallback
                          },
                          {
                              inputId: "areasInspected",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Areas Inspected",
                              value: currentCustomer.AreasInspectedListJson || "",
                              optionsModel: O_AreasInspectedModel,
                              options: areasInspectedOptions,
                              onChange: newValue => updateCustomerField("AreasInspectedListJson", newValue),
                              onOptionUpdated: handleAreasInspectedOptionUpdated,
                              addNewOptionCallback: handleAddNewAreasInspectedCallback
                          },
                          {
                              inputId: "riskOfUndetectedDefects",
                              type: FieldTypeEnum.MultiDropdown,
                              label: "Risk of Undetected Defects",
                              value: currentCustomer.RiskOfUndetectedDefectsListJson || "[]",
                              optionsModel: O_RiskOfUndetectedDefectsModel,
                              options: riskOfUndetectedDefectsOptions,
                              onChange: newValue => updateCustomerField("RiskOfUndetectedDefectsListJson", newValue),
                              onOptionUpdated: handleRiskOfUndetectedDefectsOptionUpdated,
                              addNewOptionCallback: handleAddNewRiskOfUndetectedDefectsCallback
                          }
                      ]
                  }
              ]
            : [
                  {
                      Heading: "Select a Customer...",
                      Fields: []
                  }
              ],
        isLoading: isLoading,
        showSaveButton: false
    };

    // - RENDER - //
    if (!initialised) {
        return <JC_Spinner isPageBody />;
    }

    if (noCustomerSelected) {
        return (
            <div className={styles.noCustomerContainer}>
                <JC_Title title="Select a Customer" />
                <JC_Button text="Customers" onClick={handleCustomersClick} />
            </div>
        );
    }

    return (
        <>
            <JC_FormTablet model={formTabletModel} />

            {/* Add New Overall Condition Modal */}
            <JC_Modal title="Add New Overall Condition" isOpen={addOverallConditionModalOpen} onCancel={handleAddOverallConditionModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Overall Condition"
                        onSubmit={handleAddOverallConditionModalSave}
                        onCancel={handleAddOverallConditionModalCancel}
                        isLoading={addOverallConditionModalLoading}
                        fields={[
                            {
                                inputId: "new-overall-condition-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newOverallConditionName,
                                placeholder: "Enter overall condition name",
                                onChange: (value: string) => setNewOverallConditionName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : "")
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Further Inspections Modal */}
            <JC_Modal title="Add New Further Inspections" isOpen={addFurtherInspectionsModalOpen} onCancel={handleAddFurtherInspectionsModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Further Inspections"
                        onSubmit={handleAddFurtherInspectionsModalSave}
                        onCancel={handleAddFurtherInspectionsModalCancel}
                        isLoading={addFurtherInspectionsModalLoading}
                        fields={[
                            {
                                inputId: "new-further-inspections-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newFurtherInspectionsName,
                                placeholder: "Enter further inspections name",
                                onChange: (value: string) => setNewFurtherInspectionsName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Obstructions Modal */}
            <JC_Modal title="Add New Obstructions" isOpen={addObstructionsModalOpen} onCancel={handleAddObstructionsModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Obstructions"
                        onSubmit={handleAddObstructionsModalSave}
                        onCancel={handleAddObstructionsModalCancel}
                        isLoading={addObstructionsModalLoading}
                        fields={[
                            {
                                inputId: "new-obstructions-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newObstructionsName,
                                placeholder: "Enter obstructions name",
                                onChange: (value: string) => setNewObstructionsName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : "")
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Inaccessible Areas Modal */}
            <JC_Modal title="Add New Inaccessible Areas" isOpen={addInaccessibleAreasModalOpen} onCancel={handleAddInaccessibleAreasModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Inaccessible Areas"
                        onSubmit={handleAddInaccessibleAreasModalSave}
                        onCancel={handleAddInaccessibleAreasModalCancel}
                        isLoading={addInaccessibleAreasModalLoading}
                        fields={[
                            {
                                inputId: "new-inaccessible-areas-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newInaccessibleAreasName,
                                placeholder: "Enter inaccessible areas name",
                                onChange: (value: string) => setNewInaccessibleAreasName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : "")
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Areas Inspected Modal */}
            <JC_Modal title="Add New Areas Inspected" isOpen={addAreasInspectedModalOpen} onCancel={handleAddAreasInspectedModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Areas Inspected"
                        onSubmit={handleAddAreasInspectedModalSave}
                        onCancel={handleAddAreasInspectedModalCancel}
                        isLoading={addAreasInspectedModalLoading}
                        fields={[
                            {
                                inputId: "new-areas-inspected-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newAreasInspectedName,
                                placeholder: "Enter areas inspected name",
                                onChange: (value: string) => setNewAreasInspectedName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : "")
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Risk of Undetected Defects Modal */}
            <JC_Modal title="Add New Risk of Undetected Defects" isOpen={addRiskOfUndetectedDefectsModalOpen} onCancel={handleAddRiskOfUndetectedDefectsModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Risk of Undetected Defects"
                        onSubmit={handleAddRiskOfUndetectedDefectsModalSave}
                        onCancel={handleAddRiskOfUndetectedDefectsModalCancel}
                        isLoading={addRiskOfUndetectedDefectsModalLoading}
                        fields={[
                            {
                                inputId: "new-risk-of-undetected-defects-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newRiskOfUndetectedDefectsName,
                                placeholder: "Enter risk of undetected defects name",
                                onChange: (value: string) => setNewRiskOfUndetectedDefectsName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : "")
                            }
                        ]}
                    />
                </div>
            </JC_Modal>
        </>
    );
}
