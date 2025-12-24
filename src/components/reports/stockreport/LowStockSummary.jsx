import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


const LowStockSummary = () => {
    // Report filter form - always unlock on mount
    
    const { control, watch } = useForm({
        defaultValues: {
            category: "All Categories",
            showInStock: false,
        },
    });

    const showInStock = watch("showInStock");

    // ----- Mock Data -----
    const fullData = [
        {
            id: 1,
            itemName: "Hp-laptop",
            minimumStock: 0,
            stockQty: 0,
            stockValue: 0,
        },
        {
            id: 2,
            itemName: "Sample Item",
            minimumStock: 0,
            stockQty: 0,
            stockValue: 0,
        },
    ];

    const filteredData = showInStock
        ? fullData.filter((item) => item.stockQty > 0)
        : fullData;

    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    // ===== Excel Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "LowStockSummary");
        XLSX.writeFile(
            workbook,
            `LowStockSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
    };

    // ===== PDF Generate =====
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
            </style>

            <h4>Low Stock Summary</h4>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Minimum Stock Qty</th>
                        <th>Stock Qty</th>
                        <th>Stock Value (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData
                    .map(
                        (r, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${r.itemName}</td>
                        <td>${r.minimumStock}</td>
                        <td>${r.stockQty}</td>
                        <td>${r.stockValue.toFixed(2)}</td>
                    </tr>`
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
            link.download = "LowStockSummary.pdf";
            link.click();
        }
    };

    // ===== Table Columns =====
    const columns = [
        { name: "#", selector: (row) => row.id, width: "60px" },
        { name: "Item Name", selector: (row) => row.itemName, sortable: true },
        { name: "Minimum Stock Qty", selector: (row) => row.minimumStock },
        { name: "Stock Qty", selector: (row) => row.stockQty },
        {
            name: "Stock Value",
            selector: (row) => `₹ ${row.stockValue.toFixed(2)}`,
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
            {/* FILTER ROW */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">

                    {/* Category Filter */}
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold">FILTERS</span>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className="form-select form-select-sm"
                                    style={{ width: "150px" }}
                                >
                                    <option>All Categories</option>
                                    <option>Electronics</option>
                                    <option>Grocery</option>
                                    <option>Office Supplies</option>
                                </select>
                            )}
                        />
                    </div>

                    {/* Show items in stock */}
                    <Controller
                        name="showInStock"
                        control={control}
                        render={({ field }) => (
                            <div className="form-check ms-2">
                                <input
                                    type="checkbox"
                                    {...field}
                                    className="form-check-input"
                                />
                                <label className="form-check-label">
                                    Show items in stock
                                </label>
                            </div>
                        )}
                    />
                </div>

                {/* Buttons Right side */}
                <div className="d-flex align-items-center gap-2">
                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i>
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "60vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredData}
                    highlightOnHover
                    striped
                    dense
                    customStyles={customStyles}
                />
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Low Stock Summary — PDF Preview"
            />
        </div>
    );
};

export default LowStockSummary;
