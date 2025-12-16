import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAirInboundCustomerAccountById } from "../../../Api";
import moment from "moment";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ViewCustomerAccount = () => {
    const navigate = useNavigate();
    const [entryData, setEntryData] = useState(null);
    const [masterData, setMasterData] = useState(null);
    const [houseData, setHouseData] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Get data from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem("customerAccView");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setEntryData(data);
            } catch (e) {
                console.error("Error parsing customerAccView:", e);
            }
        }

        const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
        const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");
        setMasterData(storedMaster);
        setHouseData(storedHouse);
    }, []);

    // Fetch full entry data if we have an ID
    const { data: fullEntryData } = useQuery({
        queryKey: ["customerAccountEntry", entryData?.id],
        queryFn: () => getAirInboundCustomerAccountById(entryData?.id),
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

    // Print - browser print dialog
    const handlePrint = () => {
        window.print();
    };

    // Generate PDF Preview
    const handlePrintInvoice = async () => {
        const element = document.getElementById('invoice-print-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF preview');
        }
    };

    // Handle PDF actions
    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        if (action === 'open') window.open(pdfUrl);
        if (action === 'save') {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `Export-Invoice-${voucherNo || 'document'}.pdf`;
            a.click();
        }
        if (action === 'print') {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
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
        <div className="container-fluid p-3" style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {/* Header Section with Print Button Only */}
            <div
                className="d-flex justify-content-between align-items-center px-4 py-2 rounded-1 d-print-none"
                style={{ backgroundColor: "#28a745", color: "white" }}
            >
                <h4 className="mb-0">Accounting Entry Details</h4>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handlePrint}
                        style={{ fontSize: "14px" }}
                    >
                        Print
                    </button>
                    <button
                        className="btn btn-info btn-sm"
                        onClick={handlePrintInvoice}
                        style={{ fontSize: "14px" }}
                    >
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* Main Content - Accounting Entry Details Layout - Matching first image exactly */}
            <div className="p-4 accounting-entry-print" style={{ backgroundColor: "transparent", maxWidth: "1200px", margin: "0 auto" }}>
                {/* Heading */}
                <h4 className="mb-4">Accounting Entry Details</h4>
                
                {/* Party Information Section - Matching first image */}
                <div className="mb-4" style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px", backgroundColor: "transparent" }}>
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
                                    <td style={{ padding: "8px" }}>{beDate || "0000-00-00"}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "8px" }}>Assessable Value</td>
                                    <td style={{ padding: "8px" }}>{assessableValue || ""}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Shipper Invoice Details Row */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "50%", fontWeight: "bold", padding: "8px" }}>Shipper Invoice No</td>
                                    <td style={{ padding: "8px" }}>{shipperInvoiceNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-4">
                        <table className="table table-bordered table-sm" style={{ fontSize: "13px", marginBottom: 0 }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "50%", fontWeight: "bold", padding: "8px" }}>Shipper Invoice Date</td>
                                    <td style={{ padding: "8px" }}>{shipperInvoiceDate}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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

                {/* Itemized Charges Table - Matching second image */}
                <div className="mb-4">
                    <table className="table table-bordered" style={{ fontSize: "13px", width: "100%", backgroundColor: "transparent" }}>
                        <thead style={{ backgroundColor: "transparent" }}>
                            <tr>
                                <th style={{ width: "10%", padding: "8px", backgroundColor: "transparent" }}>Code</th>
                                <th style={{ width: "50%", padding: "8px", backgroundColor: "transparent" }}>Description</th>
                                <th style={{ width: "15%", padding: "8px", backgroundColor: "transparent" }}>SAC</th>
                                <th style={{ width: "25%", padding: "8px", textAlign: "right", backgroundColor: "transparent" }}>Credit</th>
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: "transparent" }}>
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
                                        USD {totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            )}
                            {items.length > 0 && (
                                <tr className="fw-bold">
                                    <td colSpan="4" style={{ padding: "8px", textAlign: "right" }}>Total USD {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            )}
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
                        padding: 0 !important;
                    }
                    .p-4 {
                        padding: 20px !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    /* Hide everything except the accounting entry details content */
                    body * {
                        visibility: hidden;
                    }
                    .accounting-entry-print, .accounting-entry-print * {
                        visibility: visible;
                    }
                    .accounting-entry-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>

            {/* Hidden Invoice Content for PDF Generation */}
            <div id="invoice-print-content" style={{ 
                position: 'absolute', 
                left: '-9999px', 
                top: 0, 
                width: '210mm', 
                minHeight: '297mm',
                backgroundColor: 'white', 
                padding: '15mm 10mm',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                lineHeight: '1.4',
                boxSizing: 'border-box'
            }}>
                {/* Header with Logo */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '70px', 
                            height: '70px', 
                            border: '2px solid #e74c3c', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c', lineHeight: '1' }}>LOM</div>
                                <div style={{ fontSize: '7px', color: '#e74c3c', lineHeight: '1.2' }}>LEADER OF MARKET</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '9px' }}>
                            <div style={{ color: '#e74c3c', marginBottom: '1px' }}>We Care</div>
                            <div style={{ color: '#e74c3c', marginBottom: '1px' }}>We Move</div>
                            <div style={{ color: '#e74c3c', marginBottom: '3px' }}>We Deliver</div>
                            <div style={{ fontSize: '8px' }}>
                                <span style={{ marginRight: '8px' }}>WCA</span>
                                <span>IATA</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', maxWidth: '55%' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>LOM LOGISTICS INDIA PVT.LTD.</div>
                        <div style={{ fontSize: '9px', lineHeight: '1.5' }}>
                            <div>No 151, Village Road, 7th Floor, GEE GEE EMERALD Building</div>
                            <div>Nungambakkam Chennai-600 034, India Phone:+91 7449271782</div>
                        </div>
                    </div>
                </div>

                {/* Invoice Title */}
                <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', margin: '10px 0 12px 0' }}>Export Invoice</h3>

                {/* To Section */}
                <table style={{ width: '100%', marginBottom: '8px', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '8%' }}>To</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }} colSpan="3">{partyName}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>ADDR</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }} colSpan="3">{partyAddress}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>ATTN</td>
                            <td style={{ border: '1px solid #000', padding: '5px', width: '42%' }}>{attn}</td>
                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '12%' }}>TEL/FAX</td>
                            <td style={{ border: '1px solid #000', padding: '5px', width: '38%' }}>{tel} {fax && `/ ${fax}`}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Details Table */}
                <table style={{ width: '100%', marginBottom: '8px', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '18%' }}>Job No</td>
                            <td style={{ border: '1px solid #000', padding: '4px', width: '32%' }}>{jobNo}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', width: '18%' }}>Voucher Date</td>
                            <td style={{ border: '1px solid #000', padding: '4px', width: '32%' }}>{voucherDate}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Master No</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{mawbNo}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Voucher No</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{voucherNo}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>House No</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{hawbNo}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>ETA</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{eta}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Shipper</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{shipper}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Consignee</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{consignee}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Flight No</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{flightNo}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>ETD</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{etd}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Origin</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{origin}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Destination</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{destination}</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Gross Weight</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{grossWeight} KG</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Chargable Weight</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{chargeableWeight} KG</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>No of Pieces</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{noOfPieces}</td>
                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Incoterms</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{incoterms}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Charges Table */}
                <table style={{ width: '100%', marginBottom: '8px', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Description</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', backgroundColor: '#f5f5f5', width: '15%', fontWeight: 'bold' }}>SAC</th>
                            <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', backgroundColor: '#f5f5f5', width: '18%', fontWeight: 'bold' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>
                                    No items available
                                </td>
                            </tr>
                        ) : (
                            items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item?.description || item?.account || ""}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{item?.sac || "996759"}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                                        {Number(item?.total || item?.amountInInr || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                        {items.length > 0 && (
                            <tr>
                                <td colSpan="2" style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                                <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>
                                    USD {totalAmount.toFixed(2)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Remark */}
                <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '12%' }}>REMARK</td>
                            <td style={{ border: '1px solid #000', padding: '5px' }}>{displayData?.remark || ""}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal 
                show={showPreview} 
                pdfUrl={pdfUrl} 
                title="Export Invoice" 
                onClose={() => setShowPreview(false)} 
                onAction={handlePdfAction} 
            />
        </div>
    );
};

export default ViewCustomerAccount;
