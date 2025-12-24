import React, { useState, useRef } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import * as XLSX from "xlsx"; // ✅ ADDED FOR EXCEL
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const PriceList = () => {
    const navigate = useNavigate();

    const [priceLists, setPriceLists] = useState([
        {
            id: 1,
            name: "Retail Price List",
            currency: "USD",
            details: "Default list for retail customers",
            pricingScheme: "Fixed",
            roundOff: "0.05",
        },
        {
            id: 2,
            name: "Wholesale Price List",
            currency: "INR",
            details: "Discounted prices for wholesalers",
            pricingScheme: "Tiered",
            roundOff: "0.10",
        },
        {
            id: 3,
            name: "Export Price List",
            currency: "EUR",
            details: "For international customers",
            pricingScheme: "Fixed",
            roundOff: "0.25",
        },
        {
            id: 4,
            name: "Seasonal Price List",
            currency: "USD",
            details: "For seasonal discounts",
            pricingScheme: "Flexible",
            roundOff: "0.15",
        },
        {
            id: 5,
            name: "Corporate Price List",
            currency: "INR",
            details: "For business clients",
            pricingScheme: "Fixed",
            roundOff: "0.20",
        },
        {
            id: 6,
            name: "Promo Price List",
            currency: "USD",
            details: "Temporary promotional discounts",
            pricingScheme: "Dynamic",
            roundOff: "0.30",
        },
    ]);

    const [selectedRows, setSelectedRows] = useState([]);

    // ✅ PDF States
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const tempDivRef = useRef(null);

    // ✅ Generate PDF
    const generatePDF = async () => {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-2000px";
        container.style.left = "-2000px";
        container.style.width = "210mm";
        container.style.padding = "20px";
        container.style.background = "#fff";

        container.innerHTML = `
            <h2 style="text-align:center;margin-bottom:10px;">PRICE LIST REPORT</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr>
                        <th style="border:1px solid #000;padding:6px;">Name</th>
                        <th style="border:1px solid #000;padding:6px;">Currency</th>
                        <th style="border:1px solid #000;padding:6px;">Details</th>
                        <th style="border:1px solid #000;padding:6px;">Pricing Scheme</th>
                        <th style="border:1px solid #000;padding:6px;">Round Off</th>
                    </tr>
                </thead>
                <tbody>
                    ${priceLists
                .map(
                    (p) => `
                        <tr>
                            <td style="border:1px solid #000;padding:6px;">${p.name}</td>
                            <td style="border:1px solid #000;padding:6px;">${p.currency}</td>
                            <td style="border:1px solid #000;padding:6px;">${p.details}</td>
                            <td style="border:1px solid #000;padding:6px;">${p.pricingScheme}</td>
                            <td style="border:1px solid #000;padding:6px;">${p.roundOff}</td>
                        </tr>`
                )
                .join("")}
                </tbody>
            </table>
        `;

        document.body.appendChild(container);
        tempDivRef.current = container;

        const canvas = await html2canvas(container, { scale: 2 });
        const img = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
        setShowPreview(true);

        document.body.removeChild(container);
    };

    // ✅ Excel Export Function
    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(priceLists);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PriceList");
        XLSX.writeFile(wb, "PriceList.xlsx");
    };

    // ✅ PDF Action Handler
    const handlePdfAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl);

        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "PriceListReport.pdf";
            a.click();
        }

        if (action === "print") {
            const win = window.open(pdfUrl);
            win.onload = () => win.print();
        }

        if (action === "email") {
            window.location.href = `mailto:?subject=Price List Report&body=Please find the attached report.`;
        }
    };

    // ✅ Delete Selected Rows
    const handleDeleteSelected = () => {
        if (selectedRows.length === 0) {
            notifyInfo("Select at least one record.");
            return;
        }

        const confirmed = await confirm("Are you sure you want to delete selected records?");
    if (confirmed) {
            const ids = selectedRows.map((row) => row.id);
            setPriceLists((prev) => prev.filter((p) => !ids.includes(p.id)));
        }
    };

    // ✅ Navigate to Edit
    const handleRowClick = (row) => {
        navigate("/newpricelist", { state: row });
    };

    const columns = [
        {
            name: "NAME & DESCRIPTION",
            selector: (row) => row.name,
            wrap: true,
            sortable: true,
            cell: (row) => (
                <span className="text-primary fw-semibold text-decoration-underline">
                    {row.name}
                </span>
            ),
        },
        { name: "CURRENCY", selector: (row) => row.currency },
        { name: "DETAILS", selector: (row) => row.details, wrap: true },
        { name: "PRICING SCHEME", selector: (row) => row.pricingScheme },
        { name: "ROUND OFF", selector: (row) => row.roundOff },
    ];

    return (
        <div className="container-fluid p-3">

            {/* ✅ HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0"><i className="fa fa-tags me-2" aria-hidden="true"></i>Sales Price Lists</h5>

                <div className="d-flex align-items-center gap-2">

                    <button
                        className="btn btn-danger btn-sm"
                        disabled={selectedRows.length === 0}
                        onClick={handleDeleteSelected}
                    >
                        Delete Selected
                    </button>

                    {/* ✅ ✅ ✅ EXCEL BUTTON ADDED */}
                    <button className="btn btn-success btn-sm" onClick={exportExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    {/* ✅ PRINT BUTTON */}
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={generatePDF}
                    >
                        <i className="bi bi-printer"></i>
                    </button>

                    <button
                        className="btn btn-primary btn-sm px-3"
                        onClick={() => navigate("/newpricelist")}
                    >
                        + New
                    </button>
                </div>
            </div>

            {/* ✅ TABLE */}
            <div
                className="bg-white border rounded shadow-sm p-3 overflow-hidden"
                style={{ minHeight: "55vh" }}
            >
                <DataTable
                    columns={columns}
                    data={priceLists}
                    selectableRows
                    selectableRowsHighlight
                    highlightOnHover
                    pointerOnHover
                    onRowClicked={handleRowClick}
                    onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                    pagination
                    paginationPerPage={25}
                    paginationRowsPerPageOptions={[25]}
                    fixedHeader
                    fixedHeaderScrollHeight="45vh"
                    noDataComponent={<EmptyStateMessage title="Price Lists" />}
                />
            </div>

            {/* ✅ PDF MODAL */}
            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="Price List Report"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </div>
    );
};

export default PriceList;
