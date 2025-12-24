import React, { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getItemSummary } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const StockSummary = () => {
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showInStockOnly, setShowInStockOnly] = useState(false);
    const [applyDateFilter, setApplyDateFilter] = useState(false);
    const [selectedDate, setSelectedDate] = useState("2025-11-05");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = {
            Page: page,
            PageSize: perPage,
        };
        if (applyDateFilter && selectedDate) params.Date = selectedDate;
        if (selectedCategory && selectedCategory !== "All Categories") params.Category = selectedCategory;
        if (showInStockOnly) params.InStockOnly = true;
        return params;
    }, [page, perPage, applyDateFilter, selectedDate, selectedCategory, showInStockOnly]);

    const queryKey = useMemo(
        () => ["report-stock-summary", requestParams],
        [requestParams]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getItemSummary(requestParams),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Stock Summary Report"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : [];
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    const filteredData = tableRows;

    const columns = [
        { name: "#", selector: (row) => row.id, width: "60px" },
        { name: "Item Name", selector: (row) => row.itemName },
        {
            name: "Sale Price",
            selector: (row) => `₹ ${Number(row.salePrice ?? 0).toLocaleString()}.00`,
            right: true,
        },
        {
            name: "Purchase Price",
            selector: (row) => `₹ ${row.purchasePrice.toLocaleString()}.00`,
            right: true,
        },
        {
            name: "Stock Qty",
            selector: (row) => (
                <span style={{ color: row.stockQty <= 0 ? "red" : "black" }}>
                    {row.stockQty}
                </span>
            ),
            right: true,
        },
        {
            name: "Stock Value",
            selector: (row) => `₹ ${row.stockValue.toLocaleString()}.00`,
            right: true,
        },
    ];
    const downloadExcel = () => {
        if (filteredData.length === 0) {
            notifyInfo("No data available to export!");
            return;
        }
        const excelData = filteredData.map((r) => ({
            "Item Name": r.itemName,
            "Sale Price": r.salePrice,
            "Purchase Price": r.purchasePrice,
            "Stock Qty": r.stockQty,
            "Stock Value": r.stockValue,
        }));
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Summary");
        XLSX.writeFile(workbook, `Stock_Summary_Report_${selectedDate}.xlsx`);
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const totalQty = filteredData.reduce((a, b) => a + (b.stockQty ?? 0), 0);
            const totalValue = filteredData.reduce((a, b) => a + (b.stockValue ?? 0), 0);
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-9999px";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "25px";
            tempDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
            tempDiv.innerHTML = `
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 6px; text-align: center; }
          th { background: #f1f1f1; }
        </style>
        <h3 style="text-align:center; text-decoration:underline;">Stock Summary Report</h3>
        <p><b>Date:</b> ${selectedDate.split("-").reverse().join("/")}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Sale Price</th>
              <th>Purchase Price</th>
              <th>Stock Qty</th>
              <th>Stock Value</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
                    .map(
                        (r) => `
              <tr>
                <td>${r.id}</td>
                <td>${r.itemName}</td>
                <td>₹ ${Number(r.salePrice ?? 0).toLocaleString()}.00</td>
                <td>₹ ${Number(r.purchasePrice ?? 0).toLocaleString()}.00</td>
                <td>${r.stockQty}</td>
                <td>₹ ${Number(r.stockValue ?? 0).toLocaleString()}.00</td>
              </tr>`
                    )
                    .join("")}
            <tr style="font-weight:bold;">
              <td colspan="4" style="text-align:right;">Total</td>
              <td>${totalQty}</td>
              <td>₹ ${Number(totalValue).toLocaleString()}.00</td>
            </tr>
          </tbody>
        </table>
      `;
            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;
            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (error) {
            notifyError("Error generating PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    const handleAction = (action) => {
        if (!pdfUrl) return;
        if (action === "open") window.open(pdfUrl, "_blank");
        else if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `Stock_Summary_${selectedDate}.pdf`;
            link.click();
        } else if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
    };

    const totalQty = filteredData.reduce((a, b) => a + (b.stockQty ?? 0), 0);
    const totalValue = filteredData.reduce((a, b) => a + (b.stockValue ?? 0), 0);

    return (
        <div
            className="container-fluid bg-light pt-2 pb-4 rounded-3"
            style={{ height: "calc(100vh - 11vh)", overflow: "auto" }}
        >
            {/* Filters Row */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                    <span className="fw-semibold text-muted">FILTERS</span>
                    {/* Category */}
                    <select
                        className="form-select"
                        style={{ width: 180 }}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option>All Categories</option>
                        <option>Electronics</option>
                        <option>General</option>
                    </select>
                    {/* Date Filter */}
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={applyDateFilter}
                            onChange={(e) => setApplyDateFilter(e.target.checked)}
                        />
                        <span>Date filter</span>
                        <input
                            type="date"
                            className="form-control"
                            style={{ width: 160 }}
                            disabled={!applyDateFilter}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    {/* Show Items In Stock */}
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={showInStockOnly}
                            onChange={(e) => setShowInStockOnly(e.target.checked)}
                        />
                        <span>Show items in stock</span>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i>
                    </button>
                </div>
            </div>
            {/* Table Section */}
            <div className="bg-white rounded-3 shadow-sm border p-3" style={{ minHeight: "50vh" }}>
                <h6 className="fw-bold mb-3">STOCK SUMMARY</h6>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    striped
                    highlightOnHover
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={setPage}
                    onChangeRowsPerPage={setPerPage}
                    progressPending={isLoading}
                    noDataComponent="No data available for Stock Summary Report."
                />
                <div className="d-flex justify-content-between fw-bold mt-2">
                    <div>Total Qty: {totalQty}</div>
                    <div>Total Value: ₹ {Number(totalValue).toLocaleString()}.00</div>
                </div>
            </div>
            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="Stock Summary Report"
            />
        </div>
    );
};

export default StockSummary;
