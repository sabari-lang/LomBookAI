import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
    format,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
} from "date-fns";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const SACReport = () => {
    const [rangeType, setRangeType] = useState("This Month");
    const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // ✅ Dummy Data (replace with API data)
    const data = [
        {
            id: 1,
            sac: "998313",
            invoiceType: "Tax Invoice",
            totalValue: 25000,
            taxableValue: 22000,
            igst: 0,
            cgst: 1650,
            sgst: 1650,
            cess: 0,
        },
    ];

    // ✅ Columns
    const columns = [
        { name: "#", selector: (row) => row.id, width: "60px" },
        { name: "SAC", selector: (row) => row.sac },
        { name: "INVOICE TYPE", selector: (row) => row.invoiceType },
        {
            name: "TOTAL VALUE",
            selector: (row) => `₹ ${row.totalValue.toLocaleString()}.00`,
            right: true,
        },
        {
            name: "TAXABLE VALUE",
            selector: (row) => `₹ ${row.taxableValue.toLocaleString()}.00`,
            right: true,
        },
        {
            name: "IGST AMOUNT",
            selector: (row) => (row.igst ? `₹ ${row.igst.toLocaleString()}.00` : "--"),
            right: true,
        },
        {
            name: "CGST AMOUNT",
            selector: (row) => (row.cgst ? `₹ ${row.cgst.toLocaleString()}.00` : "--"),
            right: true,
        },
        {
            name: "SGST AMOUNT",
            selector: (row) => (row.sgst ? `₹ ${row.sgst.toLocaleString()}.00` : "--"),
            right: true,
        },
        {
            name: "ADD. CESS",
            selector: (row) => (row.cess ? `₹ ${row.cess.toLocaleString()}.00` : "--"),
            right: true,
        },
    ];

    // ✅ Date Range Selection Logic
    const handleRangeChange = (type) => {
        setRangeType(type);
        const today = new Date();
        let from, to;

        switch (type) {
            case "Last Month":
                from = format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd");
                to = format(endOfMonth(subMonths(today, 1)), "yyyy-MM-dd");
                break;
            case "This Quarter":
                from = format(startOfQuarter(today), "yyyy-MM-dd");
                to = format(endOfQuarter(today), "yyyy-MM-dd");
                break;
            case "This Year":
                from = format(startOfYear(today), "yyyy-MM-dd");
                to = format(endOfYear(today), "yyyy-MM-dd");
                break;
            case "Custom":
                return; // leave manual control
            default:
                from = format(startOfMonth(today), "yyyy-MM-dd");
                to = format(endOfMonth(today), "yyyy-MM-dd");
        }
        setFromDate(from);
        setToDate(to);
    };

    // ✅ Generate PDF
    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const totalValue = data.reduce((a, b) => a + b.totalValue, 0);
            const totalItems = data.length;

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
          h4 { text-align:center; text-decoration:underline; margin-bottom:10px; font-weight:700; font-size:14px; }
          p { font-size:12px; margin-bottom:4px; }
          table { border-collapse: collapse; width:100%; margin-top:6px; }
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; }
          th { background:#f1f1f1; font-weight:600; }
          .fw-bold { font-weight:700; }
          .summary { margin-top:12px; font-size:12px; }
        </style>

        <h4>SAC Wise Summary Report</h4>
        <p><b>Duration:</b> From ${format(new Date(fromDate), "dd/MM/yyyy")} to ${format(
                new Date(toDate),
                "dd/MM/yyyy"
            )}</p>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>SAC</th>
              <th>INVOICE TYPE</th>
              <th>TOTAL VALUE</th>
              <th>TAXABLE VALUE</th>
              <th>IGST AMOUNT</th>
              <th>CGST AMOUNT</th>
              <th>SGST AMOUNT</th>
              <th>ADD. CESS</th>
            </tr>
          </thead>
          <tbody>
            ${data
                    .map(
                        (r) => `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.sac}</td>
                  <td>${r.invoiceType}</td>
                  <td>₹ ${r.totalValue.toLocaleString()}.00</td>
                  <td>₹ ${r.taxableValue.toLocaleString()}.00</td>
                  <td>${r.igst ? `₹ ${r.igst.toLocaleString()}.00` : "--"}</td>
                  <td>${r.cgst ? `₹ ${r.cgst.toLocaleString()}.00` : "--"}</td>
                  <td>${r.sgst ? `₹ ${r.sgst.toLocaleString()}.00` : "--"}</td>
                  <td>${r.cess ? `₹ ${r.cess.toLocaleString()}.00` : "--"}</td>
                </tr>`
                    )
                    .join("")}
            <tr class="fw-bold">
              <td colspan="3" style="text-align:left">Total</td>
              <td>₹ ${totalValue.toLocaleString()}.00</td>
              <td colspan="5"></td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <table style="width:100%;border:none;">
            <tr>
              <td class="fw-bold text-start">Total Value: ₹ ${totalValue.toLocaleString()}.00</td>
              <td class="fw-bold text-end">Total Items: ${totalItems}</td>
            </tr>
          </table>
        </div>
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

    // ✅ Handle Actions
    const handleAction = (action) => {
        if (!pdfUrl) return;
        if (action === "open") window.open(pdfUrl, "_blank");
        else if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "SAC_Report.pdf";
            link.click();
        } else if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => {
                w.focus();
                w.print();
            };
        } else if (action === "email") {
            const subject = encodeURIComponent("SAC Wise Summary Report");
            const body = encodeURIComponent("Please find attached the SAC Wise Summary Report.");
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    };

    return (
        <div
            className="container-fluid bg-light pt-2 pb-4 rounded-3"
            style={{ height: "calc(100vh - 11vh)", overflow: "auto", background: "#d2dce5" }}
        >
            {/* Header Filters */}
            <div className="d-flex align-items-center mb-3 flex-wrap gap-3">
                {/* Range Dropdown */}
                <div className="dropdown">
                    <button
                        className="btn btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        {rangeType}
                    </button>
                    <ul className="dropdown-menu">
                        {["This Month", "Last Month", "This Quarter", "This Year", "Custom"].map((label) => (
                            <li key={label}>
                                <button className="dropdown-item" onClick={() => handleRangeChange(label)}>
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Between and Dates */}
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold text-muted">Between</span>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                    <span>To</span>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: 160 }}
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </div>

                {/* Firm Selector */}
                <select className="form-select ms-2" style={{ width: 160 }}>
                    <option>ALL FIRMS</option>
                </select>

                {/* Actions */}
                <div className="ms-auto d-flex align-items-center gap-2">
                    <button className="btn btn-outline-success btn-sm">
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : (<><i className="bi bi-printer"></i> Print</>)}
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "50vh" }}>
                <h6 className="fw-bold mb-3">SAC REPORT</h6>
                <DataTable
                    columns={columns}
                    data={data}
                    striped
                    highlightOnHover
                    pagination
                    noDataComponent="No data is available for SAC Wise Summary Report. Please try again after making relevant changes."
                />
                <div className="d-flex justify-content-between fw-bold mt-2 me-2">
                    <div className="text-success">
                        Total Value: ₹ {data.reduce((a, b) => a + b.totalValue, 0).toLocaleString()}.00
                    </div>
                    <div>Total Items: {data.length}</div>
                </div>
            </div>

            {/* PDF Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="SAC Wise Summary Report"
            />
        </div>
    );
};

export default SACReport;
