"use client";

import { JC_Utils, JC_Utils_Files } from "../Utils";
import { JC_GetRaw } from "../apiServices/JC_GetRaw";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { CustomerModel } from "../models/Customer";
import { FileModel } from "../models/File";
import { ReportModel } from "../models/Report";
import { DocRaptorPdfGenerator } from "../utils/docRaptorPdfGenerator";
import styles from "./page.module.scss";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ReportPage() {
    // - STATE - //
    const router = useRouter();
    const session = useSession();
    const [initialised, setInitialised] = useState<boolean>(false);
    const [currentCustomer, setCurrentCustomer] = useState<CustomerModel | null>(null);
    const [noCustomerSelected, setNoCustomerSelected] = useState<boolean>(false);
    const [reportGenerating, setReportGenerating] = useState<boolean>(false);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
    const [generatedPdfData, setGeneratedPdfData] = useState<{
        pdfData: string;
        filename: string;
        contentType: string;
    } | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isEmailing, setIsEmailing] = useState<boolean>(false);
    const [reportSaved, setReportSaved] = useState<boolean>(false);
    const [pdfGenerationStatus, setPdfGenerationStatus] = useState<string>("");

    // - FUNCTIONS - //
    // Handle Generate Report button click
    const handleGenerateReport = useCallback(async (customer: CustomerModel) => {
        if (!customer?.Id) return;

        try {
            // Set generating state and clear any existing PDF URL
            setReportGenerating(true);
            setGeneratedPdfUrl(null);
            setReportSaved(false);
            setPdfGenerationStatus("");

            // Generate PDF using DocRaptor or fallback to original method
            const result = process.env.NEXT_PUBLIC_GENERATED_PDF_BASE64
                ? {
                      pdfData: process.env.NEXT_PUBLIC_GENERATED_PDF_BASE64,
                      filename: "TEST_REPORT.pdf",
                      contentType: "application/pdf"
                  }
                : await DocRaptorPdfGenerator.generateInspectionReport(customer.Id, status => setPdfGenerationStatus(status));

            // Store the PDF data
            setGeneratedPdfData(result);

            // Convert base64 PDF data to blob and create URL for viewing
            const base64Data = result.pdfData;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: result.contentType });
            const url = URL.createObjectURL(blob);
            setGeneratedPdfUrl(url);

            setPdfGenerationStatus("PDF ready for viewing");
        } catch (error) {
            console.error("Error generating PDF:", error);
            JC_Utils.showToastError("Failed to generate PDF report. Please try again.");
            setGeneratedPdfData(null);
            setGeneratedPdfUrl(null);
            setPdfGenerationStatus("");
        } finally {
            setReportGenerating(false);
        }
    }, []);

    const generateNewReport = useCallback(
        async (customer: CustomerModel) => {
            // Always generate a new report for the selected customer
            await handleGenerateReport(customer);
        },
        [handleGenerateReport]
    );

    const checkSelectedCustomer = useCallback(async () => {
        try {
            const selectedCustomerId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedCustomer);

            if (!selectedCustomerId) {
                setNoCustomerSelected(true);
                setInitialised(true);
                return;
            }

            // Check if this customer exists and is not deleted
            const customerExists = await CustomerModel.ItemExists(selectedCustomerId);

            if (customerExists) {
                // Fetch customer details for UI
                const customer = await CustomerModel.Get(selectedCustomerId);
                setCurrentCustomer(customer);
                setNoCustomerSelected(false);

                // Set initialised to true just before generating report
                setInitialised(true);

                // Always generate a new report
                await generateNewReport(customer);
            } else {
                // Customer not found, clear localStorage
                localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
                setNoCustomerSelected(true);
                setInitialised(true);
            }
        } catch (error) {
            console.error("Error checking selected customer:", error);
            // Clear localStorage if there's an error
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
            setNoCustomerSelected(true);
            setInitialised(true);
        }
    }, [generateNewReport]);

    // - EFFECTS - //
    useEffect(() => {
        checkSelectedCustomer();
    }, [checkSelectedCustomer]);

    // Handle Customers button click
    const handlePropertiesClick = () => {
        router.push("/customer");
    };

    // Handle Download button click
    const handleDownload = () => {
        if (!generatedPdfData) {
            console.error("No PDF data available for download");
            JC_Utils.showToastError("No PDF data available for download. Please try generating the report again.");
            return;
        }

        try {
            // Download newly generated PDF from memory
            const base64Data = generatedPdfData.pdfData;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: generatedPdfData.contentType });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = generatedPdfData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            console.log("PDF download initiated successfully");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            JC_Utils.showToastError("Failed to download PDF. Please try again.");
        }
    };

    // Handle Email button click
    const sendEmail = async () => {
        if (!generatedPdfData || !currentCustomer) {
            console.error("No PDF data or customer available for email");
            JC_Utils.showToastError("No PDF data available for email. Please try generating the report again.");
            return;
        }

        if (!currentCustomer.ClientEmail && !currentCustomer.Ex_UserEmail) {
            JC_Utils.showToastError("No email address found for this customer. Please update the customer details.");
            return;
        }

        try {
            setIsEmailing(true);

            // Check PDF size before sending
            const pdfSizeMB = JC_Utils_Files.calculateBase64FileSizeMB(generatedPdfData.pdfData);
            const maxAttachmentSizeMB = 5;

            let successMessage = "Report emailed successfully!";
            let apiEndpoint = "email/inspectionReportEmail";
            let requestData: any;

            if (pdfSizeMB >= maxAttachmentSizeMB) {
                // For large files, first save the PDF to AWS, then send email with the saved file link
                successMessage = "Report is large - saving and emailing with download link!";

                // First save the PDF using the existing save functionality
                const savedFileData = await saveReportToAws(currentCustomer);
                if (!savedFileData) {
                    throw new Error("Failed to save report to AWS");
                }

                // Use the new endpoint that works with pre-saved files
                apiEndpoint = "email/inspectionReportEmailWithSavedFile";
                requestData = {
                    customer: currentCustomer,
                    s3Key: savedFileData.s3Key
                };

                // Mark report as saved since we just saved it
                setReportSaved(true);
            } else {
                // For small files, send as attachment with PDF data
                successMessage = "Report emailed successfully!";
                requestData = {
                    customer: currentCustomer,
                    pdfBase64: generatedPdfData.pdfData
                };
            }

            // Send email request
            await JC_PostRaw(apiEndpoint, requestData);

            console.log(`Email sent successfully. PDF size: ${pdfSizeMB.toFixed(2)}MB`);
            JC_Utils.showToastSuccess(successMessage);
        } catch (error) {
            console.error("Error sending email:", error);
            JC_Utils.showToastError("Failed to send email. Please try again.");
        } finally {
            setIsEmailing(false);
        }
    };

    // Helper function to save report to AWS (extracted from handleSave for reuse)
    const saveReportToAws = async (customer: CustomerModel): Promise<{ s3Key: string; fileId: string } | null> => {
        if (!generatedPdfData || !customer?.Id || !customer?.ClientName || !session.data?.user?.Id) return null;

        try {
            // Generate filename and S3 key following the required folder structure
            const fileName = `Building Inspection Report - ${customer.Address}.pdf`;
            const s3Key = `Inspection Reports/${customer.ClientName}/${fileName}`;

            // Get signed URL for upload
            const signedUrl = await JC_GetRaw<string>("aws/getSignedUrlForKey", {
                key: s3Key,
                contentType: "application/pdf"
            });

            // Upload file directly to S3 using signed URL
            await JC_Utils_Files.uploadFileWithSignedUrl(signedUrl, generatedPdfData.pdfData, "application/pdf");

            // Calculate file size for database record
            const buffer = JC_Utils_Files.base64ToBuffer(generatedPdfData.pdfData);

            // Create File record in database
            const fileRecord = new FileModel({
                UserId: session.data.user.Id,
                FileName: fileName,
                StorageProvider: "AWS_S3",
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "",
                Key: s3Key,
                MimeType: "application/pdf",
                SizeBytes: buffer.length,
                IsPublic: false,
                Notes: `Inspection report for customer: ${customer.ClientName}`
            });

            await FileModel.Create(fileRecord);

            // Create Report record
            const reportData = new ReportModel({
                CustomerId: customer.Id,
                UserId: session.data.user.Id,
                Name: `${customer.ClientName} - Inspection Report`,
                FileId: fileRecord.Id
            });

            await ReportModel.Create(reportData);

            return { s3Key, fileId: fileRecord.Id };
        } catch (error) {
            console.error("Error saving report to AWS:", error);
            return null;
        }
    };

    // Handle Save button click
    const handleSave = async (customer: CustomerModel) => {
        if (!generatedPdfData || !customer?.Id || !customer?.ClientName || !session.data?.user?.Id) return;

        try {
            setIsSaving(true);

            const savedData = await saveReportToAws(customer);
            if (!savedData) {
                throw new Error("Failed to save report");
            }

            // Show success message
            console.log("PDF and Report saved successfully");
            JC_Utils.showToastSuccess("Report saved successfully!");

            // Mark report as saved but keep PDF data for other operations
            setReportSaved(true);
        } catch (error) {
            console.error("Error saving PDF:", error);
            JC_Utils.showToastError("Failed to save report. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // - RENDER - //
    if (!initialised) {
        return <JC_Spinner isPageBody />;
    }

    if (noCustomerSelected) {
        return (
            <div className={styles.noCustomerContainer}>
                <JC_Title title="Select a Customer" />
                <JC_Button text="Customers" onClick={handlePropertiesClick} />
            </div>
        );
    }

    if (!currentCustomer) {
        return <JC_Spinner isPageBody />;
    }

    return (
        <div className={styles.mainContainer}>
            {/* Header */}
            <div className={styles.header}>
                {currentCustomer?.Id && (
                    <Link href={`/defects/edit/${currentCustomer.Id}`} className={styles.backButton}>
                        <Image src="/icons/Arrow.webp" alt="Back" width={0} height={0} className={styles.backButtonIcon} unoptimized />
                    </Link>
                )}
                <h2 className={styles.headerLabel}>{JC_Utils.formatPageHeaderTitle(currentCustomer.Address, "Generate Report")}</h2>
            </div>

            {/* PDF Viewer Area */}
            <div className={styles.pdfViewerArea}>
                {reportGenerating ? (
                    <div className={styles.generatingContainer}>
                        <JC_Spinner />
                        <div className={styles.generatingText}>{pdfGenerationStatus || "Generating report..."}</div>
                    </div>
                ) : generatedPdfUrl ? (
                    <iframe src={generatedPdfUrl} className={styles.pdfViewer} title="Generated Report" />
                ) : null}
            </div>

            {/* Footer - Only show after successful generation */}
            {generatedPdfUrl && (
                <div className={styles.footer}>
                    <div className={styles.rightFooterContainer}>
                        <JC_Button text="Download" onClick={handleDownload} isDisabled={!generatedPdfData} />
                        <JC_Button text="Save" onClick={() => handleSave(currentCustomer)} isLoading={isSaving} isDisabled={!generatedPdfData || reportSaved} />
                        <JC_Button text="Email" onClick={sendEmail} isLoading={isEmailing} isDisabled={!generatedPdfData} />
                    </div>
                </div>
            )}
        </div>
    );
}
