"use client";

import Template_InspectionPdf from "../../templates/Template_InspectionPdf";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { CustomerModel } from "../models/Customer";
import styles from "./page.module.scss";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PdfPreviewPage() {
    const router = useRouter();

    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [noCustomerSelected, setNoCustomerSelected] = useState<boolean>(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerModel | null>(null);

    // - EFFECTS - //
    useEffect(() => {
        checkForSelectedCustomer();
    }, []);

    // - FUNCTIONS - //
    const checkForSelectedCustomer = async () => {
        try {
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            if (!selectedCustomerId) {
                setNoCustomerSelected(true);
                setInitialised(true);
                return;
            }

            // Check if customer exists and get customer data
            const customerExists = await CustomerModel.ItemExists(selectedCustomerId);
            if (!customerExists) {
                // Customer doesn't exist, clear localStorage
                localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                setNoCustomerSelected(true);
                setInitialised(true);
                return;
            }

            // Get customer data
            const customerData = await CustomerModel.Get(selectedCustomerId);
            if (customerData) {
                setSelectedCustomer(customerData);
            } else {
                setNoCustomerSelected(true);
            }
        } catch (error) {
            console.error("Error checking selected customer:", error);
            // Clear localStorage if there's an error
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
            setNoCustomerSelected(true);
        } finally {
            setInitialised(true);
        }
    };

    // Handle Customers button click
    const handleCustomersClick = () => {
        router.push("/customer");
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

    if (!selectedCustomer) {
        return <JC_Spinner isPageBody />;
    }

    return (
        <div className={styles.mainContainer}>
            <JC_Title title="PDF Preview" />
            <div className={styles.pdfPreviewContainer}>
                <div className={styles.pdfContent}>
                    <Template_InspectionPdf {...selectedCustomer} isPreview={true} />
                </div>
            </div>
        </div>
    );
}
