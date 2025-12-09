import React, { useState, useRef } from "react";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const ItemReportByParty = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-05");
    const [partyFilter, setPartyFilter] = useState("");

    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const tempContainer = useRef(null);

    // ✅ ERP Table Styling
    const erpTableStyles = {
        table: {
            style: {
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid #e5e5e5",
            },
        },
        headRow: {
            style: {
                backgroundColor: "#f8f9fa",
                minHeight: "48px",
                borderBottom: "1px solid #ddd",
                fontWeight: 600,
                fontSize: "14px",
            },
        },
        rows: {
            style: {
                minHeight: "46px",
                fontSize: "14px",
                borderBottom: "1px solid #eee",
                "&:hover": {
                    backgroundColor: "#f5f7fb",
                },
            },
        },
        pagination: {
            style: {
                borderTop: "1px solid #e0e0e0",
                padding: "12px",
            },
        },
    };

    // ✅ Example Data
    const data = [
        {
            id: 1,
            itemName: "Hp-laptop",
            saleQty: 0,
            saleAmount: 0,
            purchaseQty: 1,
            purchaseAmount: 17700,
            party: "Ranjith",
        },
    ];

    // ✅ Party Filter
    const filteredData = data.filter((row) =>
        row.party.toLowerCase().includes(partyFilter.toLowerCase())
    );

    // ✅ Totals Calculation
    const totalSaleQty = filteredData.reduce((a, b) => a + b.saleQty, 0);
    const totalSaleAmount = filteredData.reduce((a, b) => a + b.saleAmount, 0);
    const totalPurchaseQty = filteredData.reduce((a, b) => a + b.purchaseQty, 0);
    const totalPurchaseAmount = filteredData.reduce(
        (a, b) => a + b.purchaseAmount,
        0
    );

    // ✅ Totals ROW inside table
    const totalsRow = {
        id: "total-row",
        itemName: "Total",
        saleQty: totalSaleQty,
        saleAmount: totalSaleAmount,
        purchaseQty: totalPurchaseQty,
        purchaseAmount: totalPurchaseAmount,
        isTotal: true,
    };

    const finalTableData = [...filteredData, totalsRow];

    // ✅ Highlight totals row
    const conditionalRowStyles = [
        {
            when: (row) => row.isTotal === true,
            style: {
                fontWeight: "bold",
                backgroundColor: "#f1f3f7",
                borderTop: "2px solid #ccc",
                fontSize: "15px",
            },
        },
    ];

    // ✅ Table Columns
    const columns = [
        {
            name: "Item Name",
            selector: (row) => row.itemName,
            grow: 2,
            style: { justifyContent: "flex-start" },
        },
        {
            name: "Sale Qty",
            selector: (row) => row.saleQty,
            width: "150px",
            center: true,
        },
        {
            name: "Sale Amount",
            selector: (row) =>
                row.isTotal
                    ? `₹ ${row.saleAmount.toLocaleString()}.00`
                    : `₹ ${row.saleAmount.toLocaleString()}.00`,
            width: "180px",
            right: true,
        },
        {
            name: "Purchase Qty",
            selector: (row) => row.purchaseQty,
            width: "180px",
            center: true,
        },
        {
            name: "Purchase Amount",
            selector: (row) =>
                row.isTotal
                    ? `₹ ${row.purchaseAmount.toLocaleString()}.00`
                    : `₹ ${row.purchaseAmount.toLocaleString()}.00`,
            width: "200px",
            right: true,
        },
    ];

    // ✅ Excel Downloader
    const downloadExcel = () => {
        const excelData = filteredData.map((r) => ({
            "Item Name": r.itemName,
            "Sale Quantity": r.saleQty,
            "Sale Amount": r.saleAmount,
            "Purchase Quantity": r.purchaseQty,
            "Purchase Amount": r.purchaseAmount,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Item Report");

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buffer]), "Item_Report_By_Party.xlsx");
    };

    // ✅ PDF Generator
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
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #444; padding: 6px; text-align:center; }
          th { background: #f0f0f0; }
          .left { text-align:left; padding-left:8px; }
          .right { text-align:right; padding-right:8px; }
        </style>

        <h3 style="text-align:center; text-decoration:underline;">Item Report By Party</h3>
        <p><b>From:</b> ${fromDate} &nbsp;&nbsp; <b>To:</b> ${toDate}</p>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Sale Qty</th>
              <th>Sale Amount</th>
              <th>Purchase Qty</th>
              <th>Purchase Amount</th>
            </tr>
          </thead>

          <tbody>
            ${filteredData
                    .map(
                        (r) => `
              <tr>
                <td class="left">${r.itemName}</td>
                <td>${r.saleQty}</td>
                <td class="right">₹ ${r.saleAmount.toLocaleString()}.00</td>
                <td>${r.purchaseQty}</td>
                <td class="right">₹ ${r.purchaseAmount.toLocaleString()}.00</td>
              </tr>`
                    )
                    .join("")}

            <tr style="font-weight:bold; background:#f1f3f7;">
              <td class="left">Total</td>
              <td>${totalSaleQty}</td>
              <td class="right">₹ ${totalSaleAmount.toLocaleString()}.00</td>
              <td>${totalPurchaseQty}</td>
              <td class="right">₹ ${totalPurchaseAmount.toLocaleString()}.00</td>
            </tr>
          </tbody>
        </table>
      `;

            document.body.appendChild(tempDiv);

            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const pdf = new jsPDF("p", "mm", "a4");

            const img = canvas.toDataURL("image/png");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;

            pdf.addImage(img, "PNG", 0, 0, width, height);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);

            setPdfUrl(url);
            setShowPreview(true);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "Item_Report_By_Party.pdf";
            a.click();
        }
        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
    };

    return (
        <div className="container-fluid py-2" style={{ height: "calc(100vh - 10vh)", overflow: "auto" }}>
            {/* ✅ Filters */}
            <div className="d-flex justify-content-between align-items-center p-2 mb-3 bg-white border rounded shadow-sm">

                {/* ✅ Date Range */}
                <div className="d-flex align-items-center gap-3">

                    {/* From */}
                    <div className="d-flex flex-column">
                        <small className="text-muted fw-semibold">From</small>
                        <input
                            type="date"
                            className="form-control form-control-sm rounded"
                            style={{ width: "150px" }}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    {/* To */}
                    <div className="d-flex flex-column">
                        <small className="text-muted fw-semibold">To</small>
                        <input
                            type="date"
                            className="form-control form-control-sm rounded"
                            style={{ width: "150px" }}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                </div>

                {/* ✅ Right Side Buttons */}
                <div className="d-flex gap-3">

                    {/* Excel Button */}
                    <button
                        className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "42px", height: "42px" }}
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    {/* Print Button */}
                    <button
                        className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "42px", height: "42px" }}
                        onClick={generatePDF}
                    >
                        <i className="bi bi-printer"></i>
                    </button>

                </div>
            </div>



            {/* Party Filter */}
            <div className="d-flex align-items-center gap-2 mb-3">
                <span className="text-muted fw-semibold">FILTERS</span>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Party filter"
                    style={{ width: 220 }}
                    value={partyFilter}
                    onChange={(e) => setPartyFilter(e.target.value)}
                />
            </div>

            {/* ✅ Table */}
            <div className="bg-white rounded shadow-sm p-3 border" style={{ minHeight: "50vh" }}>
                <DataTable
                    columns={columns}
                    data={finalTableData}
                    customStyles={erpTableStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    highlightOnHover
                    pagination={false}
                />
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handleAction}
                title="Item Report By Party"
            />
        </div>
    );
};

export default ItemReportByParty;
