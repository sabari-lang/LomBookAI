import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getBusinessDiscount } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const DiscountReport = () => {
    const form = useForm({
        defaultValues: {
            fromDate: "2025-11-01",
            toDate: "2025-11-26",
        },
    });
    const fromDate = useWatch({ control: form.control, name: "fromDate" });
    const toDate = useWatch({ control: form.control, name: "toDate" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const fallbackRows = useMemo(
        () => [
            {
                id: 1,
                partyName: "ranjith",
                saleDiscount: 0,
                purchaseDiscount: 0,
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
        () => ["report-discount", fromDate, toDate, page, perPage],
        [fromDate, toDate, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getBusinessDiscount(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Discount Report"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    const filteredData = tableRows;

    const totalSaleDiscount = filteredData.reduce(
        (sum, row) => sum + Number(row.saleDiscount ?? 0),
        0
    );
    const totalPurchaseDiscount = filteredData.reduce(
        (sum, row) => sum + Number(row.purchaseDiscount ?? 0),
        0
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Discount Report");
        XLSX.writeFile(workbook, `Discount_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

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

        <h4>Discount Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Party Name</th>
              <th>Sale Discount</th>
              <th>Purchase / Expense Discount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
                .map(
                    (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${row.partyName ?? "—"}</td>
              <td>${formatCurrency(row.saleDiscount)}</td>
              <td>${formatCurrency(row.purchaseDiscount)}</td>
            </tr>`
                )
                .join("")}
            <tr>
              <td colspan="2" style="font-weight:700">Totals</td>
              <td style="font-weight:700">${formatCurrency(totalSaleDiscount)}</td>
              <td style="font-weight:700">${formatCurrency(totalPurchaseDiscount)}</td>
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

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = "DiscountReport.pdf";
            link.click();
        }
    };

    const columns = [
        { name: "#", selector: (row, index) => index + 1, width: "60px" },
        { name: "Party Name", selector: (row) => row.partyName || "—", sortable: true },
        {
            name: "Sale Discount",
            selector: (row) => formatCurrency(row.saleDiscount),
            right: true,
        },
        {
            name: "Purchase / Expense Discount",
            selector: (row) => formatCurrency(row.purchaseDiscount),
            right: true,
        },
    ];

    const customStyles = {
        headCells: { style: { backgroundColor: "#f8f9fa", fontWeight: 600 } },
        rows: { style: { minHeight: "45px" } },
    };

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="fromDate"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                type="date"
                                {...field}
                                className="form-control form-control-sm"
                                style={{ width: "150px" }}
                            />
                        )}
                    />

                    <span>To</span>

                    <Controller
                        name="toDate"
                        control={form.control}
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

                <div className="d-flex align-items-center gap-2">
                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i> Excel
                    </button>

                    <button
                        className="btn btn-light border btn-sm d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i>
                        {isGenerating ? "Generating..." : "Print"}
                    </button>
                </div>
            </div>

            <h6 className="fw-bold mb-2">DISCOUNT REPORT</h6>

            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredData}
                    highlightOnHover
                    striped
                    dense
                    customStyles={customStyles}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    progressPending={isLoading}
                    persistTableHead
                    noDataComponent={<div className="py-3 text-center text-muted">No records found</div>}
                />
            </div>

            <div className="d-flex justify-content-between mt-3 px-2 fw-bold">
                <span className="text-success">Total Sale Discount: {formatCurrency(totalSaleDiscount)}</span>
                <span className="text-danger">
                    Total Purchase Discount: {formatCurrency(totalPurchaseDiscount)}
                </span>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Discount Report Preview"
            />
        </div>
    );
};

export default DiscountReport;
