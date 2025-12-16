import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation, useNavigate } from "react-router-dom";

// Print CSS for A4-only output
const printStyles = `
@media print {
    body * {
        visibility: hidden !important;
    }
    #recurring-bill-print-sheet, #recurring-bill-print-sheet * {
        visibility: visible !important;
    }
    #recurring-bill-print-sheet {
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

const RecurringBillReport = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const printRef = useRef();

    // If no data, show message
    if (!state || !Object.keys(state).length) {
        return (
            <div className="container p-4 text-center">
                <h5>No Recurring Bill Selected</h5>
                <p className="text-muted">Please select a recurring bill from the list to view its report.</p>
                <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate("/recurringbills")}>
                    Back to Recurring Bills
                </button>
            </div>
        );
    }

    // Normalize data fields
    const recurringBill = {
        profileName: state.profileName ?? "",
        vendorName: state.vendorName ?? state.vendor?.name ?? "",
        vendorAddress: state.vendorAddress ?? state.vendor?.address ?? "",
        startDate: state.startDate ?? state.startOn ?? "",
        nextDate: state.nextDate ?? state.nextBillDate ?? "",
        endDate: state.endDate ?? state.endsOn ?? "",
        frequency: state.frequency ?? state.repeatEvery ?? "",
        status: state.status ?? "Active",
        items: state.items ?? state.lineItems ?? [],
        totalAmount: state.totalAmount ?? state.amount ?? 0,
        notes: state.notes ?? state.customerNotes ?? "",
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
        pdf.save(`RecurringBill_${recurringBill.profileName || 'RecurringBill'}.pdf`);
    };

    return (
        <>
            <style>{printStyles}</style>
            <div className="container p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Toolbar */}
                <div className="d-flex justify-content-between align-items-center gap-4 mb-3">
                    <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/recurringbills")}
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
                    id="recurring-bill-print-sheet"
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        maxHeight: "297mm",
                        padding: "25px",
                        margin: "0 auto",
                        background: "#fff",
                        borderRadius: "6px",
                        boxShadow: "0 0 10px rgba(0,0,0,0.15)",
                        fontFamily: "Arial, sans-serif",
                        overflow: "hidden",
                        position: "relative"
                    }}
                >
                    <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Recurring Bill</h2>
                    
                    {/* Header Info */}
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: "700", color: "#333" }}>
                                Vendor: {recurringBill.vendorName}
                            </h4>
                            {recurringBill.vendorAddress && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    {recurringBill.vendorAddress}
                                </p>
                            )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            {recurringBill.profileName && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    Profile: <strong>{recurringBill.profileName}</strong>
                                </p>
                            )}
                            {recurringBill.frequency && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    Frequency: {recurringBill.frequency}
                                </p>
                            )}
                            {recurringBill.startDate && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    Start Date: {new Date(recurringBill.startDate).toLocaleDateString()}
                                </p>
                            )}
                            {recurringBill.nextDate && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    Next Bill Date: {new Date(recurringBill.nextDate).toLocaleDateString()}
                                </p>
                            )}
                            {recurringBill.endDate && (
                                <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                    End Date: {new Date(recurringBill.endDate).toLocaleDateString()}
                                </p>
                            )}
                            <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                                Status: {recurringBill.status}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    {(recurringBill.items || []).length > 0 && (
                        <div className="table table-responsive">
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Item Details</th>
                                        <th style={thStyle}>Qty</th>
                                        <th style={thStyle}>Rate (₹)</th>
                                        <th style={thStyle}>Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recurringBill.items.map((item, i) => (
                                        <tr key={i}>
                                            <td style={{ ...tdStyle, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                                                {item.itemDetails ?? item.name ?? item.description ?? ""}
                                            </td>
                                            <td style={tdStyle}>{item.quantity ?? item.qty ?? 0}</td>
                                            <td style={tdStyle}>{item.rate ?? item.price ?? 0}</td>
                                            <td style={tdStyle}>{item.amount ?? item.total ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totals */}
                    <div style={{ textAlign: "right", marginTop: "20px" }}>
                        <p style={{ ...totalText, fontWeight: 'bold', fontSize: '18px', color: '#222' }}>
                            Total Amount: ₹ {Number(recurringBill.totalAmount || 0).toLocaleString()}
                        </p>
                    </div>

                    {/* Notes */}
                    {recurringBill.notes && (
                        <div style={{ marginTop: "20px", fontSize: "14px", color: "#444", border: "1px solid #eee", borderRadius: "6px", padding: "10px" }}>
                            <strong>Notes:</strong><br />{recurringBill.notes}
                        </div>
                    )}

                    {/* Signature */}
                    <div style={{ textAlign: "right", marginTop: "50px" }}>
                        <strong>Authorized Signatory</strong>
                        <div style={{ borderTop: "1px solid #000", width: "180px", display: "inline-block", paddingTop: "5px" }}></div>
                    </div>
                </div>
            </div>
        </>
    );
};

/* ========= Styles ========= */
const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
};

const thStyle = {
    border: "1px solid #ddd",
    padding: "4px",
    background: "#f0f0f0",
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "left",
};

const tdStyle = {
    border: "1px solid #ddd",
    padding: "4px",
    fontSize: "12px",
};

const totalText = {
    margin: "4px 0",
    fontSize: "14px",
};

export default RecurringBillReport;

