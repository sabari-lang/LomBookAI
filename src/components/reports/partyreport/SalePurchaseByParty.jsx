import React, { useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { Controller, useForm, useWatch } from "react-hook-form";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getPartySalePurchase } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const SalePurchaseByParty = () => {
    // Report filter form - always unlock on mount
    
    
    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const { control } = useForm({
        defaultValues: {
            period: "This Month",
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            firm: "All Firms",
            searchText: "",
        },
    });

    const period = useWatch({ control, name: "period" });
    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const firm = useWatch({ control, name: "firm" });
    const rawSearchText = useWatch({ control, name: "searchText" });
    const searchText = useDebouncedValue(rawSearchText, 250); // Debounce search to prevent excessive API calls

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (period) params.Period = period;
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (firm && firm !== "All Firms") params.Firm = firm;
        if (searchText) params.Search = searchText;
        return params;
    }, [period, fromDate, toDate, firm, searchText, page, perPage]);

    const queryKey = useMemo(
        () => ["report-party-sale-purchase", period, fromDate, toDate, firm, searchText, page, perPage],
        [period, fromDate, toDate, firm, searchText, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getPartySalePurchase(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Sale Purchase by Party"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredRows = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => (row.partyName ?? "").toString().toLowerCase().includes(text));
    }, [searchText, tableRows]);

    const totalSaleAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.saleAmount ?? row.saleValue ?? 0), 0),
        [filteredRows]
    );
    const totalPurchaseAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.purchaseAmount ?? row.purchaseValue ?? 0), 0),
        [filteredRows]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredRows.map((row) => ({
                "Party Name": row.partyName ?? "",
                "Sale Amount": row.saleAmount ?? row.saleValue ?? 0,
                "Purchase Amount": row.purchaseAmount ?? row.purchaseValue ?? 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Purchase by Party");
        XLSX.writeFile(workbook, `SalePurchaseByParty_${fromDate || "start"}_${toDate || "end"}.xlsx`);
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
            tempDiv.style.padding = "22px";
            tempDiv.innerHTML = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; }
          h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Sale & Purchase by Party</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Party</th><th>Sale Amount</th><th>Purchase Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
                .map(
                    (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.partyName ?? ""}</td>
                <td>${formatCurrency(row.saleAmount ?? row.saleValue ?? 0)}</td>
                <td>${formatCurrency(row.purchaseAmount ?? row.purchaseValue ?? 0)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="2" class="text-start">Totals</td>
              <td>${formatCurrency(totalSaleAmount)}</td>
              <td>${formatCurrency(totalPurchaseAmount)}</td>
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
            notifyError("Failed to generate PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `SalePurchaseByParty_${fromDate}_${toDate}.pdf`;
            link.click();
        }
        if (action === "email") notifyInfo("Email feature coming soon");
    };

    const columns = [
        { name: "#", selector: (_, index) => index + 1, width: "60px" },
        { name: "PARTY", selector: (row) => row.partyName ?? "—", grow: 2, sortable: true },
        {
            name: "SALE AMOUNT",
            selector: (row) => formatCurrency(row.saleAmount ?? row.saleValue ?? 0),
            right: true,
            sortable: true,
        },
        {
            name: "PURCHASE AMOUNT",
            selector: (row) => formatCurrency(row.purchaseAmount ?? row.purchaseValue ?? 0),
            right: true,
            sortable: true,
        },
    ];

    return (
        <div className="container-fluid bg-light py-4 overflow-auto rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm fw-bold" style={{ width: "150px" }}>
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>This Week</option>
                                <option>Custom</option>
                            </select>
                        )}
                    />
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
                                <option>ABC Traders</option>
                                <option>XYZ Enterprises</option>
                            </select>
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="text"
                                {...field}
                                placeholder="Search Party Name..."
                                className="form-control form-control-sm"
                                style={{ maxWidth: "250px" }}
                            />
                        )}
                    />
                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={downloadExcel}
                    >
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

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "50vh" }}>
                <DataTable
                    columns={columns}
                    data={filteredRows}
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
                    noDataComponent={<div className="py-3 text-center text-muted">No data to show</div>}
                    persistTableHead
                    progressPending={isLoading}
                />
                <div className="d-flex flex-column flex-md-row justify-content-between mt-2 fw-bold text-center text-md-start gap-2">
                    <span className="text-success">Total Sale Amount: {formatCurrency(totalSaleAmount)}</span>
                    <span className="text-danger">Total Purchase Amount: {formatCurrency(totalPurchaseAmount)}</span>
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sale & Purchase by Party"
            />
        </div>
    );
};

export default SalePurchaseByParty;
