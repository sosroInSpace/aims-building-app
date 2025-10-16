"use client";

import { JC_Utils_Dates } from "../Utils";
import JC_Field from "../components/JC_Field/JC_Field";
import JC_FormTablet, { JC_FormTabletModel } from "../components/JC_FormTablet/JC_FormTablet";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import { FieldTypeEnum } from "../enums/FieldType";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { CustomerModel } from "../models/Customer";
import { CustomerDefectModel } from "../models/CustomerDefect";
import { O_ReportTypeModel } from "../models/O_ReportType";
import { UserModel } from "../models/User";
import styles from "./page.module.scss";
import { JC_Utils } from "@/app/Utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function CustomerPage() {
    const session = useSession();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerModel>(new CustomerModel({ UserId: session.data?.user.Id }));
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [customers, setCustomers] = useState<CustomerModel[]>([]);
    const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});

    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState<string>("");

    // Option lists
    const [reportTypeOptions, setReportTypeOptions] = useState<O_ReportTypeModel[]>([]);

    // Ref for scrolling to selected customer
    const reportsListRef = useRef<HTMLDivElement>(null);

    // Function to scroll to selected customer tile
    const scrollToSelectedCustomer = useCallback((customerId: string) => {
        setTimeout(() => {
            if (reportsListRef.current) {
                const selectedTile = reportsListRef.current.querySelector(`[data-customer-id="${customerId}"]`);
                if (selectedTile) {
                    selectedTile.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
        }, 100); // Small delay to ensure DOM is updated
    }, []);

    // Load defect counts for all customers
    const loadDefectCounts = useCallback(async (customerList: CustomerModel[]) => {
        try {
            const counts: Record<string, number> = {};

            // Load defect counts for each customer
            await Promise.all(
                customerList.map(async customer => {
                    try {
                        const defects = await CustomerDefectModel.GetByCustomerId(customer.Id);
                        counts[customer.Id] = defects.ResultList.length;
                    } catch (error) {
                        console.error(`Error loading defects for customer ${customer.Id}:`, error);
                        counts[customer.Id] = 0;
                    }
                })
            );

            setDefectCounts(counts);
        } catch (error) {
            console.error("Error loading defect counts:", error);
        }
    }, []);

    // Load customer data
    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Check if there's a selected customer in localStorage
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            // Load customers for the Reports pane, sorted by ModifiedAt desc and CreatedAt desc
            try {
                const result = await CustomerModel.GetList({
                    Sorts: [
                        { SortField: "ModifiedAt", SortAsc: false, nullsFirst: true },
                        { SortField: "CreatedAt", SortAsc: false, nullsFirst: true }
                    ]
                });
                const customerList = Array.isArray(result.ResultList) ? result.ResultList : [];
                setCustomers(customerList);

                // Load defect counts for all customers
                await loadDefectCounts(customerList);
            } catch (error) {
                console.error("Error fetching customers:", error);
                setCustomers([]);
            }

            // Load report type options - filter by user's qualifications only if user is not an admin
            try {
                // Check if user is an admin (no EmployeeOfUserId means they are an admin)
                const isAdmin = !session.data?.user?.EmployeeOfUserId;

                if (!isAdmin) {
                    // Get the user record from backend to get Ex_ReportTypeList
                    const userWithExtendedFields = await UserModel.Get(session.data!.user.Id);
                    if (userWithExtendedFields?.Ex_ReportTypeList && userWithExtendedFields.Ex_ReportTypeList.length > 0) {
                        // Use the user's filtered report types (only for non-admin users)
                        setReportTypeOptions(userWithExtendedFields.Ex_ReportTypeList);
                    } else {
                        // If no qualifications set, load all report types
                        const reportTypesResult = await O_ReportTypeModel.GetList();
                        setReportTypeOptions(reportTypesResult.ResultList || []);
                    }
                } else {
                    // Load all report types for admin users
                    const reportTypesResult = await O_ReportTypeModel.GetList();
                    setReportTypeOptions(reportTypesResult.ResultList || []);
                }
            } catch (error) {
                console.error("Error fetching report types:", error);
                setReportTypeOptions([]);
            }

            // If there's a selected customer, load their data
            if (selectedCustomerId) {
                try {
                    const customerExists = await CustomerModel.ItemExists(selectedCustomerId);
                    if (customerExists) {
                        const customerData = await CustomerModel.Get(selectedCustomerId);
                        if (customerData) {
                            setCurrentCustomer(customerData);
                            setSelectedCustomerId(selectedCustomerId);
                            // Scroll to the selected customer after the component has rendered
                            scrollToSelectedCustomer(selectedCustomerId);
                        } else {
                            // Customer data not found, clear localStorage
                            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                            setSelectedCustomerId(null);
                        }
                    } else {
                        // Customer doesn't exist, clear localStorage
                        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                        setSelectedCustomerId(null);
                    }
                } catch (error) {
                    console.error("Error loading selected customer:", error);
                    localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                    setSelectedCustomerId(null);
                }
            } else {
                // No selected customer, prepare for new customer creation
                setSelectedCustomerId(null);

                // Auto-populate inspector fields with current user data for new customers
                if (session.data?.user) {
                    const user = session.data.user;
                    const inspectorName = `${user.FirstName} ${user.LastName}`.trim();

                    setCurrentCustomer(
                        prev =>
                            new CustomerModel({
                                ...prev,
                                InspectorName: inspectorName,
                                InspectorPhone: user.Phone || "",
                                InspectorQualification: user.Qualification || ""
                            })
                    );
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
            setInitialised(true);
        }
    }, [session.data, loadDefectCounts, scrollToSelectedCustomer]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Show welcome message if just logged in
    useEffect(() => {
        if (localStorage.getItem(LocalStorageKeyEnum.JC_ShowLoggedInWelcome) == "1" && session.data != null) {
            JC_Utils.showToastSuccess(`Welcome ${session.data?.user.FirstName}!`);
            localStorage.setItem(LocalStorageKeyEnum.JC_ShowLoggedInWelcome, "0");
        }
    }, [session.data]);

    // Trigger header animation
    const triggerHeaderAnimation = () => {
        const buttons = ["property", "defects", "reportSummary", "report"];
        buttons.forEach((page, index) => {
            setTimeout(() => {
                const button = document.querySelector(`a[href="/${page}"]`);
                if (button) {
                    button.classList.add("animate-glow");
                    setTimeout(() => button.classList.remove("animate-glow"), 400);
                }
            }, index * 100);
        });
    };

    // Handle customer tile click
    const handleCustomerClick = (customer: CustomerModel) => {
        try {
            // Use the customer data that's already loaded in the list
            setCurrentCustomer(customer);
            setSelectedCustomerId(customer.Id);
            localStorage.setItem(LocalStorageKeyEnum.JC_SelectedCustomer, customer.Id);
            // Scroll to the selected customer
            scrollToSelectedCustomer(customer.Id);
            // Trigger header animation
            triggerHeaderAnimation();
        } catch (error) {
            console.error("Error selecting customer:", error);
        }
    };

    // Update customer field and sync with list
    const updateCustomerField = (field: keyof CustomerModel, value: any) => {
        setCurrentCustomer(prev => {
            const updatedCustomer = new CustomerModel({
                ...prev,
                [field]: value,
                ModifiedAt: new Date()
            });

            // Update the customer in the local list and move to beginning
            setCustomers(prevCustomers => {
                // Remove the updated customer from its current position
                const filteredCustomers = prevCustomers.filter(customer => customer.Id !== updatedCustomer.Id);
                // Add the updated customer to the beginning of the list
                return [updatedCustomer, ...filteredCustomers];
            });

            // Scroll to the updated customer that was moved to the top
            scrollToSelectedCustomer(updatedCustomer.Id);

            return updatedCustomer;
        });
    };

    // Handle field blur - save customer to database
    const handleFieldBlur = async () => {
        // Use callback to get the current state
        setCurrentCustomer(currentCustomerState => {
            if (!currentCustomerState || !currentCustomerState.Id) return currentCustomerState;

            // Save to database with current state
            (async () => {
                try {
                    // Update the customer in the database
                    await CustomerModel.Update(currentCustomerState);

                    // Update the customer in the local list to trigger re-render
                    setCustomers(prevCustomers => prevCustomers.map(customer => (customer.Id === currentCustomerState.Id ? new CustomerModel(currentCustomerState) : customer)));
                } catch (error) {
                    console.error("Error saving customer:", error);
                    // Show error toast - you can add toast notification here if needed
                    JC_Utils.showToastError("Failed to save customer changes");
                }
            })();

            return currentCustomerState; // Return unchanged state
        });
    };

    // Handle new customer button click - now includes creation logic
    const handleNewCustomerClick = async () => {
        try {
            setIsLoading(true);

            // Create new customer with user data
            const newCustomer = new CustomerModel({ UserId: session.data?.user.Id });
            if (session.data?.user) {
                const user = session.data.user;
                const inspectorName = `${user.FirstName} ${user.LastName}`.trim();
                newCustomer.InspectorName = inspectorName;
                newCustomer.InspectorPhone = user.Phone || "";
                newCustomer.InspectorQualification = user.Qualification || "";
            }

            // Create the customer in the database
            const response = await CustomerModel.Create(newCustomer);
            if (response) {
                // Set the newly created customer as selected and stay on the page
                localStorage.setItem(LocalStorageKeyEnum.JC_SelectedCustomer, newCustomer.Id);
                setSelectedCustomerId(newCustomer.Id);
                setCurrentCustomer(newCustomer);

                // Add the new customer to the beginning of the front-end list without re-sorting
                setCustomers(prevCustomers => {
                    const updatedCustomers = [newCustomer, ...prevCustomers];
                    // Load defect counts for the updated customer list
                    loadDefectCounts(updatedCustomers);
                    return updatedCustomers;
                });

                // Scroll to the newly created customer
                scrollToSelectedCustomer(newCustomer.Id);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error creating customer:", error);
            setIsLoading(false);
        }
    };

    // Filter customers based on search text (address only)
    const filteredCustomers = customers.filter(customer => {
        if (!searchText.trim()) return true;

        const searchLower = searchText.toLowerCase();
        return customer.Address?.toLowerCase().includes(searchLower);
    });

    // Create the form tablet model
    const formTabletModel: JC_FormTabletModel = {
        headerLabel: currentCustomer.Address,
        fieldsPaneHeader: "Job Details",
        panesSwitched: true,
        inputPaneWidth: 450,
        onBlurCallback: handleFieldBlur,
        onChangeDelayCallback: handleFieldBlur,
        noSelectionViewOverride: (
            <div className={styles.reportsContainer}>
                <div className={styles.addDocumentButton} onClick={handleNewCustomerClick}>
                    <Image src="/icons/DocumentWhite.webp" alt="Document" width={40} height={40} className={styles.documentImage} unoptimized />
                    <div className={styles.plusIcon}>+</div>
                </div>
                <div className={styles.searchContainer}>
                    <JC_Field inputId="customer-search" type={FieldTypeEnum.Text} placeholder="Filter by Address" value={searchText} onChange={newValue => setSearchText(newValue as string)} overrideClass={styles.searchField} inputOverrideClass={styles.searchInput} />
                </div>
                <div className={styles.reportsList} ref={reportsListRef}>
                    {filteredCustomers.length === 0 ? (
                        <div className={styles.noReports}>{customers.length === 0 ? "No reports found" : "No reports match your search"}</div>
                    ) : (
                        filteredCustomers.map(customer => (
                            <div key={`${customer.Id} ${customer.Address}`} data-customer-id={customer.Id} className={`${styles.reportTile} ${selectedCustomerId === customer.Id ? styles.selectedTile : ""}`} onClick={() => handleCustomerClick(customer)}>
                                <div className={styles.reportContent}>
                                    <div className={styles.reportAddress}>{customer.Address || "No address"}</div>
                                    <div className={styles.reportDefects}>
                                        {(() => {
                                            const count = defectCounts[customer.Id] ?? 0;
                                            return count === 1 ? "1 DEFECT" : `${count} DEFECTS`;
                                        })()}
                                    </div>
                                </div>
                                <div className={styles.modifiedContainer}>Modified {customer.ModifiedAt ? JC_Utils_Dates.formatDateFull(new Date(customer.ModifiedAt)) : "N/A"}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ),
        noSelectionHeaderOverride: "Report",
        sections: selectedCustomerId
            ? [
                  {
                      Heading: "Report Type",
                      Fields: [
                          {
                              inputId: "reportType",
                              type: FieldTypeEnum.Dropdown,
                              label: "Report Type",
                              value: currentCustomer.ReportTypeCode || "",
                              options: reportTypeOptions,
                              onChange: newValue => updateCustomerField("ReportTypeCode", newValue),
                              optionsModel: O_ReportTypeModel,
                              validate: value => (JC_Utils.stringNullOrEmpty(value?.toString()) ? "Report Type is required." : "")
                          }
                      ]
                  },
                  {
                      Heading: "Client Details",
                      Fields: [
                          {
                              inputId: "clientName",
                              type: FieldTypeEnum.Text,
                              label: "Name",
                              value: currentCustomer.ClientName || "",
                              onChange: newValue => updateCustomerField("ClientName", newValue),
                              validate: value => (JC_Utils.stringNullOrEmpty(value?.toString()) ? "Client name is required." : "")
                          },
                          {
                              inputId: "clientPhone",
                              type: FieldTypeEnum.Text,
                              label: "Phone",
                              value: currentCustomer.ClientPhone || "",
                              onChange: newValue => updateCustomerField("ClientPhone", newValue)
                          },
                          {
                              inputId: "clientEmail",
                              type: FieldTypeEnum.Email,
                              label: "Email",
                              value: currentCustomer.ClientEmail || "",
                              onChange: newValue => updateCustomerField("ClientEmail", newValue)
                          },
                          {
                              inputId: "clientPrincipalName",
                              type: FieldTypeEnum.Text,
                              label: "Principal Name",
                              value: currentCustomer.ClientPrincipalName || "",
                              onChange: newValue => updateCustomerField("ClientPrincipalName", newValue)
                          }
                      ]
                  },
                  {
                      Heading: "Inspection Details",
                      Fields: [
                          {
                              inputId: "address",
                              type: FieldTypeEnum.Text,
                              label: "Address",
                              value: currentCustomer.Address || "",
                              onChange: newValue => updateCustomerField("Address", newValue),
                              validate: value => (JC_Utils.stringNullOrEmpty(value?.toString()) ? "Address is required." : "")
                          },
                          {
                              inputId: "postalAddress",
                              type: FieldTypeEnum.Text,
                              label: "Postal Address",
                              value: currentCustomer.PostalAddress || "",
                              onChange: newValue => updateCustomerField("PostalAddress", newValue)
                          },
                          {
                              inputId: "inspectionDate",
                              type: FieldTypeEnum.Date,
                              label: "Inspection Date",
                              value: currentCustomer.InspectionDate ? new Date(currentCustomer.InspectionDate).toISOString() : "",
                              onChange: newValue => updateCustomerField("InspectionDate", JC_Utils_Dates.toTimezoneSafeDate(newValue))
                          }
                      ]
                  },
                  {
                      Heading: "Inspector Details",
                      Fields: [
                          {
                              inputId: "inspectorName",
                              type: FieldTypeEnum.Text,
                              label: "Inspector Name",
                              value: currentCustomer.InspectorName || "",
                              onChange: newValue => updateCustomerField("InspectorName", newValue),
                              readOnly: true
                          },
                          {
                              inputId: "inspectorPhone",
                              type: FieldTypeEnum.Text,
                              label: "Inspector Phone",
                              value: currentCustomer.InspectorPhone || "",
                              onChange: newValue => updateCustomerField("InspectorPhone", newValue),
                              readOnly: true
                          },
                          {
                              inputId: "inspectorQualification",
                              type: FieldTypeEnum.Text,
                              label: "Inspector Qualification",
                              value: currentCustomer.InspectorQualification || "",
                              onChange: newValue => updateCustomerField("InspectorQualification", newValue),
                              readOnly: true
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
    return !initialised ? <JC_Spinner isPageBody /> : <JC_FormTablet model={formTabletModel} />;
}
