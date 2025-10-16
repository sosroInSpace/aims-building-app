"use client";

import { JC_Utils } from "../Utils";
import { JC_Put } from "../apiServices/JC_Put";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Field from "../components/JC_Field/JC_Field";
import JC_FormTablet, { JC_FormTabletModel } from "../components/JC_FormTablet/JC_FormTablet";
import JC_Modal from "../components/JC_Modal/JC_Modal";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { CustomerModel } from "../models/Customer";
import { O_BuildingTypeModel } from "../models/O_BuildingType";
import { O_FloorModel } from "../models/O_Floor";
import { O_FurnishedModel } from "../models/O_Furnished";
import { O_NumBedroomsModel } from "../models/O_NumBedrooms";
import { O_OccupiedModel } from "../models/O_Occupied";
import { O_OrientationModel } from "../models/O_Orientation";
import { O_OtherBuildingElementsModel } from "../models/O_OtherBuildingElements";
import { O_OtherTimberBldgElementsModel } from "../models/O_OtherTimberBldgElements";
import { O_RoofModel } from "../models/O_Roof";
import { O_StoreysModel } from "../models/O_Storeys";
import { O_WallsModel } from "../models/O_Walls";
import { O_WeatherModel } from "../models/O_Weather";
import styles from "./page.module.scss";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function PropertyPage() {
    const router = useRouter();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [noCustomerSelected, setNoCustomerSelected] = useState<boolean>(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [currentProperty, setCurrentProperty] = useState<CustomerModel>(new CustomerModel());
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Dropdown options
    const [buildingTypeOptions, setBuildingTypeOptions] = useState<O_BuildingTypeModel[]>([]);
    const [orientationOptions, setOrientationOptions] = useState<O_OrientationModel[]>([]);
    const [numBedroomsOptions, setNumBedroomsOptions] = useState<O_NumBedroomsModel[]>([]);
    const [storeysOptions, setStoreysOptions] = useState<O_StoreysModel[]>([]);
    const [furnishedOptions, setFurnishedOptions] = useState<O_FurnishedModel[]>([]);
    const [occupiedOptions, setOccupiedOptions] = useState<O_OccupiedModel[]>([]);
    const [floorOptions, setFloorOptions] = useState<O_FloorModel[]>([]);
    const [otherBuildingElementsOptions, setOtherBuildingElementsOptions] = useState<O_OtherBuildingElementsModel[]>([]);
    const [otherTimberBldgElementsOptions, setOtherTimberBldgElementsOptions] = useState<O_OtherTimberBldgElementsModel[]>([]);
    const [roofOptions, setRoofOptions] = useState<O_RoofModel[]>([]);
    const [wallsOptions, setWallsOptions] = useState<O_WallsModel[]>([]);
    const [weatherOptions, setWeatherOptions] = useState<O_WeatherModel[]>([]);

    // Add new option modal states
    const [addBuildingTypeModalOpen, setAddBuildingTypeModalOpen] = useState(false);
    const [addOrientationModalOpen, setAddOrientationModalOpen] = useState(false);
    const [addNumBedroomsModalOpen, setAddNumBedroomsModalOpen] = useState(false);
    const [addStoreysModalOpen, setAddStoreysModalOpen] = useState(false);
    const [addFurnishedModalOpen, setAddFurnishedModalOpen] = useState(false);
    const [addOccupiedModalOpen, setAddOccupiedModalOpen] = useState(false);
    const [addFloorModalOpen, setAddFloorModalOpen] = useState(false);
    const [addOtherBuildingElementsModalOpen, setAddOtherBuildingElementsModalOpen] = useState(false);
    const [addOtherTimberBldgElementsModalOpen, setAddOtherTimberBldgElementsModalOpen] = useState(false);
    const [addRoofModalOpen, setAddRoofModalOpen] = useState(false);
    const [addWallsModalOpen, setAddWallsModalOpen] = useState(false);
    const [addWeatherModalOpen, setAddWeatherModalOpen] = useState(false);

    // Add new option form states
    const [newBuildingTypeName, setNewBuildingTypeName] = useState("");
    const [newOrientationName, setNewOrientationName] = useState("");
    const [newNumBedroomsName, setNewNumBedroomsName] = useState("");
    const [newStoreysName, setNewStoreysName] = useState("");
    const [newFurnishedName, setNewFurnishedName] = useState("");
    const [newOccupiedName, setNewOccupiedName] = useState("");
    const [newFloorName, setNewFloorName] = useState("");
    const [newOtherBuildingElementsName, setNewOtherBuildingElementsName] = useState("");
    const [newOtherTimberBldgElementsName, setNewOtherTimberBldgElementsName] = useState("");
    const [newRoofName, setNewRoofName] = useState("");
    const [newWallsName, setNewWallsName] = useState("");
    const [newWeatherName, setNewWeatherName] = useState("");

    // Add new option loading states
    const [addBuildingTypeModalLoading, setAddBuildingTypeModalLoading] = useState(false);
    const [addOrientationModalLoading, setAddOrientationModalLoading] = useState(false);
    const [addNumBedroomsModalLoading, setAddNumBedroomsModalLoading] = useState(false);
    const [addStoreysModalLoading, setAddStoreysModalLoading] = useState(false);
    const [addFurnishedModalLoading, setAddFurnishedModalLoading] = useState(false);
    const [addOccupiedModalLoading, setAddOccupiedModalLoading] = useState(false);
    const [addFloorModalLoading, setAddFloorModalLoading] = useState(false);
    const [addOtherBuildingElementsModalLoading, setAddOtherBuildingElementsModalLoading] = useState(false);
    const [addOtherTimberBldgElementsModalLoading, setAddOtherTimberBldgElementsModalLoading] = useState(false);
    const [addRoofModalLoading, setAddRoofModalLoading] = useState(false);
    const [addWallsModalLoading, setAddWallsModalLoading] = useState(false);
    const [addWeatherModalLoading, setAddWeatherModalLoading] = useState(false);

    // Load all data (property and options) simultaneously
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            if (!selectedCustomerId) {
                setNoCustomerSelected(true);
                setIsLoading(false);
                setInitialised(true);
                return;
            }

            // Check if this customer exists and is not deleted
            const customerExists = await CustomerModel.ItemExists(selectedCustomerId);

            if (!customerExists) {
                // Customer doesn't exist or is deleted, clear localStorage
                localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                setNoCustomerSelected(true);
                setIsLoading(false);
                setInitialised(true);
                return;
            }

            setCustomerId(selectedCustomerId);

            // Prepare option promises
            const optionPromises = [O_BuildingTypeModel.GetList(), O_OrientationModel.GetList(), O_NumBedroomsModel.GetList(), O_StoreysModel.GetList(), O_FurnishedModel.GetList(), O_OccupiedModel.GetList(), O_FloorModel.GetList(), O_OtherBuildingElementsModel.GetList(), O_OtherTimberBldgElementsModel.GetList(), O_RoofModel.GetList(), O_WallsModel.GetList(), O_WeatherModel.GetList()];

            // Prepare property promise
            const propertyPromise = CustomerModel.Get(selectedCustomerId);

            // Execute all promises simultaneously
            const [optionResults, propertyResult] = await Promise.all([Promise.all(optionPromises), propertyPromise]);

            // Extract option results
            const [buildingTypesResult, orientationsResult, numBedroomsResult, storeysResult, furnishedResult, occupiedResult, floorsResult, otherBuildingElementsResult, otherTimberBldgElementsResult, roofsResult, wallsResult, weatherResult] = optionResults;

            // Set option states
            setBuildingTypeOptions(buildingTypesResult.ResultList || []);
            setOrientationOptions(orientationsResult.ResultList || []);
            setNumBedroomsOptions(numBedroomsResult.ResultList || []);
            setStoreysOptions(storeysResult.ResultList || []);
            setFurnishedOptions(furnishedResult.ResultList || []);
            setOccupiedOptions(occupiedResult.ResultList || []);
            setFloorOptions(floorsResult.ResultList || []);
            setOtherBuildingElementsOptions(otherBuildingElementsResult.ResultList || []);
            setOtherTimberBldgElementsOptions(otherTimberBldgElementsResult.ResultList || []);
            setRoofOptions(roofsResult.ResultList || []);
            setWallsOptions(wallsResult.ResultList || []);
            setWeatherOptions(weatherResult.ResultList || []);

            // Set property data
            if (propertyResult) {
                setCurrentProperty(propertyResult);
            }
        } catch (error) {
            console.error("Error loading data:", error);
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

    // Update property field and auto-save
    const updatePropertyField = (field: keyof CustomerModel, value: any) => {
        setCurrentProperty(prev => {
            const updatedProperty = new CustomerModel({
                ...prev,
                [field]: value,
                ModifiedAt: new Date()
            });
            return updatedProperty;
        });
    };

    // Handle field blur (auto-save)
    const handleFieldBlur = async () => {
        if (!customerId) return;

        // Use setState callback to access the current state, just like Customer and Defects pages
        setCurrentProperty(currentPropertyState => {
            if (!currentPropertyState) return currentPropertyState;

            // Save to database with current state
            (async () => {
                try {
                    const updatedProperty = new CustomerModel({
                        ...currentPropertyState,
                        ModifiedAt: new Date()
                    });

                    await CustomerModel.Update(updatedProperty);
                } catch (error) {
                    console.error("Error saving property field:", error);
                }
            })();

            return currentPropertyState; // Return unchanged state
        });
    };

    // Add new option callback functions
    const handleAddNewBuildingTypeCallback = () => {
        setNewBuildingTypeName("");
        setAddBuildingTypeModalOpen(true);
    };

    const handleAddNewOrientationCallback = () => {
        setNewOrientationName("");
        setAddOrientationModalOpen(true);
    };

    const handleAddNewNumBedroomsCallback = () => {
        setNewNumBedroomsName("");
        setAddNumBedroomsModalOpen(true);
    };

    const handleAddNewStoreysCallback = () => {
        setNewStoreysName("");
        setAddStoreysModalOpen(true);
    };

    const handleAddNewFurnishedCallback = () => {
        setNewFurnishedName("");
        setAddFurnishedModalOpen(true);
    };

    const handleAddNewOccupiedCallback = () => {
        setNewOccupiedName("");
        setAddOccupiedModalOpen(true);
    };

    const handleAddNewFloorCallback = () => {
        setNewFloorName("");
        setAddFloorModalOpen(true);
    };

    const handleAddNewOtherBuildingElementsCallback = () => {
        setNewOtherBuildingElementsName("");
        setAddOtherBuildingElementsModalOpen(true);
    };

    const handleAddNewOtherTimberBldgElementsCallback = () => {
        setNewOtherTimberBldgElementsName("");
        setAddOtherTimberBldgElementsModalOpen(true);
    };

    const handleAddNewRoofCallback = () => {
        setNewRoofName("");
        setAddRoofModalOpen(true);
    };

    const handleAddNewWallsCallback = () => {
        setNewWallsName("");
        setAddWallsModalOpen(true);
    };

    const handleAddNewWeatherCallback = () => {
        setNewWeatherName("");
        setAddWeatherModalOpen(true);
    };

    // Save new option functions
    const handleSaveNewBuildingType = async () => {
        if (!newBuildingTypeName.trim()) return;

        setAddBuildingTypeModalLoading(true);
        try {
            const newOption = new O_BuildingTypeModel({
                Code: JC_Utils.generateGuid(),
                Name: newBuildingTypeName.trim()
            });
            await JC_Put(O_BuildingTypeModel, O_BuildingTypeModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_BuildingTypeModel.GetList();
            setBuildingTypeOptions(refreshedOptions.ResultList || []);

            setAddBuildingTypeModalOpen(false);
            setNewBuildingTypeName("");
        } catch (error) {
            console.error("Error saving new building type:", error);
        } finally {
            setAddBuildingTypeModalLoading(false);
        }
    };

    const handleSaveNewOrientation = async () => {
        if (!newOrientationName.trim()) return;

        setAddOrientationModalLoading(true);
        try {
            const newOption = new O_OrientationModel({
                Code: JC_Utils.generateGuid(),
                Name: newOrientationName.trim()
            });
            await JC_Put(O_OrientationModel, O_OrientationModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_OrientationModel.GetList();
            setOrientationOptions(refreshedOptions.ResultList || []);

            setAddOrientationModalOpen(false);
            setNewOrientationName("");
        } catch (error) {
            console.error("Error saving new orientation:", error);
        } finally {
            setAddOrientationModalLoading(false);
        }
    };

    const handleSaveNewNumBedrooms = async () => {
        if (!newNumBedroomsName.trim()) return;

        setAddNumBedroomsModalLoading(true);
        try {
            const newOption = new O_NumBedroomsModel({
                Code: JC_Utils.generateGuid(),
                Name: newNumBedroomsName.trim()
            });
            await JC_Put(O_NumBedroomsModel, O_NumBedroomsModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_NumBedroomsModel.GetList();
            setNumBedroomsOptions(refreshedOptions.ResultList || []);

            setAddNumBedroomsModalOpen(false);
            setNewNumBedroomsName("");
        } catch (error) {
            console.error("Error saving new num bedrooms:", error);
        } finally {
            setAddNumBedroomsModalLoading(false);
        }
    };

    const handleSaveNewStoreys = async () => {
        if (!newStoreysName.trim()) return;

        setAddStoreysModalLoading(true);
        try {
            const newOption = new O_StoreysModel({
                Code: JC_Utils.generateGuid(),
                Name: newStoreysName.trim()
            });
            await JC_Put(O_StoreysModel, O_StoreysModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_StoreysModel.GetList();
            setStoreysOptions(refreshedOptions.ResultList || []);

            setAddStoreysModalOpen(false);
            setNewStoreysName("");
        } catch (error) {
            console.error("Error saving new storeys:", error);
        } finally {
            setAddStoreysModalLoading(false);
        }
    };

    const handleSaveNewFurnished = async () => {
        if (!newFurnishedName.trim()) return;

        setAddFurnishedModalLoading(true);
        try {
            const newOption = new O_FurnishedModel({
                Code: JC_Utils.generateGuid(),
                Name: newFurnishedName.trim()
            });
            await JC_Put(O_FurnishedModel, O_FurnishedModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_FurnishedModel.GetList();
            setFurnishedOptions(refreshedOptions.ResultList || []);

            setAddFurnishedModalOpen(false);
            setNewFurnishedName("");
        } catch (error) {
            console.error("Error saving new furnished:", error);
        } finally {
            setAddFurnishedModalLoading(false);
        }
    };

    const handleSaveNewOccupied = async () => {
        if (!newOccupiedName.trim()) return;

        setAddOccupiedModalLoading(true);
        try {
            const newOption = new O_OccupiedModel({
                Code: JC_Utils.generateGuid(),
                Name: newOccupiedName.trim()
            });
            await JC_Put(O_OccupiedModel, O_OccupiedModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_OccupiedModel.GetList();
            setOccupiedOptions(refreshedOptions.ResultList || []);

            setAddOccupiedModalOpen(false);
            setNewOccupiedName("");
        } catch (error) {
            console.error("Error saving new occupied:", error);
        } finally {
            setAddOccupiedModalLoading(false);
        }
    };

    const handleSaveNewFloor = async () => {
        if (!newFloorName.trim()) return;

        setAddFloorModalLoading(true);
        try {
            const newOption = new O_FloorModel({
                Code: JC_Utils.generateGuid(),
                Name: newFloorName.trim()
            });
            await JC_Put(O_FloorModel, O_FloorModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_FloorModel.GetList();
            setFloorOptions(refreshedOptions.ResultList || []);

            setAddFloorModalOpen(false);
            setNewFloorName("");
        } catch (error) {
            console.error("Error saving new floor:", error);
        } finally {
            setAddFloorModalLoading(false);
        }
    };

    const handleSaveNewOtherBuildingElements = async () => {
        if (!newOtherBuildingElementsName.trim()) return;

        setAddOtherBuildingElementsModalLoading(true);
        try {
            const newOption = new O_OtherBuildingElementsModel({
                Code: JC_Utils.generateGuid(),
                Name: newOtherBuildingElementsName.trim()
            });
            await JC_Put(O_OtherBuildingElementsModel, O_OtherBuildingElementsModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_OtherBuildingElementsModel.GetList();
            setOtherBuildingElementsOptions(refreshedOptions.ResultList || []);

            setAddOtherBuildingElementsModalOpen(false);
            setNewOtherBuildingElementsName("");
        } catch (error) {
            console.error("Error saving new other building elements:", error);
        } finally {
            setAddOtherBuildingElementsModalLoading(false);
        }
    };

    const handleSaveNewOtherTimberBldgElements = async () => {
        if (!newOtherTimberBldgElementsName.trim()) return;

        setAddOtherTimberBldgElementsModalLoading(true);
        try {
            const newOption = new O_OtherTimberBldgElementsModel({
                Code: JC_Utils.generateGuid(),
                Name: newOtherTimberBldgElementsName.trim()
            });
            await JC_Put(O_OtherTimberBldgElementsModel, O_OtherTimberBldgElementsModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_OtherTimberBldgElementsModel.GetList();
            setOtherTimberBldgElementsOptions(refreshedOptions.ResultList || []);

            setAddOtherTimberBldgElementsModalOpen(false);
            setNewOtherTimberBldgElementsName("");
        } catch (error) {
            console.error("Error saving new other timber building elements:", error);
        } finally {
            setAddOtherTimberBldgElementsModalLoading(false);
        }
    };

    const handleSaveNewRoof = async () => {
        if (!newRoofName.trim()) return;

        setAddRoofModalLoading(true);
        try {
            const newOption = new O_RoofModel({
                Code: JC_Utils.generateGuid(),
                Name: newRoofName.trim()
            });
            await JC_Put(O_RoofModel, O_RoofModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_RoofModel.GetList();
            setRoofOptions(refreshedOptions.ResultList || []);

            setAddRoofModalOpen(false);
            setNewRoofName("");
        } catch (error) {
            console.error("Error saving new roof:", error);
        } finally {
            setAddRoofModalLoading(false);
        }
    };

    const handleSaveNewWalls = async () => {
        if (!newWallsName.trim()) return;

        setAddWallsModalLoading(true);
        try {
            const newOption = new O_WallsModel({
                Code: JC_Utils.generateGuid(),
                Name: newWallsName.trim()
            });
            await JC_Put(O_WallsModel, O_WallsModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_WallsModel.GetList();
            setWallsOptions(refreshedOptions.ResultList || []);

            setAddWallsModalOpen(false);
            setNewWallsName("");
        } catch (error) {
            console.error("Error saving new walls:", error);
        } finally {
            setAddWallsModalLoading(false);
        }
    };

    const handleSaveNewWeather = async () => {
        if (!newWeatherName.trim()) return;

        setAddWeatherModalLoading(true);
        try {
            const newOption = new O_WeatherModel({
                Code: JC_Utils.generateGuid(),
                Name: newWeatherName.trim()
            });
            await JC_Put(O_WeatherModel, O_WeatherModel.apiRoute, newOption);

            // Refresh options
            const refreshedOptions = await O_WeatherModel.GetList();
            setWeatherOptions(refreshedOptions.ResultList || []);

            setAddWeatherModalOpen(false);
            setNewWeatherName("");
        } catch (error) {
            console.error("Error saving new weather:", error);
        } finally {
            setAddWeatherModalLoading(false);
        }
    };

    // Handle option updated callbacks - refresh options list after updates/deletions
    const handleBuildingTypeOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_BuildingTypeModel.GetList();
            setBuildingTypeOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing building type options:", error);
        }
    };

    const handleOrientationOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_OrientationModel.GetList();
            setOrientationOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing orientation options:", error);
        }
    };

    const handleNumBedroomsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_NumBedroomsModel.GetList();
            setNumBedroomsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing num bedrooms options:", error);
        }
    };

    const handleStoreysOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_StoreysModel.GetList();
            setStoreysOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing storeys options:", error);
        }
    };

    const handleFurnishedOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_FurnishedModel.GetList();
            setFurnishedOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing furnished options:", error);
        }
    };

    const handleOccupiedOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_OccupiedModel.GetList();
            setOccupiedOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing occupied options:", error);
        }
    };

    const handleFloorOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_FloorModel.GetList();
            setFloorOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing floor options:", error);
        }
    };

    const handleOtherBuildingElementsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_OtherBuildingElementsModel.GetList();
            setOtherBuildingElementsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing other building elements options:", error);
        }
    };

    const handleOtherTimberBldgElementsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_OtherTimberBldgElementsModel.GetList();
            setOtherTimberBldgElementsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing other timber building elements options:", error);
        }
    };

    const handleRoofOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_RoofModel.GetList();
            setRoofOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing roof options:", error);
        }
    };

    const handleWallsOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_WallsModel.GetList();
            setWallsOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing walls options:", error);
        }
    };

    const handleWeatherOptionUpdated = async (updatedOption: any) => {
        try {
            const refreshedOptions = await O_WeatherModel.GetList();
            setWeatherOptions(refreshedOptions.ResultList || []);
        } catch (error) {
            console.error("Error refreshing weather options:", error);
        }
    };

    // Create the form tablet model
    const formTabletModel: JC_FormTabletModel = {
        headerLabel: JC_Utils.formatPageHeaderTitle(currentProperty.Address, "Property"),
        fieldsPaneHeader: "Property Fields",
        backButtonLink: `/customer`,
        onBlurCallback: handleFieldBlur,
        onChangeDelayCallback: handleFieldBlur,
        sections: [
            {
                Heading: "Property Details",
                Fields: [
                    {
                        inputId: "building-type",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Building Type",
                        value: currentProperty.BuildingTypeListJson || "[]",
                        options: buildingTypeOptions,
                        onChange: newValue => {
                            updatePropertyField("BuildingTypeListJson", newValue);
                            // Update the extended field for display
                            try {
                                const selectedCodes = JSON.parse(newValue as string);
                                setCurrentProperty(
                                    prev =>
                                        new CustomerModel({
                                            ...prev,
                                            Ex_BuildingTypeCodesList: selectedCodes
                                        })
                                );
                            } catch (error) {
                                console.error("Error parsing building type selection:", error);
                            }
                        },
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return Array.isArray(parsed) && parsed.length === 0 ? "Building Type is required." : "";
                            } catch {
                                return "Building Type is required.";
                            }
                        },
                        addNewOptionCallback: handleAddNewBuildingTypeCallback,
                        onOptionUpdated: handleBuildingTypeOptionUpdated
                    },
                    {
                        inputId: "company-strata-title",
                        type: FieldTypeEnum.Text,
                        label: "Company/Strata Title",
                        value: currentProperty.CompanyStrataTitle || "",
                        onChange: newValue => updatePropertyField("CompanyStrataTitle", newValue)
                    },
                    {
                        inputId: "num-bedrooms",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Number of Bedrooms",
                        value: currentProperty.NumBedroomsListJson || "[]",
                        options: numBedroomsOptions,
                        onChange: newValue => updatePropertyField("NumBedroomsListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Number of Bedrooms is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewNumBedroomsCallback,
                        onOptionUpdated: handleNumBedroomsOptionUpdated
                    },
                    {
                        inputId: "orientation",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Orientation",
                        value: currentProperty.OrientationListJson || "[]",
                        options: orientationOptions,
                        onChange: newValue => updatePropertyField("OrientationListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Orientation is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewOrientationCallback,
                        onOptionUpdated: handleOrientationOptionUpdated
                    },
                    {
                        inputId: "storeys",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Storeys",
                        value: currentProperty.StoreysListJson || "[]",
                        options: storeysOptions,
                        onChange: newValue => updatePropertyField("StoreysListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Storeys is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewStoreysCallback,
                        onOptionUpdated: handleStoreysOptionUpdated
                    },
                    {
                        inputId: "furnished",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Furnished",
                        value: currentProperty.FurnishedListJson || "[]",
                        options: furnishedOptions,
                        onChange: newValue => updatePropertyField("FurnishedListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Furnished is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewFurnishedCallback,
                        onOptionUpdated: handleFurnishedOptionUpdated
                    },
                    {
                        inputId: "occupied",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Occupied",
                        value: currentProperty.OccupiedListJson || "[]",
                        options: occupiedOptions,
                        onChange: newValue => updatePropertyField("OccupiedListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Occupied is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewOccupiedCallback,
                        onOptionUpdated: handleOccupiedOptionUpdated
                    }
                ]
            },
            {
                Heading: "Construction Method",
                Fields: [
                    {
                        inputId: "floor",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Floor",
                        value: currentProperty.FloorListJson || "[]",
                        options: floorOptions,
                        onChange: newValue => updatePropertyField("FloorListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Floor is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewFloorCallback,
                        onOptionUpdated: handleFloorOptionUpdated
                    },
                    {
                        inputId: "other-building",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Other Building Elements",
                        value: currentProperty.OtherBuildingElementsListJson || "[]",
                        options: otherBuildingElementsOptions,
                        onChange: newValue => updatePropertyField("OtherBuildingElementsListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Other Building Elements is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewOtherBuildingElementsCallback,
                        onOptionUpdated: handleOtherBuildingElementsOptionUpdated
                    },
                    {
                        inputId: "other-timber",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Other Timber Building Elements",
                        value: currentProperty.OtherTimberBldgElementsListJson || "[]",
                        options: otherTimberBldgElementsOptions,
                        onChange: newValue => updatePropertyField("OtherTimberBldgElementsListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Other Timber Building Elements is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewOtherTimberBldgElementsCallback,
                        onOptionUpdated: handleOtherTimberBldgElementsOptionUpdated
                    },
                    {
                        inputId: "roof",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Roof",
                        value: currentProperty.RoofListJson || "[]",
                        options: roofOptions,
                        onChange: newValue => updatePropertyField("RoofListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Roof is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewRoofCallback,
                        onOptionUpdated: handleRoofOptionUpdated
                    },
                    {
                        inputId: "walls",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Walls",
                        value: currentProperty.WallsListJson || "[]",
                        options: wallsOptions,
                        onChange: newValue => updatePropertyField("WallsListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Walls is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewWallsCallback,
                        onOptionUpdated: handleWallsOptionUpdated
                    }
                ]
            },
            {
                Heading: "Inspection Conditions",
                Fields: [
                    {
                        inputId: "weather",
                        type: FieldTypeEnum.MultiDropdown,
                        label: "Weather",
                        value: currentProperty.WeatherListJson || "[]",
                        options: weatherOptions,
                        onChange: newValue => updatePropertyField("WeatherListJson", newValue),
                        validate: value => {
                            try {
                                const parsed = JSON.parse(value?.toString() || "[]");
                                return parsed.length === 0 ? "Weather is required." : "";
                            } catch {
                                return "Invalid selection.";
                            }
                        },
                        addNewOptionCallback: handleAddNewWeatherCallback,
                        onOptionUpdated: handleWeatherOptionUpdated
                    }
                ]
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
        <div className={styles.propertyPageContainer}>
            <div className={styles.formTabletWrapper}>
                <JC_FormTablet model={formTabletModel} />
            </div>

            {/* Add New Option Modals */}
            <JC_Modal isOpen={addBuildingTypeModalOpen} onCancel={() => setAddBuildingTypeModalOpen(false)} title="Add New Building Type">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-building-type-name" type={FieldTypeEnum.Text} value={newBuildingTypeName} onChange={setNewBuildingTypeName} placeholder="Enter building type name" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddBuildingTypeModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewBuildingType} isLoading={addBuildingTypeModalLoading} isDisabled={!newBuildingTypeName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addOrientationModalOpen} onCancel={() => setAddOrientationModalOpen(false)} title="Add New Orientation">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-orientation-name" type={FieldTypeEnum.Text} value={newOrientationName} onChange={setNewOrientationName} placeholder="Enter orientation name" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddOrientationModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewOrientation} isLoading={addOrientationModalLoading} isDisabled={!newOrientationName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addNumBedroomsModalOpen} onCancel={() => setAddNumBedroomsModalOpen(false)} title="Add New Number of Bedrooms">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-num-bedrooms-name" type={FieldTypeEnum.Text} value={newNumBedroomsName} onChange={setNewNumBedroomsName} placeholder="Enter number of bedrooms" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddNumBedroomsModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewNumBedrooms} isLoading={addNumBedroomsModalLoading} isDisabled={!newNumBedroomsName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addStoreysModalOpen} onCancel={() => setAddStoreysModalOpen(false)} title="Add New Storeys">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-storeys-name" type={FieldTypeEnum.Text} value={newStoreysName} onChange={setNewStoreysName} placeholder="Enter storeys" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddStoreysModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewStoreys} isLoading={addStoreysModalLoading} isDisabled={!newStoreysName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addFurnishedModalOpen} onCancel={() => setAddFurnishedModalOpen(false)} title="Add New Furnished Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-furnished-name" type={FieldTypeEnum.Text} value={newFurnishedName} onChange={setNewFurnishedName} placeholder="Enter furnished option" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddFurnishedModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewFurnished} isLoading={addFurnishedModalLoading} isDisabled={!newFurnishedName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addOccupiedModalOpen} onCancel={() => setAddOccupiedModalOpen(false)} title="Add New Occupied Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-occupied-name" type={FieldTypeEnum.Text} value={newOccupiedName} onChange={setNewOccupiedName} placeholder="Enter occupied option" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddOccupiedModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewOccupied} isLoading={addOccupiedModalLoading} isDisabled={!newOccupiedName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addFloorModalOpen} onCancel={() => setAddFloorModalOpen(false)} title="Add New Floor Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-floor-name" type={FieldTypeEnum.Text} value={newFloorName} onChange={setNewFloorName} placeholder="Enter floor option" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddFloorModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewFloor} isLoading={addFloorModalLoading} isDisabled={!newFloorName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addOtherBuildingElementsModalOpen} onCancel={() => setAddOtherBuildingElementsModalOpen(false)} title="Add New Other Building Elements">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-other-building-elements-name" type={FieldTypeEnum.Text} value={newOtherBuildingElementsName} onChange={setNewOtherBuildingElementsName} placeholder="Enter other building elements" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddOtherBuildingElementsModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewOtherBuildingElements} isLoading={addOtherBuildingElementsModalLoading} isDisabled={!newOtherBuildingElementsName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addOtherTimberBldgElementsModalOpen} onCancel={() => setAddOtherTimberBldgElementsModalOpen(false)} title="Add New Other Timber Building Elements">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-other-timber-bldg-elements-name" type={FieldTypeEnum.Text} value={newOtherTimberBldgElementsName} onChange={setNewOtherTimberBldgElementsName} placeholder="Enter other timber building elements" autoFocus={true} />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddOtherTimberBldgElementsModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewOtherTimberBldgElements} isLoading={addOtherTimberBldgElementsModalLoading} isDisabled={!newOtherTimberBldgElementsName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addRoofModalOpen} onCancel={() => setAddRoofModalOpen(false)} title="Add New Roof Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-roof-name" type={FieldTypeEnum.Text} value={newRoofName} onChange={setNewRoofName} placeholder="Enter roof option" />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddRoofModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewRoof} isLoading={addRoofModalLoading} isDisabled={!newRoofName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addWallsModalOpen} onCancel={() => setAddWallsModalOpen(false)} title="Add New Walls Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-walls-name" type={FieldTypeEnum.Text} value={newWallsName} onChange={setNewWallsName} placeholder="Enter walls option" />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddWallsModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewWalls} isLoading={addWallsModalLoading} isDisabled={!newWallsName.trim()} />
                    </div>
                </div>
            </JC_Modal>

            <JC_Modal isOpen={addWeatherModalOpen} onCancel={() => setAddWeatherModalOpen(false)} title="Add New Weather Option">
                <div className={styles.addOptionModalContent}>
                    <JC_Field inputId="new-weather-name" type={FieldTypeEnum.Text} value={newWeatherName} onChange={setNewWeatherName} placeholder="Enter weather option" />
                    <div className={styles.addOptionModalButtons}>
                        <JC_Button text="Cancel" onClick={() => setAddWeatherModalOpen(false)} isSecondary={true} />
                        <JC_Button text="Save" onClick={handleSaveNewWeather} isLoading={addWeatherModalLoading} isDisabled={!newWeatherName.trim()} />
                    </div>
                </div>
            </JC_Modal>
        </div>
    );
}
