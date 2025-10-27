import { JC_Utils_Files } from "@/app/Utils";
import { ContactModel } from "@/app/models/Contact";
import { CustomerModel } from "@/app/models/Customer";
import { FileModel } from "@/app/models/File";
import { UserModel } from "@/app/models/User";
import Template_ContactEmail from "@/templates/email/Contact";
import Template_InspectionReportEmail from "@/templates/email/InspectionReport";
import Template_ResetPassswordEmail from "@/templates/email/ResetPassword";
import Template_TwoFactorAuthEmail from "@/templates/email/TwoFactorAuth";
import Template_UserVerificationEmail from "@/templates/email/UserVerification";
import Template_WelcomeEmail from "@/templates/email/Welcome";
import {
    SESClient,
    SendEmailCommand,
    SendRawEmailCommand,
} from "@aws-sdk/client-ses";
import { Resend } from "resend";

export class EmailBusiness_Resend {
    // Contact
    static async sendContactEmail(emailData: ContactModel) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_ContactEmail,
            emailData,
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: `${process.env.EMAIL_SUPPORT}`,
            subject: "TEST MATE",
            html: htmlContent,
        });
    }

    // Welcome
    static async sendWelcomeEmail(name: string, email: string) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(Template_WelcomeEmail, {
            name,
            email,
        });

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "TEST MATE",
            html: htmlContent,
        });
    }

    // Reset Password
    static async sendResetPasswordEmail(email: string, theToken: string) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_ResetPassswordEmail,
            { token: theToken },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `${process.env.NAME} Reset Password`,
            html: htmlContent,
        });
    }

    // User Verification
    static async sendUserVerificationEmail(email: string, theToken: string) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_UserVerificationEmail,
            { token: theToken },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `${process.env.NAME} Verification`,
            html: htmlContent,
        });
    }

    // Inspection Report
    static async sendInspectionReportEmail(
        customer: CustomerModel,
        pdfBase64: string,
    ) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Check PDF size (50MB = 50 * 1024 * 1024 bytes)
        const pdfSizeMB = JC_Utils_Files.calculateBase64FileSizeMB(pdfBase64);
        const maxAttachmentSizeMB = 50;

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        if (pdfSizeMB < maxAttachmentSizeMB) {
            // PDF is small enough - attach as normal
            const pdfBuffer = Buffer.from(pdfBase64, "base64");
            const htmlContent = await renderComponentToHtml(
                Template_InspectionReportEmail,
                { customer },
            );

            await resend.emails.send({
                from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
                to: customer.Ex_UserEmail || `${process.env.EMAIL_SUPPORT}`,
                subject: `${process.env.NAME} - Building Inspection Report`,
                html: htmlContent,
                attachments: [
                    {
                        filename,
                        content: pdfBuffer,
                    },
                ],
            });
        } else {
            // PDF is too large - upload to S3 and include URL in email
            const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
            const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
                pdfBase64,
                s3Key,
                7 * 24 * 60 * 59,
            ); // 30 days

            const htmlContent = await renderComponentToHtml(
                Template_InspectionReportEmail,
                { customer, pdfUrl },
            );

            await resend.emails.send({
                from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
                to: customer.Ex_UserEmail || `${process.env.EMAIL_SUPPORT}`,
                subject: `${process.env.NAME} - Building Inspection Report`,
                html: htmlContent,
            });
        }
    }

    // Inspection Report with Link (for large files)
    static async sendInspectionReportEmailWithLink(
        customer: CustomerModel,
        pdfBase64: string,
    ) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        // Upload to S3 and get signed URL (30 days expiry)
        const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
        const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
            pdfBase64,
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: customer.Ex_UserEmail || `${process.env.EMAIL_SUPPORT}`,
            subject: `${process.env.NAME} - Building Inspection Report`,
            html: htmlContent,
        });
    }

    // Inspection Report Link Only (generates PDF on backend and sends link)
    static async sendInspectionReportEmailLinkOnly(customer: CustomerModel) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Generate PDF directly using the same logic as the API route
        const pdfBase64 = await this.generateInspectionReportPdf(customer);

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        // Upload to S3 and get signed URL (30 days expiry)
        const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
        const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
            pdfBase64,
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: "info@aimsengineering.com.au",
            subject: `${process.env.NAME} - Building Inspection Report`,
            html: htmlContent,
        });
    }

    // Inspection Report with Pre-saved File (uses existing saved file from frontend)
    static async sendInspectionReportEmailWithSavedFile(
        customer: CustomerModel,
        s3Key: string,
    ) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Get signed URL for the existing file (30 days expiry)
        const pdfUrl = await JC_Utils_Files.getSignedUrlForKey(
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: customer.Ex_UserEmail || `${process.env.EMAIL_SUPPORT}`,
            subject: `${process.env.NAME} - Building Inspection Report`,
            html: htmlContent,
        });
    }

    // Two-Factor Authentication
    static async send2FAEmail(email: string, code: string) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Load base64 images for email
        const fs = await import("fs");
        const path = await import("path");

        const base64MainLogo = fs
            .readFileSync(
                path.join(
                    process.cwd(),
                    "public/logos/#Originals/Main [PastelAlt].jpg",
                ),
            )
            .toString("base64");

        const htmlContent = await renderComponentToHtml(
            Template_TwoFactorAuthEmail,
            {
                code,
                base64MainLogo,
            },
        );

        await resend.emails.send({
            from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `${process.env.NAME} - Two-Factor Authentication Code`,
            html: htmlContent,
        });
    }

    // Helper method to generate PDF directly using DocRaptor (shared between Resend and AWS)
    static async generateInspectionReportPdf(
        customer: CustomerModel,
    ): Promise<string> {
        const { JC_Utils_Business } = await import("@/app/Utils");
        const { CustomerDefectModel } = await import(
            "@/app/models/CustomerDefect"
        );
        const { DefectImageModel } = await import("@/app/models/DefectImage");
        const Template_InspectionPdf = (
            await import("@/templates/Template_InspectionPdf")
        ).default;
        const React = await import("react");
        const axios = await import("axios");

        try {
            // Dynamic import of react-dom/server to avoid build issues
            const { renderToStaticMarkup } = await import("react-dom/server");

            // Get defects for this customer
            const defectsResult = await JC_Utils_Business.sqlGetList(
                CustomerDefectModel,
                `"CustomerId" = '${customer.Id}'`,
                {
                    PageSize: undefined,
                    PageIndex: undefined,
                    Sorts: [{ SortField: "SortOrder", SortAsc: true }],
                },
            );
            const defects = defectsResult.ResultList;

            // Get images for each defect
            const defectsWithImages = await Promise.all(
                defects.map(async (defect) => {
                    try {
                        const imagesResult = await JC_Utils_Business.sqlGetList(
                            DefectImageModel,
                            `"DefectId" = '${defect.Id}'`,
                            {
                                PageSize: undefined,
                                PageIndex: undefined,
                                Sorts: [
                                    { SortField: "SortOrder", SortAsc: true },
                                ],
                            },
                        );
                        return {
                            ...defect,
                            images: imagesResult.ResultList || [],
                        };
                    } catch (error) {
                        console.error(
                            `Error fetching images for defect ${defect.Id}:`,
                            error,
                        );
                        return {
                            ...defect,
                            images: [],
                        };
                    }
                }),
            );

            // Get user data for the customer's UserId to check if they're an employee and have a logo
            const userData = await JC_Utils_Business.sqlGet(
                UserModel,
                customer.UserId,
            );
            let userLogoBase64: string | null = null;

            // Check if user is an employee (has EmployeeOfUserId) and has a logo
            if (userData && userData.EmployeeOfUserId && userData.LogoFileId) {
                try {
                    // Get the user's logo file
                    const logoFile = await JC_Utils_Business.sqlGet(
                        FileModel,
                        userData.LogoFileId,
                    );
                    if (logoFile && logoFile.Key) {
                        // Load the logo file from S3 as base64
                        const { GetObjectCommand, S3Client } = await import(
                            "@aws-sdk/client-s3"
                        );

                        const s3Client = new S3Client({
                            region: process.env.AWS_REGION || "ap-southeast-2",
                            credentials: {
                                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                                secretAccessKey:
                                    process.env.AWS_SECRET_ACCESS_KEY!,
                            },
                        });

                        const command = new GetObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET_NAME,
                            Key: logoFile.Key,
                        });

                        const response = await s3Client.send(command);
                        if (response.Body) {
                            const chunks = [];
                            const stream = response.Body as any;
                            for await (const chunk of stream) {
                                chunks.push(chunk);
                            }
                            const buffer = Buffer.concat(chunks);
                            userLogoBase64 = buffer.toString("base64");
                        }
                    }
                } catch (error) {
                    console.error("Error loading user logo:", error);
                    // Continue without user logo if there's an error
                }
            }

            // Load base64 images for PDF
            const fs = await import("fs");
            const path = await import("path");

            const base64TestMainLogo = fs
                .readFileSync(
                    path.join(process.cwd(), "public/logos/Main [Simple].webp"),
                )
                .toString("base64");
            const base64LogosMainThick = fs
                .readFileSync(
                    path.join(process.cwd(), "public/logos/Main [Thick].webp"),
                )
                .toString("base64");
            const base64LogosMainPastel = fs
                .readFileSync(
                    path.join(
                        process.cwd(),
                        "public/logos/#Originals/Main [PastelAlt].jpg",
                    ),
                )
                .toString("base64");
            const base64Tick = fs
                .readFileSync(
                    path.join(process.cwd(), "public/icons/Tick.webp"),
                )
                .toString("base64");

            // Render React component to HTML directly
            const element = React.createElement(Template_InspectionPdf, {
                ...customer,
                defects: defectsWithImages,
                base64TestMainLogo,
                base64LogosMainThick,
                base64LogosMainPastel,
                base64Tick,
                userLogoBase64,
                userData,
            });
            const html = `<!DOCTYPE html>${renderToStaticMarkup(element)}`;

            // Generate PDF using DocRaptor
            const DOC_API_KEY = process.env.DOC_API_KEY;
            if (!DOC_API_KEY) {
                throw new Error("DocRaptor API key not configured");
            }

            const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

            // Create DocRaptor document asynchronously
            const createResponse = await axios.default.post(
                "https://docraptor.com/docs",
                {
                    user_credentials: DOC_API_KEY,
                    doc: {
                        test: process.env.DOC_USE_LIVE !== "true", // Use test mode unless DOC_USE_LIVE is explicitly true
                        document_type: "pdf",
                        name: filename,
                        document_content: html,
                        async: true, // Enable async processing
                        embed_fonts: true,
                        prince_options: {
                            media: "print", // Ensure print media type for proper font rendering
                            baseurl: "https://fonts.gstatic.com/", // Help with font loading
                            http_timeout: 60, // Increase timeout for font loading
                            insecure: false, // Ensure HTTPS is used for fonts
                            javascript: false, // Disable JS for faster rendering
                            no_network: false, // Allow network access for fonts
                            embed_fonts: true, // Explicitly embed fonts for better compatibility
                        },
                    },
                },
                {
                    headers: { "Content-Type": "application/json" },
                },
            );
            const statusId = createResponse.data.status_id;

            // Poll for completion
            const maxAttempts = 60; // 5 minutes max (5 second intervals)
            let attempts = 0;

            while (attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
                attempts++;

                try {
                    const statusResponse = await axios.default.get(
                        `https://docraptor.com/status/${statusId}`,
                        {
                            headers: {
                                Authorization: `Basic ${Buffer.from(`${DOC_API_KEY}:`).toString("base64")}`,
                            },
                        },
                    );

                    const status = statusResponse.data.status;

                    if (status === "completed") {
                        // Download the PDF
                        const downloadResponse = await axios.default.get(
                            statusResponse.data.download_url,
                            {
                                responseType: "arraybuffer",
                            },
                        );

                        return Buffer.from(downloadResponse.data).toString(
                            "base64",
                        );
                    } else if (status === "failed") {
                        throw new Error(
                            `DocRaptor PDF generation failed: ${statusResponse.data.validation_errors || "Unknown error"}`,
                        );
                    }
                    // Continue polling if status is 'queued' or 'working'
                } catch (statusError) {
                    console.error(
                        "Error checking DocRaptor status:",
                        statusError,
                    );
                    if (attempts >= maxAttempts) {
                        throw new Error("Timeout waiting for PDF generation");
                    }
                }
            }

            throw new Error("Timeout waiting for PDF generation");
        } catch (error) {
            console.error(
                "Error generating inspection report with DocRaptor:",
                error,
            );
            throw error;
        }
    }
}

export class EmailBusiness_AWS {
    // Contact
    static async sendContactEmail(emailData: ContactModel) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_ContactEmail,
            emailData,
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [`${process.env.EMAIL_SUPPORT}`],
            },
            Message: {
                Subject: {
                    Data: "TEST MATE",
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Welcome
    static async sendWelcomeEmail(name: string, email: string) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(Template_WelcomeEmail, {
            name,
            email,
        });

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: "TEST MATE",
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Reset Password
    static async sendResetPasswordEmail(email: string, theToken: string) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_ResetPassswordEmail,
            { token: theToken },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} Reset Password`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // User Verification
    static async sendUserVerificationEmail(email: string, theToken: string) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");
        const htmlContent = await renderComponentToHtml(
            Template_UserVerificationEmail,
            { token: theToken },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} Verification`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Inspection Report
    static async sendInspectionReportEmail(
        customer: CustomerModel,
        pdfBase64: string,
    ) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Check PDF size (50MB = 50 * 1024 * 1024 bytes)
        const pdfSizeMB = JC_Utils_Files.calculateBase64FileSizeMB(pdfBase64);
        const maxAttachmentSizeMB = 50;

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        if (pdfSizeMB < maxAttachmentSizeMB) {
            // PDF is small enough - attach as normal
            const htmlContent = await renderComponentToHtml(
                Template_InspectionReportEmail,
                { customer },
            );

            // Create raw email with attachment
            const boundary = `----=_NextPart_${Date.now()}`;
            const rawEmail = [
                `From: ${process.env.NAME} <${process.env.EMAIL_FROM}>`,
                `To: ${process.env.EMAIL_SUPPORT}`,
                `Subject: ${process.env.NAME} - Building Inspection Report`,
                `MIME-Version: 1.0`,
                `Content-Type: multipart/mixed; boundary="${boundary}"`,
                ``,
                `--${boundary}`,
                `Content-Type: text/html; charset=UTF-8`,
                `Content-Transfer-Encoding: 7bit`,
                ``,
                htmlContent,
                ``,
                `--${boundary}`,
                `Content-Type: application/pdf`,
                `Content-Transfer-Encoding: base64`,
                `Content-Disposition: attachment; filename="${filename}"`,
                ``,
                pdfBase64,
                ``,
                `--${boundary}--`,
            ].join("\r\n");

            const command = new SendRawEmailCommand({
                RawMessage: {
                    Data: Buffer.from(rawEmail),
                },
            });

            await sesClient.send(command);
        } else {
            // PDF is too large - upload to S3 and include URL in email
            const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
            const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
                pdfBase64,
                s3Key,
                7 * 24 * 60 * 59,
            ); // 30 days

            const htmlContent = await renderComponentToHtml(
                Template_InspectionReportEmail,
                { customer, pdfUrl },
            );

            const command = new SendEmailCommand({
                Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
                Destination: {
                    ToAddresses: [`${process.env.EMAIL_SUPPORT}`],
                },
                Message: {
                    Subject: {
                        Data: `${process.env.NAME} - Building Inspection Report`,
                        Charset: "UTF-8",
                    },
                    Body: {
                        Html: {
                            Data: htmlContent,
                            Charset: "UTF-8",
                        },
                    },
                },
            });

            await sesClient.send(command);
        }
    }

    // Inspection Report with Link (for large files)
    static async sendInspectionReportEmailWithLink(
        customer: CustomerModel,
        pdfBase64: string,
    ) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        // Upload to S3 and get signed URL (30 days expiry)
        const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
        const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
            pdfBase64,
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [`${process.env.EMAIL_SUPPORT}`],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} - Building Inspection Report`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Inspection Report Link Only (generates PDF on backend and sends link)
    static async sendInspectionReportEmailLinkOnly(customer: CustomerModel) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Generate PDF directly using the same logic as the Resend class
        const pdfBase64 =
            await EmailBusiness_Resend.generateInspectionReportPdf(customer);

        const filename = `Inspection_Report_${customer.ClientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

        // Upload to S3 and get signed URL (30 days expiry)
        const s3Key = `Email Reports/${customer.ClientName}/${filename}`;
        const pdfUrl = await JC_Utils_Files.uploadPdfAndGetSignedUrl(
            pdfBase64,
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [`${process.env.EMAIL_SUPPORT}`],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} - Building Inspection Report`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Inspection Report with Pre-saved File (uses existing saved file from frontend)
    static async sendInspectionReportEmailWithSavedFile(
        customer: CustomerModel,
        s3Key: string,
    ) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Get signed URL for the existing file (30 days expiry)
        const pdfUrl = await JC_Utils_Files.getSignedUrlForKey(
            s3Key,
            7 * 24 * 60 * 59,
        ); // 30 days

        const htmlContent = await renderComponentToHtml(
            Template_InspectionReportEmail,
            { customer, pdfUrl },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [
                    customer.Ex_UserEmail || `${process.env.EMAIL_SUPPORT}`,
                ],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} - Building Inspection Report`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }

    // Two-Factor Authentication
    static async send2FAEmail(email: string, code: string) {
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const { renderComponentToHtml } = await import("@/app/UtilsServer");

        // Load base64 images for email
        const fs = await import("fs");
        const path = await import("path");

        const base64MainLogo = fs
            .readFileSync(
                path.join(
                    process.cwd(),
                    "public/logos/#Originals/Main [PastelAlt].jpg",
                ),
            )
            .toString("base64");

        const htmlContent = await renderComponentToHtml(
            Template_TwoFactorAuthEmail,
            {
                code,
                base64MainLogo,
            },
        );

        const command = new SendEmailCommand({
            Source: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: `${process.env.NAME} - Two-Factor Authentication Code`,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        });

        await sesClient.send(command);
    }
}
