import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

const SalePurchaseReportByItem = () => {
    const { control } = useForm({
        defaultValues: {
            partyName: "",
            fromDate: "2025-11-01",
            toDate: "2025-11-26",
        },
    });

    // ---- Mock Data (Replace with API Later) ----
    const data = [
        {
            id: 1,
            category: "Laptop",
            saleQty: 0,
            totalSaleAmount: 0,
            purchaseQty: 1,
            totalPurchaseAmount: 17700,
        },
    ];

    // Excel Download
    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SalePurchaseItemCategory");
        XLSX.writeFile(wb, "SalePurchaseByItemCategory.xlsx");
    };

    // PDF states
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const pdfRef = useRef(null);

    // PDF Print
    const generatePDF = async () => {
        const element = pdfRef.current;

        const canvas = await html2canvas(element, { scale: 2 });
        const image = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(image, "PNG", 0, 0, width, height);

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
            a.download = "SalePurchaseByItemCategory.pdf";
            a.click();
        }
    };

    // ---- DataTable Columns ----
    const columns = [
        {
            name: "Item Category",
            selector: (row) => row.category,
            sortable: true,
        },
        {
            name: "Sale Quantity",
            selector: (row) => row.saleQty,
            width: "150px",
            center: true,
        },
        {
            name: "Total Sale Amount",
            selector: (row) => row.totalSaleAmount,
            width: "170px",
            center: true,
            cell: (row) => `₹ ${row.totalSaleAmount.toFixed(2)}`,
        },
        {
            name: "Purchase Quantity",
            selector: (row) => row.purchaseQty,
            width: "180px",
            center: true,
        },
        {
            name: "Total Purchase Amount",
            selector: (row) => row.totalPurchaseAmount,
            width: "200px",
            center: true,
            cell: (row) => `₹ ${row.totalPurchaseAmount.toFixed(2)}`,
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: "#f8f9fa",
                fontWeight: 600,
                fontSize: "13px",
            },
        },
    };

    return (
        <div
            className="container-fluid bg-light py-4 rounded-3 overflow-auto"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* ------------------- Filters ------------------- */}
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-4">
                <div className="d-flex flex-wrap align-items-center gap-3">

                    {/* Party Name */}
                    <div className="d-flex flex-column">
                        <label className="small fw-semibold">Party name</label>
                        <Controller
                            name="partyName"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    placeholder="Party name"
                                    className="form-control form-control-sm"
                                    style={{ width: "200px" }}
                                />
                            )}
                        />
                    </div>

                    {/* From */}
                    <div className="d-flex flex-column">
                        <label className="small fw-semibold">From</label>
                        <Controller
                            name="fromDate"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="date"
                                    {...field}
                                    className="form-control form-control-sm"
                                    style={{ width: "150px" }}
                                />
                            )}
                        />
                    </div>

                    {/* To */}
                    <div className="d-flex flex-column">
                        <label className="small fw-semibold">To</label>
                        <Controller
                            name="toDate"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="date"
                                    {...field}
                                    className="form-control form-control-sm"
                                    style={{ width: "150px" }}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* -------- Excel / Print Buttons -------- */}
                <div className="d-flex align-items-center gap-4">

                    <div className="text-center cursor-pointer" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel fs-4"></i>
                        <div style={{ fontSize: "12px" }}>Excel Report</div>
                    </div>

                    <div className="text-center cursor-pointer" onClick={generatePDF}>
                        <i className="bi bi-printer fs-4"></i>
                        <div style={{ fontSize: "12px" }}>Print</div>
                    </div>
                </div>
            </div>

            {/* --------------- Title --------------- */}
            <h6 className="fw-bold mb-3">SALE/PURCHASE REPORT BY ITEM CATEGORY</h6>

            {/* --------------- Table with PDF Ref --------------- */}
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

            {/* PDF Preview */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sale/Purchase Report by Item Category — PDF Preview"
            />
        </div>
    );
};

export default SalePurchaseReportByItem;
