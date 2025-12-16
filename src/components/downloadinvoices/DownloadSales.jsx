import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "bootstrap/dist/css/bootstrap.min.css";

const DownloadSales = () => {
    const invoiceRef = useRef();

    // 🖨️ Print only the invoice section
    const handlePrint = () => {
        const printContents = invoiceRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    // 💾 Download as high-quality PDF
    const handleDownloadPDF = async () => {
        const element = invoiceRef.current;
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("Tax_Invoice.pdf");
    };

    return (
        <div
            className="d-flex flex-column align-items-center bg-light py-4 overflow-auto"
            style={{ height: "inherit" }}
        >
            {/* ===== Buttons (not printed) ===== */}
            <div className="mb-3 d-print-none">
                <button
                    onClick={handlePrint}
                    className="btn btn-outline-primary btn-sm me-2"
                >
                    🖨️ Print Invoice
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="btn btn-outline-success btn-sm"
                >
                    💾 Download PDF
                </button>
            </div>

            {/* ===== Invoice Section ===== */}
            <div
                ref={invoiceRef}
                className="bg-white p-4"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    border: "1px solid #000",
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    fontSize: "13.5px",
                    color: "#000",
                    boxSizing: "border-box",
                }}
            >
                {/* ===== Title ===== */}
                <div className="text-center mb-1">
                    <h6
                        className="fw-bold text-uppercase mb-0"
                        style={{ fontSize: "15px" }}
                    >
                        TAX INVOICE
                    </h6>
                </div>

                {/* ===== Company Header ===== */}
                <div className="row mb-1">
                    <div className="col-12">
                        <h3
                            className="fw-bold text-lowercase mb-1"
                            style={{ fontSize: "22px" }}
                        >
                            denver
                        </h3>
                        <p className="mb-1">
                            <strong>Phone:</strong> 9159950439
                        </p>
                    </div>
                </div>

                {/* ===== Bill To & Invoice Details ===== */}
                <div
                    className="row g-0"
                    style={{
                        borderTop: "1px solid #000",
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                    }}
                >
                    {/* Bill To */}
                    <div
                        className="col-md-6 p-2"
                        style={{
                            borderRight: "1px solid #000",
                            borderBottom: "1px solid #000",
                        }}
                    >
                        <p className="fw-semibold mb-1">Bill To:</p>
                        <p className="mb-0 fw-semibold">ranjith</p>
                        <p className="mb-0">Chennai</p>
                        <p className="mb-0">
                            Contact No: <strong>7010489435</strong>
                        </p>
                    </div>

                    {/* Invoice Details */}
                    <div
                        className="col-md-6 p-2"
                        style={{ borderBottom: "1px solid #000" }}
                    >
                        <p className="fw-semibold mb-1">Invoice Details:</p>
                        <div className="d-flex justify-content-between">
                            <span>No:</span>
                            <span>1</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>Date:</span>
                            <span>30/10/2025</span>
                        </div>
                    </div>
                </div>

                {/* ===== Ship To ===== */}
                <div
                    className="p-2"
                    style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        borderBottom: "1px solid #000",
                    }}
                >
                    <p className="fw-semibold mb-1">Ship To:</p>
                    <p className="mb-0">Chennai</p>
                </div>

                {/* ===== Item Table ===== */}
                <div className="table-responsive mt-2">
                    <table
                        className="table table-bordered table-sm mb-0"
                        style={{
                            border: "1px solid #000",
                            fontSize: "13.5px",
                            marginBottom: 0,
                        }}
                    >
                        <thead className="text-center">
                            <tr>
                                <th style={{ width: "30px" }}>#</th>
                                <th>Item name</th>
                                <th>HSN/ SAC</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Price/Unit(₹)</th>
                                <th>Discount(₹)</th>
                                <th>GST(₹)</th>
                                <th>Amount(₹)</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            <tr>
                                <td>1</td>
                                <td>Hp-laptop</td>
                                <td>23232</td>
                                <td>1</td>
                                <td>Pcs</td>
                                <td>₹20,000.00</td>
                                <td>₹1,000.00 (5%)</td>
                                <td>₹3,420.00 (18%)</td>
                                <td>₹22,420.00</td>
                            </tr>
                            <tr className="fw-semibold">
                                <td colSpan="6" className="text-end">
                                    Total
                                </td>
                                <td>₹1,000.00</td>
                                <td>₹3,420.00</td>
                                <td>₹22,420.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ===== Tax Summary & Totals ===== */}
                <div
                    className="row g-0"
                    style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        borderBottom: "1px solid #000",
                    }}
                >
                    {/* Tax Summary */}
                    <div
                        className="col-md-6 p-2"
                        style={{ borderRight: "1px solid #000" }}
                    >
                        <p className="fw-semibold mb-2">Tax Summary:</p>
                        <table
                            className="table table-bordered table-sm text-center mb-0"
                            style={{ border: "1px solid #000" }}
                        >
                            <thead className="table-light">
                                <tr>
                                    <th>HSN/ SAC</th>
                                    <th>Taxable amount (₹)</th>
                                    <th>Rate (%)</th>
                                    <th>CGST</th>
                                    <th>SGST</th>
                                    <th>Total Tax (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>23232</td>
                                    <td>19,000.00</td>
                                    <td>9</td>
                                    <td>1,710.00</td>
                                    <td>1,710.00</td>
                                    <td>3,420.00</td>
                                </tr>
                                <tr className="fw-semibold">
                                    <td>TOTAL</td>
                                    <td>19,000.00</td>
                                    <td>0</td>
                                    <td>1,710.00</td>
                                    <td>1,710.00</td>
                                    <td>3,420.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="col-md-6 p-2">
                        <table
                            className="table table-bordered table-sm mb-0"
                            style={{ border: "1px solid #000" }}
                        >
                            <tbody>
                                <tr>
                                    <td style={{ width: "50%" }}>Sub Total</td>
                                    <td className="text-end">₹22,420.00</td>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td className="text-end fw-semibold">₹22,420.00</td>
                                </tr>
                                <tr>
                                    <td colSpan="2">
                                        <strong>Invoice Amount in Words:</strong>
                                        <br />
                                        Twenty Two Thousand Four Hundred Twenty Rupees only
                                    </td>
                                </tr>
                                <tr>
                                    <td>Received</td>
                                    <td className="text-end">₹22,420.00</td>
                                </tr>
                                <tr>
                                    <td>Balance</td>
                                    <td className="text-end">₹0.00</td>
                                </tr>
                                <tr>
                                    <td>You Saved</td>
                                    <td className="text-end">₹1,180.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ===== Terms & Conditions ===== */}
                <div
                    className="p-2"
                    style={{
                        borderLeft: "1px solid #000",
                        borderRight: "1px solid #000",
                        borderBottom: "1px solid #000",
                    }}
                >
                    <strong>Terms & Conditions:</strong>
                    <div>Thanks for doing business with us!</div>
                </div>

                {/* ===== Signature Section ===== */}
                <div className="d-flex justify-content-between mt-4">
                    <div></div>
                    <div className="text-end">
                        <p className="fw-semibold mb-5">For denver:</p>
                        <p className="mb-0">Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadSales;
