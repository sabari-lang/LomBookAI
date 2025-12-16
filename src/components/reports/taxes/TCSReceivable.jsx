import React, { useRef, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { useQuery } from "@tanstack/react-query";
import { getTcsReceivable } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import "bootstrap/dist/css/bootstrap.min.css";

const TCSReceivable = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-30");
    const [firm, setFirm] = useState("ALL FIRMS");
    const [search, setSearch] = useState("");


    // Pagination state
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    // Data fetching
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery([
        "tcsReceivable",
        { fromDate, toDate, firm, page, perPage }
    ],
        () => getTcsReceivable({ fromDate, toDate, firm, page, perPage }),
        {
            keepPreviousData: true,
            onError: (err) => handleProvisionalError(err, "Fetch TCS Receivable", "Failed to fetch TCS Receivable report."),
        }
    );

    const rows = extractItems(data);
    const pagination = extractPagination(data);

    // Search filter
    const filtered = rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { name: "#", selector: (_r, i) => i + 1, width: "70px" },
        { name: "PARTY NAME", selector: (r) => r.partyName, sortable: true },
        { name: "BILL NO", selector: (r) => r.billNo, sortable: true },
        {
            name: "TOTAL VALUE",
            selector: (r) => `₹ ${Number(r.totalValue || 0).toLocaleString()}`,
            right: true,
        },
        {
            name: "AMOUNT PAID",
            selector: (r) => `₹ ${Number(r.amountPaid || 0).toLocaleString()}`,
            right: true,
        },
        {
            name: "TOTAL TAX PAID",
            selector: (r) => `₹ ${Number(r.taxPaid || 0).toLocaleString()}`,
            right: true,
        },
        { name: "DATE OF C.", selector: (r) => r.dateOfCollection || "" },
        { name: "TAX NAME", selector: (r) => r.taxName || "" },
        { name: "TCS RATE", selector: (r) => r.tcsRate || "" },
    ];

    const totalPurchaseWithTCS = filtered.reduce((a, b) => a + (b.totalValue || 0), 0);
    const totalTCS = filtered.reduce((a, b) => a + (b.taxPaid || 0), 0);

    // -------- Excel ----------
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            filtered.length ? filtered : [{ Note: "No data available" }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TCS Receivable");
        XLSX.writeFile(wb, "TCS_Receivable.xlsx");
    };

    // -------- PDF Preview Modal (same style as GSTReport.jsx) ----------
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

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
          h3 { text-align:center; text-decoration:underline; margin-bottom:8px; }
          .meta { margin-bottom:8px; font-size:12px; }
          .flex { display:flex; justify-content:space-between; font-weight:bold; margin-top:8px;}
        </style>

        <h3>TCS RECEIVABLE</h3>
        <div class="meta">
          Period: ${fromDate} to ${toDate} &nbsp;&nbsp;|&nbsp;&nbsp; Firm: ${firm}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Party Name</th>
              <th>Bill No</th>
              <th>Total Value</th>
              <th>Amount Paid</th>
              <th>Total Tax Paid</th>
              <th>Date of C.</th>
              <th>Tax Name</th>
              <th>TCS Rate</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length
                    ? filtered
                        .map(
                            (r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.partyName || ""}</td>
                  <td>${r.billNo || ""}</td>
                  <td>₹ ${(r.totalValue || 0).toLocaleString()}</td>
                  <td>₹ ${(r.amountPaid || 0).toLocaleString()}</td>
                  <td>₹ ${(r.taxPaid || 0).toLocaleString()}</td>
                  <td>${r.dateOfCollection || ""}</td>
                  <td>${r.taxName || ""}</td>
                  <td>${r.tcsRate || ""}</td>
                </tr>`
                        )
                        .join("")
                    : `<tr><td colspan="9" style="text-align:center; padding:20px;">No data available</td></tr>`
                }
          </tbody>
        </table>

        <div class="flex">
          <div>Total Purchase With TCS: ₹ ${totalPurchaseWithTCS.toLocaleString()}</div>
          <div>Total TCS: ₹ ${totalTCS.toLocaleString()}</div>
        </div>
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

    const handleAction = (action) => {
        if (!pdfUrl) return;
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "TCS_Receivable.pdf";
            a.click();
        }
        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
        if (action === "email") {
            const subject = encodeURIComponent("TCS Receivable");
            const body = encodeURIComponent("Please find attached TCS Receivable report.");
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    };

    const NoDataCmp = (
        <div className="text-center py-5">
            <h6 className="mt-2 fw-bold text-muted">No data is available for TCS Receivable.</h6>
            <small className="text-muted">Please try again after making relevant changes.</small>
        </div>
    );

    return (
        <div
            className="container-fluid bg-light pb-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* Top bar */}
            <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded shadow-sm mb-2">
                <h5 className="fw-bold mb-0">TCS Receivable</h5>
                <div className="d-flex align-items-center gap-3">
                    <span className="fw-semibold text-muted">From</span>
                    <input type="date" className="form-control" style={{ width: 160 }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <span className="fw-semibold text-muted">To</span>
                    <input type="date" className="form-control" style={{ width: 160 }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    <select className="form-select" style={{ width: 150 }} value={firm} onChange={(e) => setFirm(e.target.value)}>
                        <option>ALL FIRMS</option>
                        <option>Firm A</option>
                        <option>Firm B</option>
                    </select>
                    <div className="text-center" role="button" onClick={downloadExcel} title="Excel Report">
                        <i className="bi bi-file-earmark-excel fs-4"></i>
                        <div className="small text-muted">Excel Report</div>
                    </div>
                    <div className="text-center" role="button" onClick={generatePDF} title="Print">
                        <i className="bi bi-printer fs-4"></i>
                        <div className="small text-muted">{isGenerating ? "Generating…" : "Print"}</div>
                    </div>
                </div>
            </div>
            {/* Search */}
            <input className="form-control mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            {/* Table */}
            <div className="bg-white p-2 rounded border shadow-sm" style={{ minHeight: "55vh" }}>
                <DataTable
                    columns={columns}
                    data={filtered}
                    highlightOnHover
                    pagination
                    paginationServer
                    paginationTotalRows={pagination.totalCount}
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    paginationDefaultPage={page}
                    onChangePage={setPage}
                    onChangeRowsPerPage={setPerPage}
                    persistTableHead
                    progressPending={isLoading}
                    noDataComponent={NoDataCmp}
                />
            </div>
            {/* Footer totals */}
            <div className="d-flex justify-content-between px-2 mt-2 fw-bold">
                <span className="text-success">Total Purchase With TCS: ₹ {totalPurchaseWithTCS.toLocaleString()}</span>
                <span className="text-danger">Total TCS: ₹ {totalTCS.toLocaleString()}</span>
            </div>
            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="TCS Receivable Preview"
            />
        </div>
    );
};

export default TCSReceivable;
