import React, { useRef } from "react";
import { toWords } from "number-to-words";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation } from "react-router-dom";

// Print CSS for A4-only output
const printStyles = `
@media print {
    body * {
        visibility: hidden !important;
    }
    #payment-received-print-sheet, #payment-received-print-sheet * {
        visibility: visible !important;
    }
    #payment-received-print-sheet {
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

const PaymentReceivedReport = () => {
    const { state } = useLocation();
    const printRef = useRef();

    // If no data, show message
    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Payment Selected</h5>
                <p className="text-muted">Please select a payment from the list to view its report.</p>
            </div>
        );
    }

    // Normalize data fields
    const payment = {
        paymentNumber: state.paymentNumber ?? state.paymentNo ?? state.receiptNo ?? state.number ?? "",
        paymentDate: state.date ?? state.paymentDate ?? "",
        customerName: state.customerName ?? state.clientName ?? state.partyName ?? "",
        customerAddress: state.customerAddress ?? state.address ?? "",
        referenceNumber: state.referenceNumber ?? state.reference ?? "",
        invoiceNumber: state.invoiceNumber ?? state.invoiceNo ?? "INV-000002",
        invoiceDate: state.invoiceDate ?? state.date ?? "",
        mode: state.mode ?? state.paymentMode ?? "Cash",
        amount: state.amount ?? state.totalAmount ?? state.amountReceived ?? 0,
        invoiceAmount: state.invoiceAmount ?? state.amount ?? 0,
        paymentAmount: state.paymentAmount ?? state.amount ?? 0,
        status: state.status ?? "Draft",
        notes: state.notes ?? state.customerNotes ?? "",
    };

    // Company details
    const companyInfo = {
        name: "LOM TECH",
        address: "Tamil Nadu, India",
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
        const canvas = await html2canvas(input, { scale: 3, backgroundColor: "#ffffff" });
        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, "PNG", 0, 0, w, h);
        pdf.save(`PaymentReceived_${payment.paymentNumber || 'Payment'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Toolbar */}
                <div className="d-flex justify-content-end align-items-center gap-4 mb-3">
                    <i className="bi bi-download" style={{ fontSize: "22px", cursor: "pointer" }} title="Download PDF" onClick={downloadPDF}></i>
                    <i className="bi bi-printer" style={{ fontSize: "22px", cursor: "pointer" }} title="Print" onClick={() => window.print()}></i>
                </div>
                <div
                    ref={printRef}
                    id="payment-received-print-sheet"
                    style={printSheetStyle}
                >
                    {/* Header - Title */}
                    <div style={titleHeaderStyle}>
                        <div style={documentTitleStyle}>PAYMENT RECEIPT</div>
                    </div>

                    {/* Amount Box - Top Right */}
                    <div style={amountBoxStyle}>
                        <div style={amountBoxLabelStyle}>Amount Received</div>
                        <div style={amountBoxValueStyle}>₹{Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>

                    {/* Payment Details Section */}
                    <div style={paymentDetailsSectionStyle}>
                        <div style={paymentDetailsLeftStyle}>
                            <div style={detailRowStyle}>
                                <span style={detailLabelStyle}>Payment Date:</span>
                                <span style={detailValueStyle}>{formatDate(payment.paymentDate)}</span>
                            </div>
                            {payment.referenceNumber && (
                                <div style={detailRowStyle}>
                                    <span style={detailLabelStyle}>Reference Number:</span>
                                    <span style={detailValueStyle}>{payment.referenceNumber}</span>
                                </div>
                            )}
                            <div style={detailRowStyle}>
                                <span style={detailLabelStyle}>Payment Mode:</span>
                                <span style={detailValueStyle}>{payment.mode}</span>
                            </div>
                            <div style={detailRowStyle}>
                                <span style={detailLabelStyle}>Amount Received In Words:</span>
                                <span style={detailValueStyle}>{amountInWords}</span>
                            </div>
                            <div style={detailRowStyle}>
                                <span style={detailLabelStyle}>Received From:</span>
                                <span style={detailValueStyle}>{payment.customerName}</span>
                            </div>
                        </div>
                        <div style={paymentDetailsRightStyle}>
                            <div style={signatureBlockStyle}>
                                <div style={signatureLineStyle}></div>
                                <div style={signatureLabelStyle}>Authorized Signature</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment For Section */}
                    <div style={paymentForSectionStyle}>
                        <div style={paymentForTitleStyle}>Payment for</div>
                        <table style={invoiceTableStyle}>
                            <thead>
                                <tr>
                                    <th style={invoiceThStyle}>Invoice Number</th>
                                    <th style={invoiceThStyle}>Invoice Date</th>
                                    <th style={invoiceThStyle}>Invoice Amount</th>
                                    <th style={invoiceThStyle}>Payment Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={invoiceTdStyle}>{payment.invoiceNumber}</td>
                                    <td style={invoiceTdStyle}>{formatDate(payment.invoiceDate)}</td>
                                    <td style={invoiceTdStyle}>₹{Number(payment.invoiceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td style={invoiceTdStyle}>₹{Number(payment.paymentAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Page Number */}
                    <div style={pageNumberStyle}>1</div>
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

const amountBoxStyle = {
    position: "absolute",
    top: "20mm",
    right: "20mm",
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "20px",
    borderRadius: "4px",
    textAlign: "center",
    minWidth: "200px"
};

const amountBoxLabelStyle = {
    fontSize: "14px",
    marginBottom: "10px",
    fontWeight: "600"
};

const amountBoxValueStyle = {
    fontSize: "24px",
    fontWeight: "bold"
};

const paymentDetailsSectionStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "80px",
    marginBottom: "40px",
    gap: "40px"
};

const paymentDetailsLeftStyle = {
    flex: "1"
};

const paymentDetailsRightStyle = {
    flex: "0 0 200px",
    textAlign: "right"
};

const detailRowStyle = {
    marginBottom: "15px",
    fontSize: "13px"
};

const detailLabelStyle = {
    fontWeight: "600",
    marginRight: "10px"
};

const detailValueStyle = {
    color: "#555"
};

const paymentForSectionStyle = {
    marginTop: "40px"
};

const paymentForTitleStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px"
};

const invoiceTableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px"
};

const invoiceThStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    background: "#f5f5f5",
    fontWeight: "600",
    textAlign: "left"
};

const invoiceTdStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left"
};

const signatureBlockStyle = {
    display: "inline-block",
    textAlign: "center"
};

const signatureLineStyle = {
    borderTop: "1px solid #000",
    width: "180px",
    marginBottom: "5px"
};

const signatureLabelStyle = {
    fontSize: "11px",
    fontWeight: "600"
};

const pageNumberStyle = {
    position: "absolute",
    bottom: "15mm",
    right: "20mm",
    fontSize: "11px",
    color: "#666"
};

export default PaymentReceivedReport;
