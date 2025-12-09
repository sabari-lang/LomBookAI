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
    #purchase-order-print-sheet, #purchase-order-print-sheet * {
        visibility: visible !important;
    }
    #purchase-order-print-sheet {
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

const PurchaseOrderReport = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const printRef = useRef();

    // If no data, show message
    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Purchase Order Selected</h5>
                <p className="text-muted">Please select a purchase order from the list to view its report.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate("/purchaseorders")}>
                    Back to Purchase Orders
                </button>
            </div>
        );
    }

    // Normalize data fields
    const po = {
        poNumber: state.purchaseOrderNo ?? state.poNumber ?? state.number ?? "PO-00001",
        poDate: state.date ?? state.createdAt ?? state.poDate ?? "",
        deliveryDate: state.deliveryDate ?? state.expectedDeliveryDate ?? "",
        vendorName: state.vendorName ?? state.vendor?.name ?? "",
        vendorAddress: state.vendorAddress ?? state.vendor?.address ?? "",
        vendorGstin: state.vendorGstin ?? state.vendorGST ?? "",
        deliverToName: state.deliverToName ?? state.deliverTo?.name ?? "",
        deliverToAddress: state.deliverToAddress ?? state.deliverTo?.address ?? "",
        deliverToGstin: state.deliverToGstin ?? state.deliverToGST ?? "",
        deliverToPhone: state.deliverToPhone ?? state.deliverTo?.phone ?? "",
        deliverToEmail: state.deliverToEmail ?? state.deliverTo?.email ?? "",
        referenceNumber: state.reference ?? state.referenceNumber ?? "23234234",
        status: state.status ?? "Draft",
        items: state.items ?? state.lineItems ?? [],
        subtotal: state.subtotal ?? state.subTotal ?? 0,
        taxAmount: state.taxAmount ?? state.tax ?? 0,
        totalAmount: state.amount ?? state.totalAmount ?? state.total ?? 0,
        amountWithheld: state.amountWithheld ?? state.tds ?? 0,
        paymentTerms: state.paymentTerms ?? "",
        notes: state.notes ?? state.customerNotes ?? "",
        termsAndConditions: state.termsAndConditions ?? state.terms ?? "",
    };

    // Company details
    const companyInfo = {
        name: "LOM TECH",
        address: "Tamil Nadu, India",
        gstin: "33ABCDE1234F125",
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

    const taxInfo = parseTax(po.taxAmount || "18");
    
    const itemsWithTax = (po.items || []).map((item) => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || item.price || 0);
        const itemSubtotal = qty * rate;
        const itemTax = parseTax(item.tax || po.taxAmount || "18");
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
    const grandTotal = subtotal + totalCgst + totalSgst - (Number(po.amountWithheld) || 0);

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
        pdf.save(`PurchaseOrder_${po.poNumber || 'PO'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center gap-4 mb-3">
                    <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/purchaseorders")}
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
                    id="purchase-order-print-sheet"
                    style={printSheetStyle}
                >
                    {/* Header Section */}
                    <div style={headerStyle}>
                        {/* Company Info - Left */}
                        <div style={companyBlockStyle}>
                            <div style={companyNameStyle}>{companyInfo.name}</div>
                            <div style={companyDetailStyle}>{companyInfo.address}</div>
                            <div style={companyDetailStyle}>GSTIN: {companyInfo.gstin}</div>
                            <div style={companyDetailStyle}>Phone: {companyInfo.phone}</div>
                            <div style={companyDetailStyle}>Email: {companyInfo.email}</div>
                        </div>
                        {/* Document Title - Right */}
                        <div style={titleBlockStyle}>
                            <div style={documentTitleStyle}>PURCHASE ORDER</div>
                            <div style={docDetailsStyle}>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>#</span>
                                    <span style={docValueStyle}>{po.poNumber}</span>
                                </div>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>Date:</span>
                                    <span style={docValueStyle}>{formatDate(po.poDate)}</span>
                                </div>
                                {po.deliveryDate && (
                                    <div style={docDetailRowStyle}>
                                        <span style={docLabelStyle}>Delivery Date:</span>
                                        <span style={docValueStyle}>{formatDate(po.deliveryDate)}</span>
                                    </div>
                                )}
                                {po.referenceNumber && (
                                    <div style={docDetailRowStyle}>
                                        <span style={docLabelStyle}>Ref#:</span>
                                        <span style={docValueStyle}>{po.referenceNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vendor Address Section */}
                    <div style={vendorAddressBlockStyle}>
                        <div style={sectionTitleStyle}>Vendor Address:</div>
                        <div style={vendorNameStyle}>{po.vendorName}</div>
                        {po.vendorGstin && <div style={vendorDetailStyle}>GSTIN: {po.vendorGstin}</div>}
                    </div>

                    {/* Deliver To Section */}
                    <div style={deliverToBlockStyle}>
                        <div style={sectionTitleStyle}>Deliver To:</div>
                        <div style={deliverToNameStyle}>{po.deliverToName || companyInfo.name}</div>
                        {po.deliverToAddress && <div style={deliverToDetailStyle}>{po.deliverToAddress}</div>}
                        {po.deliverToGstin && <div style={deliverToDetailStyle}>GSTIN: {po.deliverToGstin}</div>}
                        {po.deliverToPhone && <div style={deliverToDetailStyle}>Phone: {po.deliverToPhone}</div>}
                        {po.deliverToEmail && <div style={deliverToDetailStyle}>Email: {po.deliverToEmail}</div>}
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
                                <span style={summaryLabelStyle}>CGST (9%):</span>
                                <span style={summaryValueStyle}>{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={summaryRowStyle}>
                                <span style={summaryLabelStyle}>SGST (9%):</span>
                                <span style={summaryValueStyle}>{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {po.amountWithheld && Number(po.amountWithheld) > 0 && (
                                <div style={summaryRowStyle}>
                                    <span style={summaryLabelStyle}>Amount Withheld (Section 194 H):</span>
                                    <span style={{ ...summaryValueStyle, color: '#d32f2f' }}>(-) {Number(po.amountWithheld).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div style={{ ...summaryRowStyle, borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                                <span style={{ ...summaryLabelStyle, fontWeight: 'bold', fontSize: '14px' }}>Total:</span>
                                <span style={{ ...summaryValueStyle, fontWeight: 'bold', fontSize: '14px' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes and Terms */}
                    <div style={notesSectionStyle}>
                        {po.notes && (
                            <div style={notesBlockStyle}>
                                <strong>Notes:</strong><br />
                                {po.notes}
                            </div>
                        )}
                        {po.termsAndConditions && (
                            <div style={termsBlockStyle}>
                                <strong>Terms & Conditions:</strong><br />
                                {po.termsAndConditions.split('\n').map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                ))}
                            </div>
                        )}
                    </div>

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

const deliverToBlockStyle = {
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

const deliverToNameStyle = {
    fontWeight: "600",
    marginBottom: "4px",
    fontSize: "12px"
};

const deliverToDetailStyle = {
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

const notesSectionStyle = {
    marginBottom: "15px",
    display: "flex",
    gap: "12px"
};

const notesBlockStyle = {
    flex: "1",
    fontSize: "11px"
};

const termsBlockStyle = {
    flex: "1",
    fontSize: "11px"
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

export default PurchaseOrderReport;
