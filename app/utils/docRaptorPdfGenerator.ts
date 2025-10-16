import { JC_GetRaw } from "@/app/apiServices/JC_GetRaw";
import { JC_PostRaw } from "@/app/apiServices/JC_PostRaw";

export interface DocRaptorPdfResult {
    pdfData: string;
    filename: string;
    contentType: string;
}

export interface DocRaptorStatusResponse {
    status: "queued" | "working" | "completed" | "failed";
    download_url?: string;
    error?: string;
}

export class DocRaptorPdfGenerator {
    /**
     * Generate PDF using DocRaptor async API with polling
     * @param customerId Customer ID to generate report for
     * @param onStatusUpdate Optional callback for status updates
     * @returns Promise that resolves with PDF data
     */
    static async generateInspectionReport(customerId: string, onStatusUpdate?: (status: string) => void): Promise<DocRaptorPdfResult> {
        try {
            // Step 1: Create PDF asynchronously
            onStatusUpdate?.("Creating PDF...");
            const createResponse = await JC_PostRaw<{ customerId: string }, { status_id: string; filename: string }>("pdf/create-docraptor", { customerId });

            const { status_id, filename } = createResponse;

            // Step 2: Poll for completion
            return await this.pollForCompletion(status_id, filename, onStatusUpdate);
        } catch (error) {
            console.error("Error generating DocRaptor PDF:", error);
            throw new Error("Failed to generate PDF report");
        }
    }

    /**
     * Poll DocRaptor status until completion
     * @param statusId Status ID from DocRaptor
     * @param filename Original filename
     * @param onStatusUpdate Optional callback for status updates
     * @returns Promise that resolves with PDF data
     */
    private static async pollForCompletion(statusId: string, filename: string, onStatusUpdate?: (status: string) => void): Promise<DocRaptorPdfResult> {
        const maxAttempts = 60; // 5 minutes max (5 second intervals)
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const statusResponse = await JC_GetRaw<DocRaptorStatusResponse>("pdf/docraptor-status", { id: statusId });

                const { status, download_url, error } = statusResponse;

                switch (status) {
                    case "queued":
                        onStatusUpdate?.("PDF queued for processing...");
                        break;
                    case "working":
                        onStatusUpdate?.("Generating PDF...");
                        break;
                    case "completed":
                        if (!download_url) {
                            throw new Error("PDF completed but no download URL provided");
                        }
                        onStatusUpdate?.("PDF completed, downloading...");
                        return await this.downloadPdfFromUrl(download_url, filename);
                    case "failed":
                        throw new Error(`PDF generation failed: ${error || "Unknown error"}`);
                    default:
                        throw new Error(`Unknown status: ${status}`);
                }

                // Wait 5 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            } catch (error) {
                console.error("Error polling DocRaptor status:", error);
                throw error;
            }
        }

        throw new Error("PDF generation timed out");
    }

    /**
     * Download PDF from DocRaptor URL and convert to base64
     * @param downloadUrl DocRaptor download URL
     * @param filename Original filename
     * @returns Promise that resolves with PDF data
     */
    private static async downloadPdfFromUrl(downloadUrl: string, filename: string): Promise<DocRaptorPdfResult> {
        try {
            const response = await fetch(downloadUrl);

            if (!response.ok) {
                throw new Error(`Failed to download PDF: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString("base64");

            return {
                pdfData: base64Data,
                filename: filename,
                contentType: "application/pdf"
            };
        } catch (error) {
            console.error("Error downloading PDF from DocRaptor:", error);
            throw new Error("Failed to download generated PDF");
        }
    }
}
