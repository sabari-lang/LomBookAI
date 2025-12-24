import React, { useState, useRef, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getPartyProfitLoss } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";


const PartyWisePL = () => {
    // Report filter form - always unlock on mount
    

    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const { control } = useForm({
        defaultValues: {
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            party: "All Parties",
            searchText: "",
        },
    });

    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const party = useWatch({ control, name: "party" });
    const searchText = useWatch({ control, name: "searchText" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (party && party !== "All Parties") params.PartyName = party;
        return params;
    }, [fromDate, toDate, party, page, perPage]);

    const queryKey = useMemo(
        () => ["report-party-profit-loss", fromDate, toDate, party, page, perPage],
        [fromDate, toDate, party, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getPartyProfitLoss(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Party Wise Profit Loss"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredData = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) =>
            (row.partyName ?? "").toLowerCase().includes(text)
        );
    }, [searchText, tableRows]);

    const totalSale = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.totalSale ?? row.saleAmount ?? 0), 0),
        [filteredData]
    );
    const totalProfit = useMemo(
        () => filteredData.reduce((sum, row) => sum + Number(row.profit ?? row.profitLoss ?? 0), 0),
        [filteredData]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    // 📊 Excel Report Download
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PartyWise Profit-Loss");
        XLSX.writeFile(workbook, `PartyWisePL_${fromDate}_${toDate}.xlsx`);
    };

    // 🧾 PDF Generate Logic
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
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
          .text-start { text-align:left; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Party Wise Profit & Loss Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Party Name</th><th>Phone</th><th>Total Sale (₹)</th><th>Profit / Loss (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
                .map(
                    (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="text-start">${r.partyName ?? ""}</td>
                <td>${r.phone ?? ""}</td>
                <td>${formatCurrency(r.totalSale ?? r.saleAmount)}</td>
                <td style="color:${Number(r.profit ?? r.profitLoss ?? 0) >= 0 ? "green" : "red"}">${formatCurrency(r.profit ?? r.profitLoss)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="3" class="text-start">Total</td>
              <td>${formatCurrency(totalSale)}</td>
              <td style="color:${totalProfit >= 0 ? "green" : "red"}">${formatCurrency(totalProfit)}</td>
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
            link.download = `PartyWisePL_${fromDate}_${toDate}.pdf`;
            link.click();
        }
    };

    // Columns
    const columns = [
        { name: "#", selector: (_, index) => index + 1, width: "70px" },
        { name: "PARTY NAME", selector: (row) => row.partyName ?? "", sortable: true },
        { name: "PHONE NO.", selector: (row) => row.phone ?? "", sortable: true },
        {
            name: "TOTAL SALE AMOUNT",
            selector: (row) => formatCurrency(row.totalSale ?? row.saleAmount),
            sortable: true,
            right: true,
        },
        {
            name: "PROFIT (+) / LOSS (-)",
            cell: (row) => (
                <span style={{ color: Number(row.profit ?? row.profitLoss ?? 0) >= 0 ? "green" : "red" }}>
                    {formatCurrency(row.profit ?? row.profitLoss)}
                </span>
            ),
            sortable: true,
            right: true,
        },
        {
            name: "ACTIONS",
            cell: () => <button className="btn btn-sm btn-outline-primary">View</button>,
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: "100px",
        },
    ];

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* Header & Filters */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="mb-0 fw-bold">This Month</h5>
                    <div className="d-flex align-items-center border rounded px-2 py-1 bg-light">
                        <span className="me-2 text-secondary fw-semibold">Between</span>
                        <Controller
                            name="fromDate"
                            control={control}
                            render={({ field }) => (
                                <input type="date" {...field} className="form-control form-control-sm" />
                            )}
                        />
                        <span className="mx-2">To</span>
                        <Controller
                            name="toDate"
                            control={control}
                            render={({ field }) => (
                                <input type="date" {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Controller
                        name="party"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: "150px" }}>
                                <option>All Parties</option>
                            </select>
                        )}
                    />

                    <button className="btn btn-outline-secondary btn-sm" onClick={exportToExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </button>

                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-2">
                <Controller
                    name="searchText"
                    control={control}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by Party Name..."
                            style={{ maxWidth: "250px" }}
                        />
                    )}
                />
            </div>

            {/* Data Table */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredData}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[15, 25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    highlightOnHover
                    responsive
                    progressPending={isLoading}
                    noDataComponent={
                        <div className="text-center p-4 text-muted">
                            <p className="mb-0">No data is available for Party Wise Profit & Loss.</p>
                            <small>Please try again after making relevant changes.</small>
                        </div>
                    }
                    persistTableHead
                />
            </div>

            {/* Footer Totals */}
            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap mb-2">
                <p className="mb-0 fw-semibold">
                    Total Sale Amount: {formatCurrency(totalSale)}
                </p>
                <p className="mb-0 fw-semibold">
                    Total Profit(+) / Loss(-):{" "}
                    <span style={{ color: totalProfit >= 0 ? "green" : "red" }}>
                        {formatCurrency(totalProfit)}
                    </span>
                </p>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Party Wise Profit & Loss PDF Preview"
            />
        </div>
    );
};

export default PartyWisePL;
