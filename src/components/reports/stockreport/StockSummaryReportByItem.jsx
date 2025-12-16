import React, { useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

const StockSummaryReportByItem = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-04");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const fallbackRows = useMemo(
        () => [
            { id: 1, date: "2025-11-01", category: "Laptop", stockQty: 10, stockValue: 50000 },
            { id: 2, date: "2025-11-02", category: "Monitor", stockQty: 5, stockValue: 25000 },
            { id: 3, date: "2025-11-03", category: "Keyboard", stockQty: 20, stockValue: 10000 },
        ],
        []
    );

    const tableRows = fallbackRows;
    const totalRows = tableRows.length;

    const filteredData = useMemo(() => {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        return tableRows.filter((row) => {
            if (categoryFilter && !row.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
                return false;
            }
            if (from && to && row.date) {
                const rowDate = new Date(row.date);
                if (!isNaN(rowDate.getTime())) {
                    if (rowDate < from || rowDate > to) return false;
                }
            }
            return true;
        });
    }, [fromDate, toDate, categoryFilter, tableRows]);

    const totalStockQty = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.stockQty ?? 0), 0),
        [filteredData]
    );
    const totalStockValue = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.stockValue ?? 0), 0),
        [filteredData]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "StockSummaryByItem");
        XLSX.writeFile(workbook, `StockSummaryByItem_${fromDate}_${toDate}.xlsx`);
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-9999px";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "20px";
            tempDiv.innerHTML = `
                <style>
                    body { font-family: Arial, sans-serif; font-size: 11px; }
                    h4 { text-align:center; text-decoration:underline; margin: 0 0 12px; }
                    table { border-collapse: collapse; width:100%; margin-top:8px; }
                    th, td { border:1px solid #000; padding:4px 6px; font-size:11px; text-align:center; }
                    th { background:#f1f1f1; }
                    .text-start { text-align:left; }
                    .fw-bold { font-weight:700; }
                </style>

                <h4>Stock Summary By Item Category</h4>
                <table>
                    <tr>
                        <td class="text-start fw-bold">Period</td>
                        <td>${fromDate} to ${toDate}</td>
                    </tr>
                    <tr>
                        <td class="text-start fw-bold">Filtered By</td>
                        <td>${categoryFilter || "All Categories"}</td>
                    </tr>
                </table>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Stock Quantity</th>
                            <th>Stock Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData
                    .map(
                        (r) => `
                            <tr>
                                <td>${r.date ?? ""}</td>
                                <td class="text-start">${r.category ?? ""}</td>
                                <td>${r.stockQty}</td>
                                <td>${formatCurrency(r.stockValue)}</td>
                            </tr>`
                    )
                    .join("")}
                        <tr class="fw-bold">
                            <td colspan="2" class="text-start">Total</td>
                            <td>${totalStockQty}</td>
                            <td>${formatCurrency(totalStockValue)}</td>
                        </tr>
                    </tbody>
                </table>`;

            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;

            const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };



    // ---------------- DataTable Columns ----------------
    const columns = [
        { name: "DATE", selector: (row) => row.date || "", sortable: true },
        { name: "CATEGORY", selector: (row) => row.category || "", sortable: true },
        {
            name: "STOCK QUANTITY",
            selector: (row) => row.stockQty,
            sortable: true,
            right: true,
        },
        {
            name: "STOCK VALUE",
            selector: (row) => formatCurrency(row.stockValue),
            sortable: true,
            right: true,
        },
    ];

    return (
        <div
            style={{ background: "#d2dce5", height: "calc(100vh - 15vh)" }}
            className="container-fluid py-1 overflow-auto rounded-1"
        >
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label className="fw-semibold">From</label>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                    <label className="fw-semibold">To</label>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="fw-semibold me-2">FILTERS</label>
                    <input
                        type="text"
                        placeholder="Category filter"
                        className="form-control d-inline-block"
                        style={{ width: 180 }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    />
                </div>

                <div className="ms-auto d-flex gap-2">
                    <button
                        className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i> Excel
                    </button>

                    <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print / PDF"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "50vh" }}>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    highlightOnHover
                    persistTableHead
                    noDataComponent={<div className="py-3 text-center text-muted">No data exists</div>}
                    dense
                />
            </div>

            <div className="mt-3">
                <strong>Summary</strong>
                <p className="mb-0">Total Stock Quantity: {totalStockQty}</p>
                <p>
                    Total Stock Value: <span>{formatCurrency(totalStockValue)}</span>
                </p>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Stock Summary By Item Category PDF Preview"
            />
        </div>
    );
    function handlePdfAction(action) {
        if (!pdfUrl) return;
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `StockSummaryByItem_${fromDate}_${toDate}.pdf`;
            link.click();
        }
    }
}

export default StockSummaryReportByItem;

