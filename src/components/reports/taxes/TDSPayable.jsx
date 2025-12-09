import React, { useRef, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { useQuery } from "@tanstack/react-query";
import { getTdsPayable } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const TDSPayable = () => {
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
        "tdsPayable",
        { fromDate, toDate, firm, page, perPage }
    ],
        () => getTdsPayable({ fromDate, toDate, firm, page, perPage }),
        {
            keepPreviousData: true,
            onError: (err) => handleProvisionalError(err, "Fetch TDS Payable", "Failed to fetch TDS Payable report."),
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
        { name: "PARTY NAME", selector: (r) => r.partyName },
        { name: "TRANSACTION TYPE", selector: (r) => r.txnType },
        { name: "BILL NO", selector: (r) => r.billNo },
        {
            name: "TOTAL AMOUNT",
            selector: (r) => `₹ ${Number(r.totalAmount || 0).toLocaleString()}`,
            right: true,
        },
        {
            name: "TAXABLE AMOUNT",
            selector: (r) => `₹ ${Number(r.taxableAmount || 0).toLocaleString()}`,
            right: true,
        },
        {
            name: "TDS PAYABLE",
            selector: (r) => `₹ ${Number(r.tdsPayable || 0).toLocaleString()}`,
            right: true,
        },
        { name: "DATE OF C.", selector: (r) => r.date },
        { name: "TAX NAME", selector: (r) => r.taxName },
        { name: "TAX SECTION", selector: (r) => r.taxSection },
        { name: "TDS RATE", selector: (r) => r.tdsRate },
    ];

    const totalPurchaseWithTDS = filtered.reduce((a, b) => a + (b.totalAmount || 0), 0);
    const totalTDS = filtered.reduce((a, b) => a + (b.tdsPayable || 0), 0);

    // Excel
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            filtered.length ? filtered : [{ Note: "No data available" }]
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TDS Payable");
        XLSX.writeFile(wb, "TDS_Payable.xlsx");
    };

    // PDF Preview (same style)
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

        <h3>TDS PAYABLE</h3>
        <div class="meta">
          Period: ${fromDate} to ${toDate} &nbsp;&nbsp;|&nbsp;&nbsp; Firm: ${firm}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Party Name</th>
              <th>Transaction Type</th>
              <th>Bill No</th>
              <th>Total Amount</th>
              <th>Taxable Amount</th>
              <th>TDS Payable</th>
              <th>Date of C.</th>
              <th>Tax Name</th>
              <th>Tax Section</th>
              <th>TDS Rate</th>
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
                <td>${r.txnType || ""}</td>
                <td>${r.billNo || ""}</td>
                <td>₹ ${(r.totalAmount || 0).toLocaleString()}</td>
                <td>₹ ${(r.taxableAmount || 0).toLocaleString()}</td>
                <td>₹ ${(r.tdsPayable || 0).toLocaleString()}</td>
                <td>${r.date || ""}</td>
                <td>${r.taxName || ""}</td>
                <td>${r.taxSection || ""}</td>
                <td>${r.tdsRate || ""}</td>
              </tr>`
                        )
                        .join("")
                    : `<tr><td colspan="11" style="text-align:center; padding:20px;">No data available</td></tr>`
                }
          </tbody>
        </table>

        <div class="flex">
          <div>Total Purchase With TDS: ₹ ${totalPurchaseWithTDS.toLocaleString()}</div>
          <div>Total TDS: ₹ ${totalTDS.toLocaleString()}</div>
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
            a.download = "TDS_Payable.pdf";
            a.click();
        }
        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
        if (action === "email") {
            window.location.href = `mailto:?subject=TDS Payable&body=Please find attached TDS Payable report.`;
        }
    };

    const NoDataCmp = (
        <div className="text-center py-5">
            <h6 className="fw-bold text-muted mt-2">No Data Available!</h6>
            <small className="text-muted">Please try again after making relevant changes.</small>
        </div>
    );

    return (
        <div className="container-fluid bg-light pb-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}>
            <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded shadow-sm mb-2">
                <h5 className="fw-bold mb-0">TDS Payable</h5>
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
            <input className="form-control mb-2" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <div className="d-flex justify-content-between px-2 mt-2 fw-bold">
                <span className="text-success">Total Purchase With TDS: ₹ {totalPurchaseWithTDS.toLocaleString()}</span>
                <span className="text-danger">Total TDS: ₹ {totalTDS.toLocaleString()}</span>
            </div>
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="TDS Payable Preview"
            />
        </div>
    );
};

export default TDSPayable;
