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
    #vendor-credit-print-sheet, #vendor-credit-print-sheet * {
        visibility: visible !important;
    }
    #vendor-credit-print-sheet {
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

const VendorCreditReport = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const printRef = useRef();

    // If no data, show message
    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Vendor Credit Selected</h5>
                <p className="text-muted">Please select a vendor credit from the list to view its report.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate("/vendorcredits")}>
                    Back to Vendor Credits
                </button>
            </div>
        );
    }

    // Normalize data fields
    const vendorCredit = {
        creditNumber: state.creditNumber ?? state.creditNo ?? state.number ?? "CN0001",
        creditDate: state.date ?? state.creditDate ?? "",
        vendorName: state.vendorName ?? state.vendor?.name ?? "",
        vendorAddress: state.vendorAddress ?? state.vendor?.address ?? "",
        vendorGstin: state.vendorGstin ?? state.vendorGST ?? "",
        referenceNumber: state.referenceNumber ?? state.reference ?? "00003",
        billNumber: state.billNumber ?? state.billNo ?? "",
        items: state.items ?? state.lineItems ?? [],
        subtotal: state.subtotal ?? state.subTotal ?? 0,
        taxAmount: state.taxAmount ?? state.tax ?? 0,
        totalAmount: state.amount ?? state.totalAmount ?? state.total ?? 0,
        amountWithheld: state.amountWithheld ?? state.tds ?? 0,
        creditsRemaining: state.creditsRemaining ?? state.totalAmount ?? 0,
        reason: state.reason ?? "",
        notes: state.notes ?? state.customerNotes ?? "",
        status: state.status ?? "Draft",
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

    // Calculate totals
    const parseTax = (taxStr) => {
        if (!taxStr) return { cgstRate: 9, sgstRate: 9 };
        const match = String(taxStr).match(/(\d+(?:\.\d+)?)/);
        const rate = match ? parseFloat(match[1]) : 18;
        return { cgstRate: rate / 2, sgstRate: rate / 2 };
    };

    const taxInfo = parseTax(vendorCredit.taxAmount || "18");
    
    const itemsWithTax = (vendorCredit.items || []).map((item) => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || item.price || 0);
        const itemSubtotal = qty * rate;
        const itemTax = parseTax(item.tax || vendorCredit.taxAmount || "18");
        const cgstAmt = (itemSubtotal * itemTax.cgstRate) / 100;
        const sgstAmt = (itemSubtotal * itemTax.sgstRate) / 100;
        return {
            ...item,
            itemSubtotal,
            cgstRate: itemTax.cgstRate,
            sgstRate: itemTax.sgstRate,
            cgstAmt,
            sgstAmt
        };
    });

    const subtotal = itemsWithTax.reduce((sum, item) => sum + item.itemSubtotal, 0);
    const totalCgst = itemsWithTax.reduce((sum, item) => sum + item.cgstAmt, 0);
    const totalSgst = itemsWithTax.reduce((sum, item) => sum + item.sgstAmt, 0);
    const grandTotal = subtotal + totalCgst + totalSgst - (Number(vendorCredit.amountWithheld) || 0);
    const creditsRemaining = grandTotal;

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
        pdf.save(`VendorCredit_${vendorCredit.creditNumber || 'VendorCredit'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center gap-4 mb-3">
                    <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/vendorcredits")}
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
                    id="vendor-credit-print-sheet"
                    style={printSheetStyle}
                >
                    {/* Header Section */}
                    <div style={headerStyle}>
                        {/* Company Info - Left */}
                        <div style={companyBlockStyle}>
                            <div style={companyNameStyle}>{companyInfo.name}</div>
                            <div style={companyDetailStyle}>{companyInfo.address}</div>
                            <div style={companyDetailStyle}>{companyInfo.address2}</div>
                            <div style={companyDetailStyle}>GSTIN: {companyInfo.gstin}</div>
                            <div style={companyDetailStyle}>{companyInfo.phone}</div>
                            <div style={companyDetailStyle}>{companyInfo.email}</div>
                        </div>
                        {/* Document Title - Right */}
                        <div style={titleBlockStyle}>
                            <div style={documentTitleStyle}>VENDOR CREDITS</div>
                            <div style={docDetailsStyle}>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>CreditNote#</span>
                                    <span style={docValueStyle}>{vendorCredit.creditNumber}</span>
                                </div>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>Credits Remaining</span>
                                    <span style={{ ...docValueStyle, fontSize: '16px', fontWeight: 'bold' }}>₹{creditsRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Address Section */}
                    <div style={vendorAddressBlockStyle}>
                        <div style={sectionTitleStyle}>Vendor Address:</div>
                        <div style={vendorNameStyle}>{vendorCredit.vendorName}</div>
                        {vendorCredit.vendorGstin && <div style={vendorDetailStyle}>GSTIN: {vendorCredit.vendorGstin}</div>}
                    </div>

                    {/* Date and Reference */}
                    <div style={dateRefSectionStyle}>
                        <div style={docDetailRowStyle}>
                            <span style={docLabelStyle}>Date:</span>
                            <span style={docValueStyle}>{formatDate(vendorCredit.creditDate)}</span>
                        </div>
                        {vendorCredit.referenceNumber && (
                            <div style={docDetailRowStyle}>
                                <span style={docLabelStyle}>Reference number:</span>
                                <span style={docValueStyle}>{vendorCredit.referenceNumber}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <table style={itemsTableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>#</th>
                                <th style={thStyle}>Item & Description</th>
                                <th style={thStyle}>HSN/SAC</th>
                                <th style={thStyle}>Qty</th>
                                <th style={thStyle}>Rate</th>
                                <th style={thStyle}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsWithTax.map((item, i) => (
                                <tr key={i}>
                                    <td style={tdStyle}>{i + 1}</td>
                                    <td style={{ ...tdStyle, textAlign: 'left' }}>{item.itemDetails || item.name || ""}</td>
                                    <td style={tdStyle}>{item.hsn || item.hsnCode || ""}</td>
                                    <td style={tdStyle}>{Number(item.quantity || item.qty || 0).toFixed(2)} pcs</td>
                                    <td style={tdStyle}>{Number(item.rate || item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td style={tdStyle}>{item.itemSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary Section */}
                    <div style={summarySectionStyle}>
                        <div style={summaryBlockStyle}>
                            <div style={summaryRowStyle}>
                                <span style={summaryLabelStyle}>Sub Total:</span>
                                <span style={summaryValueStyle}>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={summaryRowStyle}>
                                <span style={summaryLabelStyle}>CGST9 (9%):</span>
                                <span style={summaryValueStyle}>{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={summaryRowStyle}>
                                <span style={summaryLabelStyle}>SGST9 (9%):</span>
                                <span style={summaryValueStyle}>{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {vendorCredit.amountWithheld && Number(vendorCredit.amountWithheld) > 0 && (
                                <div style={summaryRowStyle}>
                                    <span style={summaryLabelStyle}>Amount Withheld (Section 194 H):</span>
                                    <span style={{ ...summaryValueStyle, color: '#d32f2f' }}>(-) {Number(vendorCredit.amountWithheld).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div style={{ ...summaryRowStyle, borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                                <span style={{ ...summaryLabelStyle, fontWeight: 'bold', fontSize: '14px' }}>Total:</span>
                                <span style={{ ...summaryValueStyle, fontWeight: 'bold', fontSize: '14px' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ ...summaryRowStyle, marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <span style={{ ...summaryLabelStyle, fontWeight: 'bold', fontSize: '14px' }}>Credits Remaining:</span>
                                <span style={{ ...summaryValueStyle, fontWeight: 'bold', fontSize: '14px' }}>₹{creditsRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {vendorCredit.notes && (
                        <div style={notesBlockStyle}>
                            <strong>Notes:</strong><br />
                            {vendorCredit.notes}
                        </div>
                    )}

                    {/* Signature */}
                    <div style={signatureStyle}>
                        <div style={signatureBlockStyle}>
                            <div style={signatureLineStyle}></div>
                            <div style={signatureLabelStyle}>Authorized Signature</div>
                        </div>
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
    padding: "15mm",
    margin: "0 auto",
    background: "#fff",
    fontFamily: "Arial, sans-serif",
    fontSize: "11px",
    color: "#000",
    lineHeight: "1.4"
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    paddingBottom: "8px"
};

const companyBlockStyle = {
    flex: "1"
};

const companyNameStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "4px"
};

const companyDetailStyle = {
    fontSize: "11px",
    marginBottom: "2px",
    color: "#333"
};

const titleBlockStyle = {
    textAlign: "right",
    flex: "1"
};

const documentTitleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "8px",
    letterSpacing: "2px"
};

const docDetailsStyle = {
    fontSize: "11px"
};

const docDetailRowStyle = {
    marginBottom: "4px"
};

const docLabelStyle = {
    marginRight: "8px"
};

const docValueStyle = {
    fontWeight: "600"
};

const vendorAddressBlockStyle = {
    marginBottom: "12px"
};

const dateRefSectionStyle = {
    marginBottom: "15px"
};

const sectionTitleStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    fontSize: "12px"
};

const vendorNameStyle = {
    fontWeight: "600",
    marginBottom: "4px",
    fontSize: "12px"
};

const vendorDetailStyle = {
    fontSize: "11px",
    marginBottom: "2px",
    color: "#555"
};

const itemsTableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "12px",
    fontSize: "10px"
};

const thStyle = {
    border: "1px solid #000",
    padding: "5px 3px",
    background: "#f5f5f5",
    fontWeight: "600",
    textAlign: "center",
    fontSize: "10px"
};

const tdStyle = {
    border: "1px solid #000",
    padding: "5px 3px",
    textAlign: "right",
    fontSize: "10px"
};

const summarySectionStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "12px"
};

const summaryBlockStyle = {
    width: "280px"
};

const summaryRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    fontSize: "11px"
};

const summaryLabelStyle = {
    fontWeight: "500"
};

const summaryValueStyle = {
    fontWeight: "600",
    textAlign: "right"
};

const notesBlockStyle = {
    fontSize: "11px",
    marginBottom: "15px"
};

const signatureStyle = {
    textAlign: "right",
    marginTop: "25px"
};

const signatureBlockStyle = {
    display: "inline-block",
    textAlign: "center"
};

const signatureLineStyle = {
    borderTop: "1px solid #000",
    width: "180px",
    marginBottom: "4px"
};

const signatureLabelStyle = {
    fontSize: "11px",
    fontWeight: "600"
};

export default VendorCreditReport;
