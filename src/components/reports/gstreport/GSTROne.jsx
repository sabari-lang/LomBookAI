import React, { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getGstrOneReport } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";


const GSTROne = () => {
    const [fromMonth, setFromMonth] = useState("2025-10");
    const [toMonth, setToMonth] = useState("2025-11");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const fallbackRows = useMemo(
        () => [
            {
                id: 1,
                gstin: "27ABCDE1234F1Z5",
                partyName: "Ranjith",
                invoiceNo: "1",
                date: "2025-10-30",
                value: 22420,
                rate: 18,
                taxableValue: 19000,
                ct: 1710,
                st: 1710,
            },
        ],
        []
    );

    const requestParams = useMemo(() => {
        const params = {
            Page: page,
            PageSize: perPage,
        };
        if (fromMonth) params.FromMonth = fromMonth;
        if (toMonth) params.ToMonth = toMonth;
        return params;
    }, [fromMonth, toMonth, page, perPage]);

    const queryKey = useMemo(
        () => ["report-gstr-one", fromMonth, toMonth, page, perPage],
        [fromMonth, toMonth, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getGstrOneReport(requestParams),
        enabled: Boolean(fromMonth && toMonth),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "GSTR-1"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const totalValue = useMemo(
        () => tableRows.reduce((sum, row) => sum + Number(row.value ?? 0), 0),
        [tableRows]
    );
    const totalTaxable = useMemo(
        () => tableRows.reduce((sum, row) => sum + Number(row.taxableValue ?? 0), 0),
        [tableRows]
    );
    const totalCt = useMemo(
        () => tableRows.reduce((sum, row) => sum + Number(row.ct ?? 0), 0),
        [tableRows]
    );
    const totalSt = useMemo(
        () => tableRows.reduce((sum, row) => sum + Number(row.st ?? 0), 0),
        [tableRows]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(tableRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "GSTR1");
        XLSX.writeFile(workbook, `GSTR1_${fromMonth}_${toMonth}.xlsx`);
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
            tempDiv.style.padding = "25px";
            tempDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
            tempDiv.innerHTML = `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
          h4 { text-align:center; text-decoration:underline; margin: 0 0 12px; font-weight:700; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; }
          th { background:#f1f1f1; font-weight:600; }
          td { vertical-align:middle; text-align:center; }
          .text-start { text-align:left; }
          .fw-bold { font-weight:700; }
          .section-title { text-align:center; font-weight:700; margin-top:14px; margin-bottom:4px; font-size:12px; }
        </style>

        <h4>GSTR1 Report</h4>

        <div class="section-title">Sale</div>
        <table>
          <thead>
            <tr>
              <th>GSTIN/UIN</th>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Value</th>
              <th>Rate</th>
              <th>Taxable Value</th>
              <th>Central Tax</th>
              <th>State/UT Tax</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows
                .map(
                    (row) => `
              <tr>
                <td>${row.gstin ?? ""}</td>
                <td>${row.invoiceNo ?? ""}</td>
                <td>${row.date ?? ""}</td>
                <td>${formatCurrency(row.value)}</td>
                <td>${row.rate ?? ""}</td>
                <td>${formatCurrency(row.taxableValue)}</td>
                <td>${formatCurrency(row.ct)}</td>
                <td>${formatCurrency(row.st)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="3" class="text-start">Totals</td>
              <td>${formatCurrency(totalValue)}</td>
              <td></td>
              <td>${formatCurrency(totalTaxable)}</td>
              <td>${formatCurrency(totalCt)}</td>
              <td>${formatCurrency(totalSt)}</td>
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

    const handleAction = (action) => {
        if (!pdfUrl) return;
        if (action === "open") window.open(pdfUrl, "_blank");
        else if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "GSTR1_Report.pdf";
            link.click();
        } else if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => {
                w.focus();
                w.print();
            };
        } else if (action === "email") {
            const subject = encodeURIComponent("GSTR1 Report");
            const body = encodeURIComponent("Please find attached your GSTR1 Report.");
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    };

    const columns = [
        { name: "GSTIN/UIN", selector: (row) => row.gstin || "—" },
        { name: "Party Name", selector: (row) => row.partyName || "—" },
        { name: "Invoice No.", selector: (row) => row.invoiceNo || "—" },
        { name: "Date", selector: (row) => row.date || "—" },
        { name: "Value", selector: (row) => formatCurrency(row.value), right: true },
        { name: "Tax Rate", selector: (row) => row.rate ?? "—" },
        { name: "Taxable Value", selector: (row) => formatCurrency(row.taxableValue), right: true },
        { name: "Central Tax", selector: (row) => formatCurrency(row.ct), right: true },
        { name: "State/UT Tax", selector: (row) => formatCurrency(row.st), right: true },
    ];

    return (
        <div
            className="container-fluid bg-light pt-2 pb-4 rounded-3"
            style={{ height: "calc(100vh - 11vh)", overflow: "auto", background: "#d2dce5" }}
        >
            <div className="d-flex align-items-center mb-3 flex-wrap gap-3">
                <div>
                    <label className="form-label mb-0 fw-semibold">From Month/Year</label>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 200 }}
                        value={fromMonth}
                        onChange={(e) => setFromMonth(e.target.value)}
                    />
                </div>
                <div>
                    <label className="form-label mb-0 fw-semibold">To Month/Year</label>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 200 }}
                        value={toMonth}
                        onChange={(e) => setToMonth(e.target.value)}
                    />
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                    <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> XLS
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={generatePDF} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : (<><i className="bi bi-printer"></i> Print</>)}
                    </button>
                </div>
            </div>

            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={tableRows}
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
                    persistTableHead
                    noDataComponent={<div className="py-3 text-center text-muted">No records found</div>}
                    progressPending={isLoading}
                />
                <div className="text-end fw-bold mt-2 me-3">
                    Value: {formatCurrency(totalValue)} • Taxable: {formatCurrency(totalTaxable)} • CT: {formatCurrency(totalCt)} • ST: {formatCurrency(totalSt)}
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="GSTR1 Report Preview"
            />
        </div>
    );
};

export default GSTROne;
