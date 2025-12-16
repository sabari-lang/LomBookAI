import React, { useState, useRef } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";


import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import * as XLSX from "xlsx";
import EmptyStateMessage from "../common/emptytable/EmptyStateMessage";
import PdfPreviewModal from "../common/popup/PdfPreviewModal";

const ItemGroups = () => {
    const navigate = useNavigate();

    const [itemGroups, setItemGroups] = useState([
        { id: 1, name: "Electronics Set", sku: "ELEC-GRP-001", stockOnHand: 120, reorderPoint: 20 },
        { id: 2, name: "Office Essentials", sku: "OFFICE-GRP-002", stockOnHand: 75, reorderPoint: 10 },
        { id: 3, name: "Kitchen Equipment", sku: "KITCHEN-GRP-003", stockOnHand: 50, reorderPoint: 8 },
        { id: 4, name: "Furniture Collection", sku: "FURN-GRP-004", stockOnHand: 200, reorderPoint: 15 },
        { id: 5, name: "Computer Accessories", sku: "COMP-GRP-005", stockOnHand: 90, reorderPoint: 12 },
    ]);

    const [selectedRows, setSelectedRows] = useState([]);

    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const tempDivRef = useRef(null);

    // ✅ Excel Export
    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(itemGroups);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ItemGroups");
        XLSX.writeFile(wb, "ItemGroups.xlsx");
    };

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
            <h2 style="text-align:center;margin-bottom:10px;">ITEM GROUPS REPORT</h2>
            
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr>
                        <th style="border:1px solid #000;padding:6px;">Group Name</th>
                        <th style="border:1px solid #000;padding:6px;">SKU</th>
                        <th style="border:1px solid #000;padding:6px;">Stock</th>
                        <th style="border:1px solid #000;padding:6px;">Reorder Point</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemGroups
                .map(
                    (g) => `
                        <tr>
                            <td style="border:1px solid #000;padding:6px;">${g.name}</td>
                            <td style="border:1px solid #000;padding:6px;">${g.sku}</td>
                            <td style="border:1px solid #000;padding:6px;">${g.stockOnHand}</td>
                            <td style="border:1px solid #000;padding:6px;">${g.reorderPoint}</td>
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
        const blobUrl = URL.createObjectURL(blob);

        setPdfUrl(blobUrl);
        setShowPreview(true);

        document.body.removeChild(container);
    };

    // ✅ PDF Action Handler
    const handlePdfAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl);

        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "ItemGroupsReport.pdf";
            a.click();
        }

        if (action === "print") {
            const win = window.open(pdfUrl);
            win.onload = () => win.print();
        }

        if (action === "email") {
            window.location.href = `mailto:?subject=Item Groups Report&body=Please find the attached report.`;
        }
    };

    // ✅ Delete Selected Rows
    const handleDelete = () => {
        if (selectedRows.length === 0) {
            alert("Please select at least one group to delete.");
            return;
        }

        if (window.confirm(`Delete ${selectedRows.length} selected item group(s)?`)) {
            const ids = selectedRows.map((row) => row.id);
            setItemGroups((prev) => prev.filter((g) => !ids.includes(g.id)));
        }
    };

    const handleRowClick = (row) => {
        navigate("/itemgropusnew", { state: row });
    };

    const columns = [
        {
            name: "GROUP NAME", selector: (row) => row.name, sortable: true, wrap: true,
            cell: (row) => <span className="text-primary fw-semibold text-decoration-underline">{row.name}</span>
        },
        { name: "SKU", selector: (row) => row.sku, wrap: true },
        { name: "STOCK ON HAND", selector: (row) => row.stockOnHand, right: true },
        { name: "REORDER POINT", selector: (row) => row.reorderPoint, right: true },
    ];

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >

            {/* ✅ Header */}
            <div
                className="d-flex justify-content-between align-items-center mb-3"
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    background: "#f8f9fa",
                    paddingTop: "0.6rem",
                    paddingBottom: "0.6rem",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                }}
            >
                <h5 className="fw-semibold mb-0"><i className="fa fa-boxes me-2" aria-hidden="true"></i>Item Groups</h5>

                <div className="d-flex align-items-center gap-2">

                    <button
                        className="btn btn-danger btn-sm"
                        disabled={selectedRows.length === 0}
                        onClick={handleDelete}
                    >
                        <i className="bi bi-trash"></i> Delete
                    </button>

                    {/* ✅ Excel Export Button */}
                    <button className="btn btn-success btn-sm" onClick={exportExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={generatePDF}
                    >
                        <i className="bi bi-printer"></i>
                    </button>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate("/itemgropusnew")}
                    >
                        + New
                    </button>
                </div>
            </div>

            {/* ✅ Table */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "55vh" }}
            >
                <DataTable
                    columns={columns}
                    data={itemGroups}
                    selectableRows
                    selectableRowsHighlight
                    highlightOnHover
                    pointerOnHover
                    onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                    onRowClicked={handleRowClick}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="45vh"
                    noDataComponent={<EmptyStateMessage title="Item Groups" />}
                />
            </div>

            {/* ✅ PDF MODAL */}
            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="Item Groups Report"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </div>
    );
};

export default ItemGroups;
