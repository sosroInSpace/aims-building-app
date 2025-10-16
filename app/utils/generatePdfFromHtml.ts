import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function generatePdfFromHtml(
    html: string,
    options?: {
        format?: "A4" | "A3" | "A5" | "Letter" | "Legal";
        margin?: { top?: string; right?: string; bottom?: string; left?: string };
        printBackground?: boolean;
        landscape?: boolean;
    }
): Promise<Buffer> {
    let browser;
    try {
        console.log("Generating PDF with @sparticuz/chromium...");

        const executablePath = await chromium.executablePath();
        console.log("Chromium executable path:", executablePath);

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless
        });

        const page = await browser.newPage();

        // Set content
        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        // Generate PDF with proper page margins - let CSS @page rules handle margins
        const pdfBuffer = await page.pdf({
            format: (options?.format?.toLowerCase() as any) || "a4",
            margin: {
                top: "0", // Let CSS @page handle margins
                right: "0",
                bottom: "0", // Let CSS @page handle margins
                left: "0"
            },
            printBackground: options?.printBackground !== false,
            landscape: options?.landscape || false,
            displayHeaderFooter: false,
            preferCSSPageSize: true // Respect CSS @page rules
        });

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF from HTML:", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
