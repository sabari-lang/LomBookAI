import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";


const SalesSummaryByHsn = () => {
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // ✅ Example Data
    const reportData = [
        {
            hsn: "23232",
            totalValue: 22420,
            taxableValue: 19000,
            igst: 0,
            cgst: 1710,
            sgst: 1710,
            cess: 0,
        },
    ];

    // ✅ React Data Table Columns
    const columns = [
        { name: "HSN", selector: (row) => row.hsn, sortable: true },
        {
            name: "Total Value",
            selector: (row) => `₹ ${row.totalValue.toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Taxable Value",
            selector: (row) => `₹ ${row.taxableValue.toLocaleString()}`,
            sortable: true,
        },
        { name: "IGST", selector: (row) => row.igst },
        { name: "CGST", selector: (row) => row.cgst },
        { name: "SGST", selector: (row) => row.sgst },
        { name: "CESS", selector: (row) => row.cess },
    ];

    // ✅ Generate PDF
    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const fromDate = "01/10/2025";
            const toDate = "31/10/2025";

            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-9999px";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "25px";
            tempDiv.innerHTML = `
        <h4 style="text-align:center; text-decoration:underline;">HSN Wise Sale Summary Report</h4>
        <p><b>Duration:</b> From ${fromDate} to ${toDate}</p>
        <table style="width:100%; border-collapse: collapse;" border="1">
          <thead>
            <tr style="background:#f1f1f1;">
              <th>HSN</th><th>Total Value</th><th>Taxable Value</th>
              <th>IGST</th><th>CGST</th><th>SGST</th><th>CESS</th>
            </tr>
          </thead>
          <tbody>
            ${reportData
                    .map(
                        (r) => `
              <tr>
                <td>${r.hsn}</td>
                <td>${r.totalValue}</td>
                <td>${r.taxableValue}</td>
                <td>${r.igst}</td>
                <td>${r.cgst}</td>
                <td>${r.sgst}</td>
                <td>${r.cess}</td>
              </tr>
            `
                    )
                    .join("")}
          </tbody>
        </table>
      `;

            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;

            const canvas = await html2canvas(tempDiv, { scale: 2 });
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
            notifyError("Error generating PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    // ✅ PDF modal actions
    const handleAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl, "_blank");
        else if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "HSN_Wise_Sale_Summary.pdf";
            link.click();
        } else if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => {
                w.print();
            };
        } else if (action === "email") {
            window.location.href = `mailto:?subject=HSN Summary&body=Please find the HSN summary attached.`;
        }
    };

    return (
        <div
            className="container-fluid bg-light pt-2 pb-4 rounded-3"
            style={{ height: "calc(100vh - 11vh)", overflow: "auto" }}
        >
            <div className="d-flex align-items-center mb-3 gap-3 flex-wrap">
                <div>
                    <label className="form-label mb-0">From Date</label>
                    <input type="date" className="form-control" defaultValue="2025-10-01" />
                </div>
                <div>
                    <label className="form-label mb-0">To Date</label>
                    <input type="date" className="form-control" defaultValue="2025-10-31" />
                </div>
                <div className="ms-auto d-flex gap-2">
                    <button className="btn btn-outline-success btn-sm">XLS</button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            {/* ✅ React Data Table */}
            <div className="bg-white p-3 rounded-3 shadow-sm" style={{ minHeight: "55vh" }}>
                <h6 className="fw-bold mb-2">HSN Wise Sale Summary Report</h6>
                <p className="text-muted">Duration: From 01/10/2025 to 31/10/2025</p>

                <DataTable
                    columns={columns}
                    data={reportData}
                    pagination
                    highlightOnHover
                    dense
                    striped
                    responsive
                />

                <div className="text-end fw-bold mt-2">
                    Total Value: ₹{" "}
                    {reportData
                        .reduce((a, b) => a + b.totalValue, 0)
                        .toLocaleString()}
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="HSN Wise Sale Summary Report"
            />
        </div>
    );
};

export default SalesSummaryByHsn;
