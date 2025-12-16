import React, { useState, useRef } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const PartyWisePL = () => {
    // Mock data (same as your original)
    const mockData = [
        { id: 1, partyName: "ABC Traders", phone: "9876543210", totalSale: 15000, profit: 2000 },
        { id: 2, partyName: "XYZ Suppliers", phone: "9123456780", totalSale: 25000, profit: -1000 },
        { id: 3, partyName: "LMN Distributors", phone: "9812345670", totalSale: 35000, profit: 3500 },
        { id: 4, partyName: "Omkar Enterprises", phone: "9001234567", totalSale: 12000, profit: 800 },
        { id: 5, partyName: "SRS Agencies", phone: "9823456789", totalSale: 41000, profit: 6000 },
        { id: 6, partyName: "Vision Traders", phone: "9908765432", totalSale: 19000, profit: -500 },
        { id: 7, partyName: "Elite Distributors", phone: "9834567123", totalSale: 28000, profit: 1200 },
        { id: 8, partyName: "Perfect Supplies", phone: "9789056123", totalSale: 54000, profit: 8500 },
        { id: 9, partyName: "Bright Sales Corp", phone: "9956782345", totalSale: 23000, profit: 2500 },
        { id: 10, partyName: "Global Wholesalers", phone: "9876512340", totalSale: 32000, profit: 4500 },
        { id: 11, partyName: "Metro Agencies", phone: "9812323456", totalSale: 27000, profit: -1500 },
        { id: 12, partyName: "Everest Traders", phone: "9911223344", totalSale: 15000, profit: 1800 },
        { id: 13, partyName: "Future Link", phone: "9798456123", totalSale: 47000, profit: 5300 },
        { id: 14, partyName: "Sunrise Enterprises", phone: "9898989898", totalSale: 21000, profit: -700 },
        { id: 15, partyName: "Royal Mart", phone: "9807070707", totalSale: 56000, profit: 9600 },
    ];

    const [data, setData] = useState(mockData);
    const [search, setSearch] = useState("");
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // Filter logic (unchanged)
    const filteredData = data.filter((item) =>
        item.partyName.toLowerCase().includes(search.toLowerCase())
    );

    // Totals
    const totalSale = filteredData.reduce((sum, row) => sum + row.totalSale, 0);
    const totalProfit = filteredData.reduce((sum, row) => sum + row.profit, 0);

    // 📊 Excel Report Download
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PartyWise Profit-Loss");
        XLSX.writeFile(workbook, `PartyWisePL_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
                <td class="text-start">${r.partyName}</td>
                <td>${r.phone}</td>
                <td>${r.totalSale.toLocaleString()}</td>
                <td style="color:${r.profit >= 0 ? "green" : "red"}">${r.profit.toLocaleString()}</td>
              </tr>`
                    )
                    .join("")}
            <tr class="fw-bold">
              <td colspan="3" class="text-start">Total</td>
              <td>${totalSale.toLocaleString()}</td>
              <td style="color:${totalProfit >= 0 ? "green" : "red"}">${totalProfit.toLocaleString()}</td>
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
            link.download = `PartyWisePL_${new Date().toISOString().slice(0, 10)}.pdf`;
            link.click();
        }
    };

    // Columns (same)
    const columns = [
        { name: "#", selector: (row) => row.id, width: "70px" },
        { name: "PARTY NAME", selector: (row) => row.partyName, sortable: true },
        { name: "PHONE NO.", selector: (row) => row.phone, sortable: true },
        {
            name: "TOTAL SALE AMOUNT",
            selector: (row) => `₹ ${row.totalSale.toLocaleString()}`,
            sortable: true,
            right: true,
        },
        {
            name: "PROFIT (+) / LOSS (-)",
            cell: (row) => (
                <span style={{ color: row.profit >= 0 ? "green" : "red" }}>
                    ₹ {row.profit.toLocaleString()}
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
            {/* Header & Filters (unchanged layout) */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="mb-0 fw-bold">This Month</h5>
                    <div className="d-flex align-items-center border rounded px-2 py-1 bg-light">
                        <span className="me-2 text-secondary fw-semibold">Between</span>
                        <input type="date" className="form-control form-control-sm" defaultValue="2025-11-01" />
                        <span className="mx-2">To</span>
                        <input type="date" className="form-control form-control-sm" defaultValue="2025-11-30" />
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <select className="form-select form-select-sm" style={{ width: "150px" }}>
                        <option>All Parties</option>
                        <option>ABC Traders</option>
                        <option>XYZ Suppliers</option>
                    </select>

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
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by Party Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: "250px" }}
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
                    paginationPerPage={15}
                    highlightOnHover
                    responsive
                    noDataComponent={
                        <div className="text-center p-4 text-muted">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/7486/7486745.png"
                                alt="no data"
                                width="80"
                                className="mb-2"
                            />
                            <p className="mb-0">No data is available for Party Wise Profit & Loss.</p>
                            <small>Please try again after making relevant changes.</small>
                        </div>
                    }
                />
            </div>

            {/* Footer Totals */}
            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap mb-2">
                <p className="mb-0 fw-semibold">
                    Total Sale Amount: ₹ {totalSale.toLocaleString()}
                </p>
                <p className="mb-0 fw-semibold">
                    Total Profit(+) / Loss(-):{" "}
                    <span style={{ color: totalProfit >= 0 ? "green" : "red" }}>
                        ₹ {totalProfit.toLocaleString()}
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
