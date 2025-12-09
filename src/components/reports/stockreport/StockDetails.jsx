import React, { useRef, useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const StockDetails = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-06");
    const [category, setCategory] = useState("All Categories");

    // ✅ Example data (from screenshot)
    const rows = [
        {
            itemName: "Hp-laptop",
            beginQty: -1,
            qtyIn: 1,
            purchaseAmt: 17700,
            qtyOut: 0,
            saleAmt: 0,
            closingQty: 0,
        },
    ];

    const filtered = rows;

    const columns = [
        { name: "Item Name", selector: (r) => r.itemName, sortable: true },
        { name: "Begining Quantity", selector: (r) => r.beginQty, sortable: true },
        { name: "Quantity In", selector: (r) => r.qtyIn },
        {
            name: "Purchase Amount",
            selector: (r) => `₹ ${r.purchaseAmt.toLocaleString()}`,
            right: true,
        },
        { name: "Quantity Out", selector: (r) => r.qtyOut },
        {
            name: "Sale Amount",
            selector: (r) => `₹ ${r.saleAmt.toLocaleString()}`,
            right: true,
        },
        { name: "Closing Quantity", selector: (r) => r.closingQty },
    ];

    // ✅ Totals
    const totalBegin = filtered.reduce((a, b) => a + b.beginQty, 0);
    const totalIn = filtered.reduce((a, b) => a + b.qtyIn, 0);
    const totalPurchase = filtered.reduce((a, b) => a + b.purchaseAmt, 0);
    const totalOut = filtered.reduce((a, b) => a + b.qtyOut, 0);
    const totalSale = filtered.reduce((a, b) => a + b.saleAmt, 0);
    const totalClosing = filtered.reduce((a, b) => a + b.closingQty, 0);

    // ✅ Excel Export
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filtered);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stock Details");
        XLSX.writeFile(wb, "Stock_Details.xlsx");
    };

    // ✅ PDF Preview Modal Logic
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

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
          th { background:#eee; }
          h3 { text-align:center; text-decoration:underline; margin-bottom:10px; }
        </style>

        <h3>STOCK DETAILS REPORT</h3>
        <p>Period: ${fromDate} to ${toDate} | Category: ${category}</p>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Begining Quantity</th>
              <th>Quantity In</th>
              <th>Purchase Amount</th>
              <th>Quantity Out</th>
              <th>Sale Amount</th>
              <th>Closing Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
                    .map(
                        (r) => `
              <tr>
                <td>${r.itemName}</td>
                <td>${r.beginQty}</td>
                <td>${r.qtyIn}</td>
                <td>₹ ${r.purchaseAmt.toLocaleString()}</td>
                <td>${r.qtyOut}</td>
                <td>₹ ${r.saleAmt.toLocaleString()}</td>
                <td>${r.closingQty}</td>
              </tr>`
                    )
                    .join("")}
            
            <tr style="font-weight:bold;">
              <td>Total</td>
              <td>${totalBegin}</td>
              <td>${totalIn}</td>
              <td>₹ ${totalPurchase.toLocaleString()}</td>
              <td>${totalOut}</td>
              <td>₹ ${totalSale.toLocaleString()}</td>
              <td>${totalClosing}</td>
            </tr>
          </tbody>
        </table>
      `;

            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;

            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const img = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            const w = pdf.internal.pageSize.getWidth();
            const h = (canvas.height * w) / canvas.width;

            pdf.addImage(img, "PNG", 0, 0, w, h);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);

            setPdfUrl(url);
            setShowPreview(true);
        } finally {
            if (tempContainer.current) document.body.removeChild(tempContainer.current);
            setIsGenerating(false);
        }
    };

    const handleAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl);
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "Stock_Details.pdf";
            a.click();
        }
        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
        if (action === "email") {
            window.location.href = `mailto:?subject=Stock Details Report&body=Please find the attached report.`;
        }
    };

    return (
        <div className="container-fluid p-3">

            {/* Top Filters */}
            <div className="d-flex align-items-center gap-3 mb-3">
                <div>
                    <label className="small fw-semibold">From</label>
                    <input type="date" className="form-control" style={{ width: 180 }}
                        value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>

                <div>
                    <label className="small fw-semibold">To</label>
                    <input type="date" className="form-control" style={{ width: 180 }}
                        value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div className="ms-auto d-flex gap-3">
                    <button className="btn btn-outline-success rounded-circle" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>
                    <button className="btn btn-outline-primary rounded-circle" onClick={generatePDF}>
                        <i className="bi bi-printer"></i>
                    </button>
                </div>
            </div>

            <h6 className="fw-bold">DETAILS</h6>

            <div className="d-flex align-items-center mb-2 gap-3">
                <span className="fw-semibold small">Filter by Item Category</span>
                <select className="form-select" style={{ width: 180 }}
                    value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>All Categories</option>
                    <option>Laptops</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white p-2 rounded border shadow-sm mb-3">
                <DataTable columns={columns} data={filtered} highlightOnHover />
            </div>

            {/* Totals */}
            <table className="table table-bordered text-center">
                <thead>
                    <tr className="fw-bold">
                        <td>Total</td>
                        <td>{totalBegin}</td>
                        <td>{totalIn}</td>
                        <td>₹ {totalPurchase.toLocaleString()}</td>
                        <td>{totalOut}</td>
                        <td>₹ {totalSale.toLocaleString()}</td>
                        <td>{totalClosing}</td>
                    </tr>
                </thead>
            </table>

            {/* PDF Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="Stock Details Report"
            />
        </div>
    );
};

export default StockDetails;
