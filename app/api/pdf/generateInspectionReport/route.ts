import { JC_Utils_Business } from "@/app/Utils";
import { CustomerModel } from "@/app/models/Customer";
import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { DefectImageModel } from "@/app/models/DefectImage";
import { FileModel } from "@/app/models/File";
import { UserModel } from "@/app/models/User";
import { generatePdfFromHtml } from "@/app/utils/generatePdfFromHtml";
import Template_InspectionPdf from "@/templates/Template_InspectionPdf";
import { NextRequest, NextResponse } from "next/server";
import React from "react";

// Force Node.js runtime (not Edge Runtime)
export const runtime = "nodejs";

async function generateInspectionReport(customer: CustomerModel): Promise<Buffer> {
    try {
        // Dynamic import of react-dom/server to avoid build issues
        const { renderToStaticMarkup } = await import("react-dom/server");

        // Get user data for the customer's UserId to check if they're an employee and have a logo
        const userData = await JC_Utils_Business.sqlGet(UserModel, customer.UserId);
        let userLogoBase64: string | null = null;

        // Load user logo if user has one (regardless of employee status for now, but we'll use it in footer only for employees)
        if (userData && userData.LogoFileId) {
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
        const defects = defectsResult.ResultList;

        // Fetch images for each defect
        const defectsWithImages = await Promise.all(
            defects.map(async defect => {
                try {
                    const imagesResult = await JC_Utils_Business.sqlGetList(DefectImageModel, `"DefectId" = '${defect.Id}'`, {
                        PageSize: undefined,
                        PageIndex: undefined,
                        Sorts: [{ SortField: "SortOrder", SortAsc: true }]
                    });
                    return {
                        ...defect,
                        images: imagesResult.ResultList || []
                    };
                } catch (error) {
                    console.error(`Error fetching images for defect ${defect.Id}:`, error);
                    return {
                        ...defect,
                        images: []
                    };
                }
            })
        );

        // Render React component to HTML directly in the API route
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

        // Generate PDF from HTML using Puppeteer with chrome-aws-lambda
        console.log("Generating PDF with Puppeteer and chrome-aws-lambda...");

        // Debug user data
        console.log("User data:", {
            userId: userData?.Id,
            employeeOfUserId: userData?.EmployeeOfUserId,
            companyName: userData?.CompanyName,
            abn: userData?.ABN,
            hasLogo: !!userLogoBase64
        });

        const pdfBuffer = await generatePdfFromHtml(html);
        console.log("PDF generated successfully");

        return pdfBuffer;
    } catch (error) {
        console.error("Error generating inspection report:", error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { customerId } = await request.json();

        if (!customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        // Get customer data from database
        const customerData = await JC_Utils_Business.sqlGet(CustomerModel, customerId);

        if (!customerData) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Convert to CustomerModel instance
        const customer = new CustomerModel(customerData);

        // Generate PDF from React component
        const pdfBuffer = await generateInspectionReport(customer);

        // Return PDF as base64-encoded JSON (compatible with JC_Post)
        const base64Pdf = pdfBuffer.toString("base64");
        return NextResponse.json(
            {
                pdfData: base64Pdf,
                filename: `Building Inspection Report - ${customer.Address}.pdf`,
                contentType: "application/pdf"
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
