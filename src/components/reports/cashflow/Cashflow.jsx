import React, { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getCashFlowReport } from "../reportAPI";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";


const Cashflow = () => {
    // Report filter form - always unlock on mount
    
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        search: "",
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const queryKey = useMemo(() => ["report-cashflow", page, perPage], [page, perPage]);
    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () =>
            getCashFlowReport({
                Page: page,
                PageSize: perPage,
            }),
        enabled: Boolean(page && perPage),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Cash Flow Report"),
    });
    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const filteredRows = useMemo(() => {
        let filtered = tableRows;
        const text = filters.search.trim().toLowerCase();
        if (text) {
            filtered = filtered.filter(
                (row) =>
                    (row.name ?? "").toLowerCase().includes(text) ||
                    (row.type ?? "").toLowerCase().includes(text) ||
                    (row.category ?? "").toLowerCase().includes(text)
            );
        }
        if (filters.startDate && filters.endDate) {
            filtered = filtered.filter(
                (row) =>
                    new Date(row.date) >= new Date(filters.startDate) &&
                    new Date(row.date) <= new Date(filters.endDate)
            );
        }
        return filtered;
    }, [tableRows, filters]);
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    // Totals
    const totalCashIn = filteredRows.reduce((sum, row) => sum + (row.cashIn ?? 0), 0);
    const totalCashOut = filteredRows.reduce((sum, row) => sum + (row.cashOut ?? 0), 0);
    const closingBalance = totalCashIn - totalCashOut;

    // ===== Excel Report Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cashflow Report");
        XLSX.writeFile(workbook, `Cashflow_${filters.startDate}_${filters.endDate}.xlsx`);
    };

    // ===== PDF Generate & Preview =====
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
          h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; font-size:11px; text-align:center; }
          th { background:#f1f1f1; }
          .text-start { text-align:left; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Cash Flow Report</h4>
        <table>
          <tr><td class="fw-bold text-start">Period</td><td>${filters.startDate || "—"} to ${filters.endDate || "—"}</td></tr>
          <tr><td class="fw-bold text-start">Filtered By</td><td>${filters.search || "All"}</td></tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Ref No.</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Cash In (₹)</th>
              <th>Cash Out (₹)</th>
              <th>Running Balance (₹)</th>
            </tr>
          </thead>
            <tbody>
            ${filteredRows
                    .map(
                        (r) => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.refNo}</td>
                  <td class="text-start">${r.name}</td>
                  <td>${r.category}</td>
                  <td>${r.type}</td>
                  <td>${r.cashIn.toLocaleString()}</td>
                  <td>${r.cashOut.toLocaleString()}</td>
                  <td>${r.runningBalance.toLocaleString()}</td>
                </tr>`
                    )
                    .join("")}
            <tr class="fw-bold">
              <td colspan="5" class="text-start">Total</td>
              <td>${totalCashIn.toLocaleString()}</td>
              <td>${totalCashOut.toLocaleString()}</td>
              <td>${closingBalance.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      `;

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
            notifyError("Failed to generate PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const handlePdfAction = (action) => {
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `Cashflow_${filters.startDate}_${filters.endDate}.pdf`;
            link.click();
        }
    };

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const columns = [
        { name: "Date", selector: (row) => row.date, sortable: true },
        { name: "Ref No.", selector: (row) => row.refNo, sortable: true },
        { name: "Name", selector: (row) => row.name, sortable: true },
        { name: "Category", selector: (row) => row.category },
        { name: "Type", selector: (row) => row.type },
        {
            name: "Cash In",
            selector: (row) => formatCurrency(row.cashIn),
            right: true,
        },
        {
            name: "Cash Out",
            selector: (row) => formatCurrency(row.cashOut),
            right: true,
        },
        {
            name: "Running Balance",
            selector: (row) => formatCurrency(row.runningBalance),
            right: true,
        },
    ];

    return (
        <div
            style={{ background: "#d2dce5", height: "calc(100vh - 15vh)" }}
            className="container-fluid py-1 overflow-auto rounded-1"
        >
            {/* Top Filter Bar */}
            <div className="bg-light p-3 rounded d-flex flex-wrap align-items-center justify-content-between mb-3 shadow-sm">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select className="form-select form-select-sm" style={{ width: "120px" }}>
                        <option>Custom</option>
                        <option>Today</option>
                        <option>This Month</option>
                    </select>

                    <span className="fw-bold text-secondary">Between</span>
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ width: "160px" }}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <span className="fw-bold text-secondary">To</span>
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ width: "160px" }}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />

                    <select className="form-select form-select-sm" style={{ width: "180px" }}>
                        <option>All Firms</option>
                        <option>Firm A</option>
                        <option>Firm B</option>
                    </select>
                </div>

                <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                    <button
                        className="btn btn-outline-success btn-sm"
                        onClick={downloadExcel}
                    >
                        📊 Excel Report
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        🖨 {isGenerating ? "Generating..." : "Print / PDF"}
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Search..."
                    className="form-control form-control-sm"
                    style={{ maxWidth: "250px" }}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded shadow-sm p-2">
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    highlightOnHover
                    responsive
                    striped
                    dense
                    noDataComponent="No transactions found"
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    progressPending={isLoading}
                    persistTableHead
                />
            </div>

            {/* Footer Totals */}
            <div
                className="d-flex justify-content-between align-items-center mt-4 p-2 rounded"
                style={{ background: "#e9f4f5" }}
            >
                <span className="text-success fw-bold">Total Cash-in: ₹ {totalCashIn.toLocaleString()}</span>
                <span className="text-danger fw-bold">Total Cash-out: ₹ {totalCashOut.toLocaleString()}</span>
                <span className="text-primary fw-bold">
                    Closing Cash-in Hand: ₹ {closingBalance.toLocaleString()}
                </span>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Cashflow PDF Preview"
            />
        </div>
    );
};

export default Cashflow;
