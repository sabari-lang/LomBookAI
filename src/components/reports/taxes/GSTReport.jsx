import React, { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getGstSummary } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";


const GSTReport = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-05");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // Fallback/mock data
    const fallbackRows = useMemo(() => [
        { id: 1, party: "ranjith", saleTax: 0, purchaseTax: 2700 },
    ], []);

    const requestParams = useMemo(() => {
        const params = {
            Page: page,
            PageSize: perPage,
        };
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        return params;
    }, [fromDate, toDate, page, perPage]);

    const queryKey = useMemo(() => ["report-gst-summary", fromDate, toDate, page, perPage], [fromDate, toDate, page, perPage]);

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getGstSummary(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "GST Report"),
    });

    const items = extractItems(fetched) || fallbackRows;
    const pagination = extractPagination(fetched);

    // Totals
    const totalSaleTax = items.reduce((a, b) => a + (b.saleTax || 0), 0);
    const totalPurchaseTax = items.reduce((a, b) => a + (b.purchaseTax || 0), 0);

    // Table columns
    const columns = [
        { name: "Party Name", selector: (row) => row.party, grow: 2 },
        {
            name: "Sale Tax",
            selector: (row) => `₹ ${Number(row.saleTax || 0).toLocaleString()}.00`,
            right: true,
        },
        {
            name: "Purchase /Expense Tax",
            selector: (row) => `₹ ${Number(row.purchaseTax || 0).toLocaleString()}.00`,
            right: true,
        },
    ];

    const noDataComponent = (
        <div className="py-3 text-muted">No data available</div>
    );

    // Export Excel
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(items);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "GST Report");
        XLSX.writeFile(wb, "GST_Report.xlsx");
    };

    // Generate PDF
    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-99999px";
            tempDiv.style.left = "-99999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "20px";
            tempDiv.innerHTML = `
                <style>
                    table { width:100%; border-collapse:collapse; }
                    th, td { border:1px solid #000; padding:6px; font-size:12px; }
                    th { background:#eee; font-weight:bold; }
                </style>
                <h3 style="text-align:center; text-decoration:underline; margin-bottom:10px;">GST TAX REPORT</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Party Name</th>
                            <th>Sale Tax</th>
                            <th>Purchase / Expense Tax</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items
                            .map(
                                (r) => `
                                    <tr>
                                        <td>${r.party}</td>
                                        <td>₹ ${Number(r.saleTax || 0).toLocaleString()}.00</td>
                                        <td>₹ ${Number(r.purchaseTax || 0).toLocaleString()}.00</td>
                                    </tr>`
                            )
                            .join("")}
                        <tr style="font-weight:bold;">
                            <td>Total</td>
                            <td>₹ ${totalSaleTax.toLocaleString()}.00</td>
                            <td>₹ ${totalPurchaseTax.toLocaleString()}.00</td>
                        </tr>
                    </tbody>
                </table>
            `;
            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;
            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, width, height);
            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    // PDF ACTIONS
    const handleAction = (action) => {
        if (!pdfUrl) return;
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "GST_Report.pdf";
            a.click();
        }
    };
    return (
        <>
            <div className="container-fluid bg-light py-4 overflow-auto rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
                {/* Date Filters + Icons */}
                <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded shadow-sm mb-3">
                    <div className="d-flex gap-4">
                        <div>
                            <small className="fw-semibold text-muted">From</small>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                style={{ width: 160 }}
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <small className="fw-semibold text-muted">To</small>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                style={{ width: 160 }}
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="d-flex gap-3">
                        <button
                            className="btn btn-outline-success rounded-circle"
                            style={{ width: 42, height: 42 }}
                            onClick={downloadExcel}
                        >
                            <i className="bi bi-file-earmark-excel"></i>
                        </button>
                        <button
                            className="btn btn-outline-primary rounded-circle"
                            style={{ width: 42, height: 42 }}
                            onClick={generatePDF}
                            disabled={isGenerating}
                        >
                            <i className="bi bi-printer"></i>
                        </button>
                    </div>
                </div>
                {/* GST TITLE */}
                <h6 className="fw-bold mb-2">GST TAX REPORT</h6>
                {/* Data Table */}
                <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "55vh" }}>
                    <DataTable
                        columns={columns}
                        data={items}
                        persistTableHead
                        highlightOnHover
                        striped
                        dense
                        progressPending={isLoading}
                        pagination
                        paginationServer
                        paginationTotalRows={pagination.totalCount}
                        paginationPerPage={perPage}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        paginationDefaultPage={page}
                        onChangePage={setPage}
                        onChangeRowsPerPage={setPerPage}
                        noDataComponent={noDataComponent}
                    />
                    {/* Total Section */}
                    <div className="d-flex justify-content-between px-2 mt-3 fw-bold">
                        <div className="text-success">Total Tax In: ₹ {totalSaleTax}.00</div>
                        <div className="text-danger">Total Tax Out: ₹ {totalPurchaseTax}.00</div>
                    </div>
                </div>
            </div>
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="GST Tax Report Preview"
            />
        </>
    );
};

export default GSTReport;
