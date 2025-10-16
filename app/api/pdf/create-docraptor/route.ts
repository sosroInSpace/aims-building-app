import { JC_Utils_Business } from "@/app/Utils";
import { CustomerModel } from "@/app/models/Customer";
import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { DefectImageModel } from "@/app/models/DefectImage";
import { FileModel } from "@/app/models/File";
import { UserModel } from "@/app/models/User";
import Template_InspectionPdf from "@/templates/Template_InspectionPdf";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import React from "react";

// Force Node runtime
export const runtime = "nodejs";

// Get DocRaptor API key from environment
const DOC_API_KEY = process.env.DOC_API_KEY!;

async function generateInspectionReportHtml(customer: CustomerModel): Promise<string> {
    try {
        // Dynamic import of react-dom/server to avoid build issues
        const { renderToStaticMarkup } = await import("react-dom/server");

        // Get user data for the customer's UserId to check if they're an employee and have a logo
        const userData = await JC_Utils_Business.sqlGet(UserModel, customer.UserId);
        let userLogoBase64: string | null = null;

        // Check if user is an employee (has EmployeeOfUserId) and has a logo
        if (userData && userData.EmployeeOfUserId && userData.LogoFileId) {
            try {
                // Get the user's logo file
                const logoFile = await JC_Utils_Business.sqlGet(FileModel, userData.LogoFileId);
                if (logoFile && logoFile.Key) {
                    // Load the logo file from S3 as base64
                    const { GetObjectCommand, S3Client } = await import("@aws-sdk/client-s3");

                    const s3Client = new S3Client({
                        region: process.env.AWS_REGION || "ap-southeast-2",
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
                        }
                    });

                    const command = new GetObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: logoFile.Key
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

        // Load base64 images
        const fs = require("fs");
        const path = require("path");
        const base64TestMainLogo = fs.readFileSync(path.join(process.cwd(), "public/CameraDefaultImage.webp")).toString("base64");
        const base64LogosMainThick = fs.readFileSync(path.join(process.cwd(), "public/logos/Main [Thick].webp")).toString("base64");
        const base64LogosMainPastel = fs.readFileSync(path.join(process.cwd(), "public/logos/#Originals/Main [PastelAlt].jpg")).toString("base64");
        const base64Tick = fs.readFileSync(path.join(process.cwd(), "public/icons/Tick.webp")).toString("base64");
        const base64HexagonGrid = fs.readFileSync(path.join(process.cwd(), "public/logos/HexagonGrid.svg")).toString("base64");

        // Fetch defects for this customer using sqlGetList which includes extended fields
        const defectsResult = await JC_Utils_Business.sqlGetList(CustomerDefectModel, `"CustomerId" = '${customer.Id}'`, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "SortOrder", SortAsc: true }]
        });

        // Get images for each defect
        const defectsWithImages = await Promise.all(
            defectsResult.ResultList.map(async defect => {
                const imagesResult = await JC_Utils_Business.sqlGetList(DefectImageModel, `"DefectId" = '${defect.Id}'`, {
                    PageSize: undefined,
                    PageIndex: undefined,
                    Sorts: [{ SortField: "SortOrder", SortAsc: true }]
                });

                return {
                    ...defect,
                    images: imagesResult.ResultList
                };
            })
        );

        // Render React component to HTML
        const element = React.createElement(Template_InspectionPdf, {
            ...customer,
            defects: defectsWithImages,
            base64TestMainLogo,
            base64LogosMainThick,
            base64LogosMainPastel,
            base64Tick,
            base64HexagonGrid,
            userLogoBase64,
            userData
        });
        const html = `<!DOCTYPE html>${renderToStaticMarkup(element)}`;

        return html;
    } catch (error) {
        console.error("Error generating inspection report HTML:", error);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { customerId } = await req.json();

        if (!customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        if (!DOC_API_KEY) {
            return NextResponse.json({ error: "DocRaptor API key not configured" }, { status: 500 });
        }

        // Get customer data from database
        const customerData = await JC_Utils_Business.sqlGet(CustomerModel, customerId);

        if (!customerData) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Convert to CustomerModel instance
        const customer = new CustomerModel(customerData);

        // Generate HTML for the report
        const html = await generateInspectionReportHtml(customer);

        const filename = `Building Inspection Report - ${customer.Address}.pdf`;

        // Create DocRaptor document asynchronously
        const response = await axios.post(
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
                        embed_fonts: true // Explicitly embed fonts for better compatibility
                    }
                }
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        // Return the status_id for polling
        return NextResponse.json(
            {
                status_id: response.data.status_id,
                filename: filename
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("DocRaptor error:", err.response?.data || err.message);
        return NextResponse.json({ error: "Failed to create PDF" }, { status: 500 });
    }
}
