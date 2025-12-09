import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const SalePurchaseByPartyGroup = () => {
    const { control } = useForm({
        defaultValues: {
            fromDate: "2025-11-01",
            toDate: "2025-11-30",
            firm: "All Firms",
            category: "All Categories",
            item: "All Items",
        },
    });

    const mockData = [
        { id: 1, groupName: "General", saleAmount: 0, purchaseAmount: 17700 },
        { id: 2, groupName: "Retailers", saleAmount: 12300, purchaseAmount: 15800 },
        { id: 3, groupName: "Wholesalers", saleAmount: 18400, purchaseAmount: 13200 },
    ];

    const totalSale = mockData.reduce((sum, i) => sum + i.saleAmount, 0);
    const totalPurchase = mockData.reduce((sum, i) => sum + i.purchaseAmount, 0);

    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // ===== Excel Report Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(mockData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SalePurchaseByPartyGroup");
        XLSX.writeFile(workbook, `SalePurchaseByPartyGroup_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // ===== PDF Generate Logic =====
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
          h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Sale & Purchase by Party Group Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Group Name</th><th>Sale Amount (₹)</th><th>Purchase Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${mockData
                    .map(
                        (r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.groupName}</td>
                <td>${r.saleAmount.toLocaleString()}</td>
                <td>${r.purchaseAmount.toLocaleString()}</td>
              </tr>`
                    )
                    .join("")}
            <tr class="fw-bold">
              <td colspan="2" class="text-start">Total</td>
              <td>${totalSale.toLocaleString()}</td>
              <td>${totalPurchase.toLocaleString()}</td>
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
            link.download = "SalePurchaseByPartyGroup.pdf";
            link.click();
        }
    };

    const columns = [
        { name: "GROUP NAME", selector: (row) => row.groupName, sortable: true },
        { name: "SALE AMOUNT", selector: (row) => `₹ ${row.saleAmount.toLocaleString()}`, sortable: true },
        {
            name: "PURCHASE AMOUNT",
            selector: (row) => `₹ ${row.purchaseAmount.toLocaleString()}`,
            sortable: true,
            conditionalCellStyles: [{ when: (row) => row.purchaseAmount > 0, style: { color: "red" } }],
        },
    ];

    const customStyles = {
        headCells: {
            style: { backgroundColor: "#f8f9fa", fontWeight: "600" },
        },
        rows: { style: { minHeight: "45px" } },
    };

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* ===== Header Section ===== */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                {/* Left side filters */}
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <h5 className="fw-bold mb-0">This Month</h5>
                    <button className="btn btn-secondary btn-sm fw-semibold">Between</button>

                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" style={{ width: "150px" }} />
                        )}
                    />
                    <span>To</span>
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" style={{ width: "150px" }} />
                        )}
                    />
                    <Controller
                        name="firm"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: "150px" }}>
                                <option>All Firms</option>
                                <option>ABC Traders</option>
                                <option>XYZ Enterprises</option>
                            </select>
                        )}
                    />
                </div>

                {/* Right side buttons */}
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-light border btn-sm d-flex align-items-center gap-1" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </button>
                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            {/* ===== Sub-Filters ===== */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "200px" }}>
                            <option>All Categories</option>
                            <option>Electronics</option>
                            <option>Hardware</option>
                            <option>Furniture</option>
                        </select>
                    )}
                />

                <Controller
                    name="item"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "200px" }}>
                            <option>All Items</option>
                            <option>Item 1</option>
                            <option>Item 2</option>
                        </select>
                    )}
                />

                <input
                    type="text"
                    placeholder="Search..."
                    className="form-control form-control-sm"
                    style={{ maxWidth: "250px", flex: "1" }}
                />
            </div>

            {/* ===== Table Section ===== */}
            <h6 className="fw-semibold mb-2">SALE PURCHASE BY PARTY GROUP</h6>
            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "50vh" }}>
                <DataTable columns={columns} data={mockData} highlightOnHover striped dense pagination customStyles={customStyles} />
            </div>

            {/* ===== Totals Footer ===== */}
            <div className="d-flex flex-column flex-md-row justify-content-between mt-2 fw-bold text-center text-md-start gap-2">
                <span className="text-success">Total Sale Amount: ₹ {totalSale.toLocaleString()}</span>
                <span className="text-danger">Total Purchase Amount: ₹ {totalPurchase.toLocaleString()}</span>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sale Purchase by Party Group PDF Preview"
            />
        </div>
    );
};

export default SalePurchaseByPartyGroup;
