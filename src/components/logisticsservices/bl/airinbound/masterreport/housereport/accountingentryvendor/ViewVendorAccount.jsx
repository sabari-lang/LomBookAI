import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAirInboundVendorAccountById } from "../../../Api";
import moment from "moment";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ViewVendorAccount = () => {
    const navigate = useNavigate();
    const [entryData, setEntryData] = useState(null);
    const [masterData, setMasterData] = useState(null);
    const [houseData, setHouseData] = useState(null);
    const printRef = useRef(null);
    const pdfRef = useRef(null);

    // Get data from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem("vendorAccountViewData");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setEntryData(data);
            } catch (e) {
                console.error("Error parsing vendorAccountViewData:", e);
            }
        }

        const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
        const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");
        setMasterData(storedMaster);
        setHouseData(storedHouse);
    }, []);

    // Fetch full entry data if we have an ID
    const { data: fullEntryData } = useQuery({
        queryKey: ["vendorAccountEntry", entryData?.id],
        queryFn: () => getAirInboundVendorAccountById(entryData?.id),
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
    const { totalAmount, items, subtotal, taxableAmt, nonTaxableAmt, cgstTotal, sgstTotal, igstTotal } = useMemo(() => {
        const itemsList = Array.isArray(displayData?.items) ? displayData.items : [];
        const total = itemsList.reduce((sum, item) => sum + Number(item?.total ?? 0), 0);
        const sub = itemsList.reduce((sum, item) => sum + Number(item?.amountInInr ?? item?.amountInINR ?? 0), 0);
        const taxable = itemsList.reduce((sum, item) => {
            const gst = Number(item?.gst ?? item?.gstPer ?? 0);
            return gst > 0 ? sum + Number(item?.amountInInr ?? item?.amountInINR ?? 0) : sum;
        }, 0);
        const nonTaxable = itemsList.reduce((sum, item) => {
            const gst = Number(item?.gst ?? item?.gstPer ?? 0);
            return gst === 0 ? sum + Number(item?.amountInInr ?? item?.amountInINR ?? 0) : sum;
        }, 0);
        const cgst = itemsList.reduce((sum, item) => sum + Number(item?.cgst ?? 0), 0);
        const sgst = itemsList.reduce((sum, item) => sum + Number(item?.sgst ?? 0), 0);
        const igst = itemsList.reduce((sum, item) => sum + Number(item?.igst ?? 0), 0);
        return {
            totalAmount: total,
            items: itemsList,
            subtotal: sub,
            taxableAmt: taxable,
            nonTaxableAmt: nonTaxable,
            cgstTotal: cgst,
            sgstTotal: sgst,
            igstTotal: igst,
        };
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

    // Generate and download PDF for Purchase Voucher using html2canvas - Matching 3rd image (Purchase voucher)
    const handlePrintPurchaseVoucher = async () => {
        if (!displayData) {
            alert("Entry data not found");
            return;
        }

        try {
            // Create a temporary div for PDF generation
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm"; // A4 width
            tempDiv.style.padding = "20px";
            tempDiv.style.backgroundColor = "white";
            tempDiv.style.fontFamily = "Arial, sans-serif";

            // Extract data
            const partyName = displayData?.partyName || "";
            const partyAddress = displayData?.partyAddress || "";
            const gstin = displayData?.gstin || displayData?.gstNumber || "";
            const jobNo = displayData?.jobNo || masterData?.jobNo || "";
            const mawbNo = masterData?.mawbNo || masterData?.mawb || "";
            const hawbNo = displayData?.hawbNo || displayData?.hawbno || houseData?.hawb || houseData?.hawbNo || "";
            const voucherDate = formatDate(displayData?.voucherDate);
            const voucherNo = displayData?.voucherNo || "";
            const firstItem = items.length > 0 ? items[0] : null;

            // Build HTML for Purchase Voucher (matching 3rd image)
            tempDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 24px; font-weight: bold; color: #0000FF; margin-bottom: 5px;">LOM</div>
                    <div style="font-size: 10px; color: #FF0000; margin-bottom: 10px;">We Care, We Monitor, We Deliver</div>
                    <div style="font-size: 14px; font-weight: bold; color: #0000FF; margin-bottom: 5px;">LOM LOGISTICS INDIA PVT.LTD.</div>
                    <div style="font-size: 11px; margin-bottom: 3px;">No 151, Village Road, 7th Floor, GEE GEE EMERALD Building</div>
                    <div style="font-size: 11px; margin-bottom: 3px;">Nungambakkam Chennai-600 034, India</div>
                    <div style="font-size: 11px; margin-bottom: 15px;">Tel: +91 44 66455902 to 923</div>
                    <div style="font-size: 16px; font-weight: bold; margin-top: 10px;">Purchase</div>
                </div>

                <div style="margin-bottom: 15px; font-size: 11px;">
                    <div style="margin-bottom: 5px;"><strong>Voucher No:</strong> ${voucherNo}</div>
                    <div style="margin-bottom: 5px;"><strong>Voucher Date:</strong> ${voucherDate}</div>
                    <div style="margin-bottom: 5px;"><strong>Credit Account:</strong> ${partyName}</div>
                    <div style="margin-bottom: 5px;"><strong>Address:</strong> ${partyAddress}</div>
                    <div style="margin-bottom: 5px;"><strong>GSTIN:</strong> ${gstin}</div>
                    ${firstItem ? `
                        <div style="margin-bottom: 5px;"><strong>Debit Account:</strong> ${firstItem?.description || ""}</div>
                        <div style="margin-bottom: 5px;"><strong>Rs ${Number(firstItem?.total || 0).toFixed(2)}</strong></div>
                        <div style="margin-bottom: 5px;">0.00</div>
                        <div style="margin-bottom: 5px;">0.00</div>
                        <div style="margin-bottom: 5px;">IGST Rs ${Number(firstItem?.igst || 0).toFixed(2)}</div>
                    ` : ""}
                </div>

                <div style="margin-bottom: 15px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 5px;">Voucher Date</th>
                                <th style="border: 1px solid #000; padding: 5px;">Voucher No</th>
                                <th style="border: 1px solid #000; padding: 5px;">Voucher Type</th>
                                <th style="border: 1px solid #000; padding: 5px;">Job No</th>
                                <th style="border: 1px solid #000; padding: 5px;">Master No</th>
                                <th style="border: 1px solid #000; padding: 5px;">House No</th>
                                <th style="border: 1px solid #000; padding: 5px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px;">${voucherDate}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${voucherNo}</td>
                                <td style="border: 1px solid #000; padding: 5px;">Purchase</td>
                                <td style="border: 1px solid #000; padding: 5px;">${jobNo}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${mawbNo}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${hawbNo}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(totalAmount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin-bottom: 15px; font-size: 11px; font-weight: bold;">
                    GRAND TOTAL: (Rs) ${Number(totalAmount).toFixed(2)}
                </div>

                <div style="margin-bottom: 15px; font-size: 11px;">
                    <strong>Remarks:</strong> ${displayData?.remark || ""}
                </div>

                <div style="margin-bottom: 15px;">
                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">BREAK UP DETAILS</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 5px;">TAXABLE AMT</th>
                                <th style="border: 1px solid #000; padding: 5px;">NON TAXABLE AMT</th>
                                <th style="border: 1px solid #000; padding: 5px;">CGST</th>
                                <th style="border: 1px solid #000; padding: 5px;">SGST</th>
                                <th style="border: 1px solid #000; padding: 5px;">IGST</th>
                                <th style="border: 1px solid #000; padding: 5px;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(taxableAmt).toFixed(2)}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(nonTaxableAmt).toFixed(2)}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(cgstTotal).toFixed(2)}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(sgstTotal).toFixed(2)}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(igstTotal).toFixed(2)}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${Number(totalAmount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 10px;">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 5px;">PREPARED BY</div>
                        <div>${displayData?.createdBy || ""}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-weight: bold; margin-bottom: 5px;">CHECKED BY</div>
                        <div style="width: 80px; height: 80px; border: 2px solid #000; border-radius: 50%; margin: 10px auto; display: flex; align-items: center; justify-content: center; flex-direction: column; font-size: 8px;">
                            <div>CHENNAI 600 034</div>
                            <div>INDIA</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; margin-bottom: 5px;">AUTHORISED BY</div>
                        <div style="width: 80px; height: 80px; border: 2px solid #000; border-radius: 50%; margin: 10px auto; display: flex; align-items: center; justify-content: center; flex-direction: column; font-size: 8px;">
                            <div>CHENNAI 600 034</div>
                            <div>INDIA</div>
                        </div>
                    </div>
                </div>

                <div style="text-align: right; margin-top: 20px; font-size: 9px;">
                    Page 1
                </div>
            `;

            document.body.appendChild(tempDiv);

            // Wait for images/fonts to load
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture with html2canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            // Remove temp div
            document.body.removeChild(tempDiv);

            // Convert to PDF
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // If content is taller than one page, split into multiple pages
            const pageHeight = pdf.internal.pageSize.getHeight();
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            // Save PDF
            const fileName = `Purchase_Voucher_${voucherNo || displayData?.id || "voucher"}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
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
    const mawbNo = masterData?.mawbNo || masterData?.mawb || "";
    const hawbNo = displayData?.hawbNo || displayData?.hawbno || houseData?.hawb || houseData?.hawbNo || "";
    const shipper = masterData?.shipperName || "";
    const consignee = masterData?.consigneeName || "";
    const origin = masterData?.airportDeparture || "";
    const destination = masterData?.airportDestination || "";
    const flightNo = masterData?.flightNo || "";
    const etd = formatDate(masterData?.departureDate);
    const eta = formatDate(masterData?.arrivalDate);
    const noOfPieces = masterData?.pieces || "";
    const grossWeight = masterData?.grossWeight || "";
    const chargeableWeight = masterData?.chargeableWeight || "";
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
            {/* Header Section with Buttons - Matching first image */}
            <div
                className="d-flex justify-content-between align-items-center px-4 py-3"
                style={{ backgroundColor: "#28a745", color: "white" }}
            >
                <h4 className="mb-0 fw-bold">Accounting Entry Details</h4>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-sm d-print-none"
                        onClick={handlePrintPurchaseVoucher}
                        style={{ fontSize: "12px" }}
                    >
                        Print Purchase Voucher
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

            {/* Main Content - Accounting Entry Details Layout - Matching first 2 images exactly */}
            <div className="p-4" style={{ backgroundColor: "white", maxWidth: "1200px", margin: "0 auto" }}>
                {/* Party Information Section - Matching first image */}
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

                {/* Details Table - Two Column Layout Matching First Image Exactly */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "40%", fontWeight: "bold", padding: "8px" }}>Job No / Ref No</td>
                                    <td style={{ padding: "8px" }}>{jobNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Mawbno</td>
                                    <td style={{ padding: "8px" }}>{mawbNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Hawbno</td>
                                    <td style={{ padding: "8px" }}>{hawbNo}</td>
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
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>No of Pieces</td>
                                    <td style={{ padding: "8px" }}>{noOfPieces}</td>
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
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Flight No</td>
                                    <td style={{ padding: "8px" }}>{flightNo}</td>
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
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Chargable Weight</td>
                                    <td style={{ padding: "8px" }}>{chargeableWeight} {masterData?.kgLb || "KG"}</td>
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

                {/* Itemized Charges Table - Matching second image with all columns */}
                <div className="mb-4">
                    <table className="table table-bordered" style={{ fontSize: "13px", width: "100%" }}>
                        <thead className="table-light">
                            <tr>
                                <th style={{ padding: "8px" }}>Code</th>
                                <th style={{ padding: "8px" }}>Description</th>
                                <th style={{ padding: "8px" }}>SAC</th>
                                <th style={{ padding: "8px" }}>Currency</th>
                                <th style={{ padding: "8px" }}>Per</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>Amount</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>Ex.Rate</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>Amount in INR</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>GST %</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>CGST</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>SGST</th>
                                <th style={{ padding: "8px", textAlign: "right" }}>IGST</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="text-center text-muted" style={{ padding: "15px" }}>
                                        No items available
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: "8px" }}>{item?.code || ""}</td>
                                        <td style={{ padding: "8px" }}>{item?.description || item?.account || ""}</td>
                                        <td style={{ padding: "8px" }}>{item?.sac || ""}</td>
                                        <td style={{ padding: "8px" }}>{item?.currency || "INR"}</td>
                                        <td style={{ padding: "8px" }}>{item?.per || ""}</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.amount || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.exRate || item?.exchangeRate || 1).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.amountInInr || item?.amountInINR || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.gst || item?.gstPer || 0).toFixed(0)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.cgst || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.sgst || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {Number(item?.igst || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            {items.length > 0 && (
                                <>
                                    <tr className="fw-bold">
                                        <td colSpan="5" style={{ padding: "8px", textAlign: "right" }}>Subtotal</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {items.reduce((sum, item) => sum + Number(item?.amount || 0), 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px" }}></td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {subtotal.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px" }}></td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {cgstTotal.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {sgstTotal.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>
                                            {igstTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr className="fw-bold">
                                        <td colSpan="8" style={{ padding: "8px", textAlign: "right" }}>Total</td>
                                        <td colSpan="4" style={{ padding: "8px", textAlign: "right" }}>
                                            INR {totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Remarks Section - Matching second image */}
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

export default ViewVendorAccount;
