import { JC_Utils_Dates } from "@/app/Utils";
import { CustomerModel } from "@/app/models/Customer";

interface Template_InspectionReportEmailProps {
    customer: CustomerModel;
    pdfUrl?: string; // Optional PDF URL for large files
}

export default function Template_InspectionReportEmail(props: Template_InspectionReportEmailProps | CustomerModel) {
    // Handle both old and new prop formats for backward compatibility
    const customer = "customer" in props ? props.customer : props;
    const pdfUrl = "pdfUrl" in props ? props.pdfUrl : undefined;
    const inspectionDate = customer.InspectionDate ? JC_Utils_Dates.formatDateFull(customer.InspectionDate) : "Not specified";

    return (
        <div>
            <table>
                <tr>
                    <td colSpan={2} style={{ paddingBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>
                        Building Inspection Report
                    </td>
                </tr>

                <tr>
                    <td>Client Name:</td>
                    <td>{customer.ClientName}</td>
                </tr>

                <tr>
                    <td>Property Address:</td>
                    <td>{customer.Address || "Not specified"}</td>
                </tr>

                <tr>
                    <td>Inspection Date:</td>
                    <td>{inspectionDate}</td>
                </tr>

                <tr>
                    <td>Inspector:</td>
                    <td>{customer.InspectorName || "Not specified"}</td>
                </tr>

                <tr>
                    <td colSpan={2} style={{ paddingTop: "20px" }}>
                        {pdfUrl ? (
                            <>
                                Your building inspection report is available for download using the link below:
                                <br />
                                <br />
                                <a href={pdfUrl} style={{ color: "#0066cc", textDecoration: "underline" }}>
                                    Download Inspection Report
                                </a>
                                <br />
                                <br />
                                <em>Note: This download link will expire in 30 days.</em>
                            </>
                        ) : (
                            "Please find your building inspection report attached to this email."
                        )}
                    </td>
                </tr>

                <tr>
                    <td colSpan={2} style={{ paddingTop: "10px" }}>
                        If you have any questions about this report, please don't hesitate to contact us.
                    </td>
                </tr>
            </table>
        </div>
    );
}
