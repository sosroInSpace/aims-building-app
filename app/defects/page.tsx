"use client";

import { JC_Utils, JC_Utils_Defects } from "../Utils";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_FormTablet, { JC_FormListModel, JC_FormTabletModel } from "../components/JC_FormTablet/JC_FormTablet";
import { JC_ListHeader } from "../components/JC_List/JC_ListHeader";
import JC_Modal from "../components/JC_Modal/JC_Modal";
import JC_ModalConfirmation from "../components/JC_ModalConfirmation/JC_ModalConfirmation";
import { JC_ModalPhotosModel } from "../components/JC_ModalPhotos/JC_ModalPhotos";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { JC_FieldModel } from "../models/ComponentModels/JC_Field";
import { CustomerModel } from "../models/Customer";
import { CustomerDefectModel } from "../models/CustomerDefect";
import { DefectImageModel } from "../models/DefectImage";
import { O_AreaModel } from "../models/O_Area";
import { O_BuildingModel } from "../models/O_Building";
import { O_DefectFindingModel } from "../models/O_DefectFinding";
import { O_LocationModel } from "../models/O_Location";
import { O_SeverityModel } from "../models/O_Severity";
import { _ModelRequirements } from "../models/_ModelRequirements";
import styles from "./page.module.scss";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function DefectsPage() {
    const router = useRouter();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [noCustomerSelected, setNoCustomerSelected] = useState<boolean>(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customer, setCustomer] = useState<CustomerModel | null>(null);
    const [defectsList, setDefectsList] = useState<CustomerDefectModel[]>([]);
    const [defectImages, setDefectImages] = useState<DefectImageModel[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Track sort order counters for each defect to handle multiple simultaneous uploads
    const [defectSortOrderCounters, setDefectSortOrderCounters] = useState<Map<string, number>>(new Map());

    // Dropdown options
    const [buildingOptions, setBuildingOptions] = useState<O_BuildingModel[]>([]);
    const [areaOptions, setAreaOptions] = useState<O_AreaModel[]>([]);
    const [locationOptions, setLocationOptions] = useState<O_LocationModel[]>([]);

    const [defectFindingOptions, setDefectFindingOptions] = useState<O_DefectFindingModel[]>([]);
    const [severityOptions, setSeverityOptions] = useState<O_SeverityModel[]>([]);

    // AI confirmation modal state
    const [aiConfirmationOpen, setAiConfirmationOpen] = useState<boolean>(false);
    const [aiConfirmationLoading, setAiConfirmationLoading] = useState<boolean>(false);
    const [currentDefectForAI, setCurrentDefectForAI] = useState<CustomerDefectModel | null>(null);

    // Add new defect modal state
    const [addDefectModalOpen, setAddDefectModalOpen] = useState<boolean>(false);
    const [addDefectModalLoading, setAddDefectModalLoading] = useState<boolean>(false);
    const [newDefectName, setNewDefectName] = useState<string>("");
    const [newDefectInformation, setNewDefectInformation] = useState<string>("");

    // Add new building modal state
    const [addBuildingModalOpen, setAddBuildingModalOpen] = useState<boolean>(false);
    const [addBuildingModalLoading, setAddBuildingModalLoading] = useState<boolean>(false);
    const [newBuildingName, setNewBuildingName] = useState<string>("");

    // Add new area modal state
    const [addAreaModalOpen, setAddAreaModalOpen] = useState<boolean>(false);
    const [addAreaModalLoading, setAddAreaModalLoading] = useState<boolean>(false);
    const [newAreaName, setNewAreaName] = useState<string>("");

    // Add new location modal state
    const [addLocationModalOpen, setAddLocationModalOpen] = useState<boolean>(false);
    const [addLocationModalLoading, setAddLocationModalLoading] = useState<boolean>(false);
    const [newLocationName, setNewLocationName] = useState<string>("");

    // Add new severity modal state
    const [addSeverityModalOpen, setAddSeverityModalOpen] = useState<boolean>(false);
    const [addSeverityModalLoading, setAddSeverityModalLoading] = useState<boolean>(false);
    const [newSeverityName, setNewSeverityName] = useState<string>("");

    // - EFFECTS - //
    useEffect(() => {
        loadDefectsData();
    }, []);

    // Load defects data and dropdown options
    const loadDefectsData = async () => {
        try {
            setIsLoading(true);
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            // Prepare option promises
            const optionPromises = [O_BuildingModel.GetList(), O_AreaModel.GetList(), O_LocationModel.GetList(), O_DefectFindingModel.GetList(), O_SeverityModel.GetList()];

            // Execute option promises
            const optionResults = await Promise.all(optionPromises);

            // Extract option results
            const [buildingResult, areaResult, locationResult, defectFindingResult, severityResult] = optionResults;

            // Set option states
            setBuildingOptions(buildingResult.ResultList || []);
            setAreaOptions(areaResult.ResultList || []);
            setLocationOptions(locationResult.ResultList || []);
            setDefectFindingOptions((defectFindingResult.ResultList || []) as O_DefectFindingModel[]);
            setSeverityOptions(severityResult.ResultList || []);

            if (selectedCustomerId) {
                // Check if this customer exists and is not deleted
                const customerExists = await CustomerModel.ItemExists(selectedCustomerId);

                if (customerExists) {
                    // Load customer data
                    const customerData = await CustomerModel.Get(selectedCustomerId);
                    setCustomer(customerData);

                    // Clear cache to ensure fresh data with updated image counts
                    JC_Utils.clearLocalStorageForTable(CustomerDefectModel.tableName);

                    // Load defects for this customer
                    const defectsResponse = await CustomerDefectModel.GetByCustomerId(selectedCustomerId);
                    if (defectsResponse && defectsResponse.ResultList) {
                        setDefectsList(defectsResponse.ResultList);
                        setCustomerId(selectedCustomerId);

                        // Load all defect images for this customer's defects
                        const allImages: DefectImageModel[] = [];
                        for (const defect of defectsResponse.ResultList) {
                            try {
                                const imagesResponse = await DefectImageModel.GetByDefectId(defect.Id);
                                if (imagesResponse && imagesResponse.ResultList) {
                                    allImages.push(...imagesResponse.ResultList);
                                }
                            } catch (error) {
                                console.error(`Error loading images for defect ${defect.Id}:`, error);
                            }
                        }
                        setDefectImages(allImages);

                        // Initialize sort order counters for each defect
                        initializeSortOrderCounters(defectsResponse.ResultList, allImages);
                    } else {
                        // No defects found, but customer exists
                        setDefectsList([]);
                        setDefectImages([]);
                        setCustomerId(selectedCustomerId);

                        // Clear sort order counters
                        setDefectSortOrderCounters(new Map());
                    }
                } else {
                    // Customer doesn't exist or is deleted, clear localStorage
                    localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                    setNoCustomerSelected(true);
                }
            } else {
                // No customer selected
                setNoCustomerSelected(true);
            }
        } catch (error) {
            console.error("Error loading defects data:", error);
            // Clear localStorage if there's an error
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
            setNoCustomerSelected(true);
        } finally {
            setIsLoading(false);
            setInitialised(true);
        }
    };

    // Initialize sort order counters for each defect based on current max sort order
    const initializeSortOrderCounters = (defects: CustomerDefectModel[], images: DefectImageModel[]) => {
        const counters = new Map<string, number>();

        for (const defect of defects) {
            const defectImagesForThisDefect = images.filter(img => img.DefectId === defect.Id);
            const maxSortOrder = defectImagesForThisDefect.reduce((max, img) => Math.max(max, img.SortOrder || 0), 0);
            counters.set(defect.Id, maxSortOrder);
        }

        setDefectSortOrderCounters(counters);
    };

    // Get next sort order for a defect and increment the counter
    const getNextSortOrderForDefect = (defectId: string): number => {
        setDefectSortOrderCounters(prev => {
            const newCounters = new Map(prev);
            const currentMax = newCounters.get(defectId) || 0;
            const nextSortOrder = currentMax + 1;
            newCounters.set(defectId, nextSortOrder);
            return newCounters;
        });

        // Return the next sort order (current max + 1)
        const currentMax = defectSortOrderCounters.get(defectId) || 0;
        return currentMax + 1;
    };

    // Handle Customers button click
    const handleCustomersClick = () => {
        router.push("/customer");
    };

    // Handle individual option updated callbacks - for building, area, location, severity, and defects fields
    const handleBuildingOptionUpdated = async (updatedOption: _ModelRequirements) => {
        // For deletions, refresh the entire options list from the database
        // For updates, update the specific option in the list
        try {
            const refreshedOptions = await O_BuildingModel.GetList();
            setBuildingOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing building options:", error);
            // Fallback to updating the specific option if refresh fails
            const buildingOption = new O_BuildingModel(updatedOption as Partial<O_BuildingModel>);
            setBuildingOptions(prev => {
                const newOptions = prev.map(option => (option.Code === buildingOption.Code ? buildingOption : option));
                return [...newOptions];
            });
        }
    };

    const handleAreaOptionUpdated = async (updatedOption: _ModelRequirements) => {
        try {
            const refreshedOptions = await O_AreaModel.GetList();
            setAreaOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing area options:", error);
            const areaOption = new O_AreaModel(updatedOption as Partial<O_AreaModel>);
            setAreaOptions(prev => {
                const newOptions = prev.map(option => (option.Code === areaOption.Code ? areaOption : option));
                return [...newOptions];
            });
        }
    };

    const handleLocationOptionUpdated = async (updatedOption: _ModelRequirements) => {
        try {
            const refreshedOptions = await O_LocationModel.GetList();
            setLocationOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing location options:", error);
            const locationOption = new O_LocationModel(updatedOption as Partial<O_LocationModel>);
            setLocationOptions(prev => {
                const newOptions = prev.map(option => (option.Code === locationOption.Code ? locationOption : option));
                return [...newOptions];
            });
        }
    };

    const handleSeverityOptionUpdated = async (updatedOption: _ModelRequirements) => {
        try {
            const refreshedOptions = await O_SeverityModel.GetList();
            setSeverityOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing severity options:", error);
            const severityOption = new O_SeverityModel(updatedOption as Partial<O_SeverityModel>);
            setSeverityOptions(prev => {
                const newOptions = prev.map(option => (option.Code === severityOption.Code ? severityOption : option));
                return [...newOptions];
            });
        }
    };

    const handleDefectFindingOptionUpdated = async (updatedOption: _ModelRequirements) => {
        try {
            const refreshedOptions = await O_DefectFindingModel.GetList();
            setDefectFindingOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing defect finding options:", error);
            const defectFindingOption = new O_DefectFindingModel(updatedOption as Partial<O_DefectFindingModel>);
            setDefectFindingOptions(prev => {
                const newOptions = prev.map(option => (option.Code === defectFindingOption.Code ? defectFindingOption : option));
                return [...newOptions];
            });
        }
    };

    // Handle image uploaded callback - refresh defect images and defects list
    const handleImageUploaded = async () => {
        if (customerId) {
            try {
                // Clear cache to ensure fresh data with updated image counts
                JC_Utils.clearLocalStorageForTable(CustomerDefectModel.tableName);

                // Reload defects to get updated Ex_ImageFileIds
                const defectsResponse = await CustomerDefectModel.GetByCustomerId(customerId);
                if (defectsResponse && defectsResponse.ResultList) {
                    setDefectsList(defectsResponse.ResultList);

                    // Also reload all defect images for this customer's defects (for sort order counters)
                    const allImages: DefectImageModel[] = [];
                    for (const defect of defectsResponse.ResultList) {
                        try {
                            const imagesResponse = await DefectImageModel.GetByDefectId(defect.Id);
                            if (imagesResponse && imagesResponse.ResultList) {
                                allImages.push(...imagesResponse.ResultList);
                            }
                        } catch (error) {
                            console.error(`Error loading images for defect ${defect.Id}:`, error);
                        }
                    }
                    setDefectImages(allImages);

                    // Reinitialize sort order counters after reloading images
                    initializeSortOrderCounters(defectsResponse.ResultList, allImages);
                }
            } catch (error) {
                console.error("Error refreshing defect images:", error);
            }
        }
    };

    // Handle add defect button click
    const addDefect = async () => {
        try {
            if (!customerId) {
                console.error("No customer selected");
                return;
            }

            setIsLoading(true);

            // Create new defect with customer ID
            const newDefect = new CustomerDefectModel({
                CustomerId: customerId,
                Name: "New Defect"
            });

            // Create the defect in the database
            const response = await CustomerDefectModel.Create(newDefect);
            if (response) {
                // Add the new defect to the beginning of the front-end list
                setDefectsList(prevDefects => [newDefect, ...prevDefects]);
            }
        } catch (error) {
            console.error("Error creating defect:", error);
            JC_Utils.showToastError("Failed to create new defect");
        } finally {
            setIsLoading(false);
        }
    };

    // Update defect field and sync with list
    const updateDefectField = (defectId: string, field: keyof CustomerDefectModel, value: any) => {
        setDefectsList(prevDefects => {
            return prevDefects.map(defect => {
                if (defect.Id === defectId) {
                    // Preserve the constructor by creating a new instance of the same class
                    const updatedDefect = Object.create(Object.getPrototypeOf(defect));
                    Object.assign(updatedDefect, defect, {
                        [field]: value,
                        ModifiedAt: new Date()
                    });
                    return updatedDefect;
                }
                return defect;
            });
        });
    };

    // Handle field blur for auto-saving - saves all modified defects
    const handleDefectFieldBlur = async () => {
        // Use callback to get the current state, just like Customer page
        setDefectsList(currentDefectsState => {
            if (!currentDefectsState || currentDefectsState.length === 0) return currentDefectsState;

            // Save to database with current state
            (async () => {
                try {
                    // Update all defects in the database with the current state
                    for (const defect of currentDefectsState) {
                        if (defect.Id) {
                            // Only save existing defects, not new ones without IDs
                            await CustomerDefectModel.Update(defect);
                        }
                    }
                    // Don't show success toast for every blur event like Customer page
                } catch (error) {
                    console.error("Error saving defects:", error);
                    JC_Utils.showToastError("Failed to save defect changes");
                }
            })();

            return currentDefectsState; // Return unchanged state
        });
    };

    // Handle individual defect field changes for auto-saving - saves only the specific defect
    const handleIndividualDefectFieldChange = useCallback(async (itemIndex: number, updatedItem?: CustomerDefectModel) => {
        // Use setState callback to access the current state, just like Customer page
        setDefectsList(currentDefectsState => {
            if (!currentDefectsState || itemIndex >= currentDefectsState.length) {
                return currentDefectsState;
            }

            // Use the updated item passed from JC_FormTablet if available
            // This ensures we get the latest changes made in the JC_FormTablet component
            let itemToSave = updatedItem || currentDefectsState[itemIndex];

            if (updatedItem) {
                // Update the defects list with the changes from the form tablet
                const newDefectsState = [...currentDefectsState];
                newDefectsState[itemIndex] = updatedItem;

                // Save to database with updated state
                (async () => {
                    try {
                        if (itemToSave.Id) {
                            // Only save existing defects, not new ones without IDs
                            await CustomerDefectModel.Update(itemToSave);
                        }
                        // Don't show success toast for every change event
                    } catch (error) {
                        console.error("Error saving defect:", error);
                        JC_Utils.showToastError("Failed to save defect changes");
                    }
                })();

                return newDefectsState; // Return updated state
            } else {
                // Fallback to original logic if no updated item is provided
                const currentItem = currentDefectsState[itemIndex];
                if (!currentItem) {
                    return currentDefectsState;
                }

                // Save to database with current state
                (async () => {
                    try {
                        if (currentItem.Id) {
                            // Only save existing defects, not new ones without IDs
                            await CustomerDefectModel.Update(currentItem);
                        }
                        // Don't show success toast for every change event
                    } catch (error) {
                        console.error("Error saving defect:", error);
                        JC_Utils.showToastError("Failed to save defect changes");
                    }
                })();

                return currentDefectsState; // Return unchanged state
            }
        });
    }, []); // Empty dependency array since we're using setState callback

    // Handle delete defect
    const handleDeleteDefect = async (defect: CustomerDefectModel) => {
        try {
            if (!defect.Id) {
                console.error("Cannot delete defect without ID");
                return;
            }

            setIsLoading(true);

            // Delete the defect from the database
            await CustomerDefectModel.Delete(defect.Id);

            // Remove the defect from the front-end list
            setDefectsList(prevDefects => prevDefects.filter(d => d.Id !== defect.Id));

            // Also remove any associated images from the state
            setDefectImages(prevImages => prevImages.filter(img => img.DefectId !== defect.Id));

            JC_Utils.showToastSuccess("Defect deleted successfully");
        } catch (error) {
            console.error("Error deleting defect:", error);
            JC_Utils.showToastError("Failed to delete defect");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Use AI callback for manual override action button
    const handleUseAICallback = async (defect: CustomerDefectModel): Promise<any> => {
        // Check if defect has photos
        const defectImageCount = JC_Utils_Defects.countDefectImages(defect.Id, defectImages);

        if (defectImageCount === 0) {
            JC_Utils.showToastError("No photos yet!");
            return null;
        }

        // Store the current defect and show confirmation modal
        setCurrentDefectForAI(defect);
        setAiConfirmationOpen(true);

        // Return a promise that resolves when the AI call completes
        return new Promise(resolve => {
            // Store the resolve function to call it later
            (window as any).aiCallbackResolve = resolve;
        });
    };

    // Handle AI confirmation
    const handleAiConfirmation = async () => {
        if (!currentDefectForAI) return;

        setAiConfirmationLoading(true);
        setAiConfirmationOpen(false);
        try {
            // Call the AI service
            const result = await CustomerDefectModel.AiGenerateInfoFromDefectId(currentDefectForAI.Id);

            // Close the confirmation modal
            setAiConfirmationOpen(false);
            setCurrentDefectForAI(null);

            // Resolve the promise with the AI result
            if ((window as any).aiCallbackResolve) {
                // Create the response object that includes the selected options and overrides
                const selectedOptions = result.SelectedOptions.map((option: any) => ({
                    Code: option.Code,
                    NameOverride: option.NameOverride,
                    InformationOverride: option.InformationOverride
                }));

                const aiResponse = {
                    // Set the selected defect finding options (multiple selections supported)
                    DefectFindingListJson: JSON.stringify(selectedOptions),
                    // For backward compatibility with manual override modal, use the first selection's overrides
                    DefectFindingNameOverride: selectedOptions[0]?.NameOverride || null,
                    DefectFindingInformationOverride: selectedOptions[0]?.InformationOverride || null
                };

                (window as any).aiCallbackResolve(aiResponse);
                delete (window as any).aiCallbackResolve;
            }
        } catch (error) {
            console.error("Error calling AI service:", error);
            JC_Utils.showToastError("Failed to generate AI information");

            // Close the confirmation modal
            setAiConfirmationOpen(false);
            setCurrentDefectForAI(null);

            // Resolve with null to indicate failure
            if ((window as any).aiCallbackResolve) {
                (window as any).aiCallbackResolve(null);
                delete (window as any).aiCallbackResolve;
            }
        } finally {
            setAiConfirmationLoading(false);
        }
    };

    // Handle AI confirmation cancel
    const handleAiConfirmationCancel = () => {
        setAiConfirmationOpen(false);
        setCurrentDefectForAI(null);

        // Resolve with null to indicate cancellation
        if ((window as any).aiCallbackResolve) {
            (window as any).aiCallbackResolve(null);
            delete (window as any).aiCallbackResolve;
        }
    };

    // Add new defect modal functions
    const handleAddNewDefectCallback = () => {
        setNewDefectName("");
        setNewDefectInformation("");
        setAddDefectModalOpen(true);
    };

    const handleAddNewBuildingCallback = () => {
        setNewBuildingName("");
        setAddBuildingModalOpen(true);
    };

    const handleAddNewAreaCallback = () => {
        setNewAreaName("");
        setAddAreaModalOpen(true);
    };

    const handleAddNewLocationCallback = () => {
        setNewLocationName("");
        setAddLocationModalOpen(true);
    };

    const handleAddNewSeverityCallback = () => {
        setNewSeverityName("");
        setAddSeverityModalOpen(true);
    };

    const handleAddBuildingModalCancel = () => {
        setAddBuildingModalOpen(false);
        setNewBuildingName("");
    };

    const handleAddBuildingModalSave = async () => {
        if (!newBuildingName.trim()) {
            JC_Utils.showToastError("Please enter a building name");
            return;
        }

        setAddBuildingModalLoading(true);
        try {
            // Calculate next sort order (find max sort order and add 1)
            const maxSortOrder = buildingOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new building
            const newBuilding = new O_BuildingModel({
                Code: JC_Utils.generateGuid(),
                Name: newBuildingName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_BuildingModel.Create(newBuilding);

            // Add to front-end list
            const updatedOptions = [...buildingOptions, newBuilding];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setBuildingOptions(updatedOptions);

            // Close modal and show success message
            setAddBuildingModalOpen(false);
            setNewBuildingName("");
            JC_Utils.showToastSuccess("Building added successfully");
        } catch (error) {
            console.error("Error adding new building:", error);
            JC_Utils.showToastError("Failed to add new building");
        } finally {
            setAddBuildingModalLoading(false);
        }
    };

    const handleAddAreaModalCancel = () => {
        setAddAreaModalOpen(false);
        setNewAreaName("");
    };

    const handleAddAreaModalSave = async () => {
        if (!newAreaName.trim()) {
            JC_Utils.showToastError("Please enter an area name");
            return;
        }

        setAddAreaModalLoading(true);
        try {
            // Calculate next sort order (find max sort order and add 1)
            const maxSortOrder = areaOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new area
            const newArea = new O_AreaModel({
                Code: JC_Utils.generateGuid(),
                Name: newAreaName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_AreaModel.Create(newArea);

            // Add to front-end list
            const updatedOptions = [...areaOptions, newArea];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setAreaOptions(updatedOptions);

            // Close modal and show success message
            setAddAreaModalOpen(false);
            setNewAreaName("");
            JC_Utils.showToastSuccess("Area added successfully");
        } catch (error) {
            console.error("Error adding new area:", error);
            JC_Utils.showToastError("Failed to add new area");
        } finally {
            setAddAreaModalLoading(false);
        }
    };

    const handleAddLocationModalCancel = () => {
        setAddLocationModalOpen(false);
        setNewLocationName("");
    };

    const handleAddLocationModalSave = async () => {
        if (!newLocationName.trim()) {
            JC_Utils.showToastError("Please enter a location name");
            return;
        }

        setAddLocationModalLoading(true);
        try {
            // Calculate next sort order (find max sort order and add 1)
            const maxSortOrder = locationOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new location
            const newLocation = new O_LocationModel({
                Code: JC_Utils.generateGuid(),
                Name: newLocationName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_LocationModel.Create(newLocation);

            // Add to front-end list
            const updatedOptions = [...locationOptions, newLocation];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setLocationOptions(updatedOptions);

            // Close modal and show success message
            setAddLocationModalOpen(false);
            setNewLocationName("");
            JC_Utils.showToastSuccess("Location added successfully");
        } catch (error) {
            console.error("Error adding new location:", error);
            JC_Utils.showToastError("Failed to add new location");
        } finally {
            setAddLocationModalLoading(false);
        }
    };

    const handleAddSeverityModalCancel = () => {
        setAddSeverityModalOpen(false);
        setNewSeverityName("");
    };

    const handleAddSeverityModalSave = async () => {
        if (!newSeverityName.trim()) {
            JC_Utils.showToastError("Please enter a severity name");
            return;
        }

        setAddSeverityModalLoading(true);
        try {
            // Calculate next sort order (find max sort order and add 1)
            const maxSortOrder = severityOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new severity
            const newSeverity = new O_SeverityModel({
                Code: JC_Utils.generateGuid(),
                Name: newSeverityName.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_SeverityModel.Create(newSeverity);

            // Add to front-end list
            const updatedOptions = [...severityOptions, newSeverity];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setSeverityOptions(updatedOptions);

            // Close modal and show success message
            setAddSeverityModalOpen(false);
            setNewSeverityName("");
            JC_Utils.showToastSuccess("Severity added successfully");
        } catch (error) {
            console.error("Error adding new severity:", error);
            JC_Utils.showToastError("Failed to add new severity");
        } finally {
            setAddSeverityModalLoading(false);
        }
    };

    const handleAddDefectModalCancel = () => {
        setAddDefectModalOpen(false);
        setNewDefectName("");
        setNewDefectInformation("");
    };

    const handleAddDefectModalSave = async () => {
        if (!newDefectName.trim()) {
            JC_Utils.showToastError("Please enter a defect name");
            return;
        }

        setAddDefectModalLoading(true);
        try {
            // Calculate next sort order (find max sort order and add 1)
            const maxSortOrder = defectFindingOptions.reduce((max, option) => Math.max(max, option.SortOrder || 0), 0);
            const nextSortOrder = maxSortOrder + 1;

            // Create new defect finding
            const newDefectFinding = new O_DefectFindingModel({
                Code: JC_Utils.generateGuid(),
                Name: newDefectName.trim(),
                Information: newDefectInformation.trim(),
                SortOrder: nextSortOrder
            });

            // Save to database
            await O_DefectFindingModel.Create(newDefectFinding);

            // Add to front-end list
            const updatedOptions = [...defectFindingOptions, newDefectFinding];
            updatedOptions.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
            setDefectFindingOptions(updatedOptions);

            // Close modal and show success message
            setAddDefectModalOpen(false);
            setNewDefectName("");
            setNewDefectInformation("");
            JC_Utils.showToastSuccess("Defect added successfully");
        } catch (error) {
            console.error("Error adding new defect:", error);
            JC_Utils.showToastError("Failed to add new defect");
        } finally {
            setAddDefectModalLoading(false);
        }
    };

    // Create formList model for JC_FormTablet - memoized to ensure re-renders when data changes
    const createFormListModel = useMemo((): JC_FormListModel<CustomerDefectModel> => {
        const headers: JC_ListHeader[] = [
            {
                label: "Building",
                sortKey: "BuildingListJson",
                optionsEditableFields: [O_BuildingModel.primaryDisplayField], // "Name"
                manualOverrideFields: [{ field: "BuildingNameOverride", label: "Name" }] // Manual override fields for multi-select
            },
            {
                label: "Area",
                sortKey: "AreaListJson",
                optionsEditableFields: [O_AreaModel.primaryDisplayField], // "Name"
                manualOverrideFields: [{ field: "AreaNameOverride", label: "Name" }] // Manual override fields for multi-select
            },
            {
                label: "Location",
                sortKey: "LocationListJson",
                optionsEditableFields: [O_LocationModel.primaryDisplayField], // "Name"
                manualOverrideFields: [{ field: "LocationNameOverride", label: "Name" }] // Manual override fields for multi-select
            },
            {
                label: "Defects",
                sortKey: "DefectFindingCode",
                optionsEditableFields: [O_DefectFindingModel.primaryDisplayField, "Information"], // "Name" and "Information"
                manualOverrideFields: [
                    { field: "DefectFindingNameOverride", label: "Name" },
                    { field: "DefectFindingInformationOverride", label: "Information" }
                ], // Manual override fields for defect finding
                manualEditActionButton: {
                    label: "Use AI",
                    callback: handleUseAICallback
                },
                wideOptionsColumn: true // Make the options column wider when this column is selected
            },
            {
                label: "Severity",
                sortKey: "SeverityListJson",
                optionsEditableFields: [O_SeverityModel.primaryDisplayField], // "Name"
                manualOverrideFields: [{ field: "SeverityNameOverride", label: "Name" }] // Manual override fields for multi-select
            },
            { label: "Imgs", sortKey: "" }
        ];

        return {
            headers,
            items: defectsList,
            deleteRecordCallback: handleDeleteDefect,
            deleteConfirmationTitle: "Delete Defect",
            deleteConfirmationText: (item: CustomerDefectModel) => `Are you sure you want to delete this defect?`,
            row: (item: CustomerDefectModel) => [
                {
                    inputId: `defect-building-${item.Id}`,
                    type: FieldTypeEnum.MultiDropdown,
                    value: item.BuildingListJson || "[]",
                    optionsModel: O_BuildingModel,
                    options: buildingOptions,
                    onOptionUpdated: handleBuildingOptionUpdated,
                    onChange: (value: string) => {
                        // Convert simple code array to object structure with Code, NameOverride
                        // Preserve existing override values when new selections are made
                        try {
                            const codes = JSON.parse(value);
                            if (Array.isArray(codes)) {
                                // Get existing selections to preserve override values
                                const existingSelections = item.BuildingListJson ? JSON.parse(item.BuildingListJson) : [];
                                const existingOverrides = new Map();

                                // Build map of existing overrides
                                if (Array.isArray(existingSelections)) {
                                    existingSelections.forEach((sel: any) => {
                                        if (typeof sel === "object" && sel.Code) {
                                            existingOverrides.set(sel.Code, sel.NameOverride || null);
                                        }
                                    });
                                }

                                const objectStructure = codes.map(code => ({
                                    Code: code,
                                    NameOverride: existingOverrides.get(code) || null
                                }));
                                updateDefectField(item.Id, "BuildingListJson", JSON.stringify(objectStructure));
                            } else {
                                updateDefectField(item.Id, "BuildingListJson", value);
                            }
                        } catch {
                            updateDefectField(item.Id, "BuildingListJson", value);
                        }
                    },
                    manualOverrideDisplayValue: (() => {
                        // Check if BuildingListJson is empty or contains no selections
                        let hasSelections = false;
                        let firstOverrideName = null;
                        try {
                            const selections = JSON.parse(item.BuildingListJson || "[]");
                            hasSelections = Array.isArray(selections) && selections.length > 0;

                            // Check if first item has a name override
                            if (hasSelections && selections[0] && typeof selections[0] === "object" && selections[0].NameOverride) {
                                firstOverrideName = selections[0].NameOverride;
                            }
                        } catch {
                            hasSelections = false;
                        }

                        // Show override name if no selections but has override, or if has selections with override
                        return firstOverrideName || (!hasSelections ? "-" : undefined);
                    })(),
                    addNewOptionCallback: handleAddNewBuildingCallback
                },
                {
                    inputId: `defect-area-${item.Id}`,
                    type: FieldTypeEnum.MultiDropdown,
                    value: item.AreaListJson || "[]",
                    optionsModel: O_AreaModel,
                    options: areaOptions,
                    onOptionUpdated: handleAreaOptionUpdated,
                    onChange: (value: string) => {
                        // Convert simple code array to object structure with Code, NameOverride
                        // Preserve existing override values when new selections are made
                        try {
                            const codes = JSON.parse(value);
                            if (Array.isArray(codes)) {
                                // Get existing selections to preserve override values
                                const existingSelections = item.AreaListJson ? JSON.parse(item.AreaListJson) : [];
                                const existingOverrides = new Map();

                                // Build map of existing overrides
                                if (Array.isArray(existingSelections)) {
                                    existingSelections.forEach((sel: any) => {
                                        if (typeof sel === "object" && sel.Code) {
                                            existingOverrides.set(sel.Code, sel.NameOverride || null);
                                        }
                                    });
                                }

                                const objectStructure = codes.map(code => ({
                                    Code: code,
                                    NameOverride: existingOverrides.get(code) || null
                                }));
                                updateDefectField(item.Id, "AreaListJson", JSON.stringify(objectStructure));
                            } else {
                                updateDefectField(item.Id, "AreaListJson", value);
                            }
                        } catch {
                            updateDefectField(item.Id, "AreaListJson", value);
                        }
                    },
                    manualOverrideDisplayValue: (() => {
                        // Check if AreaListJson is empty or contains no selections
                        let hasSelections = false;
                        let firstOverrideName = null;
                        try {
                            const selections = JSON.parse(item.AreaListJson || "[]");
                            hasSelections = Array.isArray(selections) && selections.length > 0;

                            // Check if first item has a name override
                            if (hasSelections && selections[0] && typeof selections[0] === "object" && selections[0].NameOverride) {
                                firstOverrideName = selections[0].NameOverride;
                            }
                        } catch {
                            hasSelections = false;
                        }

                        // Show override name if no selections but has override, or if has selections with override
                        return firstOverrideName || (!hasSelections ? "-" : undefined);
                    })(),
                    addNewOptionCallback: handleAddNewAreaCallback
                },
                {
                    inputId: `defect-location-${item.Id}`,
                    type: FieldTypeEnum.MultiDropdown,
                    value: item.LocationListJson || "[]",
                    optionsModel: O_LocationModel,
                    options: locationOptions,
                    onOptionUpdated: handleLocationOptionUpdated,
                    onChange: (value: string) => {
                        // Convert simple code array to object structure with Code, NameOverride
                        // Preserve existing override values when new selections are made
                        try {
                            const codes = JSON.parse(value);
                            if (Array.isArray(codes)) {
                                // Get existing selections to preserve override values
                                const existingSelections = item.LocationListJson ? JSON.parse(item.LocationListJson) : [];
                                const existingOverrides = new Map();

                                // Build map of existing overrides
                                if (Array.isArray(existingSelections)) {
                                    existingSelections.forEach((sel: any) => {
                                        if (typeof sel === "object" && sel.Code) {
                                            existingOverrides.set(sel.Code, sel.NameOverride || null);
                                        }
                                    });
                                }

                                const objectStructure = codes.map(code => ({
                                    Code: code,
                                    NameOverride: existingOverrides.get(code) || null
                                }));
                                updateDefectField(item.Id, "LocationListJson", JSON.stringify(objectStructure));
                            } else {
                                updateDefectField(item.Id, "LocationListJson", value);
                            }
                        } catch {
                            updateDefectField(item.Id, "LocationListJson", value);
                        }
                    },
                    manualOverrideDisplayValue: (() => {
                        // Check if LocationListJson is empty or contains no selections
                        let hasSelections = false;
                        let firstOverrideName = null;
                        try {
                            const selections = JSON.parse(item.LocationListJson || "[]");
                            hasSelections = Array.isArray(selections) && selections.length > 0;

                            // Check if first item has a name override
                            if (hasSelections && selections[0] && typeof selections[0] === "object" && selections[0].NameOverride) {
                                firstOverrideName = selections[0].NameOverride;
                            }
                        } catch {
                            hasSelections = false;
                        }

                        // Show override name if no selections but has override, or if has selections with override
                        return firstOverrideName || (!hasSelections ? "-" : undefined);
                    })(),
                    addNewOptionCallback: handleAddNewLocationCallback
                },
                {
                    inputId: `defect-defects-${item.Id}`,
                    type: FieldTypeEnum.Dropdown,
                    value: item.DefectFindingCode || "",
                    optionsModel: O_DefectFindingModel,
                    options: defectFindingOptions,
                    onOptionUpdated: handleDefectFindingOptionUpdated,
                    onChange: (value: string) => {
                        updateDefectField(item.Id, "DefectFindingCode", value);
                    },
                    manualOverrideDisplayValue: (() => {
                        // Show DefectFindingNameOverride if it exists, otherwise use normal dropdown logic
                        if (item.DefectFindingNameOverride) {
                            return item.DefectFindingNameOverride;
                        }
                        // Return undefined to use normal dropdown display logic
                        return undefined;
                    })(),
                    addNewOptionCallback: handleAddNewDefectCallback
                },
                {
                    inputId: `defect-severity-${item.Id}`,
                    type: FieldTypeEnum.MultiDropdown,
                    value: item.SeverityListJson || "[]",
                    optionsModel: O_SeverityModel,
                    options: severityOptions,
                    onOptionUpdated: handleSeverityOptionUpdated,
                    onChange: (value: string) => {
                        // Convert simple code array to object structure with Code, NameOverride
                        // Preserve existing override values when new selections are made
                        try {
                            const codes = JSON.parse(value);
                            if (Array.isArray(codes)) {
                                // Get existing selections to preserve override values
                                const existingSelections = item.SeverityListJson ? JSON.parse(item.SeverityListJson) : [];
                                const existingOverrides = new Map();

                                // Build map of existing overrides
                                if (Array.isArray(existingSelections)) {
                                    existingSelections.forEach((sel: any) => {
                                        if (typeof sel === "object" && sel.Code) {
                                            existingOverrides.set(sel.Code, sel.NameOverride || null);
                                        }
                                    });
                                }

                                const objectStructure = codes.map(code => ({
                                    Code: code,
                                    NameOverride: existingOverrides.get(code) || null
                                }));
                                updateDefectField(item.Id, "SeverityListJson", JSON.stringify(objectStructure));
                            } else {
                                updateDefectField(item.Id, "SeverityListJson", value);
                            }
                        } catch {
                            updateDefectField(item.Id, "SeverityListJson", value);
                        }
                    },
                    manualOverrideDisplayValue: (() => {
                        // Check if SeverityListJson is empty or contains no selections
                        let hasSelections = false;
                        let firstOverrideName = null;
                        try {
                            const selections = JSON.parse(item.SeverityListJson || "[]");
                            hasSelections = Array.isArray(selections) && selections.length > 0;

                            // Check if first item has a name override
                            if (hasSelections && selections[0] && typeof selections[0] === "object" && selections[0].NameOverride) {
                                firstOverrideName = selections[0].NameOverride;
                            }
                        } catch {
                            hasSelections = false;
                        }

                        // Show override name if no selections but has override, or if has selections with override
                        return firstOverrideName || (!hasSelections ? "-" : undefined);
                    })(),
                    addNewOptionCallback: handleAddNewSeverityCallback
                },
                {
                    inputId: `defect-imgs-${item.Id}`,
                    type: FieldTypeEnum.MultiPhoto,
                    value: JC_Utils_Defects.countDefectImagesFromDefect(item).toString(),
                    s3KeyPath: `Inspection Report/${customer!.ClientName}/Images`,
                    onChange: (_value: string) => {
                        // Images count is read-only, no change handling needed
                    }
                }
            ]
        };
    }, [defectsList, buildingOptions, areaOptions, locationOptions, defectFindingOptions, severityOptions, customer]);

    // Handle photo field click - defect-specific logic
    const handlePhotoFieldClick = (field: JC_FieldModel, item: CustomerDefectModel) => {
        // Extract defectId from inputId (format: defect-imgs-{defectId})
        const defectId = field.inputId.replace("defect-imgs-", "");

        // Get DefectImage records for this defect to build files array with sort orders
        const defectImagesForThisDefect = defectImages.filter(img => img.DefectId === defectId);
        const files: JC_ModalPhotosModel[] = defectImagesForThisDefect.map(img => ({
            FileId: img.ImageFileId,
            SortOrder: img.SortOrder || 0
        }));

        return {
            files: files,
            title: "Defect Photos",
            onImageUploaded: async (fileId: string, fileName: string) => {
                try {
                    // Get next sort order for this defect using the counter system
                    // This ensures each upload gets a unique, incrementing sort order
                    const nextSortOrder = getNextSortOrderForDefect(defectId);

                    // Create DefectImage record
                    const defectImage = new DefectImageModel({
                        DefectId: defectId,
                        ImageName: fileName.replace(".webp", ""), // Remove extension for ImageName
                        ImageFileId: fileId,
                        SortOrder: nextSortOrder
                    });

                    // Create the record and get the returned record with actual SortOrder from backend
                    const createdDefectImage = await DefectImageModel.Create(defectImage);

                    // Update the defectImages state with the returned record (which has the actual SortOrder)
                    setDefectImages(prev => [...prev, createdDefectImage]);

                    // Update the defectsList to include the new fileId in Ex_ImageFileIds
                    setDefectsList(prevDefects =>
                        prevDefects.map(defect => {
                            if (defect.Id === defectId) {
                                // Preserve the constructor by creating a new instance of the same class
                                const updatedDefect = Object.create(Object.getPrototypeOf(defect));
                                Object.assign(updatedDefect, defect, {
                                    Ex_ImageFileIds: [...(defect.Ex_ImageFileIds || []), fileId]
                                });
                                return updatedDefect;
                            }
                            return defect;
                        })
                    );
                } catch (error) {
                    console.error("Error creating DefectImage record:", error);
                    JC_Utils.showToastError("Failed to save image record");
                }
            },
            onImageDeleted: async (fileId: string) => {
                try {
                    // Find the DefectImage record by ImageFileId
                    const defectImageResponse = await DefectImageModel.GetByImageFileId(fileId);

                    if (defectImageResponse?.ResultList && defectImageResponse.ResultList.length > 0) {
                        const defectImageRecord = defectImageResponse.ResultList[0];

                        // Delete the DefectImage record (this will also delete the File record via the updated Delete service)
                        await DefectImageModel.Delete(defectImageRecord.Id);

                        // Remove the DefectImage from the defectImages state
                        setDefectImages(prev => prev.filter(img => img.ImageFileId !== fileId));

                        // Update the defectsList to remove the fileId from Ex_ImageFileIds
                        setDefectsList(prevDefects =>
                            prevDefects.map(defect => {
                                if (defect.Id === defectId) {
                                    // Preserve the constructor by creating a new instance of the same class
                                    const updatedDefect = Object.create(Object.getPrototypeOf(defect));
                                    Object.assign(updatedDefect, defect, {
                                        Ex_ImageFileIds: (defect.Ex_ImageFileIds || []).filter(id => id !== fileId)
                                    });
                                    return updatedDefect;
                                }
                                return defect;
                            })
                        );
                    } else {
                        throw new Error("Could not find DefectImage record to delete");
                    }
                } catch (error) {
                    console.error("Error deleting image:", error);
                    JC_Utils.showToastError("Failed to delete image");
                    throw error; // Re-throw so JC_ModalPhotos can handle the error
                }
            },
            onSortOrderChanged: async (updatedFiles: JC_ModalPhotosModel[]) => {
                try {
                    // Update the DefectImage records with new sort orders
                    const defectImagesForThisDefect = defectImages.filter(img => img.DefectId === defectId);
                    const updatedDefectImages: DefectImageModel[] = [];

                    for (const file of updatedFiles) {
                        const defectImage = defectImagesForThisDefect.find(img => img.ImageFileId === file.FileId);
                        if (defectImage && defectImage.SortOrder !== file.SortOrder) {
                            defectImage.SortOrder = file.SortOrder;
                            updatedDefectImages.push(defectImage);
                        }
                    }

                    if (updatedDefectImages.length > 0) {
                        // Use the utility function to organize sort orders
                        const organizedDefectImages = JC_Utils.organiseSortOrders(updatedDefectImages);

                        // Update each DefectImage record via API
                        for (const defectImage of organizedDefectImages) {
                            await DefectImageModel.Update(defectImage);
                        }

                        // Update the defectImages state
                        setDefectImages(prev =>
                            prev.map(img => {
                                const updated = organizedDefectImages.find(updated => updated.Id === img.Id);
                                return updated || img;
                            })
                        );

                        JC_Utils.showToastSuccess("Image order updated successfully");
                    }
                } catch (error) {
                    console.error("Error updating image sort order:", error);
                    JC_Utils.showToastError("Failed to update image order");
                }
            },
            onImagesUploaded: async () => {
                try {
                    // Re-fetch all defect images for this defect to ensure modal shows updated data
                    const imagesResponse = await DefectImageModel.GetByDefectId(defectId);
                    if (imagesResponse && imagesResponse.ResultList) {
                        // Update the defectImages state with fresh data for this defect
                        setDefectImages(prev => {
                            // Remove old images for this defect and add fresh ones
                            const otherDefectImages = prev.filter(img => img.DefectId !== defectId);
                            return [...otherDefectImages, ...imagesResponse.ResultList];
                        });

                        // Update the defectsList to include fresh Ex_ImageFileIds for this defect
                        setDefectsList(prevDefects =>
                            prevDefects.map(defect => {
                                if (defect.Id === defectId) {
                                    // Preserve the constructor by creating a new instance of the same class
                                    const updatedDefect = Object.create(Object.getPrototypeOf(defect));
                                    const freshImageFileIds = imagesResponse.ResultList.map(img => img.ImageFileId);
                                    Object.assign(updatedDefect, defect, {
                                        Ex_ImageFileIds: freshImageFileIds
                                    });
                                    return updatedDefect;
                                }
                                return defect;
                            })
                        );

                        // Return the updated files array for the modal
                        const updatedFiles: JC_ModalPhotosModel[] = imagesResponse.ResultList.map(img => ({
                            FileId: img.ImageFileId,
                            SortOrder: img.SortOrder || 0
                        }));
                        return updatedFiles;
                    }
                    return [];
                } catch (error) {
                    console.error("Error re-fetching defect images:", error);
                    JC_Utils.showToastError("Failed to refresh images");
                    return [];
                }
            }
        };
    };

    // Default sort function for defects - group by area names in priority order
    const defaultSort = (a: CustomerDefectModel, b: CustomerDefectModel) => {
        // Define area priority order
        const areaPriority = ["Interior", "Roof Void", "Subfloor", "Exterior", "Outbuilding"];

        // Helper function to get the highest priority area for a defect
        const getHighestPriorityArea = (defect: CustomerDefectModel): number => {
            if (!defect.Ex_AreaNamesList || defect.Ex_AreaNamesList.length === 0) {
                return areaPriority.length; // Put records with no areas at the end
            }

            // Find the highest priority area (lowest index in areaPriority array)
            let highestPriority = areaPriority.length;
            for (const areaName of defect.Ex_AreaNamesList) {
                const priority = areaPriority.indexOf(areaName);
                if (priority !== -1 && priority < highestPriority) {
                    highestPriority = priority;
                }
            }
            return highestPriority;
        };

        // Get priority for both defects
        const priorityA = getHighestPriorityArea(a);
        const priorityB = getHighestPriorityArea(b);

        // First sort by area priority
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If same priority, sort alphabetically by name within the group
        const nameA = (a.Name || "").toLowerCase();
        const nameB = (b.Name || "").toLowerCase();
        return nameA.localeCompare(nameB);
    };

    // Create JC_FormTablet model - use useMemo to regenerate when defectsList changes
    const formTabletModel: JC_FormTabletModel = useMemo(
        () => ({
            headerLabel: JC_Utils.formatPageHeaderTitle(customer?.Address, "Defects"),
            fieldsPaneHeader: "Defects List",
            fieldsPaneWidth: 500,
            sections: [], // Empty sections since we're using formList
            formList: customerId ? createFormListModel : undefined,
            defaultSort: defaultSort, // Add default sort function
            isLoading: isLoading,
            panesSwitched: true,
            showSaveButton: false,
            onBlurCallback: handleDefectFieldBlur,
            onFormListItemChangeDelayCallback: handleIndividualDefectFieldChange, // Use individual item callback
            onImageUploaded: handleImageUploaded,
            onPhotoFieldClick: handlePhotoFieldClick,
            customerId: customerId || undefined,
            customer: customer, // Pass customer object for CustomOrder persistence
            useContainerHeight: true // Use height: 100% instead of height: 100vh
        }),
        [customerId, isLoading, createFormListModel, handleImageUploaded, handleIndividualDefectFieldChange, customer?.Address, customer, defaultSort]
    );

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
        <div className={styles.defectsPageContainer}>
            <div className={styles.formTabletWrapper}>
                <JC_FormTablet model={formTabletModel} />
            </div>
            <div className={styles.addButtonContainer}>
                <button className={styles.addButton} onClick={addDefect}>
                    +
                </button>
            </div>

            {/* AI Confirmation Modal */}
            <JC_ModalConfirmation
                title="Use AI"
                text="Are you sure you want to use the AI call to populate the Name and Information based on the defect's photos?"
                isOpen={aiConfirmationOpen}
                onCancel={handleAiConfirmationCancel}
                submitButtons={[
                    {
                        text: "Use AI",
                        onSubmit: handleAiConfirmation
                    }
                ]}
                isLoading={aiConfirmationLoading}
            />

            {/* Add New Defect Modal */}
            <JC_Modal title="Add New Defect" isOpen={addDefectModalOpen} onCancel={handleAddDefectModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Defect"
                        onSubmit={handleAddDefectModalSave}
                        onCancel={handleAddDefectModalCancel}
                        isLoading={addDefectModalLoading}
                        fields={[
                            {
                                inputId: "new-defect-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newDefectName,
                                placeholder: "Enter defect name",
                                onChange: (value: string) => setNewDefectName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            },
                            {
                                inputId: "new-defect-information",
                                type: FieldTypeEnum.Textarea,
                                label: "Information",
                                value: newDefectInformation,
                                placeholder: "Enter defect information (optional)",
                                onChange: (value: string) => setNewDefectInformation(value)
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Building Modal */}
            <JC_Modal title="Add New Building" isOpen={addBuildingModalOpen} onCancel={handleAddBuildingModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Building"
                        onSubmit={handleAddBuildingModalSave}
                        onCancel={handleAddBuildingModalCancel}
                        isLoading={addBuildingModalLoading}
                        fields={[
                            {
                                inputId: "new-building-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newBuildingName,
                                placeholder: "Enter building name",
                                onChange: (value: string) => setNewBuildingName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Area Modal */}
            <JC_Modal title="Add New Area" isOpen={addAreaModalOpen} onCancel={handleAddAreaModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Area"
                        onSubmit={handleAddAreaModalSave}
                        onCancel={handleAddAreaModalCancel}
                        isLoading={addAreaModalLoading}
                        fields={[
                            {
                                inputId: "new-area-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newAreaName,
                                placeholder: "Enter area name",
                                onChange: (value: string) => setNewAreaName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Location Modal */}
            <JC_Modal title="Add New Location" isOpen={addLocationModalOpen} onCancel={handleAddLocationModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Location"
                        onSubmit={handleAddLocationModalSave}
                        onCancel={handleAddLocationModalCancel}
                        isLoading={addLocationModalLoading}
                        fields={[
                            {
                                inputId: "new-location-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newLocationName,
                                placeholder: "Enter location name",
                                onChange: (value: string) => setNewLocationName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            }
                        ]}
                    />
                </div>
            </JC_Modal>

            {/* Add New Severity Modal */}
            <JC_Modal title="Add New Severity" isOpen={addSeverityModalOpen} onCancel={handleAddSeverityModalCancel}>
                <div style={{ minWidth: "300px" }}>
                    <JC_Form
                        submitButtonText="Add Severity"
                        onSubmit={handleAddSeverityModalSave}
                        onCancel={handleAddSeverityModalCancel}
                        isLoading={addSeverityModalLoading}
                        fields={[
                            {
                                inputId: "new-severity-name",
                                type: FieldTypeEnum.Text,
                                label: "Name",
                                value: newSeverityName,
                                placeholder: "Enter severity name",
                                onChange: (value: string) => setNewSeverityName(value),
                                validate: (value: string | number | Date | undefined) => (!value || (typeof value === "string" && !value.trim()) ? "Name is required" : ""),
                                autoFocus: true
                            }
                        ]}
                    />
                </div>
            </JC_Modal>
        </div>
    );
}
