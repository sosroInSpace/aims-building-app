import { JC_Utils_Dates } from "@/app/Utils";
import { CustomerModel } from "@/app/models/Customer";
import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { DefectImageModel } from "@/app/models/DefectImage";
import React from "react";

interface DefectWithImages extends CustomerDefectModel {
    images: DefectImageModel[];
}

interface Template_InspectionPdfProps extends CustomerModel {
    isPreview?: boolean;
    defects?: DefectWithImages[];
    base64TestMainLogo?: string;
    base64LogosMainThick?: string;
    base64LogosMainPastel?: string;
    base64Tick?: string;
    base64HexagonGrid?: string;
    userLogoBase64?: string | null;
    userData?: {
        FirstName: string;
        LastName: string;
        Email: string;
        Phone?: string;
        CompanyName?: string;
        ABN?: string;
        Qualification?: string;
        EmployeeOfUserId?: string;
    } | null;
}

export default function Template_InspectionPdf(props: Template_InspectionPdfProps) {
    const { isPreview = false, defects = [], base64TestMainLogo = "", base64LogosMainThick = "", base64LogosMainPastel = "", base64Tick = "", base64HexagonGrid = "", userLogoBase64 = null, userData = null, ...customer } = props;

    // - ------ - //
    // - STYLES - //
    // - ------ - //

    // Colors
    const primaryColor = "#031363";
    const secondaryColor = "#539fc1";

    const offBlack = "#303030";

    // Typography
    const fontFamily = "Arial, sans-serif";
    const fontWeightBold = "700";

    // Font Sizes
    const fontSizeMainTitle = "36px";
    const fontSizePageTitle = "20px";
    const fontSizeBody = "14px";

    // Spacing
    const pagePadding = "0px 80px"; // Remove top/bottom padding, keep original 80px left/right
    const marginLarge = "25px";
    const marginMedium = "20px";
    const marginSmall = "10px";
    const cellPadding = "12px 8px";

    // Borders
    const borderThin = `1px solid ${offBlack}`;

    // Layout
    const pageWidth = "100%";

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    // Check if we're in a server environment
    const isServer = typeof window === "undefined";

    // Determine if we should use employee data (user is an employee and has data)
    const isEmployee = userData && userData.EmployeeOfUserId;

    // Helper variables for inspector information
    const inspectorName = isEmployee ? `${userData.FirstName} ${userData.LastName}`.trim() : "Gopan Mondal";
    const inspectorCredentials = isEmployee ? "" : "MIEAust RPEQ CPEng NER";
    const inspectorRole = isEmployee ? userData.Qualification || "" : "Structural Engineer";
    const inspectorPhone = isEmployee ? userData.Phone || "" : "+61 44 987 2030";
    const inspectorEmail = isEmployee ? userData.Email : "Gopan.Mondal@aimsengineering.com.au";
    const companyName = isEmployee ? userData.CompanyName || "" : "";
    const companyWebsite = isEmployee ? "" : "www.aimsengineering.com.au";
    const companyEmail = isEmployee ? "" : "info@aimsengineering.com.au";
    const companyLocation = isEmployee ? (userData.ABN ? `ABN: ${userData.ABN}` : "") : "PERTH, WEIPA, ABN: 87 652 177 396";

    // Format dates
    const inspectionDate = customer.InspectionDate ? JC_Utils_Dates.formatInspectionDate(new Date(customer.InspectionDate)) : JC_Utils_Dates.formatInspectionDate(new Date());
    const modifiedDate = customer.ModifiedAt ? JC_Utils_Dates.formatInspectionDate(new Date(customer.ModifiedAt)) : undefined;

    // Process defects and group by severity (each defect goes to highest priority group only)
    const groupedDefects = {
        "Safety Hazard": [] as DefectWithImages[],
        "Major Defect": [] as DefectWithImages[],
        "Minor Defect": [] as DefectWithImages[],
        "Noted Item": [] as DefectWithImages[]
    };

    // Define severity matching keywords for each category
    const severityKeywords = {
        "Safety Hazard": ["Critical", "Safety", "Safety Hazard"],
        "Major Defect": ["High", "Major", "Major Structural"],
        "Minor Defect": ["Medium", "Minor"],
        "Noted Item": ["Low", "Maintenance", "For your information"]
    };

    // Helper function to check if any severity name contains any of the keywords
    const matchesSeverity = (severityNames: string[], keywords: string[]): boolean => {
        return severityNames.some(name => keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase())));
    };

    // Group each defect into the highest priority severity group
    defects.forEach(defect => {
        if (!defect.Ex_SeverityNamesList || defect.Ex_SeverityNamesList.length === 0) {
            return; // Skip defects with no severity
        }

        // Check for highest priority first (Safety Hazard -> Major -> Minor -> Noted Item)
        if (matchesSeverity(defect.Ex_SeverityNamesList, severityKeywords["Safety Hazard"])) {
            groupedDefects["Safety Hazard"].push(defect);
        } else if (matchesSeverity(defect.Ex_SeverityNamesList, severityKeywords["Major Defect"])) {
            groupedDefects["Major Defect"].push(defect);
        } else if (matchesSeverity(defect.Ex_SeverityNamesList, severityKeywords["Minor Defect"])) {
            groupedDefects["Minor Defect"].push(defect);
        } else if (matchesSeverity(defect.Ex_SeverityNamesList, severityKeywords["Noted Item"])) {
            groupedDefects["Noted Item"].push(defect);
        }
    });

    // Calculate defect counts for summary table
    const defectCounts = {
        safetyHazard: groupedDefects["Safety Hazard"].length,
        majorDefect: groupedDefects["Major Defect"].length,
        minorDefect: groupedDefects["Minor Defect"].length
    };

    // Generate dynamic defect summary text based on actual defects found
    const generateDefectSummaryText = () => {
        const defectTypes = [];

        if (defectCounts.safetyHazard > 0) {
            defectTypes.push("safety hazards");
        }
        if (defectCounts.majorDefect > 0) {
            defectTypes.push("major defects");
        }
        if (defectCounts.minorDefect > 0) {
            defectTypes.push("minor defects");
        }

        if (defectTypes.length === 0) {
            return "no significant defects found";
        } else if (defectTypes.length === 1) {
            return `some ${defectTypes[0]} found`;
        } else if (defectTypes.length === 2) {
            return `some ${defectTypes[0]} and ${defectTypes[1]} found`;
        } else {
            return `some ${defectTypes[0]}, ${defectTypes[1]} and ${defectTypes[2]} found`;
        }
    };

    // Get the actual data for the lists from extended fields
    const areasInspectedNames = customer.Ex_AreasInspectedList?.map(item => item.Name) || [];
    const inaccessibleAreasNames = customer.Ex_InaccessibleAreasList?.map(item => item.Name) || [];
    const obstructionsNames = customer.Ex_ObstructionsList?.map(item => item.Name) || [];
    const futherInspectionsNames = customer.Ex_FutherInspectionsList?.map(item => item.Name) || [];
    const riskOfUndetectedDefectsName = customer.Ex_RiskOfUndetectedDefectsList && customer.Ex_RiskOfUndetectedDefectsList.length > 0 ? customer.Ex_RiskOfUndetectedDefectsList.map(item => item.Name).join(", ") : "Not specified";

    // Helper function to get display names from multi-select arrays using List fields
    const getMultiSelectDisplayValue = (list: any[] | undefined): string => {
        return list && list.length > 0 ? list.map(item => item.Name).join(", ") : "-";
    };

    // Helper function to render defect images
    const renderDefectImages = (images: DefectImageModel[]) => {
        if (!images || images.length === 0) {
            return [];
        }

        const imagesToShow = images; // Show all images instead of limiting to 8
        const rows = [];

        // Group images into rows of 2
        for (let i = 0; i < imagesToShow.length; i += 2) {
            const rowImages = imagesToShow.slice(i, i + 2);
            rows.push(
                <div key={`row-${i}`} className="defect-images-row" style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "20px" }}>
                    {rowImages.map((image, index) => (
                        <img key={i + index} src={image.Ex_ImageSignedUrl || `data:image/webp;base64,${base64TestMainLogo}`} alt={`Defect Image ${i + index + 1}`} style={{ width: "280px", height: "200px", objectFit: "cover" }} />
                    ))}
                </div>
            );
        }

        return rows;
    };

    // Helper function to format defect location
    const formatDefectLocation = (defect: DefectWithImages) => {
        const parts = [];
        if (defect.Ex_AreaNamesList && defect.Ex_AreaNamesList.length > 0) parts.push(defect.Ex_AreaNamesList.join(", "));
        if (defect.Ex_LocationNamesList && defect.Ex_LocationNamesList.length > 0) parts.push(defect.Ex_LocationNamesList.join(", "));
        if (defect.Ex_OrientationName) parts.push(defect.Ex_OrientationName);
        return parts.length > 0 ? parts.join(" > ") : "-";
    };

    // Helper function to render text with line breaks
    const renderTextWithLineBreaks = (text: string | undefined | null) => {
        if (!text) return null;

        const lines = text.split("\n");
        return lines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < lines.length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // Helper function to render defects by severity
    const renderDefectsBySeverity = (severityName: string, defectsList: DefectWithImages[]) => {
        if (defectsList.length === 0) return null;

        // Sort defects by SortOrder within the severity group
        const sortedDefects = [...defectsList].sort((a, b) => (a.SortOrder || 999) - (b.SortOrder || 999));

        const severityMap: { [key: string]: string } = {
            "Safety Hazard": "1",
            "Major Defect": "2",
            "Minor Defect": "3",
            "Noted Item": "4"
        };

        const severityNumber = severityMap[severityName] || "1";

        return (
            <>
                <div className="section-title">{severityName}</div>
                {sortedDefects.map((defect, index) => (
                    <div key={defect.Id} className="defect-item">
                        <div className="defect-content no-page-break">
                            <div className="defect-title">
                                Defects {severityNumber}.{String(index + 1).padStart(2, "0")}
                            </div>

                            <table className="defect-details-table">
                                <tbody>
                                    <tr>
                                        <td className="defect-label">Building:</td>
                                        <td className="defect-value">{defect.Ex_BuildingNamesList?.join(", ") || "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className="defect-label">Location:</td>
                                        <td className="defect-value">{formatDefectLocation(defect)}</td>
                                    </tr>
                                    <tr>
                                        <td className="defect-label">Finding:</td>
                                        <td className="defect-value">{(defect as any).DefectFindingNameOverride || defect.Ex_DefectFindingName || "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className="defect-label">Information:</td>
                                        <td className="defect-value">
                                            <div className="defect-information">{renderTextWithLineBreaks((defect as any).DefectFindingInformationOverride || (defect as any).Ex_DefectFindingInformation || defect.Name) || "-"}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="defect-images-container" style={{ marginTop: "20px" }}>
                            {renderDefectImages(defect.images)}
                        </div>
                    </div>
                ))}
            </>
        );
    };

    // - ------ - //
    // - BUILDS - //
    // - ------ - //

    // const _defaultImage = (
    //     <img
    //         src={isServer && base64TestMainLogo ? `data:image/webp;base64,${base64TestMainLogo}` : "/CameraDefaultImage.webp"}
    //         alt="Property Image"
    //         style={{ width: '280px', height: '200px', objectFit: 'cover' }}
    //     />
    // );

    // - ---- - //
    // - MAIN - //
    // - ---- - //

    // Define the styles as a string for reuse
    const styles = `
                    /* Using Arial system font - no custom font loading needed */



                    /* Footer flow setup */
                    .pdf-footer-flow {
                        flow: static(footer-content);
                    }

                    @page {
                        margin: ${isPreview ? "0" : "30mm 0 25mm 0"}; /* Increased bottom margin for footer */
                        size: A4;
                        @bottom {
                            content: flow(footer-content);
                        }
                    }

                    /* Force Arial font globally for DocRaptor compatibility */
                    html {
                        font-family: Arial, sans-serif !important;
                    }

                    body {
                        font-family: Arial, sans-serif !important;
                        margin: 0;
                        padding: 0;
                        color: #333;
                        line-height: 1.4;
                        orphans: 3;
                        widows: 3;
                        font-weight: 300;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }

                    * {
                        font-family: Arial, sans-serif !important;
                    }

                    /* Ensure all text elements use Arial */
                    h1, h2, h3, h4, h5, h6, p, div, span, td, th, li, a {
                        font-family: Arial, sans-serif !important;
                    }

                    /* Common page styles */
                    .main-page {
                        width: ${pageWidth};
                        min-height: ${isPreview ? "auto" : "auto"};
                        padding: ${pagePadding};
                        box-sizing: border-box;
                        position: relative;
                        ${isPreview ? "border-bottom: 8px solid #ccc;" : ""}
                    }

                    /* Footer styling for DocRaptor flow */
                    .pdf-footer-flow {
                        display: flex;
                        align-items: center;
                        padding: 5px 30px;
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        font-weight: normal;
                        color: #333;
                        background: white;
                        height: 20mm;
                        box-sizing: border-box;
                        position: relative;
                        opacity: 0.5;
                    }

                    .pdf-footer-logo {
                        height: 15mm;
                        width: auto;
                        position: absolute;
                        left: 60px;
                    }

                    .pdf-footer-center-text {
                        flex: 1;
                        text-align: center;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .pdf-footer-spacer {
                        width: 50px;
                        height: 1px;
                    }

                    .pdf-footer-left {
                        flex: 1;
                        text-align: left;
                    }



                    /* Section 1 Styles */
                    .section-1 {
                        height: ${isPreview ? "auto" : "calc(100vh - 60mm)"};
                        max-height: ${isPreview ? "none" : "calc(100vh - 60mm)"};
                        overflow: ${isPreview ? "visible" : "hidden"};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        page-break-after: always;
                    }

                    .section-1-logo {
                        margin-bottom: ${marginMedium};
                    }

                    .section-1-logo img {
                        max-width: 300px;
                        height: auto;
                    }

                    .section-1-title {
                        font-size: ${fontSizeMainTitle};
                        font-weight: ${fontWeightBold};
                        color: ${secondaryColor};
                        margin-bottom: ${marginLarge};
                        text-align: center;
                    }
.test-font {
    font-family: Arial, sans-serif !important;
    font-weight: 300 !important;
    font-size: 24px !important;
    color: red !important;
}

                    .section-1-table {
                        width: 100%;
                        max-width: 600px;
                        margin-bottom: 40px;
                        border-collapse: collapse;
                    }

                    .section-1-table td {
                        padding: 8px 20px;
                        font-size: ${fontSizeBody};
                    }

                    .section-1-table .label {
                        font-weight: 700;
                        width: 40%;
                        text-align: right;
                    }

                    .section-1-table .value {
                        width: 60%;
                    }

                    .section-1-image {
                        flex-grow: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .section-1-image img {
                        max-width: 500px;
                        max-height: 400px;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                    }

                    /* Common section title and subtitle styles - moved to page break control section */

                    /* Section 2 Styles */
                    .section-2 {
                        page-break-before: always;
                    }

                    /* contents-section styles moved to page break control section */

                    .contents-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }

                    .contents-table td {
                        padding: 8px 12px;
                        font-size: ${fontSizeBody};
                        vertical-align: top;
                        border: none;
                    }

                    .contents-table .section-cell {
                        font-weight: 700;
                        width: 190px;
                        padding-left: 0;
                        padding-right: 0;
                    }

                    .section-cell.blue {
                        color: ${secondaryColor};
                    }

                    .contents-table .description-cell {
                        color: #333;
                    }

                    .contents-table .header-cell {
                        color: #333;
                        font-weight: 400;
                        text-align: center;
                        padding: 12px;
                    }

                    /* body-text styles moved to page break control section */

                    .dates-section {
                        margin-top: ${marginLarge};
                        font-size: ${fontSizeBody};
                        color: #333;
                    }

                    .date-item {
                        margin-bottom: 8px;
                    }

                    .date-label {
                        font-weight: ${fontWeightBold};
                        display: inline-block;
                        width: 150px;
                    }

                    /* Section 3 Styles */
                    .section-3 {
                        page-break-before: always;
                    }

                    /* Section 4 Styles */
                    .section-4 {
                        page-break-before: always;
                    }

                    .inspection-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: ${marginLarge};
                    }

                    .inspection-table th {
                        font-size: ${fontSizeBody};
                        font-weight: ${fontWeightBold};
                        color: ${secondaryColor};
                        text-align: center;
                        padding: ${marginSmall} 0;
                        border: none;
                    }

                    .inspection-table td {
                        font-size: ${fontSizeBody};
                        font-weight: ${fontWeightBold};
                        color: ${primaryColor};
                        padding: ${marginSmall} 0;
                        border: none;
                        vertical-align: middle;
                    }

                    .inspection-table .checkmark {
                        text-align: center;
                        vertical-align: middle;
                    }

                    .inspection-table .checkmark img {
                        width: 20px;
                        height: 20px;
                        object-fit: contain;
                    }

                    .overall-condition-title {
                        font-size: ${fontSizeBody};
                        font-weight: ${fontWeightBold};
                        color: ${secondaryColor};
                        margin-bottom: ${marginSmall};
                        margin-top: ${marginLarge};
                    }

                    .overall-condition-text {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        line-height: 1.5;
                    }

                    /* Section 5 Styles */
                    .section-5 {
                        page-break-before: always;
                    }

                    /* Section 6 Styles */
                    .section-6 {
                        page-break-before: always;
                    }

                    /* accessibility-section styles moved to page break control section */

                    /* accessibility-text styles moved to page break control section */

                    .accessibility-list {
                        margin: ${marginMedium} 0;
                        padding-left: 0;
                        list-style: none;
                    }

                    .accessibility-list li {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        margin-bottom: 8px;
                        padding-left: 0;
                    }

                    /* risk-text styles moved to page break control section */

                    .risk-rating {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        margin-bottom: ${marginMedium};
                    }

                    .risk-rating strong {
                        font-weight: ${fontWeightBold};
                    }

                    /* Section 7 Styles */
                    .section-7 {
                        page-break-before: always;
                    }

                    /* defect-item and defect-title styles moved to page break control section */

                    .defect-details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: ${marginMedium};
                    }

                    .defect-details-table td {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        padding: 8px 0;
                        vertical-align: top;
                        border: none;
                    }

                    .defect-label {
                        font-weight: ${fontWeightBold};
                        width: 120px;
                    }

                    .defect-value {
                        padding-left: ${marginSmall};
                    }

                    .defect-information {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        line-height: 1.5;
                        text-align: justify;
                    }

                    /* Section 8 Styles */
                    .section-8 {
                        page-break-before: always;
                    }

                    /* Section 9 Styles */
                    .section-9 {
                        page-break-before: always;
                    }

                    /* Section 10 Styles */
                    .section-10 {
                        page-break-before: always;
                    }

                    /* Section 11 Styles */
                    .section-11 {
                        page-break-before: always;
                    }

                    .definitions-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }

                    .definitions-table td {
                        padding: 8px 12px;
                        vertical-align: top;
                    }

                    .definition-term {
                        width: 30%;
                    }

                    .definition-description {
                        width: 70%;
                        text-align: justify;
                    }

                    /* Section 12 Styles */
                    .section-12 {
                        page-break-before: always;
                    }

                    /* terms-content p styles moved to page break control section */

                    .section-header {
                        font-weight: 700;
                        font-size: ${fontSizeBody};
                        margin: 20px 0 10px 0;
                        color: ${primaryColor};
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    .italic-text {
                        font-style: italic;
                    }

                    .uppercase-text {
                        text-transform: uppercase;
                    }

                    /* Inspector Section Styles */
                    .section-inspector {
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        background-color: #0f264f !important;
                        min-height: ${isPreview ? "auto" : "100vh"};
                        height: ${isPreview ? "auto" : "100vh"};
                        max-height: ${isPreview ? "none" : "100vh"};
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                        margin: 0;
                        box-sizing: border-box;
                        overflow: visible;
                        position: relative;
                    }

                    /* Ensure the entire first page (inspector page) has the background color - only for admin users */
                    @page :first {
                        background-color: ${isEmployee ? "transparent" : "#0f264f"} !important;
                        margin: ${isPreview ? "0" : "0 0 20mm 0"}; /* Keep bottom margin for footer */
                        overflow: visible;
                    }

                    /* Apply background to the first page content - only for admin users */
                    .section-inspector::before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: ${isEmployee ? "transparent" : "#0f264f"};
                        z-index: -1;
                    }

                    .inspector-page-content {
                        text-align: left;
                        max-width: 700px;
                        width: 100%;
                        padding: 20px 20px 20px 10px;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        justify-content: center;
                        position: relative;
                        z-index: 2;
                        height: 100%;
                        min-height: 100vh;
                    }
                        
                    .inspector-logo {
                        margin-bottom: 20px;
                    }

                    .inspector-logo img {
                        max-width: 500px;
                        max-height: 200px;
                        height: auto;
                    }

                    .inspector-hexagon {
                        position: absolute;
                        top: 50%;
                        right: -200px;
                        transform: translateY(-50%);
                        z-index: 1;
                        pointer-events: none;
                    }

                    .inspector-hexagon img {
                        min-height: 1300px;
                        height: 1300px;
                        width: auto;
                        display: block;
                    }

                    .inspector-name {
                        font-size: 36px;
                        font-weight: ${fontWeightBold};
                        color: ${isEmployee ? "black" : "white"};
                        margin-bottom: 5px;
                        line-height: 1.1;
                        text-align: left;
                        width: 100%;
                        max-width: 700px;
                    }

                    .credentials {
                        font-size: 18px;
                        font-weight: normal;
                        color: ${isEmployee ? "black" : "white"};
                        margin-left: 3px;
                    }

                    .inspector-role {
                        font-size: 24px;
                        font-weight: normal;
                        color: ${isEmployee ? "black" : "white"};
                        margin-bottom: 25px;
                        text-align: left;
                        width: 100%;
                        max-width: 700px;
                    }

                    .inspector-phone {
                        font-size: 34px;
                        color: ${isEmployee ? "black" : "white"};
                        margin-bottom: 10px;
                        font-weight: ${fontWeightBold};
                        text-align: left;
                        width: 100%;
                        max-width: 550px;
                    }

                    .inspector-email {
                        letter-spacing: 2px;
                        font-size: 24px;
                        spacing: 20px;
                        color: ${isEmployee ? "black" : "white"};
                        margin-bottom: 10px;
                        text-align: left;
                        width: 100%;
                        max-width: 550px;
                    }

                    .separator-box {
                        height: 10px;
                        width: 100%;
                        max-width: 510px;
                        border-top: 1px solid ${isEmployee ? "black" : "white"};
                        border-bottom: 1px solid ${isEmployee ? "black" : "white"};
                        margin: 15px 0;
                    }

                    .company-details {
                        padding-top: 0px;
                        width: 100%;
                        max-width: 550px;
                        text-align: left;
                    }

                    .company-website,
                    .company-email,
                    .company-location {
                        font-size: 24px;
                        color: ${isEmployee ? "black" : "white"};
                        margin-bottom: 8px;
                        text-align: left;
                        width: 100%;
                    }

                    /* Section 13 Styles */
                    .section-13 {
                        page-break-before: always;
                    }

                    .large-header {
                        font-size: ${fontSizePageTitle};
                        font-weight: 700;
                        margin: 30px 0 20px 0;
                        color: ${primaryColor};
                    }

                    .certification-list {
                        margin: 20px 0;
                    }

                    /* certification-item styles moved to page break control section */

                    .certification-letter {
                        min-width: 30px;
                        font-weight: 700;
                        margin-right: 10px;
                    }

                    .certification-text {
                        flex: 1;
                        text-align: justify;
                        line-height: 1.4;
                    }

                    .general-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: ${marginLarge};
                    }

                    .general-table tr {
                        border-bottom: ${borderThin};
                    }

                    .general-label {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        padding: ${cellPadding};
                        vertical-align: top;
                        width: 40%;
                    }

                    .general-value {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        padding: ${cellPadding};
                        vertical-align: top;
                        line-height: 1.4;
                    }

                    .parties-table {
                        width: ${pageWidth};
                        border-collapse: collapse;
                        margin-bottom: ${marginLarge};
                    }

                    .parties-table tr {
                        border-top: ${borderThin};
                        border-bottom: ${borderThin};
                    }

                    .parties-label {
                        padding: ${cellPadding};
                        vertical-align: top;
                        width: 40%;
                        color: ${offBlack};
                    }

                    .parties-value {
                        padding: ${cellPadding};
                        vertical-align: top;
                        color: ${offBlack};
                        line-height: 1.4;
                    }

                    .special-conditions-title {
                        font-size: ${fontSizePageTitle};
                        font-weight: ${fontWeightBold};
                        color: ${primaryColor};
                        margin-bottom: ${marginSmall};
                    }

                    .special-conditions-text {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        line-height: 1.5;
                    }



                    /* Page break control styles */
                    .no-page-break {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    .page-break-before {
                        page-break-before: always;
                        break-before: always;
                    }

                    .page-break-after {
                        page-break-after: always;
                        break-after: always;
                    }

                    /* Prevent breaking of key content sections */
                    .defect-item {
                        margin-bottom: ${marginLarge};
                        /* Allow defect items to break across pages so images can flow naturally */
                    }

                    /* Keep defect content (title and table) together */
                    .defect-content {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    .accessibility-section {
                        margin-bottom: ${marginLarge};
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    .contents-section {
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Prevent tables from breaking */
                    .inspection-table,
                    .general-table,
                    .parties-table,
                    .definitions-table,
                    .contents-table,
                    .defect-details-table {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Allow defect images container to break across pages */
                    .defect-images-container {
                        margin-top: 20px;
                    }

                    /* Keep individual image rows together */
                    .defect-images-row {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Keep section titles with their content */
                    .section-title {
                        font-size: ${fontSizePageTitle};
                        font-weight: ${fontWeightBold};
                        color: ${primaryColor};
                        margin-bottom: ${marginMedium};
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    .section-subtitle {
                        font-size: ${fontSizePageTitle};
                        font-weight: ${fontWeightBold};
                        color: ${secondaryColor};
                        margin-bottom: ${marginMedium};
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    .defect-title {
                        font-size: ${fontSizePageTitle};
                        font-weight: ${fontWeightBold};
                        color: ${secondaryColor};
                        margin-bottom: ${marginMedium};
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    /* Keep certification items together */
                    .certification-item {
                        display: flex;
                        margin-bottom: 15px;
                        align-items: flex-start;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Keep terms content paragraphs together when possible */
                    .terms-content p {
                        margin-bottom: 15px;
                        text-align: justify;
                        line-height: 1.4;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        orphans: 2;
                        widows: 2;
                    }

                    /* Improve text flow for body text */
                    .body-text {
                        font-size: ${fontSizeBody};
                        line-height: 1.5;
                        color: #333;
                        margin-bottom: 30px;
                        text-align: justify;
                        orphans: 2;
                        widows: 2;
                    }

                    /* Improve text flow for accessibility text */
                    .accessibility-text {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        line-height: 1.5;
                        margin-bottom: ${marginMedium};
                        orphans: 2;
                        widows: 2;
                    }

                    /* Improve text flow for risk text */
                    .risk-text {
                        font-size: ${fontSizeBody};
                        color: ${offBlack};
                        line-height: 1.5;
                        margin-bottom: ${marginMedium};
                        orphans: 2;
                        widows: 2;
                    }

                    /* Print-specific styles */
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        /* Ensure first page background color is preserved in print - only for admin users */
                        @page :first {
                            background-color: ${isEmployee ? "transparent" : "#0f264f"} !important;
                            margin: ${isPreview ? "0" : "0 0 20mm 0"}; /* Keep bottom margin for footer */
                            overflow: visible;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        .section-inspector {
                            background-color: ${isEmployee ? "transparent" : "#0f264f"} !important;
                            overflow: visible !important;
                            position: relative !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        .inspector-hexagon {
                            position: absolute !important;
                            top: 1200px !important;
                            right: -340px !important;
                            z-index: 1 !important;
                        }

                        .inspector-hexagon img {
                            height: 450px !important;
                            width: auto !important;
                            display: block !important;
                        }

                        .page-break-before {
                            page-break-before: always;
                        }

                        .page-break-after {
                            page-break-after: always;
                        }

                        .no-page-break {
                            page-break-inside: avoid;
                        }

                        .inspection-table .checkmark img {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        /* Additional print-specific page break controls */
                        .accessibility-section,
                        .contents-section,
                        .certification-item,
                        .defect-content {
                            page-break-inside: avoid;
                        }

                        /* Keep individual image rows together in print */
                        .defect-images-row {
                            page-break-inside: avoid;
                        }

                        .inspection-table,
                        .general-table,
                        .parties-table,
                        .definitions-table,
                        .contents-table,
                        .defect-details-table {
                            page-break-inside: avoid;
                        }

                        .section-title,
                        .section-subtitle,
                        .defect-title {
                            page-break-after: avoid;
                        }
                    }


                `;

    // Define the page content
    const pageContent = (
        <>
            {/* DocRaptor Footer Flow - must be at the top of the document */}
            {!isPreview && isEmployee && (
                <div className="pdf-footer-flow">
                    {userLogoBase64 && <img className="pdf-footer-logo" src={isServer ? `data:image/webp;base64,${userLogoBase64}` : "/logos/Main [PastelAlt].webp"} alt="Company Logo" />}
                    <div className="pdf-footer-center-text">
                        {userData?.CompanyName && <div>{userData.CompanyName}</div>}
                        {userData?.CompanyName && userData?.ABN && <div className="pdf-footer-spacer"></div>}
                        {userData?.ABN && <div>ABN: {userData.ABN}</div>}
                    </div>
                </div>
            )}

            {/* Inspector Information Page - First Page */}
            <div className="main-page section-inspector">
                <div className="inspector-page-content">
                    {/* Logo - show user logo if employee has one, otherwise show AIMS logo, or hide if employee has no logo */}
                    {(!isEmployee || userLogoBase64) && (
                        <div className="inspector-logo">
                            <img src={isServer ? (userLogoBase64 ? `data:image/webp;base64,${userLogoBase64}` : `data:image/webp;base64,${base64LogosMainPastel}`) : "/logos/Main [PastelAlt].webp"} alt="" />
                        </div>
                    )}

                    {/* Company name - show below logo if employee has one */}
                    {companyName && (
                        <div className="company-name" style={{ fontSize: "24px", fontWeight: "bold", color: isEmployee ? "black" : "white", marginBottom: "15px", textAlign: "left" }}>
                            {companyName}
                        </div>
                    )}

                    <div className="inspector-name">
                        {inspectorName} {inspectorCredentials && <span className="credentials">{inspectorCredentials}</span>}
                    </div>
                    {inspectorRole && <div className="inspector-role">{inspectorRole}</div>}
                    {inspectorPhone && <div className="inspector-phone">M: {inspectorPhone}</div>}
                    <div className="inspector-email">{inspectorEmail}</div>

                    {/* Only show separator if there are company details to display */}
                    {(companyWebsite || companyEmail || companyLocation) && <div className="separator-box"></div>}

                    <div className="company-details">
                        {companyWebsite && <div className="company-website">{companyWebsite}</div>}
                        {companyEmail && <div className="company-email">{companyEmail}</div>}
                        {companyLocation && <div className="company-location">{companyLocation}</div>}
                    </div>

                    {/* Only show hexagon for admin users */}
                    {!isEmployee && (
                        <div className="inspector-hexagon">
                            <img src={isServer ? `data:image/svg+xml;base64,${base64HexagonGrid}` : "/logos/HexagonGrid.svg"} alt="" />
                        </div>
                    )}
                </div>
            </div>

            {/* Section 1 - Original First Page (not needed anymore, 07/10/25) */}
            {/* <div className="main-page section-1">
                <div className="section-1-logo">
                    <img src={isServer ? `data:image/webp;base64,${base64LogosMainThick}` : "/logos/Main [Thick].webp"} alt="Company Logo" />
                </div>

                <div className="section-1-title">{customer.Ex_ReportTypeName || "Building Inspection Report"}</div>

                <table className="section-1-table">
                    <tbody>
                        <tr>
                            <td className="label">Inspection Date:</td>
                            <td className="value">{inspectionDate}</td>
                        </tr>
                        <tr>
                            <td className="label">Property Address:</td>
                            <td className="value">{renderTextWithLineBreaks(customer.Address) || "Not specified"}</td>
                        </tr>
                    </tbody>
                </table>

                {customer.MainImageFileId && (
                    <div className="section-1-image">
                        <img src={customer.Ex_MainImageFileSignedUrl || (isServer && base64TestMainLogo ? `data:image/webp;base64,${base64TestMainLogo}` : "/CameraDefaultImage.webp")} alt="Property Image" />
                    </div>
                )}
            </div> */}

            {/* Section 2 */}
            <div className="main-page section-2">
                <div className="section-title">Contents</div>

                <div className="contents-section no-page-break">
                    <table className="contents-table no-page-break">
                        <tbody>
                            <tr>
                                <td className="section-cell blue"></td>
                                <td className="description-cell">The Parties</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section A</td>
                                <td className="description-cell">Results of inspection - summary</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section B</td>
                                <td className="description-cell">General</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section C</td>
                                <td className="description-cell">Accessibility</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section D</td>
                                <td className="description-cell">Significant Items</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section E</td>
                                <td className="description-cell">Additional comments</td>
                            </tr>
                            <tr>
                                <td className="section-cell blue">Section F</td>
                                <td className="description-cell">Annexures to this report</td>
                            </tr>
                            <tr>
                                <td className="section-cell"></td>
                                <td className="description-cell">Definitions to help you better understand this report</td>
                            </tr>
                            <tr>
                                <td className="section-cell"></td>
                                <td className="description-cell">Terms on which this report was prepared</td>
                            </tr>
                            <tr>
                                <td className="section-cell"></td>
                                <td className="description-cell">Special conditions or instructions</td>
                            </tr>
                            <tr>
                                <td className="section-cell"></td>
                                <td className="description-cell">
                                    If you have any queries with this report or require further information, please do not hesitate to contact the person who carried out the inspection. This Report has been prepared in accordance with the pre-inspection agreement in place between the parties set out below, which set out the purpose and scope of the inspection, and the significant items that will be reported on. This Report reflects the opinion of the inspector based on the documents that have been provided. This Report should be read in its entirety and in the context of the agreed scope of Services. If there is a discrepancy between the summary findings and the body of the Report, the body of the Report will prevail. We recommend that you should promptly implement any recommendation or advice in this Report, including recommendations of further inspections by another specialist. If you have any queries with this Report or require further information, please do not hesitate to contact
                                    the person who carried out the inspection. This Report contains reference to material that is the copyright of Standards Australia reproduced under agreement with SAI Global to AIMS Building Inspection.
                                </td>
                            </tr>
                            <tr>
                                <td>Original Inspection Date:</td>
                                <td className="description-cell">{inspectionDate}</td>
                            </tr>
                            <tr>
                                <td>Modified Date:</td>
                                <td className="description-cell">{modifiedDate || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 3 - The Parties */}
            <div className="main-page section-3">
                <div className="section-title">The Parties</div>

                <table className="parties-table no-page-break">
                    <tbody>
                        <tr>
                            <td className="parties-label">Name of the Client:</td>
                            <td className="parties-value">{customer.ClientName || "-"}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Name of the Principal (If Applicable):</td>
                            <td className="parties-value">{customer.ClientPrincipalName || ""}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Job Address:</td>
                            <td className="parties-value">{renderTextWithLineBreaks(customer.Address) || "-"}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Client&apos;s Email Address:</td>
                            <td className="parties-value">{customer.ClientEmail || "-"}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Client&apos;s Phone Number:</td>
                            <td className="parties-value">{customer.ClientPhone || "-"}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Consultant:</td>
                            <td className="parties-value">
                                {customer.InspectorName || `${customer.Ex_UserFirstName || ""} ${customer.Ex_UserLastName || ""}`.trim() || "-"}
                                {customer.InspectorPhone || customer.Ex_UserPhone ? ` Ph: ${customer.InspectorPhone || customer.Ex_UserPhone}` : ""}
                                <br />
                                Email: {customer.Ex_UserEmail || "-"}
                            </td>
                        </tr>
                        <tr>
                            <td className="parties-label"></td>
                            <td className="parties-value">{customer.InspectorQualification || customer.Ex_UserQualification || "-"}</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Company Name:</td>
                            <td className="parties-value">AIMS Engineering</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Company Address:</td>
                            <td className="parties-value">104 Coode Street, MAYLANDS WA 6051, Australia</td>
                        </tr>
                        <tr>
                            <td className="parties-label">Company Email:</td>
                            <td className="parties-value">info@aimsengineering.com.au</td>
                        </tr>
                    </tbody>
                </table>

                <div className="section-title">Special conditions or instructions</div>

                <div className="special-conditions-text">{renderTextWithLineBreaks(customer.SpecialConditions) || "A report may be conditional on information provided by the person, agents or employees of the person requesting the report, apparent concealment of possible defects and a range of other factors."}</div>
            </div>

            {/* Section 4 - Section A Results of Inspection */}
            <div className="main-page section-4">
                <div className="section-title">Section A Results of Inspection - summary</div>

                <div className="section-subtitle">A summary of your inspection is outlined below; please also refer to the Report.</div>

                <table className="inspection-table no-page-break">
                    <thead>
                        <tr>
                            <th style={{ width: "60%" }}></th>
                            <th style={{ width: "20%" }}>Found</th>
                            <th style={{ width: "20%" }}>Not Found</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Safety Hazard</td>
                            <td className="checkmark">{defectCounts.safetyHazard > 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                            <td className="checkmark">{defectCounts.safetyHazard === 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                        </tr>
                        <tr>
                            <td>Major Defect</td>
                            <td className="checkmark">{defectCounts.majorDefect > 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                            <td className="checkmark">{defectCounts.majorDefect === 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                        </tr>
                        <tr>
                            <td>Minor Defect</td>
                            <td className="checkmark">{defectCounts.minorDefect > 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                            <td className="checkmark">{defectCounts.minorDefect === 0 ? <img src={isServer ? `data:image/webp;base64,${base64Tick}` : "/icons/Tick.webp"} alt="Tick" /> : ""}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="overall-condition-title">Overall Condition</div>

                <div className="overall-condition-text">
                    In summary, the building, compared to others of similar age and construction is in {getMultiSelectDisplayValue(customer.Ex_OverallConditionNamesList)?.toLowerCase() || "fair"} condition with {generateDefectSummaryText()}.
                </div>
            </div>

            {/* Section 5 - Section B General */}
            <div className="main-page section-5">
                <div className="section-title">Section B General</div>

                <div className="section-subtitle">General description of the property</div>

                <table className="general-table no-page-break">
                    <tbody>
                        <tr>
                            <td className="general-label">Building Type</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_BuildingTypeList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Company or Strata title</td>
                            <td className="general-value">{customer.CompanyStrataTitle || "-"}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Floor</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_FloorList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Furnished</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_FurnishedList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">No. of bedrooms</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_NumBedroomsList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Occupied</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_OccupiedList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Orientation</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_OrientationList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Other Building Elements</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_OtherBuildingElementsList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Other Timber Bldg Elements</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_OtherTimberBldgElementsList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Roof</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_RoofList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Storeys</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_StoreysList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Walls</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_WallsList)}</td>
                        </tr>
                        <tr>
                            <td className="general-label">Weather</td>
                            <td className="general-value">{getMultiSelectDisplayValue(customer.Ex_WeatherList)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section 6 - Section C Accessibility */}
            <div className="main-page section-6">
                <div className="section-title">Section C Accessibility</div>

                <div className="accessibility-section no-page-break">
                    <div className="section-subtitle">Areas Inspected</div>

                    <div className="accessibility-text">The following areas were inspected. As documented in your Pre-Inspection Agreement, obstructions and limitations to the accessible areas for inspection are to be expected in any inspection. Refer also to our listing of obstructions and limitations.</div>

                    <ul className="accessibility-list">{areasInspectedNames.length > 0 ? areasInspectedNames.map((name, index) => <li key={index}>- {name}</li>) : <li>- No areas specified</li>}</ul>

                    <div className="accessibility-text">The inspection excludes areas which are affected by obstructions or where access is limited or unsafe. We do not move obstructions and building defects may not be obvious unless obstructions or unsafe conditions are removed to provide access.</div>
                </div>

                <div className="accessibility-section no-page-break">
                    <div className="section-subtitle">Inaccessible Areas</div>

                    <div className="accessibility-text">The following areas were inaccessible:</div>

                    <ul className="accessibility-list">{inaccessibleAreasNames.length > 0 ? inaccessibleAreasNames.map((name, index) => <li key={index}>- {name}</li>) : <li>- No inaccessible areas specified</li>}</ul>

                    <div className="accessibility-text">Any areas which are inaccessible at the time of inspection present a high risk for undetected building defects. The client is strongly advised to make arrangements to access inaccessible areas urgently wherever possible.</div>
                </div>

                <div className="accessibility-section no-page-break">
                    <div className="section-subtitle">Obstructions and Limitations</div>

                    <div className="accessibility-text">Building defects may be concealed by the following obstructions which prevented full inspection:</div>

                    <ul className="accessibility-list">{obstructionsNames.length > 0 ? obstructionsNames.map((name, index) => <li key={index}>- {name}</li>) : <li>- No obstructions specified</li>}</ul>

                    <div className="accessibility-text">The presence of obstructions increases the risk of undetected defects. The client should make arrangement to remove obstructions where ever possible and re-inspect these areas as a matter of urgency. See also overall risk rating for undetected defects.</div>
                </div>

                <div className="accessibility-section no-page-break">
                    <div className="section-subtitle">Undetected defect risk</div>

                    <div className="risk-text">A risk rating is provided to help you understand the degree to which accessibility issues and the presence of obstructions have limited the scope of the inspection</div>

                    <div className="risk-rating">
                        The risk of undetected defects is: <strong>{riskOfUndetectedDefectsName}</strong>
                    </div>

                    <div className="risk-text">When the risk of undetected defects medium or high we strongly recommend further inspection once access is provided or if the obstruction can be removed. Contact us for further advice.</div>
                </div>
            </div>

            {/* Section 7 - Section D Significant Items */}
            <div className="main-page section-7">
                <div className="section-title">Section D Significant Items</div>

                {/* Render Safety Hazards */}
                {renderDefectsBySeverity("Safety Hazard", groupedDefects["Safety Hazard"])}

                {/* Render Major Defects */}
                {renderDefectsBySeverity("Major Defect", groupedDefects["Major Defect"])}

                {/* Render Minor Defects */}
                {renderDefectsBySeverity("Minor Defect", groupedDefects["Minor Defect"])}
            </div>

            {/* Section 8 - Section D Significant Items (Continued) */}
            <div className="main-page section-8">
                <div className="section-title">Section D Significant Items</div>

                <div className="section-subtitle">D4 Further Inspections</div>

                <div className="body-text">We advise that you seek additional specialist inspections from a qualified and, where appropriate, licensed</div>

                {futherInspectionsNames.length > 0 ? (
                    futherInspectionsNames.map((name, index) => (
                        <div key={index} className="body-text" style={{ marginTop: index === 0 ? marginSmall : 0, marginBottom: marginMedium }}>
                            - {name}
                        </div>
                    ))
                ) : (
                    <div className="body-text" style={{ marginTop: marginSmall, marginBottom: marginMedium }}>
                        - No further inspections specified
                    </div>
                )}

                <div className="body-text">AIMS Building Inspection can put you in contact with qualified and licensed providers of these and other trades services. Please contact your inspector for recommendations.</div>

                <div className="section-subtitle">D5 Conclusion - Assessment of overall condition of property</div>

                {customer.Summary ? (
                    <div className="body-text">{renderTextWithLineBreaks(customer.Summary)}</div>
                ) : (
                    <div className="body-text">
                        - Compared to other buildings of a similar age, the visual appraisal and a limited assessment of serviceability of the{" "}
                        {customer.Ex_BuildingTypeList?.map(item => item.Name)
                            .join("/")
                            .toLowerCase() || "building"}{" "}
                        at the time of inspection was in a {getMultiSelectDisplayValue(customer.Ex_OverallConditionList)?.toLowerCase() || "fair"} condition. All significant items have been noted in the body of the report and will require addressing.
                    </div>
                )}

                <div className="body-text">Several limitations and obstructions impeded the inspection and, if feasible, should be removed, and a further inspection should be performed. Indicative images below depict some of the obstructions encountered.</div>

                <div className="body-text">
                    For further information, advice and clarification please contact {customer.InspectorName || `${customer.Ex_UserFirstName || ""} ${customer.Ex_UserLastName || ""}`.trim() || "-"} on: {customer.InspectorPhone || customer.Ex_UserPhone || "-"}
                </div>
            </div>

            {/* Section 9 - Section E Attachments and Further Comments */}
            <div className="main-page section-9">
                <div className="section-title">Section E Attachments and Further Comments</div>

                <div className="body-text" style={{ marginTop: marginLarge }}>
                    - Defects Report
                </div>

                <div className="body-text" style={{ marginTop: marginLarge }}>
                    - Definitions
                </div>
            </div>

            {/* Section 10 - Section D Significant Items (Noted Items) */}
            <div className="main-page section-10">
                <div className="section-title">Section D Significant Items</div>

                <div className="section-subtitle">The following items were noted as - For your information</div>

                {/* Render Noted Items */}
                {renderDefectsBySeverity("Noted Item", groupedDefects["Noted Item"])}
            </div>

            {/* Section 11 - Definitions */}
            <div className="main-page section-11">
                <div className="section-title">Definitions to help you better understand this report</div>

                <table className="definitions-table no-page-break">
                    <tbody>
                        <tr>
                            <td className="definition-term">Access hole (cover)</td>
                            <td className="definition-description">An opening in flooring or ceiling or other parts of a structure (such as service hatch, removable panel) to allow for entry to carry out an inspection, maintenance or repair.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Accessible area</td>
                            <td className="definition-description">An area of the site where sufficient, safe and reasonable access is available to allow inspection within the scope of the inspection.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Appearance defect</td>
                            <td className="definition-description">Fault or deviation from the intended appearance of a building element.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Asbestos-Containing Material (ACM)</td>
                            <td className="definition-description">Asbestos-containing material (ACM) means any material or thing that, as part of its design, contains asbestos.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Building element</td>
                            <td className="definition-description">A portion of a building that, by itself or in combination with other such parts, fulfils a characteristic function. NOTE: For example supporting, enclosing, furnishing or servicing building space.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Client</td>
                            <td className="definition-description">The person or other entity for whom the inspection is being carried out.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Defect</td>
                            <td className="definition-description">Fault or deviation from the intended condition of a material, assembly, or component.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Detailed assessment</td>
                            <td className="definition-description">An assessment by an accredited sampler to determine the extent and magnitude of methamphetamine contamination in a property.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Inspection</td>
                            <td className="definition-description">Close and careful scrutiny of a building carried out without dismantling, in order to arrive at a reliable conclusion as to the condition of the building.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Inspector</td>
                            <td className="definition-description">Person or organisation responsible for carrying out the inspection.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Limitation</td>
                            <td className="definition-description">Any factor that prevents full or proper inspection of the building.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Major defect</td>
                            <td className="definition-description">A defect of sufficient magnitude where rectification has to be carried out in order to avoid unsafe conditions, loss of utility or further deterioration of the property.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Methamphetamine</td>
                            <td className="definition-description">An amphetamine-type stimulant that is highly addictive. Methamphetamine is a controlled substance, classified as a Class A (very high-risk) drug under the Misuse of Drug Act. This term is used as a grouping term to include all substances screened for, specifically: Ephedrine, Pseudoephedrine,Amphetamine, Methamphetamine, MDA and MDMA.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Methamphetamine contamination</td>
                            <td className="definition-description">A property or part of a property where the level of methamphetamine has been tested in accordance with this standard and found to exceed 0.5 micrograms/100 cm2 (Residential) or 10 micrograms/100 cm2 (Commercial).</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Methamphetamine production/manufacture</td>
                            <td className="definition-description">The manufacture of methamphetamine, including processing, packaging, and storage of methamphetamine and associated chemicals.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Minor defect</td>
                            <td className="definition-description">A defect other than a major defect.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Roof space/Roof void</td>
                            <td className="definition-description">Space between the roof covering and the ceiling immediately below the roof covering.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Screening assessment</td>
                            <td className="definition-description">An assessment by a screening sampler to determine whether or not methamphetamine is present.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Serviceability defect</td>
                            <td className="definition-description">Fault or deviation from the intended serviceability performance of a building element.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Significant item</td>
                            <td className="definition-description">An item that is to be reported in accordance with the scope of the inspection.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Site</td>
                            <td className="definition-description">Allotment of land on which a building stands or is to be erected.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Structural defect</td>
                            <td className="definition-description">Fault or deviation from the intended structural performance of a building element.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Structural element</td>
                            <td className="definition-description">Physically distinguishable part of a structure. NOTE: For example wall, columns, beam, connection.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Subfloor space</td>
                            <td className="definition-description">Space between the underside of a suspended floor and the ground.</td>
                        </tr>
                        <tr>
                            <td className="definition-term">Urgent and Serious Safety Hazards</td>
                            <td className="definition-description">Building elements or situations that present a current or immediate potential threat of injury or disease to persons.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Section 12 - Terms on which this report was prepared */}
            <div className="main-page section-12">
                <div className="section-title">Terms on which this report was prepared</div>

                <div className="terms-content">
                    <p>This report is based on the condition of the property at the time of inspection. We strongly recommend re-inspection 30 days after this report is issued as the general condition of the property is likely to have changed, including the extent of defects described and instance of potential undetected defects.</p>

                    <p>This report has been prepared in accordance with and subject to the pre-inspection agreement in place between the parties, which forms part of this Report.</p>

                    <p className="italic-text">This Report is prepared for the client identified above and may not be relied on by any other person without our express permission or by the purchase of this Report on our website.</p>

                    <p className="uppercase-text">SPECIAL ATTENTION SHOULD BE GIVEN TO THE SCOPE, LIMITATIONS AND EXCLUSIONS IN YOUR PRE-INSPECTION AGREEMENT AND THIS REPORT</p>

                    <p>Any of the exclusions or limitations identified for this Report may be the subject of a special-purpose inspection which we recommend being undertaken by an appropriately qualified inspector</p>

                    <div className="section-header">RELIANCE AND DISCLOSURE</div>

                    <p>This report has been prepared based on conditions at the time of the report.</p>

                    <p>We own the copyright in this report and may make it available to third parties.</p>

                    <p>
                        If your Property is in the Australian Capital Territory, you acknowledge we will make certain information about this Report available to the ACT Government for inclusion in the building and pest inspections public register if required under the <em>Civil Law (Sale of Residential Property) Act 2003</em>. This will include the fact the report has been prepared, the Property street address, date of the inspection, the name of the person who prepared the report and (if applicable) the entity that employs them.
                    </p>

                    <div className="section-header">UNDETECTED DEFECT RISK RATING</div>

                    <p>If this Report has identified a medium or high-risk rating for undetected defects, we strongly recommend a further inspection of areas that were inaccessible. This may include an invasive inspection that requires the removal or cutting of walls, floors or ceilings.</p>

                    <p className="italic-text">If the Property has been vacant for a period of time, moisture levels or leaks may not be detectable at the time of the inspection because often only frequent use of water pipes (showers, taps etc) result in a leak being identifiable. We advise further testing on pipes and water susceptible areas (such as the bathroom and laundry) after more frequent use has occurred.</p>

                    <div className="section-header">IMPORTANT SAFETY INFORMATION:</div>

                    <p>
                        <strong>This is not a report by a licensed plumber or electrician.</strong> We recommend a special-purpose report to detect substandard or illegal plumbing and electrical work at the Property
                    </p>

                    <p>
                        <strong>This is not a smoke alarm report.</strong> We recommend all existing detectors in the Property be tested and advice sought as to the suitability of number, placement and operation.
                    </p>

                    <p>
                        <strong>This is not a pest report.</strong> As termites are widespread throughout mainland Australia we recommend annual timber pest inspections.
                    </p>

                    <p>
                        <strong>This is not an asbestos report.</strong> There are potential products in the Property containing asbestos that will not be identified in this report. In order to accurately identify asbestos, we recommend performing an asbestos inspection, particularly for buildings built prior to 1988.
                    </p>

                    <p>
                        <strong>This is not a report on safety glass.</strong> Glazing in older homes may not reflect current standards and may cause significant injury if damaged. Exercise caution around the glass in older homes.
                    </p>

                    <p>
                        <strong>This is not a report on window opening restrictions.</strong> We have not inspected window opening restrictors. Window openings in older buildings may not reflect current standards and can be a potential risk. Window opening restrictors are advised for all second story or above windows with sill heights below 900mm. Some states make this a mandatory requirement. Owners should enquire of their local and state requirements to ensure compliance.
                    </p>

                    <p>
                        <strong>This is not a report on pool safety.</strong> If a swimming pool is present it should be the subject to a special purpose pool inspection.
                    </p>

                    <p>
                        <strong>External Timber Structures - Balcony and Decks.</strong> It is strongly recommended that a Structural Engineer is required to assess distributed load capacity of external timber structures such as balconies and decks, alerting users of the load capacity. Regular maintenance and inspections by competent practitioners to assess the ongoing durability of exposed external timber structures are needed.
                    </p>

                    <p>
                        <strong>This is not a Group Titled Property Report as per AS4349.2.</strong> If you require a report for a Group Titled Property as per this standard, please seek a separate inspection for Group Titled Properties.
                    </p>

                    <div className="section-header">MOISTURE</div>

                    <p>The identification of moisture, dampness or the evidence of water penetration is dependent on the weather conditions at the time of inspection. The absence of dampness identified in this Report does not necessarily mean the Property will not experience some damp problems in other weather conditions or that roofs, walls or wet areas are watertight.</p>

                    <p>Where the evidence of water penetration is identified we recommend detailed investigation of waterproofing in the surrounding area monitoring of the affected area over a period of time to fully detect and assess the cause of dampness.</p>

                    <div className="section-header">MAINTENANCE OF THE PROPERTY</div>

                    <p>This Report is not a warranty or an insurance policy against problems developing with the Property in the future. Accordingly, a preventative maintenance program should be implemented which includes systematic inspections, detection and prevention of issues. Please contact the inspector who carried out this inspection for further advice.</p>
                </div>
            </div>

            {/* Section 13 - No Certification and Rectification Costs */}
            <div className="main-page section-13">
                <div className="section-header large-header">NO CERTIFICATION</div>

                <div className="certification-list no-page-break">
                    <div className="certification-item no-page-break">
                        <span className="certification-letter">a)</span>
                        <span className="certification-text">The Property has been compared to others of a similar age, construction type and method that had an acceptable level of basic maintenance completed.</span>
                    </div>
                    <div className="certification-item no-page-break">
                        <span className="certification-letter">b)</span>
                        <span className="certification-text">We don&apos;t advise you about title, ownership or other legal matters like easements, restrictions, covenants and planning laws. None of our inspections constitutes approval by a Building Surveyor, a certificate of occupancy or compliance with any law, regulation or standard, including any comment on whether the Property complies with current Australian Standards, Building Regulations or other legislative requirements.</span>
                    </div>
                </div>

                <div className="section-header large-header">RECTIFICATION COSTS</div>

                <p>We don&apos;t provide advice on the costs of rectification or repair unless specifically identified in the scope of the Report. Any cost advice provided verbally or in this report must be taken as of a general nature and is not to be relied on. Actual costs depend on the quality of materials, the standard of work, what price a contractor is prepared to do the work for and may be contingent on approvals, delays and unknown factors associated with third parties. No liability is accepted for costing advice.</p>
            </div>
        </>
    );

    // Return based on isPreview prop
    if (isPreview) {
        return (
            <div style={{ fontFamily: fontFamily }}>
                <style>{styles}</style>
                {pageContent}
            </div>
        );
    }

    // Return full HTML document for PDF generation
    return (
        <html>
            <head>
                <title>Customer Inspection Report</title>
                <style>{styles}</style>
            </head>
            <body>{pageContent}</body>
        </html>
    );
}
