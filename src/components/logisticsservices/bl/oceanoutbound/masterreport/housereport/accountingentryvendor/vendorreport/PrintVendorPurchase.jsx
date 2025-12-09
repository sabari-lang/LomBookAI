import React, { useEffect } from "react";

const PrintVendorPurchase = () => {

    useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 600);
    }, []);

    return (
        <div className="a4">

            {/* HEADER SECTION */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <img
                    src="/your-logo.png"
                    alt="logo"
                    style={{ height: "70px", marginBottom: "10px" }}
                />
                <h2 style={{ margin: 0, fontWeight: "bold", color: "#003c8f" }}>
                    LOM LOGISTICS INDIA PVT. LTD.
                </h2>
                <p style={{ margin: 0, fontSize: "13px" }}>
                    No 151, Village Road, 7th Floor, GEE GEE EMERALD Building<br />
                    Nungambakkam Chennai-600 034, India &nbsp;
                    Tel: +91 44 66455902 to 923
                </p>
            </div>

            {/* PURCHASE TITLE */}
            <h3 style={{ textAlign: "center", textDecoration: "underline" }}>
                Purchase
            </h3>

            {/* TOP DETAILS */}
            <table className="pdf-table">
                <tbody>
                    <tr>
                        <th>Voucher No :</th>
                        <td>7630 AV</td>
                        <th>Voucher Date :</th>
                        <td>2025-11-18</td>
                    </tr>

                    <tr>
                        <th>Credit Account :</th>
                        <td>A.V. TRAILERS</td>
                        <th style={{ textAlign: "right" }}>Rs 6800.00</th>
                        <td></td>
                    </tr>

                    <tr>
                        <th>Address :</th>
                        <td colSpan={3}>
                            5, IYPASSI STREET, BALAMURUGAN NAGAR,<br />
                            ALAPAKKAM, PORUR TAMIL NADU INDIA
                        </td>
                    </tr>

                    <tr>
                        <th>GSTIN :</th>
                        <td></td>
                    </tr>

                    <tr>
                        <th>Debit Account :</th>
                        <td>TRANSPORT CHARGES NON TAXABLE</td>
                        <th style={{ textAlign: "right" }}>Rs 6800.00</th>
                        <td><u>+ Rs (0.00+ 0.00)</u></td>
                    </tr>
                </tbody>
            </table>

            {/* TABLE WITH JOB / MASTER DETAILS */}
            <table className="pdf-table" style={{ marginTop: "15px" }}>
                <thead>
                    <tr>
                        <th>Voucher Date</th>
                        <th>Voucher No</th>
                        <th>Voucher Type</th>
                        <th>Job No</th>
                        <th>Master No</th>
                        <th>House No</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>2025-11-18</td>
                        <td>7630 AV</td>
                        <td>Purchase</td>
                        <td>SE9008</td>
                        <td>SI250116</td>
                        <td>LOMS17166</td>
                        <td>6800.00</td>
                    </tr>
                </tbody>
            </table>

            {/* GRAND TOTAL BOX */}
            <div style={{
                textAlign: "right",
                marginTop: "10px",
                fontWeight: "bold",
                border: "1px solid black",
                padding: "8px",
                width: "230px",
                marginLeft: "auto"
            }}>
                GRAND TOTAL&nbsp;&nbsp; (Rs) 6,800.00
            </div>

            {/* BREAK UP DETAILS */}
            <h5 style={{ marginTop: "30px", textAlign: "center", textDecoration: "underline" }}>
                BREAK UP DETAILS
            </h5>

            <table className="pdf-table">
                <thead>
                    <tr>
                        <th>TAXABLE AMT</th>
                        <th>NON TAXABLE AMT</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>0.00</td>
                        <td>6,800.00</td>
                        <td>0.00</td>
                        <td>0.00</td>
                        <td>0.00</td>
                        <td>6,800.00</td>
                    </tr>
                </tbody>
            </table>

            {/* PRINT CSS */}
            <style>
                {`
                @page { size: A4; margin: 12mm; }
                body { background: white; }

                .a4 {
                    width: 210mm;
                    margin: auto;
                    background: white;
                    padding: 10mm;
                    font-size: 13px;
                }

                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    font-size: 13px;
                }

                .pdf-table th, .pdf-table td {
                    border: 1px solid black;
                    padding: 6px;
                }

                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default PrintVendorPurchase;
