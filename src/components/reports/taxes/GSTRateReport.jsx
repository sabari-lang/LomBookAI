import React, { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getGstRateSummary } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const GSTRateReport = () => {
  const [fromDate, setFromDate] = useState("2025-11-01");
  const [toDate, setToDate] = useState("2025-11-06");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const tempContainer = useRef(null);

  // Fallback/mock data
  const fallbackRows = useMemo(
    () => [
      {
        taxName: "SGST@9%",
        taxPercent: "9%",
        taxableSale: 0,
        taxIn: 0,
        taxablePurchase: 15000,
        taxOut: 1350,
      },
      {
        taxName: "CGST@9%",
        taxPercent: "9%",
        taxableSale: 0,
        taxIn: 0,
        taxablePurchase: 15000,
        taxOut: 1350,
      },
    ],
    []
  );

  const requestParams = useMemo(() => {
    const params = {
      Page: page,
      PageSize: perPage,
    };
    if (fromDate) params.FromDate = fromDate;
    if (toDate) params.ToDate = toDate;
    return params;
  }, [fromDate, toDate, page, perPage]);

  const queryKey = useMemo(
    () => ["report-gst-rate-summary", fromDate, toDate, page, perPage],
    [fromDate, toDate, page, perPage]
  );

  const { data: fetched, isLoading } = useQuery({
    queryKey,
    queryFn: () => getGstRateSummary(requestParams),
    enabled: Boolean(fromDate && toDate),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "GST Rate Report"),
  });

  const items = extractItems(fetched) || fallbackRows;
  const pagination = extractPagination(fetched);

  // Totals
  const totalTaxIn = items.reduce((a, b) => a + (b.taxIn || 0), 0);
  const totalTaxOut = items.reduce((a, b) => a + (b.taxOut || 0), 0);

  // ✅ Columns
  const columns = [
    { name: "Tax Name", selector: (row) => row.taxName, sortable: true },
    { name: "Tax Percent", selector: (row) => row.taxPercent, sortable: true },
    {
      name: "Taxable Sale Amount",
      selector: (row) => `₹ ${Number(row.taxableSale || 0).toLocaleString()}`,
    },
    {
      name: "Tax In",
      selector: (row) => `₹ ${Number(row.taxIn || 0).toLocaleString()}`,
    },
    {
      name: "Taxable Purchase/Expense Amount",
      selector: (row) => `₹ ${Number(row.taxablePurchase || 0).toLocaleString()}`,
    },
    {
      name: "Tax Out",
      selector: (row) => `₹ ${Number(row.taxOut || 0).toLocaleString()}`,
    },
  ];

  // Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GST Rate Report");
    XLSX.writeFile(wb, "GST_Rate_Report.xlsx");
  };

  // Generate PDF (same style as GSTReport.jsx)
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
          table { width:100%; border-collapse:collapse; }
          th, td { border:1px solid #000; padding:6px; font-size:12px; }
          th { background:#eee; font-weight:bold; }
          h3 { text-align:center; text-decoration:underline; margin-bottom:10px; }
        </style>
        <h3>GST TAX RATE REPORT</h3>
        <table>
          <thead>
            <tr>
              <th>Tax Name</th>
              <th>Tax Percent</th>
              <th>Taxable Sale Amount</th>
              <th>Tax In</th>
              <th>Taxable Purchase/Expense Amount</th>
              <th>Tax Out</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (r) => `
                  <tr>
                    <td>${r.taxName}</td>
                    <td>${r.taxPercent}</td>
                    <td>₹ ${Number(r.taxableSale || 0).toLocaleString()}</td>
                    <td>₹ ${Number(r.taxIn || 0).toLocaleString()}</td>
                    <td>₹ ${Number(r.taxablePurchase || 0).toLocaleString()}</td>
                    <td>₹ ${Number(r.taxOut || 0).toLocaleString()}</td>
                  </tr>`
              )
              .join("")}
            <tr style="font-weight:bold;">
              <td colspan="3">Total Tax In: ₹ ${totalTaxIn.toLocaleString()}</td>
              <td colspan="3">Total Tax Out: ₹ ${totalTaxOut.toLocaleString()}</td>
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

  // ✅ PDF Actions
  const handleAction = (action) => {
    if (!pdfUrl) return;

    if (action === "open") window.open(pdfUrl, "_blank");

    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "GST_Rate_Report.pdf";
      a.click();
    }

    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }

    if (action === "email") {
      window.location.href = `mailto:?subject=GST Rate Report&body=Please check the attached GST rate report.`;
    }
  };

  return (
    <div
      className="container-fluid bg-light py-4 overflow-auto rounded-3"
      style={{ height: "calc(100vh - 11vh)" }}
    >
      {/* ✅ Filters */}
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

        {/* ✅ Icons */}
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

      {/* ✅ Title */}
      <h6 className="fw-bold mb-2">GST TAX RATE REPORT</h6>

      {/* Data Table */}
      <div className="bg-white p-3 rounded-3 shadow-sm border" style={{ minHeight: "55vh" }}>
        <DataTable
          columns={columns}
          data={items}
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
        />
        {/* Totals */}
        <div className="d-flex justify-content-between px-2 mt-3 fw-bold">
          <span className="text-success">
            Total Tax In: ₹ {totalTaxIn.toLocaleString()}
          </span>
          <span className="text-danger">
            Total Tax Out: ₹ {totalTaxOut.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ✅ PDF PREVIEW MODAL */}
      <PdfPreviewModal
        pdfUrl={pdfUrl}
        show={showPreview}
        onClose={() => setShowPreview(false)}
        onAction={handleAction}
        title="GST Rate Report Preview"
      />
    </div>
  );
};

export default GSTRateReport;
