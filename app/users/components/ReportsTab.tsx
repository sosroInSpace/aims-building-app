"use client";

import { JC_Utils } from "../../Utils";
import { JC_Utils_Dates } from "../../Utils";
import JC_Field from "../../components/JC_Field/JC_Field";
import JC_FormTablet, { JC_FormTabletModel } from "../../components/JC_FormTablet/JC_FormTablet";
import JC_Spinner from "../../components/JC_Spinner/JC_Spinner";
import { FieldTypeEnum } from "../../enums/FieldType";
import { LocalStorageKeyEnum } from "../../enums/LocalStorageKey";
import { CustomerModel } from "../../models/Customer";
import { CustomerDefectModel } from "../../models/CustomerDefect";
import { O_ReportTypeModel } from "../../models/O_ReportType";
import styles from "../page.module.scss";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";

export default function ReportsTab() {
    const session = useSession();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerModel>(new CustomerModel({}));
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [customers, setCustomers] = useState<CustomerModel[]>([]);
    const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState<string>("");
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
        }, 100);
    }, []);

    // Load defect counts for all customers
    const loadDefectCounts = useCallback(async (customerList: CustomerModel[]) => {
        try {
            const counts: Record<string, number> = {};
            for (const customer of customerList) {
                const defects = await CustomerDefectModel.GetByCustomerId(customer.Id);
                counts[customer.Id] = defects.ResultList.length;
            }
            setDefectCounts(counts);
        } catch (error) {
            console.error("Error loading defect counts:", error);
        }
    }, []);

    // - EFFECTS - //
    useEffect(() => {
        const init = async () => {
            try {
                // Load report type options - filter by user's qualifications only if user is not an admin
                // Check if user is an admin (no EmployeeOfUserId means they are an admin)
                const isAdmin = !session.data?.user?.EmployeeOfUserId;

                if (!isAdmin && session.data?.user?.Ex_ReportTypeList) {
                    // Use the user's filtered report types (only for non-admin users)
                    setReportTypeOptions(session.data.user.Ex_ReportTypeList);
                } else {
                    // Load all report types for admin users or users with no qualifications set
                    const reportTypes = await O_ReportTypeModel.GetList();
                    setReportTypeOptions(reportTypes.ResultList);
                }

                // Load customers for employees of admin
                const customersResult = await CustomerModel.GetListForEmployeesOfAdmin();
                setCustomers(customersResult.ResultList);

                // Load defect counts
                await loadDefectCounts(customersResult.ResultList);

                // Check if there's a selected customer in localStorage
                const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                if (selectedCustomerId) {
                    // Find the customer in the loaded list
                    const selectedCustomer = customersResult.ResultList.find(c => c.Id === selectedCustomerId);
                    if (selectedCustomer) {
                        // Check if this customer exists and is not deleted
                        const customerExists = await CustomerModel.ItemExists(selectedCustomerId);
                        if (customerExists) {
                            // Load the full customer data
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
                    } else {
                        // Customer not in the employee reports list, clear localStorage
                        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                        setSelectedCustomerId(null);
                    }
                }

                setInitialised(true);
            } catch (error) {
                console.error("Error initializing reports tab:", error);
                setInitialised(true);
            }
        };
        init();
    }, [session.data, loadDefectCounts, scrollToSelectedCustomer]);

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

    // Handle customer click
    const handleCustomerClick = useCallback(
        (customer: CustomerModel) => {
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
        },
        [scrollToSelectedCustomer]
    );

    // Update customer field
    const updateCustomerField = useCallback((fieldName: keyof CustomerModel, value: any) => {
        setCurrentCustomer(prev => {
            const updated = new CustomerModel({ ...prev, [fieldName]: value });
            return updated;
        });
    }, []);

    // Handle field blur - save customer to database
    const handleFieldBlur = useCallback(async () => {
        if (!currentCustomer || !currentCustomer.Id) return;

        try {
            await CustomerModel.Update(currentCustomer);
            // Update the customer in the local list
            setCustomers(prevCustomers => prevCustomers.map(customer => (customer.Id === currentCustomer.Id ? new CustomerModel(currentCustomer) : customer)));
        } catch (error) {
            console.error("Error saving customer:", error);
            JC_Utils.showToastError("Failed to save customer changes");
        }
    }, [currentCustomer]);

    // Filter customers based on search text (address and user name)
    const filteredCustomers = customers.filter(customer => {
        if (!searchText.trim()) return true;
        const searchLower = searchText.toLowerCase();

        // Check address
        const addressMatch = customer.Address?.toLowerCase().includes(searchLower);

        // Check user name (first + last name)
        const userFirstName = customer.Ex_UserFirstName || "";
        const userLastName = customer.Ex_UserLastName || "";
        const fullUserName = `${userFirstName} ${userLastName}`.trim();
        const userNameMatch = fullUserName.toLowerCase().includes(searchLower);

        return addressMatch || userNameMatch;
    });

    // Create the form tablet model
    const formTabletModel: JC_FormTabletModel = {
        headerLabel: currentCustomer.Address || "Employee Reports",
        fieldsPaneHeader: "Job Details",
        panesSwitched: true,
        inputPaneWidth: 450,
        onBlurCallback: handleFieldBlur,
        onChangeDelayCallback: handleFieldBlur,
        noSelectionViewOverride: (
            <div className={styles.reportsContainer}>
                <div className={styles.searchContainer}>
                    <JC_Field inputId="reports-search" type={FieldTypeEnum.Text} placeholder="Filter by Address or User" value={searchText} onChange={newValue => setSearchText(newValue as string)} overrideClass={styles.searchField} inputOverrideClass={styles.searchInput} />
                </div>
                <div className={styles.reportsList} ref={reportsListRef}>
                    {filteredCustomers.length === 0 ? (
                        <div className={styles.noReports}>{customers.length === 0 ? "No employee reports found" : "No reports match your search"}</div>
                    ) : (
                        filteredCustomers.map(customer => (
                            <div key={`${customer.Id} ${customer.Address}`} data-customer-id={customer.Id} className={`${styles.reportTile} ${selectedCustomerId === customer.Id ? styles.selectedTile : ""}`} onClick={() => handleCustomerClick(customer)}>
                                <div className={styles.reportContent}>
                                    <div className={styles.reportAddress}>{customer.Address || "No address"}</div>
                                    <div className={styles.reportDefects}>
                                        {(() => {
                                            const userFirstName = customer.Ex_UserFirstName || "";
                                            const userLastName = customer.Ex_UserLastName || "";
                                            const fullUserName = `${userFirstName} ${userLastName}`.trim();
                                            const count = defectCounts[customer.Id] ?? 0;
                                            const defectsText = count === 1 ? "1 DEFECT" : `${count} DEFECTS`;

                                            if (fullUserName) {
                                                return `${fullUserName} | ${defectsText}`;
                                            } else {
                                                return defectsText;
                                            }
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
        noSelectionHeaderOverride: "Employee Reports",
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
                      Heading: "Property Details",
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
                              inputId: "inspectionDate",
                              type: FieldTypeEnum.Date,
                              label: "Inspection Date",
                              value: currentCustomer.InspectionDate ? (typeof currentCustomer.InspectionDate === "string" ? currentCustomer.InspectionDate : currentCustomer.InspectionDate.toISOString().split("T")[0]) : "",
                              onChange: newValue => updateCustomerField("InspectionDate", newValue)
                          }
                      ]
                  }
              ]
            : [
                  {
                      Heading: "Select a Report...",
                      Fields: []
                  }
              ],
        isLoading: isLoading,
        showSaveButton: false,
        useContainerHeight: true
    };

    // - RENDER - //
    return !initialised ? <JC_Spinner isPageBody /> : <JC_FormTablet model={formTabletModel} />;
}
