import React, { useRef } from "react";
import { toWords } from "number-to-words";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation, useNavigate } from "react-router-dom";

// Print CSS for A4-only output
const printStyles = `
@media print {
    body * {
        visibility: hidden !important;
    }
    #payment-made-print-sheet, #payment-made-print-sheet * {
        visibility: visible !important;
    }
    #payment-made-print-sheet {
        position: absolute !important;
        left: 0; top: 0;
        width: 210mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        box-shadow: none !important;
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        overflow: auto !important;
        z-index: 9999 !important;
        page-break-after: auto !important;
        page-break-inside: avoid !important;
    }
}
`;

const PaymentMadeReport = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const printRef = useRef();

    // If no data, show message
    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Payment Selected</h5>
                <p className="text-muted">Please select a payment from the list to view its report.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate("/paymentsmade")}>
                    Back to Payments Made
                </button>
            </div>
        );
    }

    // Normalize data fields
    const payment = {
        paymentNumber: state.paymentNumber ?? state.receiptNumber ?? state.number ?? "1",
        paymentDate: state.date ?? state.paymentDate ?? "",
        vendorName: state.vendorName ?? state.vendor?.name ?? state.customerName ?? "",
        vendorAddress: state.vendorAddress ?? state.vendor?.address ?? state.customerAddress ?? "",
        vendorGstin: state.vendorGstin ?? state.vendorGST ?? "",
        referenceNumber: state.referenceNumber ?? state.reference ?? "Ref023",
        placeOfSupply: state.placeOfSupply ?? "Tamil Nadu (33)",
        mode: state.mode ?? state.paymentMode ?? "Cash",
        paidThrough: state.paidThrough ?? state.paymentMethod ?? "Petty Cash",
        amount: state.amount ?? state.totalAmount ?? 0,
        unusedAmount: state.unusedAmount ?? state.balanceAmount ?? 0,
        status: state.status ?? "Draft",
        notes: state.notes ?? state.customerNotes ?? "",
    };

    // Company details
    const companyInfo = {
        name: "LOM TECH",
        address: "Tamil Nadu",
        address2: "India",
        gstin: "33ABCDE1234F1Z5",
        phone: "91-8056374039",
        email: "sabari@lomtech.ai"
    };

    const amountInWords = payment.amount > 0 
        ? `Indian Rupee ${toWords(Math.round(payment.amount)).replace(/,/g, "")} Only`
        : "";

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // PDF Download
    const downloadPDF = async () => {
        const input = printRef.current;
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(input, { 
            scale: 3,
            backgroundColor: "#ffffff",
        });
        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, "PNG", 0, 0, w, h);
        pdf.save(`PaymentMade_${payment.paymentNumber || 'Payment'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center gap-4 mb-3">
                    <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/paymentsmade")}
                    >
                        <i className="bi bi-arrow-left me-2"></i>Back
                    </button>
                    <div className="d-flex gap-4">
                        <i 
                            className="bi bi-download" 
                            style={{ fontSize: "22px", cursor: "pointer" }} 
                            title="Download PDF" 
                            onClick={downloadPDF}
                        ></i>
                        <i 
                            className="bi bi-printer" 
                            style={{ fontSize: "22px", cursor: "pointer" }} 
                            title="Print" 
                            onClick={() => window.print()}
                        ></i>
                    </div>
                </div>
                <div
                    ref={printRef}
                    id="payment-made-print-sheet"
                    style={printSheetStyle}
                >
                    {/* Header - Company Info */}
                    <div style={companyHeaderStyle}>
                        <div style={companyNameStyle}>{companyInfo.name}</div>
                        <div style={companyDetailStyle}>{companyInfo.address}</div>
                        <div style={companyDetailStyle}>{companyInfo.address2}</div>
                        <div style={companyDetailStyle}>GSTIN {companyInfo.gstin}</div>
                        <div style={companyDetailStyle}>{companyInfo.phone}</div>
                        <div style={companyDetailStyle}>{companyInfo.email}</div>
                    </div>

                    {/* Divider Line */}
                    <div style={dividerLineStyle}></div>

                    {/* Title */}
                    <div style={titleHeaderStyle}>
                        <div style={documentTitleStyle}>PAYMENTS MADE</div>
                    </div>

                    {/* Payment Details Section */}
                    <div style={paymentDetailsSectionStyle}>
                        {/* Payment Details Table - Left */}
                        <div style={paymentDetailsLeftStyle}>
                            <table style={paymentDetailsTableStyle}>
                                <tbody>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Payment#:</td>
                                        <td style={paymentDetailValueStyle}>{payment.paymentNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Payment Date:</td>
                                        <td style={paymentDetailValueStyle}>{formatDate(payment.paymentDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Reference Number:</td>
                                        <td style={paymentDetailValueStyle}>{payment.referenceNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Paid To:</td>
                                        <td style={paymentDetailValueStyle}>{payment.vendorName}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Place Of Supply:</td>
                                        <td style={paymentDetailValueStyle}>{payment.placeOfSupply}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Payment Mode:</td>
                                        <td style={paymentDetailValueStyle}>{payment.mode}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Paid Through:</td>
                                        <td style={paymentDetailValueStyle}>{payment.paidThrough}</td>
                                    </tr>
                                    <tr>
                                        <td style={paymentDetailLabelStyle}>Amount Paid In Words:</td>
                                        <td style={paymentDetailValueStyle}>{amountInWords}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Amount Paid Box - Right */}
                        <div style={amountBoxStyle}>
                            <div style={amountBoxLabelStyle}>Amount Paid</div>
                            <div style={amountBoxValueStyle}>₹{Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Paid To Section */}
                    <div style={paidToSectionStyle}>
                        <div style={sectionTitleStyle}>Paid To</div>
                        <div style={vendorNameStyle}>{payment.vendorName}</div>
                        {payment.vendorGstin && <div style={vendorDetailStyle}>GSTIN {payment.vendorGstin}</div>}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ========= Styles ========= */
const printSheetStyle = {
    width: "210mm",
    minHeight: "297mm",
    padding: "20mm",
    margin: "0 auto",
    background: "#fff",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#000",
    lineHeight: "1.5",
    position: "relative"
};

const companyHeaderStyle = {
    marginBottom: "15px"
};

const companyNameStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "4px"
};

const companyDetailStyle = {
    fontSize: "12px",
    marginBottom: "2px",
    color: "#333"
};

const dividerLineStyle = {
    borderTop: "1px solid #333",
    marginBottom: "20px"
};

const titleHeaderStyle = {
    textAlign: "center",
    marginBottom: "30px"
};

const documentTitleStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "3px",
    color: "#333"
};

const paymentDetailsSectionStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "40px",
    gap: "40px"
};

const paymentDetailsLeftStyle = {
    flex: "1"
};

const paymentDetailsTableStyle = {
    width: "100%",
    borderCollapse: "collapse"
};

const paymentDetailLabelStyle = {
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: "600",
    width: "40%",
    verticalAlign: "top"
};

const paymentDetailValueStyle = {
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333"
};

const amountBoxStyle = {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "25px",
    borderRadius: "4px",
    textAlign: "center",
    minWidth: "220px",
    height: "fit-content"
};

const amountBoxLabelStyle = {
    fontSize: "14px",
    marginBottom: "12px",
    fontWeight: "600"
};

const amountBoxValueStyle = {
    fontSize: "28px",
    fontWeight: "bold"
};

const paidToSectionStyle = {
    marginTop: "40px"
};

const sectionTitleStyle = {
    fontWeight: "bold",
    marginBottom: "8px",
    fontSize: "14px"
};

const vendorNameStyle = {
    fontWeight: "600",
    marginBottom: "4px",
    fontSize: "13px"
};

const vendorDetailStyle = {
    fontSize: "12px",
    marginBottom: "2px",
    color: "#555"
};

export default PaymentMadeReport;
