import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getSalesOrderItems } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const SaleOrderItem = () => {
    // Report filter form - always unlock on mount
    
    
    const form = useForm({
        defaultValues: {
            fromDate: "2025-10-01",
            toDate: "2025-11-05",
            searchText: "",
            orderType: "Sale Order",
            status: "All Status",
        },
    });
    const control = form.control;
    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const searchText = useWatch({ control, name: "searchText" });
    const orderType = useWatch({ control, name: "orderType" });
    const statusFilter = useWatch({ control, name: "status" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (orderType && orderType !== "All Status") params.OrderType = orderType;
        if (statusFilter && statusFilter !== "All Status") params.Status = statusFilter;
        if (searchText) params.Search = searchText;
        return params;
    }, [fromDate, orderType, page, perPage, searchText, statusFilter, toDate]);

    const queryKey = useMemo(
        () => ["report-sales-order-items", fromDate, toDate, orderType, statusFilter, searchText, page, perPage],
        [fromDate, orderType, page, perPage, searchText, statusFilter, toDate]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getSalesOrderItems(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Sales Order Items"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredRows = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => {
            const name = (row.name ?? row.itemName ?? "").toString().toLowerCase();
            return name.includes(text);
        });
    }, [tableRows, searchText]);

    const totalQty = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.qty ?? row.quantity ?? 0), 0),
        [filteredRows]
    );
    const totalAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.amount ?? row.totalAmount ?? 0), 0),
        [filteredRows]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredRows.map((row) => ({
                "Item Name": row.name ?? row.itemName ?? "",
                Quantity: row.qty ?? row.quantity ?? 0,
                Amount: row.amount ?? row.totalAmount ?? 0,
                Status: row.status ?? row.orderStatus ?? "",
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Order Items");
        XLSX.writeFile(workbook, `SaleOrderItems_${fromDate || "start"}_${toDate || "end"}.xlsx`);
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
            tempDiv.style.padding = "22px";
            tempDiv.innerHTML = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; }
          h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
        </style>

        <h4>Sale Order Item Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
                .map(
                    (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.name ?? row.itemName ?? ""}</td>
                <td>${row.qty ?? row.quantity ?? 0}</td>
                <td>${formatCurrency(row.amount ?? row.totalAmount)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="2" class="text-start">Totals</td>
              <td>${totalQty}</td>
              <td>${formatCurrency(totalAmount)}</td>
            </tr>
          </tbody>
        </table>`;

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
            notifyError("Failed to generate PDF");
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
            link.download = `SaleOrderItems_${fromDate}_${toDate}.pdf`;
            link.click();
        }
        if (action === "email") notifyInfo("Email feature coming soon");
    };

    const columns = [
        { name: "ITEM", selector: (row) => row.name ?? row.itemName ?? "—", sortable: true, grow: 2 },
        {
            name: "QTY",
            selector: (row) => row.qty ?? row.quantity ?? 0,
            right: true,
            width: "120px",
        },
        {
            name: "AMOUNT",
            selector: (row) => formatCurrency(row.amount ?? row.totalAmount),
            right: true,
            sortable: true,
        },
        { name: "STATUS", selector: (row) => row.status ?? row.orderStatus ?? "—", sortable: true },
    ];

    return (
        <div className="container-fluid bg-light py-4 overflow-auto rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} style={{ width: 160 }} />
                        )}
                    />
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} style={{ width: 160 }} />
                        )}
                    />
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="orderType"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: 160 }}>
                                <option>All Status</option>
                                <option>Sale Order</option>
                                <option>Purchase Order</option>
                            </select>
                        )}
                    />
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: 200 }}>
                                <option>All Status</option>
                                <option>Open Orders</option>
                                <option>Partial Open Orders</option>
                                <option>Close Orders</option>
                            </select>
                        )}
                    />
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                placeholder="Search item"
                                className="form-control form-control-sm"
                                style={{ width: 220 }}
                            />
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={generatePDF} disabled={isGenerating}>
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print / PDF"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "55vh" }}>
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    highlightOnHover
                    striped
                    dense
                    persistTableHead
                    progressPending={isLoading}
                    noDataComponent={<div className="py-3 text-center text-muted">No records to display</div>}
                />
                <div className="d-flex justify-content-between fw-bold mt-2">
                    <div>Items: {filteredRows.length}</div>
                    <div>Total Qty: {totalQty}</div>
                    <div>Total Amount: {formatCurrency(totalAmount)}</div>
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sale Order Item Report"
            />
        </div>
    );
};

export default SaleOrderItem;
