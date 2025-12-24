import React, { useState, useRef, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import { getPartySalePurchaseByGroup } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const SalePurchaseByPartyGroup = () => {
    // Report filter form - always unlock on mount
    

    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const { control } = useForm({
        defaultValues: {
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            firm: "All Firms",
            category: "All Categories",
            item: "All Items",
            searchText: "",
        },
    });

    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const firm = useWatch({ control, name: "firm" });
    const category = useWatch({ control, name: "category" });
    const item = useWatch({ control, name: "item" });
    const searchText = useWatch({ control, name: "searchText" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (firm && firm !== "All Firms") params.Firm = firm;
        if (category && category !== "All Categories") params.Category = category;
        if (item && item !== "All Items") params.Item = item;
        return params;
    }, [fromDate, toDate, firm, category, item, page, perPage]);

    const queryKey = useMemo(
        () => ["report-sale-purchase-by-group", fromDate, toDate, firm, category, item, page, perPage],
        [fromDate, toDate, firm, category, item, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getPartySalePurchaseByGroup(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Sale Purchase by Party Group"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredData = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => (row.groupName ?? "").toLowerCase().includes(text));
    }, [searchText, tableRows]);

    const totalSale = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.saleAmount ?? row.saleValue ?? 0), 0),
        [filteredData]
    );
    const totalPurchase = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.purchaseAmount ?? row.purchaseValue ?? 0), 0),
        [filteredData]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // ===== Excel Report Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SalePurchaseByPartyGroup");
        XLSX.writeFile(workbook, `SalePurchaseByPartyGroup_${fromDate}_${toDate}.xlsx`);
    };

    // ===== PDF Generate Logic =====
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
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Sale & Purchase by Party Group Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Group Name</th><th>Sale Amount (₹)</th><th>Purchase Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
                .map(
                    (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.groupName ?? ""}</td>
                <td>${formatCurrency(r.saleAmount ?? r.saleValue)}</td>
                <td>${formatCurrency(r.purchaseAmount ?? r.purchaseValue)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="2" class="text-start">Total</td>
              <td>${formatCurrency(totalSale)}</td>
              <td>${formatCurrency(totalPurchase)}</td>
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
            console.error("PDF generation failed", err);
        } finally {
            if (tempContainer.current) document.body.removeChild(tempContainer.current);
            setIsGenerating(false);
        }
    };

    const handlePdfAction = (action) => {
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `SalePurchaseByPartyGroup_${fromDate}_${toDate}.pdf`;
            link.click();
        }
    };

    const columns = [
        { name: "GROUP NAME", selector: (row) => row.groupName ?? "", sortable: true },
        { name: "SALE AMOUNT", selector: (row) => formatCurrency(row.saleAmount ?? row.saleValue), sortable: true },
        {
            name: "PURCHASE AMOUNT",
            selector: (row) => formatCurrency(row.purchaseAmount ?? row.purchaseValue),
            sortable: true,
            conditionalCellStyles: [{ when: (row) => (row.purchaseAmount ?? row.purchaseValue ?? 0) > 0, style: { color: "red" } }],
        },
    ];

    const customStyles = {
        headCells: {
            style: { backgroundColor: "#f8f9fa", fontWeight: "600" },
        },
        rows: { style: { minHeight: "45px" } },
    };

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* ===== Header Section ===== */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                {/* Left side filters */}
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <h5 className="fw-bold mb-0">This Month</h5>
                    <button className="btn btn-secondary btn-sm fw-semibold">Between</button>

                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" style={{ width: "150px" }} />
                        )}
                    />
                    <span>To</span>
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" style={{ width: "150px" }} />
                        )}
                    />
                    <Controller
                        name="firm"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: "150px" }}>
                                <option>All Firms</option>
                            </select>
                        )}
                    />
                </div>

                {/* Right side buttons */}
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-light border btn-sm d-flex align-items-center gap-1" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </button>
                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            {/* ===== Sub-Filters ===== */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "200px" }}>
                            <option>All Categories</option>
                        </select>
                    )}
                />

                <Controller
                    name="item"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "200px" }}>
                            <option>All Items</option>
                        </select>
                    )}
                />

                <Controller
                    name="searchText"
                    control={control}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="text"
                            placeholder="Search..."
                            className="form-control form-control-sm"
                            style={{ maxWidth: "250px", flex: "1" }}
                        />
                    )}
                />
            </div>

            {/* ===== Table Section ===== */}
            <h6 className="fw-semibold mb-2">SALE PURCHASE BY PARTY GROUP</h6>
            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "50vh" }}>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    highlightOnHover
                    striped
                    dense
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    customStyles={customStyles}
                    progressPending={isLoading}
                    noDataComponent={<div className="py-3 text-center text-muted">No records found</div>}
                    persistTableHead
                />
            </div>

            {/* ===== Totals Footer ===== */}
            <div className="d-flex flex-column flex-md-row justify-content-between mt-2 fw-bold text-center text-md-start gap-2">
                <span className="text-success">Total Sale Amount: {formatCurrency(totalSale)}</span>
                <span className="text-danger">Total Purchase Amount: {formatCurrency(totalPurchase)}</span>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sale Purchase by Party Group PDF Preview"
            />
        </div>
    );
};

export default SalePurchaseByPartyGroup;
