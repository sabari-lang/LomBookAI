import React, { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getBillWiseProfit } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const BillwiseProfit = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-04");
    const [partyFilter, setPartyFilter] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = {
            Page: page,
            PageSize: perPage,
        };
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (partyFilter) params.PartyName = partyFilter;
        return params;
    }, [fromDate, toDate, partyFilter, page, perPage]);

    const queryKey = useMemo(
        () => ["report-billwise-profit", fromDate, toDate, partyFilter, page, perPage],
        [fromDate, toDate, partyFilter, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getBillWiseProfit(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Billwise Profit"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    const filteredData = useMemo(() => {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        return tableRows.filter((row) => {
            const partyName = (row.party ?? row.partyName ?? "").toString();
            if (partyFilter && !partyName.toLowerCase().includes(partyFilter.toLowerCase())) {
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
    }, [fromDate, partyFilter, tableRows, toDate]);

    const totalSaleAmount = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0),
        [filteredData]
    );
    const totalProfit = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.profit ?? 0), 0),
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
                XLSX.utils.book_append_sheet(workbook, worksheet, "Billwise Profit");
                XLSX.writeFile(workbook, `BillwiseProfit_${fromDate}_${toDate}.xlsx`);
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

                <h4>Billwise Profit Report</h4>
                <table>
                    <tr>
                        <td class="text-start fw-bold">Period</td>
                        <td>${fromDate} to ${toDate}</td>
                    </tr>
                    <tr>
                        <td class="text-start fw-bold">Filtered By</td>
                        <td>${partyFilter || "All Parties"}</td>
                    </tr>
                </table>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice No</th>
                            <th>Party</th>
                            <th>Total Sale Amount</th>
                            <th>Profit (+) / Loss (-)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData
                                .map(
                                        (r) => `
                            <tr>
                                <td>${r.date ?? ""}</td>
                                <td>${r.invoiceNo ?? ""}</td>
                                <td class="text-start">${r.party ?? r.partyName ?? ""}</td>
                                <td>${formatCurrency(r.totalAmount)}</td>
                                <td style="color:${Number(r.profit ?? 0) >= 0 ? "green" : "red"}">${formatCurrency(
                                                r.profit
                                        )}</td>
                            </tr>`
                                )
                                .join("")}
                        <tr class="fw-bold">
                            <td colspan="3" class="text-start">Total</td>
                            <td>${formatCurrency(totalSaleAmount)}</td>
                            <td style="color:${totalProfit >= 0 ? "green" : "red"}">${formatCurrency(totalProfit)}</td>
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
                        link.download = `BillwiseProfit_${fromDate}_${toDate}.pdf`;
                        link.click();
                }
        };

        const columns = [
                { name: "DATE", selector: (row) => row.date || "", sortable: true },
                { name: "INVOICE NO", selector: (row) => row.invoiceNo || "", sortable: true },
                { name: "PARTY", selector: (row) => row.party ?? row.partyName ?? "", sortable: true },
                {
                        name: "TOTAL SALE AMOUNT",
                        selector: (row) => formatCurrency(row.totalAmount),
                        sortable: true,
                        right: true,
                },
                {
                        name: "PROFIT (+) / LOSS (-)",
                        selector: (row) => (
                                <span style={{ color: Number(row.profit ?? 0) >= 0 ? "green" : "red" }}>
                                        {formatCurrency(row.profit)}
                                </span>
                        ),
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
                        placeholder="Party filter"
                        className="form-control d-inline-block"
                        style={{ width: 180 }}
                        value={partyFilter}
                        onChange={(e) => setPartyFilter(e.target.value)}
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
                    noDataComponent={<div className="py-3 text-center text-muted">No transaction exists</div>}
                    dense
                    progressPending={isLoading}
                />
            </div>

            <div className="mt-3">
                <strong>Summary</strong>
                <p className="mb-0">Total Sale Amount: {formatCurrency(totalSaleAmount)}</p>
                <p>
                    Total Profit(+)/Loss(-):{" "}
                    <span style={{ color: totalProfit >= 0 ? "green" : "red" }}>
                        {formatCurrency(totalProfit)}
                    </span>
                </p>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Billwise Profit PDF Preview"
            />
        </div>
    );
};

export default BillwiseProfit;
