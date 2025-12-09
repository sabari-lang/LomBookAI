import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOceanOutboundCustomerAccountById } from "../../../oceanOutboundApi";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ViewCustomerAccountSeaOut = () => {
    const navigate = useNavigate();
    const [entryData, setEntryData] = useState(null);
    const [masterData, setMasterData] = useState(null);
    const [houseData, setHouseData] = useState(null);
    const printRef = useRef(null);

    // Get data from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem("customerAccViewSeaOut");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setEntryData(data);
            } catch (e) {
                console.error("Error parsing customerAccViewSeaOut:", e);
            }
        }

        const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
        const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");
        setMasterData(storedMaster);
        setHouseData(storedHouse);
    }, []);

    // Fetch full entry data if we have an ID
    const { data: fullEntryData } = useQuery({
        queryKey: ["oceanOutboundCustomerAccountEntry", entryData?.id],
        queryFn: () => getOceanOutboundCustomerAccountById(entryData?.id),
        enabled: Boolean(entryData?.id),
        retry: 1,
    });

    // Use full entry data if available, otherwise use session data
    const displayData = useMemo(() => {
        if (fullEntryData?.data) return fullEntryData.data;
        if (fullEntryData) return fullEntryData;
        return entryData?.__raw || entryData;
    }, [fullEntryData, entryData]);

    // Calculate totals from items
    const { totalAmount, items } = useMemo(() => {
        const itemsList = Array.isArray(displayData?.items) ? displayData.items : [];
        const total = itemsList.reduce((sum, item) => sum + Number(item?.total ?? 0), 0);
        return { totalAmount: total, items: itemsList };
    }, [displayData]);

    // Format date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            return moment(dateStr).format("YYYY-MM-DD");
        } catch {
            return dateStr || "";
        }
    };

    // Generate and download PDF for Export Invoice - Matching Export Invoice SEZ format
    const handlePrintExportInvoice = () => {
        if (!displayData) {
            alert("Entry data not found");
            return;
        }

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        let yPos = 10;

        // Company Header
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("LOM LOGISTICS INDIA PVT.LTD.", 105, yPos, { align: "center" });
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("No 151, Village Road, 7th Floor, GEE GEE EMERALD Building,", 105, yPos, { align: "center" });
        yPos += 5;
        pdf.text("Nungambakkam Chennai-600 034, India", 105, yPos, { align: "center" });
        yPos += 5;
        pdf.text("Phone: +91 7449271782", 105, yPos, { align: "center" });
        yPos += 8;

        // Document Title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Export Invoice SEZ", 105, yPos, { align: "center" });
        yPos += 6;

        // Invoice Reference
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Invoice Reference: ${displayData?.gstin || "33AACCL6611R227"}`, 105, yPos, { align: "center" });
        yPos += 10;

        // Party Information Section
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("To", 20, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(displayData?.partyName || "", 30, yPos);
        yPos += 6;

        pdf.setFont("helvetica", "bold");
        pdf.text("ADDR", 20, yPos);
        pdf.setFont("helvetica", "normal");
        const addressLines = pdf.splitTextToSize(displayData?.partyAddress || "", 170);
        pdf.text(addressLines, 30, yPos);
        yPos += addressLines.length * 5 + 2;

        pdf.setFont("helvetica", "bold");
        pdf.text("TEL/FAX", 20, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${displayData?.tel || ""} ${displayData?.fax ? "/ " + displayData.fax : ""}`, 30, yPos);
        yPos += 10;

        // Shipment Details Table
        const leftColumnData = [
            ["Job No", displayData?.jobNo || masterData?.jobNo || ""],
            ["Master No", masterData?.mblNo || masterData?.mbl || ""],
            ["House No", displayData?.hblNo || displayData?.hbl || houseData?.hbl || houseData?.hblNo || ""],
            ["Shipper", masterData?.shipperName || ""],
            ["Vessel Name", masterData?.vesselName || ""],
            ["Origin", masterData?.portLoading || ""],
            ["Destination", masterData?.portDischarge || ""],
            ["Gross Weight", `${masterData?.grossWeight || ""} ${masterData?.kgLb || "KG"}`],
            ["No of Packages", masterData?.package || ""],
            ["Incoterm", masterData?.shipment || ""],
        ];

        const rightColumnData = [
            ["Voucher Date", formatDate(displayData?.voucherDate)],
            ["Voucher No", displayData?.voucherNo || ""],
            ["ETA", formatDate(masterData?.arrivalDate)],
            ["ETD", formatDate(masterData?.onBoardDate)],
        ];

        // Left column table
        pdf.autoTable({
            startY: yPos,
            body: leftColumnData,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: "bold" },
                1: { cellWidth: 80 },
            },
            margin: { left: 20 },
        });

        // Right column table
        pdf.autoTable({
            startY: yPos,
            body: rightColumnData,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: "bold" },
                1: { cellWidth: 80 },
            },
            margin: { left: 110 },
        });

        yPos = pdf.lastAutoTable.finalY + 8;

        // Itemized Charges Table
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Itemized Charges", 20, yPos);
        yPos += 8;

        const tableData = items.map((item) => [
            item?.code || "",
            item?.description || item?.account || "",
            item?.sac || "",
            Number(item?.total || item?.amountInInr || 0).toFixed(2),
        ]);

        if (tableData.length > 0) {
            pdf.autoTable({
                startY: yPos,
                head: [["Code", "Description", "SAC", "Debit"]],
                body: tableData,
                foot: [["", "", "TOTAL", `INR ${totalAmount.toFixed(2)}`]],
                theme: "grid",
                headStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
                footStyles: { fontStyle: "bold", fillColor: [240, 240, 240] },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 100 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 40, halign: "right" },
                },
            });
            yPos = pdf.lastAutoTable.finalY + 8;
        }

        // Bank Details
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("BANK DETAIL", 20, yPos);
        yPos += 8;

        const bankData = [
            ["A/C Holder Name", "LOM LOGISTICS INDIA PRIVATE LTD", "Bank Name", "WOORI BANK"],
            ["EEFC Current A/C", "150957000116 (US DOLLAR)", "SWIFT/BIC", "HVBKIN5M"],
            ["A/C", "150957000094 (INDIA RUPEE)", "IFSC Code", "HVBK0000001"],
            ["Branch Address", "Lotte India, 2nd Floor, No.4/169", "", ""],
        ];

        pdf.autoTable({
            startY: yPos,
            body: bankData,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 45, fontStyle: "bold" },
                1: { cellWidth: 60 },
                2: { cellWidth: 45, fontStyle: "bold" },
                3: { cellWidth: 40 },
            },
        });

        // Save PDF
        const fileName = `Export_Invoice_SEZ_${displayData?.voucherNo || displayData?.id || "invoice"}.pdf`;
        pdf.save(fileName);
    };

    // Print Digitally Signed
    const handlePrintDigitallySigned = () => {
        if (!displayData?.id) {
            alert("Entry ID not found");
            return;
        }
        const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        const cleanBase = baseUrl.replace(/\/$/, "");
        const phpUrl = `${cleanBase}/LOM//quotation/airreimbursement.php?aid=${displayData.id}&signed=1`;
        window.open(phpUrl, "_blank");
    };

    // Print - browser print dialog
    const handlePrint = () => {
        window.print();
    };

    if (!displayData) {
        return (
            <div className="container p-4 text-center">
                <h5>No Entry Selected</h5>
                <p className="text-muted">Please select an entry from the list to view its details.</p>
                <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
                    Go Back
                </button>
            </div>
        );
    }

    // Extract data with fallbacks
    const partyName = displayData?.partyName || "";
    const partyAddress = displayData?.partyAddress || "";
    const gstin = displayData?.gstin || displayData?.gstNumber || "";
    const tel = displayData?.tel || "";
    const fax = displayData?.fax || "";
    const attn = displayData?.contactPerson || "";

    const jobNo = displayData?.jobNo || masterData?.jobNo || "";
    const mblNo = masterData?.mblNo || masterData?.mbl || "";
    const hblNo = displayData?.hblNo || displayData?.hbl || houseData?.hbl || houseData?.hblNo || "";
    const shipper = masterData?.shipperName || "";
    const consignee = masterData?.consigneeName || "";
    const origin = masterData?.portLoading || "";
    const destination = masterData?.portDischarge || "";
    const vesselName = masterData?.vesselName || "";
    const eta = formatDate(masterData?.arrivalDate);
    const etd = formatDate(masterData?.onBoardDate);
    const noOfPackages = masterData?.package || "";
    const grossWeight = masterData?.grossWeight || "";
    const incoterms = masterData?.shipment || "";
    const beNo = displayData?.beNo || "";
    const beDate = formatDate(displayData?.beDate);
    const invoiceValue = displayData?.invoiceValue || "";
    const assessableValue = displayData?.assessableValue || "";
    const shipperInvoiceNo = displayData?.shipperInvoiceNo || "";
    const shipperInvoiceDate = formatDate(displayData?.shipperInvoiceDate);
    const shipperInvoiceAmount = displayData?.shipperInvoiceAmount || "";
    const voucherDate = formatDate(displayData?.voucherDate);
    const voucherNo = displayData?.voucherNo || "";

    return (
        <div className="container-fluid p-0" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }} ref={printRef}>
            {/* Header Section with Buttons */}
            <div
                className="d-flex justify-content-between align-items-center px-4 py-3"
                style={{ backgroundColor: "#28a745", color: "white" }}
            >
                <h4 className="mb-0 fw-bold">Accounting Entry Details</h4>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-sm d-print-none"
                        onClick={handlePrintExportInvoice}
                        style={{ fontSize: "12px" }}
                    >
                        Print Export Invoice / Reimbursement Invoice
                    </button>
                    <button
                        className="btn btn-warning btn-sm d-print-none"
                        onClick={handlePrintDigitallySigned}
                        style={{ fontSize: "12px" }}
                    >
                        Print Digitally Signed
                    </button>
                    <button
                        className="btn btn-primary btn-sm d-print-none"
                        onClick={handlePrint}
                        style={{ fontSize: "12px" }}
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4" style={{ backgroundColor: "white", maxWidth: "1200px", margin: "0 auto" }}>
                {/* Party Information Section */}
                <div className="mb-4" style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px", backgroundColor: "#f9f9f9" }}>
                    <div className="mb-2">
                        <strong>To {partyName}</strong>
                    </div>
                    <div className="mb-2" style={{ whiteSpace: "pre-line" }}>
                        <strong>Address</strong> {partyAddress}
                    </div>
                    <div className="mb-2">
                        <strong>Gstin</strong> {gstin}
                    </div>
                    <div className="mb-2">
                        <strong>Attn</strong> {attn || ""}
                    </div>
                    <div>
                        <strong>Tel/Fax</strong> {tel} {fax && `/ ${fax}`}
                    </div>
                </div>

                {/* Details Table - Two Column Layout */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "40%", fontWeight: "bold", padding: "8px" }}>Job No / Ref No</td>
                                    <td style={{ padding: "8px" }}>{jobNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>M.B/L No</td>
                                    <td style={{ padding: "8px" }}>{mblNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>H.B/L No</td>
                                    <td style={{ padding: "8px" }}>{hblNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Shipper</td>
                                    <td style={{ padding: "8px" }}>{shipper}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Consignee</td>
                                    <td style={{ padding: "8px" }}>{consignee}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Origin</td>
                                    <td style={{ padding: "8px" }}>{origin}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>No of Packages</td>
                                    <td style={{ padding: "8px" }}>{noOfPackages}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Incoterms</td>
                                    <td style={{ padding: "8px" }}>{incoterms}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Be No</td>
                                    <td style={{ padding: "8px" }}>{beNo || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Invoice Value</td>
                                    <td style={{ padding: "8px" }}>{invoiceValue || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Shipper Invoice No</td>
                                    <td style={{ padding: "8px" }}>{shipperInvoiceNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-6">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "40%", fontWeight: "bold", padding: "8px" }}>Voucher Date</td>
                                    <td style={{ padding: "8px" }}>{voucherDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Voucher No</td>
                                    <td style={{ padding: "8px" }}>{voucherNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>E.T.D</td>
                                    <td style={{ padding: "8px" }}>{etd}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>E.T.A</td>
                                    <td style={{ padding: "8px" }}>{eta}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Vessel Name</td>
                                    <td style={{ padding: "8px" }}>{vesselName}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Destination</td>
                                    <td style={{ padding: "8px" }}>{destination}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Gross Weight</td>
                                    <td style={{ padding: "8px" }}>{grossWeight} {masterData?.kgLb || "KG"}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Be Date</td>
                                    <td style={{ padding: "8px" }}>{beDate || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Assesable Value</td>
                                    <td style={{ padding: "8px" }}>{assessableValue || ""}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Shipper Invoice Date</td>
                                    <td style={{ padding: "8px" }}>{shipperInvoiceDate}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Shipper Invoice Amount Row */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "50%", fontWeight: "bold", padding: "8px" }}>Shipper Invoice Amount</td>
                                    <td style={{ padding: "8px" }}>{shipperInvoiceAmount}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Itemized Charges Table */}
                <div className="mb-4">
                    <table className="table table-bordered" style={{ fontSize: "13px", width: "100%" }}>
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: "10%", padding: "8px" }}>Code</th>
                                <th style={{ width: "50%", padding: "8px" }}>Description</th>
                                <th style={{ width: "15%", padding: "8px" }}>SAC</th>
                                <th style={{ width: "25%", padding: "8px", textAlign: "right" }}>Debit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted" style={{ padding: "15px" }}>
                                        No items available
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: "8px" }}>{item?.code || ""}</td>
                                        <td style={{ padding: "8px" }}>{item?.description || item?.account || ""}</td>
                                        <td style={{ padding: "8px" }}>{item?.sac || ""}</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.total || item?.amountInInr || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            {items.length > 0 && (
                                <tr className="fw-bold">
                                    <td colSpan="3" style={{ padding: "8px", textAlign: "right" }}>Total</td>
                                    <td style={{ padding: "8px", textAlign: "right" }}>
                                        INR {totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bank Details Section */}
                <div className="mb-4">
                    <h6 className="fw-bold mb-3">BANK DETAIL</h6>
                    <table className="table table-bordered table-sm" style={{ fontSize: "13px" }}>
                        <tbody>
                            <tr>
                                <td style={{ width: "20%", fontWeight: "bold", padding: "8px" }}>A/C Holder Name</td>
                                <td style={{ padding: "8px" }}>LOM LOGISTICS INDIA PRIVATE LTD</td>
                                <td style={{ width: "20%", fontWeight: "bold", padding: "8px" }}>Bank Name</td>
                                <td style={{ padding: "8px" }}>WOORI BANK</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", padding: "8px" }}>EEFC Current A/C</td>
                                <td style={{ padding: "8px" }}>150957000116 (US DOLLAR)</td>
                                <td style={{ fontWeight: "bold", padding: "8px" }}>SWIFT/BIC</td>
                                <td style={{ padding: "8px" }}>HVBKIN5M</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", padding: "8px" }}>A/C</td>
                                <td style={{ padding: "8px" }}>150957000094 (INDIA RUPEE)</td>
                                <td style={{ fontWeight: "bold", padding: "8px" }}>IFSC Code</td>
                                <td style={{ padding: "8px" }}>HVBK0000001</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold", padding: "8px" }}>Branch Address</td>
                                <td colSpan="3" style={{ padding: "8px" }}>Lotte India, 2nd Floor, No.4/169</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Remarks Section */}
                <div className="mb-4">
                    <table className="table table-bordered table-sm" style={{ fontSize: "13px" }}>
                        <tbody>
                            <tr>
                                <td style={{ width: "15%", fontWeight: "bold" }}>Remarks</td>
                                <td>{displayData?.remark || ""}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold" }}>Created by</td>
                                <td>{displayData?.createdBy || ""}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold" }}>Created On</td>
                                <td>{formatDate(displayData?.createdAt || displayData?.createdOn)}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold" }}>Cancelled Remarks</td>
                                <td>{displayData?.cancelledRemarks || ""}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold" }}>Cancelled by</td>
                                <td>{displayData?.cancelledBy || ""}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: "bold" }}>Cancelled On</td>
                                <td>{formatDate(displayData?.cancelledOn)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .btn, .d-print-none {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .container-fluid {
                        background: white !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default ViewCustomerAccountSeaOut;

