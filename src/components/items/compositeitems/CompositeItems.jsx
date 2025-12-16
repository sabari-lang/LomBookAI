import React, { useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage"
import PdfPreviewModal from "../../common/popup/PdfPreviewModal"
import * as XLSX from "xlsx";   // ✅ ADDED

const CompositeItems = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState([
        { id: 1, name: "Office Desk Set", type: "Assembly", sku: "DESK001", stockOnHand: 25, reorderPoint: 5, note: "Includes table top + legs + drawers" },
        { id: 2, name: "Conference Table", type: "Assembly", sku: "CONF002", stockOnHand: 10, reorderPoint: 2, note: "Seats up to 10 people" },
        { id: 3, name: "Wooden Chair Set", type: "Assembly", sku: "CHAIR003", stockOnHand: 45, reorderPoint: 10, note: "Pack of 4 chairs" },
        { id: 4, name: "Storage Rack", type: "Assembly", sku: "RACK004", stockOnHand: 30, reorderPoint: 6, note: "Adjustable shelves" },
        { id: 5, name: "Bookshelf", type: "Assembly", sku: "BOOK005", stockOnHand: 12, reorderPoint: 3, note: "5-tier wooden shelf" },
    ]);

    const [selectedRows, setSelectedRows] = useState([]);

    // ✅ DELETE
    const handleDeleteSelected = () => {
        if (selectedRows.length === 0) {
            alert("Please select items to delete.");
            return;
        }

        if (window.confirm("Delete selected composite items?")) {
            const ids = selectedRows.map((r) => r.id);
            setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
        }
    };

    const handleRowClick = (row) => {
        navigate("/newcompositeitem", { state: row });
    };

    const handleDeleteSingle = (id) => {
        if (window.confirm("Are you sure to delete this composite item?")) {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }
    };

    // ✅ PDF
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const tempDivRef = useRef(null);

    const generatePDF = async () => {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-2000px";
        container.style.left = "-2000px";
        container.style.width = "210mm";
        container.style.padding = "20px";
        container.style.background = "#fff";

        container.innerHTML = `
            <h2 style="text-align:center;margin-bottom:10px;">COMPOSITE ITEMS REPORT</h2>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="border:1px solid #000;padding:6px;">Name</th>
                        <th style="border:1px solid #000;padding:6px;">Type</th>
                        <th style="border:1px solid #000;padding:6px;">SKU</th>
                        <th style="border:1px solid #000;padding:6px;">Stock</th>
                        <th style="border:1px solid #000;padding:6px;">Reorder Point</th>
                        <th style="border:1px solid #000;padding:6px;">Note</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                .map(
                    (i) => `
                        <tr>
                            <td style="border:1px solid #000;padding:6px;">${i.name}</td>
                            <td style="border:1px solid #000;padding:6px;">${i.type}</td>
                            <td style="border:1px solid #000;padding:6px;">${i.sku}</td>
                            <td style="border:1px solid #000;padding:6px;">${i.stockOnHand}</td>
                            <td style="border:1px solid #000;padding:6px;">${i.reorderPoint}</td>
                            <td style="border:1px solid #000;padding:6px;">${i.note}</td>
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

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl);

        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "CompositeItemsReport.pdf";
            a.click();
        }

        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }

        if (action === "email") {
            window.location.href = `mailto:?subject=Composite Items Report&body=Please find attached report.`;
        }
    };

    // ✅ ✅ ✅ EXCEL EXPORT (ONLY NEW FEATURE)
    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(items);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CompositeItems");
        XLSX.writeFile(wb, "CompositeItems.xlsx");
    };

    // ✅ Columns
    const columns = [
        {
            name: "NAME",
            selector: (row) => row.name,
            sortable: true,
            wrap: true,
            cell: (row) => (
                <span className="text-primary fw-semibold text-decoration-underline">
                    {row.name}
                </span>
            ),
        },
        { name: "TYPE", selector: (row) => row.type },
        { name: "SKU", selector: (row) => row.sku, wrap: true },
        { name: "STOCK", selector: (row) => row.stockOnHand, right: true },
        { name: "REORDER POINT", selector: (row) => row.reorderPoint, right: true },
        { name: "NOTE", selector: (row) => row.note, wrap: true },
    ];

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* HEADER */}
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
                <h5 className="fw-semibold"><i className="fa fa-puzzle-piece me-2" aria-hidden="true"></i>Composite Items</h5>

                <div className="d-flex gap-2">

                    {/* ✅ DELETE */}
                    <button
                        className="btn btn-danger btn-sm"
                        disabled={selectedRows.length === 0}
                        onClick={handleDeleteSelected}
                    >
                        <i className="bi bi-trash"></i> Delete
                    </button>

                    {/* ✅ ✅ ✅ EXCEL (added without style change) */}
                    <button className="btn btn-success btn-sm" onClick={exportExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    {/* PRINT */}
                    <button className="btn btn-outline-secondary btn-sm" onClick={generatePDF}>
                        <i className="bi bi-printer"></i>
                    </button>

                    {/* NEW */}
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate("/newcompositeitem")}
                    >
                        + New
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div
                className="bg-white border rounded-3 shadow-sm p-3 overflow-hidden"
                style={{ minHeight: "65vh" }}
            >
                <DataTable
                    columns={columns}
                    data={items}
                    selectableRows
                    selectableRowsHighlight
                    highlightOnHover
                    pointerOnHover
                    onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                    onRowClicked={handleRowClick}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="65vh"
                    noDataComponent={<EmptyStateMessage title="Composite Items" />}
                />
            </div>

            {/* PDF MODAL */}
            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="Composite Items Report"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </div>
    );
};

export default CompositeItems;
