import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getBankStatement } from "../reportAPI";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";


const BankStatement = () => {
    // Report filter form - always unlock on mount
    
    const { control } = useForm({
        defaultValues: {
            fromDate: "2025-11-01",
            toDate: "2025-11-26",
            bankName: "NONE",
        },
    });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const queryKey = useMemo(
        () => ["report-bank-statement", page, perPage],
        [page, perPage]
    );

    const {
        data: fetchedStatement,
        isLoading,
    } = useQuery({
        queryKey,
        queryFn: () =>
            getBankStatement({
                Page: page,
                PageSize: perPage,
            }),
        enabled: Boolean(page && perPage),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Bank Statement"),
    });
    const fallbackRows = useMemo(
        () => [
            {
                id: 1,
                date: "2025-11-05",
                description: "ATM Withdrawal",
                withdrawalAmount: 5000,
                depositAmount: 0,
                balanceAmount: 45000,
            },
            {
                id: 2,
                date: "2025-11-10",
                description: "Salary Credited",
                withdrawalAmount: 0,
                depositAmount: 55000,
                balanceAmount: 100000,
            },
            {
                id: 3,
                date: "2025-11-20",
                description: "Online Purchase",
                withdrawalAmount: 2200,
                depositAmount: 0,
                balanceAmount: 97780,
            },
        ],
        []
    );

    const apiRows = extractItems(fetchedStatement);
    const pagination = extractPagination(fetchedStatement);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalBalance = tableRows.reduce(
        (sum, row) => sum + (row.balanceAmount ?? 0),
        0
    );
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // ===== Excel Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(tableRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "BankStatement");
        XLSX.writeFile(
            workbook,
            `BankStatement_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
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
        </style>

        <h4>Bank Statement Report</h4>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Withdrawal Amount</th>
                            <th>Deposit Amount</th>
                            <th>Balance Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows
                                        .map(
                                                (r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${r.date}</td>
                                <td>${r.description}</td>
                                <td>${r.withdrawalAmount ? r.withdrawalAmount.toLocaleString() : "---"}</td>
                                <td>${r.depositAmount ? r.depositAmount.toLocaleString() : "---"}</td>
                                <td>${r.balanceAmount.toLocaleString()}</td>
                            </tr>
                        `
                                        )
                                        .join("")}
                        <tr>
                            <td colspan="5"><strong>Total Balance</strong></td>
                            <td><strong>${totalBalance.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
      `;

            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;

            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const img = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;

            pdf.addImage(img, "PNG", 0, 0, width, height);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (error) {
            console.error(error);
        } finally {
            if (tempContainer.current)
                document.body.removeChild(tempContainer.current);
            setIsGenerating(false);
        }
    };

    const handlePdfAction = (action) => {
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "BankStatement.pdf";
            link.click();
        }
    };

    // ===== Table Columns =====
    const columns = [
        { name: "#", selector: (row) => row.id, width: "60px" },
        { name: "Date", selector: (row) => row.date, sortable: true },
        { name: "Description", selector: (row) => row.description, sortable: true },
        {
            name: "Withdrawal Amount",
            selector: (row) =>
                row.withdrawalAmount
                    ? `₹ ${row.withdrawalAmount.toLocaleString()}`
                    : "---",
        },
        {
            name: "Deposit Amount",
            selector: (row) =>
                row.depositAmount
                    ? `₹ ${row.depositAmount.toLocaleString()}`
                    : "---",
        },
        {
            name: "Balance Amount",
            selector: (row) => `₹ ${row.balanceAmount.toLocaleString()}`,
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
            {/* Filters Section */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    {/* Bank Name Dropdown (UI-only) */}
                    <Controller
                        name="bankName"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className="form-select form-select-sm fw-bold"
                                style={{ width: "150px" }}
                            >
                                <option value="NONE">NONE</option>
                                <option value="SBI">SBI</option>
                                <option value="HDFC">HDFC</option>
                                <option value="ICICI">ICICI</option>
                            </select>
                        )}
                    />

                    {/* From Date */}
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                {...field}
                                className="form-control form-control-sm"
                                style={{ width: "150px" }}
                            />
                        )}
                    />

                    <span>To</span>

                    {/* To Date */}
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                {...field}
                                className="form-control form-control-sm"
                                style={{ width: "150px" }}
                            />
                        )}
                    />
                </div>

                <div className="text-muted small fw-semibold">
                    Records: {totalRows}
                </div>

                {/* Excel + Print */}
                <div className="d-flex align-items-center gap-2">
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
                        <i className="bi bi-printer"></i>
                        {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={tableRows}
                    highlightOnHover
                    striped
                    dense
                    customStyles={customStyles}
                    progressPending={isLoading}
                    noDataComponent="No transactions available"
                    persistTableHead
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                />
            </div>

            {/* Balance Footer */}
            <div className="mt-3 fw-bold text-end pe-3">
                Balance: ₹ {totalBalance.toLocaleString()}
            </div>

            {/* PDF Preview */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Bank Statement PDF Preview"
            />
        </div>
    );
};

export default BankStatement;
