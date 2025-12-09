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
    #delivery-challan-print-sheet, #delivery-challan-print-sheet * {
        visibility: visible !important;
    }
    #delivery-challan-print-sheet {
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

const DeliveryChallanReport = () => {
    const { state } = useLocation();
    const printRef = useRef();

    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Delivery Challan Selected</h5>
                <p className="text-muted">Please select a delivery challan from the list to view its report.</p>
            </div>
        );
    }

    // Normalize data fields
    const challan = {
        challanNumber: state.deliveryChallanNo ?? state.challanNo ?? state.dcNo ?? state.number ?? "DC-00001",
        challanDate: state.deliveryDate ?? state.challanDate ?? state.date ?? "",
        challanType: state.challanType ?? state.type ?? "Job Work",
        customerName: state.customerName ?? state.cusName ?? state.clientName ?? state.partyName ?? "",
        customerAddress: state.customerAddress ?? state.address ?? "",
        customerGstin: state.customerGstin ?? state.customerGST ?? "",
        referenceNumber: state.reference ?? state.referenceNumber ?? state.refNo ?? "0034",
        placeOfSupply: state.placeOfSupply ?? "Tamil Nadu (33)",
        items: state.items ?? state.lineItems ?? [],
        totalAmount: state.totalAmount ?? state.amount ?? state.total ?? 0,
        notes: state.customerNotes ?? state.notes ?? state.note ?? "Looking forward for your business.",
        terms: state.terms ?? state.termsAndConditions ?? "Looking forward for your business."
    };

    // Company details
    const companyInfo = {
        name: "LOM TECH",
        address: "Tamil Nadu, India",
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

    const taxInfo = parseTax("18");
    
    const itemsWithTax = (challan.items || []).map((item) => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || item.price || 0);
        const itemSubtotal = qty * rate;
        const cgstAmt = (itemSubtotal * taxInfo.cgstRate) / 100;
        const sgstAmt = (itemSubtotal * taxInfo.sgstRate) / 100;
        return {
            ...item,
            itemSubtotal,
            cgstAmt,
            sgstAmt
        };
    });

    const subtotal = itemsWithTax.reduce((sum, item) => sum + item.itemSubtotal, 0);
    const totalCgst = itemsWithTax.reduce((sum, item) => sum + item.cgstAmt, 0);
    const totalSgst = itemsWithTax.reduce((sum, item) => sum + item.sgstAmt, 0);
    const grandTotal = subtotal + totalCgst + totalSgst;

    const amountInWords = grandTotal > 0 
        ? `Indian Rupee ${toWords(Math.round(grandTotal)).replace(/,/g, "")} Only`
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

    const downloadPDF = async () => {
        const input = printRef.current;
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(input, { scale: 3, backgroundColor: "#ffffff" });
        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, "PNG", 0, 0, w, h);
        pdf.save(`DeliveryChallan_${challan.challanNumber || 'Challan'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="d-flex justify-content-end align-items-center gap-4 mb-3">
                    <i className="bi bi-download" style={{ fontSize: "22px", cursor: "pointer" }} title="Download PDF" onClick={downloadPDF}></i>
                    <i className="bi bi-printer" style={{ fontSize: "22px", cursor: "pointer" }} title="Print" onClick={() => window.print()}></i>
                </div>
                <div
                    ref={printRef}
                    id="delivery-challan-print-sheet"
                    style={printSheetStyle}
                >
                    {/* Header */}
                    <div style={headerStyle}>
                        <div style={companyBlockStyle}>
                            <div style={companyNameStyle}>{companyInfo.name}</div>
                            <div style={companyDetailStyle}>{companyInfo.address}</div>
                            <div style={companyDetailStyle}>GSTIN: {companyInfo.gstin}</div>
                            <div style={companyDetailStyle}>Phone: {companyInfo.phone}</div>
                            <div style={companyDetailStyle}>Email: {companyInfo.email}</div>
                        </div>
                        <div style={titleBlockStyle}>
                            <div style={documentTitleStyle}>DELIVERY CHALLAN</div>
                            <div style={docDetailsStyle}>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>Delivery Challan#:</span>
                                    <span style={docValueStyle}>{challan.challanNumber}</span>
                                </div>
                                <div style={docDetailRowStyle}>
                                    <span style={docLabelStyle}>Challan Date:</span>
                                    <span style={docValueStyle}>{formatDate(challan.challanDate)}</span>
                                </div>
                                {challan.referenceNumber && (
                                    <div style={docDetailRowStyle}>
                                        <span style={docLabelStyle}>Ref#:</span>
                                        <span style={docValueStyle}>{challan.referenceNumber}</span>
                                    </div>
                                )}
                                {challan.challanType && (
                                    <div style={docDetailRowStyle}>
                                        <span style={docLabelStyle}>Challan Type:</span>
                                        <span style={docValueStyle}>{challan.challanType}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Place of Supply */}
                    <div style={placeOfSupplyStyle}>
                        <strong>Place Of Supply:</strong> {challan.placeOfSupply}
                    </div>

                    {/* Deliver To */}
                    <div style={deliverToBlockStyle}>
                        <div style={sectionTitleStyle}>Deliver To:</div>
                        <div style={customerNameStyle}>{challan.customerName}</div>
                        {challan.customerGstin && <div style={customerDetailStyle}>GSTIN: {challan.customerGstin}</div>}
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

                    {/* Summary */}
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
                            <div style={{ ...summaryRowStyle, borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                                <span style={{ ...summaryLabelStyle, fontWeight: 'bold', fontSize: '14px' }}>Total:</span>
                                <span style={{ ...summaryValueStyle, fontWeight: 'bold', fontSize: '14px' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total in Words */}
                    {amountInWords && (
                        <div style={amountInWordsStyle}>
                            <strong>Total In Words:</strong> {amountInWords}
                        </div>
                    )}

                    {/* Notes and Terms */}
                    <div style={notesSectionStyle}>
                        {challan.notes && (
                            <div style={notesBlockStyle}>
                                <strong>Notes:</strong><br />
                                {challan.notes}
                            </div>
                        )}
                        {challan.terms && (
                            <div style={termsBlockStyle}>
                                <strong>Terms & Conditions:</strong><br />
                                {challan.terms}
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

const placeOfSupplyStyle = {
    fontSize: "11px",
    marginBottom: "12px",
    padding: "4px 0"
};

const deliverToBlockStyle = {
    marginBottom: "15px"
};

const sectionTitleStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    fontSize: "12px"
};

const customerNameStyle = {
    fontWeight: "600",
    marginBottom: "4px",
    fontSize: "12px"
};

const customerDetailStyle = {
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

const amountInWordsStyle = {
    fontSize: "11px",
    marginBottom: "12px",
    padding: "6px 0"
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

export default DeliveryChallanReport;
