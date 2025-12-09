import React, { useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getAllTransactions } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const fallbackRows = [
    {
        date: "2025-11-01",
        refNo: "INV001",
        partyName: "ranjith",
        category: "General",
        type: "Purchase",
        total: 17700,
        received: 0,
        balance: 17700,
    },
    {
        date: "2025-11-03",
        refNo: "INV002",
        partyName: "suresh",
        category: "General",
        type: "Sale",
        total: 12500,
        received: 12500,
        balance: 0,
    },
    {
        date: "2025-11-05",
        refNo: "INV003",
        partyName: "mani",
        category: "Expense",
        type: "Payment-Out",
        total: 3000,
        received: 0,
        balance: 3000,
    },
];

const AllTransaction = () => {
    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const form = useForm({
        defaultValues: {
            startDate: defaultFromDate,
            endDate: defaultToDate,
            transactionType: "All Transaction",
            searchText: "",
        },
    });

    const control = form.control;
    const startDate = useWatch({ control, name: "startDate" });
    const endDate = useWatch({ control, name: "endDate" });
    const transactionType = useWatch({ control, name: "transactionType" });
    const searchText = useWatch({ control, name: "searchText" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (startDate) params.FromDate = startDate;
        if (endDate) params.ToDate = endDate;
        if (transactionType && transactionType !== "All Transaction") params.TransactionType = transactionType;
        return params;
    }, [endDate, page, perPage, startDate, transactionType]);

    const queryKey = useMemo(
        () => ["report-all-transactions", transactionType, startDate, endDate, page, perPage],
        [transactionType, startDate, endDate, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getAllTransactions(requestParams),
        enabled: Boolean(startDate && endDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "All Transactions"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredData = useMemo(() => {
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        const text = (searchText ?? "").toLowerCase().trim();
        const needTypeFilter = transactionType && transactionType !== "All Transaction";

        return tableRows.filter((row) => {
            if (needTypeFilter && row.type !== transactionType) return false;
            if (from && to && row.date) {
                const rowDate = new Date(row.date);
                if (!isNaN(rowDate.getTime()) && (rowDate < from || rowDate > to)) return false;
            }
            if (!text) return true;
            const ref = `${row.refNo ?? ""}`.toLowerCase();
            const party = `${row.partyName ?? ""}`.toLowerCase();
            return ref.includes(text) || party.includes(text);
        });
    }, [endDate, searchText, startDate, tableRows, transactionType]);

    const totalAmount = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.total ?? 0), 0),
        [filteredData]
    );
    const totalReceived = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.received ?? 0), 0),
        [filteredData]
    );
    const totalBalance = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.balance ?? 0), 0),
        [filteredData]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((row) => ({
                Date: row.date || "",
                "Ref No": row.refNo || "",
                "Party Name": row.partyName || "",
                Category: row.category || "",
                Type: row.type || "",
                Total: row.total ?? 0,
                Received: row.received ?? 0,
                Balance: row.balance ?? 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, `AllTransactions_${startDate || "start"}_${endDate || "end"}.xlsx`);
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

        <h4>All Transactions Report</h4>
        <table>
          <tr>
            <td class="text-start fw-bold">Period</td>
            <td>${startDate || "N/A"} to ${endDate || "N/A"}</td>
          </tr>
          <tr>
            <td class="text-start fw-bold">Transaction Type</td>
            <td>${transactionType}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Ref No</th>
              <th>Party Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Total</th>
              <th>Received</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
                .map(
                    (r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.date ?? ""}</td>
                  <td>${r.refNo ?? ""}</td>
                  <td class="text-start">${r.partyName ?? ""}</td>
                  <td>${r.category ?? ""}</td>
                  <td>${r.type ?? ""}</td>
                  <td>${formatCurrency(r.total)}</td>
                  <td>${formatCurrency(r.received)}</td>
                  <td>${formatCurrency(r.balance)}</td>
                </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="6" class="text-start">Total</td>
              <td>${formatCurrency(totalAmount)}</td>
              <td>${formatCurrency(totalReceived)}</td>
              <td>${formatCurrency(totalBalance)}</td>
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
            alert("Failed to generate PDF");
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
            link.download = `AllTransactions_${startDate || "start"}_${endDate || "end"}.pdf`;
            link.click();
        }
    };

    const columns = [
        { name: "#", selector: (_, index) => index + 1, width: "70px" },
        { name: "Date", selector: (row) => row.date || "" },
        { name: "Ref No.", selector: (row) => row.refNo || "" },
        { name: "Party Name", selector: (row) => row.partyName || "" },
        { name: "Category", selector: (row) => row.category || "" },
        { name: "Type", selector: (row) => row.type || "" },
        {
            name: "Total (₹)",
            selector: (row) => formatCurrency(row.total),
            right: true,
        },
        {
            name: "Received (₹)",
            selector: (row) => formatCurrency(row.received),
            right: true,
        },
        {
            name: "Balance (₹)",
            selector: (row) => formatCurrency(row.balance),
            right: true,
        },
    ];

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <h6 className="fw-bold m-0">Transaction Window</h6>
                    <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} />
                        )}
                    />
                    <span className="text-muted">to</span>
                    <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} />
                        )}
                    />
                    <Controller
                        name="transactionType"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm">
                                <option>All Transaction</option>
                                <option>Sale</option>
                                <option>Purchase</option>
                                <option>Payment-In</option>
                                <option>Payment-Out</option>
                                <option>Expense</option>
                            </select>
                        )}
                    />
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                placeholder="Search ref or party"
                                className="form-control form-control-sm"
                                style={{ width: 220 }}
                            />
                        )}
                    />
                    <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={generatePDF} disabled={isGenerating}>
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
                    striped
                    dense
                    responsive
                    persistTableHead
                    noDataComponent={<div className="p-2 text-muted">No transactions found</div>}
                    progressPending={isLoading}
                />
                <div className="d-flex justify-content-between fw-bold mt-2">
                    <div>Rows: {filteredData.length}</div>
                    <div>Total: {formatCurrency(totalAmount)}</div>
                    <div>Received: {formatCurrency(totalReceived)}</div>
                    <div>Balance: {formatCurrency(totalBalance)}</div>
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="All Transactions PDF Preview"
            />
        </div>
    );
};

export default AllTransaction;
