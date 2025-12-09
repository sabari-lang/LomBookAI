import React, { useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

const ItemCategoryWiseProfitLoss = () => {
    const { control } = useForm({
        defaultValues: {
            period: "This Month",
            fromDate: "2025-11-01",
            toDate: "2025-11-30",
            itemType: "Active Items",
        },
    });

    // ---------------- MOCK DATA (replace with API) ----------------
    const data = [
        {
            id: 1,
            category: "Laptop",
            sale: 0,
            crNote: 0,
            purchase: 17700,
            drNote: 0,
            openingStock: 0,
            closingStock: 0,
            taxReceivable: 2700,
            taxPayable: 0,
            netProfit: -15000,
        },
    ];

    // ---------------- EXCEL EXPORT ----------------
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CategoryProfitLoss");
        XLSX.writeFile(wb, "ItemCategoryWiseProfitLoss.xlsx");
    };

    // ---------------- PDF PREVIEW ----------------
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const pdfRef = useRef(null);

    const generatePDF = async () => {
        const element = pdfRef.current;

        const canvas = await html2canvas(element, { scale: 2 });
        const img = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(img, "PNG", 0, 0, width, height);

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
        setShowPreview(true);
    };

    const handlePdfAction = (action) => {
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "ItemCategoryWiseProfitLoss.pdf";
            a.click();
        }
    };

    // ---------------- TABLE COLUMNS ----------------
    const columns = [
        {
            name: "Category Name",
            selector: (row) => row.category,
            sortable: true,
        },
        {
            name: "Sale",
            selector: (row) => row.sale,
            center: true,
            width: "120px",
        },
        {
            name: "Cr. Note / Sale Return",
            selector: (row) => row.crNote,
            center: true,
            width: "170px",
        },
        {
            name: "Purchase",
            selector: (row) => row.purchase,
            center: true,
            width: "150px",
            cell: (row) => `₹ ${row.purchase.toLocaleString()}`,
        },
        {
            name: "Dr. Note / Purchase Return",
            selector: (row) => row.drNote,
            center: true,
            width: "200px",
        },
        {
            name: "Opening Stock",
            selector: (row) => row.openingStock,
            center: true,
            width: "150px",
        },
        {
            name: "Closing Stock",
            selector: (row) => row.closingStock,
            center: true,
            width: "150px",
        },
        {
            name: "Tax Receivable",
            selector: (row) => row.taxReceivable,
            center: true,
            width: "160px",
            cell: (row) => `₹ ${row.taxReceivable.toLocaleString()}`,
        },
        {
            name: "Tax Payable",
            selector: (row) => row.taxPayable,
            center: true,
            width: "150px",
        },
        {
            name: "Net Profit/Loss",
            selector: (row) => row.netProfit,
            center: true,
            width: "160px",
            cell: (row) => (
                <span style={{ color: row.netProfit < 0 ? "red" : "green" }}>
                    {row.netProfit < 0 ? "- " : ""}
                    ₹ {Math.abs(row.netProfit).toLocaleString()}
                </span>
            ),
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: "#f8f9fa",
                fontWeight: 600,
                fontSize: "14px",
            },
        },
        rows: {
            style: {
                minHeight: "45px",
            },
        },
    };

    return (
        <div
            className="container-fluid bg-light py-4 rounded-3 overflow-auto"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* ---------------- FILTER BAR ---------------- */}
            <div className="d-flex flex-wrap gap-3 align-items-center bg-white p-3 border rounded mb-4">

                <span className="fw-semibold">Filter by :</span>

                {/* This Month Dropdown */}
                <Controller
                    name="period"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "160px" }}>
                            <option>This Month</option>
                            <option>Last Month</option>
                            <option>Custom</option>
                        </select>
                    )}
                />

                {/* Date Range */}
                <div className="d-flex gap-2 align-items-center">
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" />
                        )}
                    />
                    <span>To</span>
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" {...field} className="form-control form-control-sm" />
                        )}
                    />
                </div>

                {/* Active Items Dropdown */}
                <Controller
                    name="itemType"
                    control={control}
                    render={({ field }) => (
                        <select {...field} className="form-select form-select-sm" style={{ width: "150px" }}>
                            <option>Active Items</option>
                            <option>Inactive Items</option>
                            <option>All Items</option>
                        </select>
                    )}
                />
            </div>

            {/* ---------------- TITLE + ACTIONS ---------------- */}
            <div className="d-flex justify-content-between mb-3">
                <h6 className="fw-bold">Details</h6>

                <div className="d-flex align-items-center gap-4">
                    <div className="text-center cursor-pointer">
                        <i className="bi bi-search fs-5"></i>
                    </div>

                    <div className="text-center cursor-pointer" onClick={generatePDF}>
                        <i className="bi bi-printer fs-5"></i>
                    </div>

                    <div className="text-center cursor-pointer" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel fs-5 text-success"></i>
                    </div>
                </div>
            </div>

            {/* ---------------- DATA TABLE (PDF WRAPPER) ---------------- */}
            <div
                ref={pdfRef}
                className="bg-white shadow-sm border rounded-3 p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={data}
                    highlightOnHover
                    striped
                    dense
                    customStyles={customStyles}
                />
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                title="Item Category Wise Profit/Loss — PDF Preview"
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </div>
    );
};

export default ItemCategoryWiseProfitLoss;
