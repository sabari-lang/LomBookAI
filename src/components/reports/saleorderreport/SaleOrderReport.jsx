import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getSalesOrders } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const fallbackRows = [
    {
        id: 1,
        orderDate: "2025-10-30",
        orderNo: "SO-001",
        partyName: "Ranjith",
        dueDate: "2025-11-05",
        status: "Order Open",
        orderType: "Sale Order",
        total: 23600,
        advance: 23600,
        balance: 0,
    },
];

const SaleOrderReport = () => {
    const form = useForm({
        defaultValues: {
            fromDate: "2025-10-01",
            toDate: "2025-11-05",
            party: "",
            orderType: "Sale Order",
            orderStatus: "All Orders",
            searchText: "",
        },
    });
    const control = form.control;
    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const partyFilter = useWatch({ control, name: "party" });
    const orderType = useWatch({ control, name: "orderType" });
    const orderStatus = useWatch({ control, name: "orderStatus" });
    const searchText = useWatch({ control, name: "searchText" });

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
        if (partyFilter) params.PartyName = partyFilter;
        if (orderType && orderType !== "All Orders") params.OrderType = orderType;
        if (orderStatus && orderStatus !== "All Orders") params.Status = orderStatus;
        return params;
    }, [fromDate, orderStatus, orderType, page, partyFilter, perPage, toDate]);

    const queryKey = useMemo(
        () => ["report-sales-orders", fromDate, toDate, partyFilter, orderType, orderStatus, page, perPage],
        [fromDate, orderStatus, orderType, page, partyFilter, perPage, toDate]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getSalesOrders(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Sales Orders"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredRows = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => {
            const party = (row.partyName ?? row.party ?? "").toString().toLowerCase();
            const number = (row.orderNo ?? row.orderNumber ?? "").toString().toLowerCase();
            const status = (row.status ?? "").toString().toLowerCase();
            return party.includes(text) || number.includes(text) || status.includes(text);
        });
    }, [tableRows, searchText]);

    const totalAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.total ?? row.totalAmount ?? 0), 0),
        [filteredRows]
    );
    const totalAdvance = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.advance ?? row.advanceAmount ?? 0), 0),
        [filteredRows]
    );
    const totalBalance = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.balance ?? 0), 0),
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
                "Order Date": row.orderDate ?? row.orderCreated ?? "",
                "Order No": row.orderNo ?? row.orderNumber ?? "",
                Party: row.partyName ?? row.party ?? "",
                "Due Date": row.dueDate ?? row.dueOn ?? "",
                Status: row.status ?? "",
                "Order Type": row.orderType ?? "",
                Total: row.total ?? row.totalAmount ?? 0,
                Advance: row.advance ?? row.advanceAmount ?? 0,
                Balance: row.balance ?? 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Orders");
        XLSX.writeFile(workbook, `SalesOrders_${fromDate || "start"}_${toDate || "end"}.xlsx`);
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
          .text-start { text-align:left; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>Sales Order Report</h4>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Order No.</th>
              <th>Party</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Order Type</th>
              <th>Total</th>
              <th>Advance</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
                .map(
                    (row) => `
              <tr>
                <td>${row.orderDate ?? row.orderCreated ?? ""}</td>
                <td>${row.orderNo ?? row.orderNumber ?? ""}</td>
                <td class="text-start">${row.partyName ?? row.party ?? ""}</td>
                <td>${row.dueDate ?? row.dueOn ?? ""}</td>
                <td>${row.status ?? ""}</td>
                <td>${row.orderType ?? ""}</td>
                <td>${formatCurrency(row.total ?? row.totalAmount)}</td>
                <td>${formatCurrency(row.advance ?? row.advanceAmount)}</td>
                <td>${formatCurrency(row.balance)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="6" class="text-start">Totals</td>
              <td>${formatCurrency(totalAmount)}</td>
              <td>${formatCurrency(totalAdvance)}</td>
              <td>${formatCurrency(totalBalance)}</td>
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
            link.download = `SalesOrderReport_${fromDate}_${toDate}.pdf`;
            link.click();
        }
        if (action === "email") {
            const subject = encodeURIComponent("Sales Order Report");
            const body = encodeURIComponent("Please find attached the sales order report.");
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }
    };

    const columns = [
        { name: "DATE", selector: (row) => row.orderDate ?? row.orderCreated ?? "—", sortable: true },
        { name: "ORDER NO.", selector: (row) => row.orderNo ?? row.orderNumber ?? "—", sortable: true },
        { name: "PARTY", selector: (row) => row.partyName ?? row.party ?? "—", grow: 2, sortable: true },
        { name: "DUE DATE", selector: (row) => row.dueDate ?? row.dueOn ?? "—", sortable: true },
        { name: "STATUS", selector: (row) => row.status ?? "—", sortable: true },
        { name: "TYPE", selector: (row) => row.orderType ?? "—", sortable: true },
        {
            name: "TOTAL",
            selector: (row) => formatCurrency(row.total ?? row.totalAmount),
            right: true,
            sortable: true,
        },
        {
            name: "ADVANCE",
            selector: (row) => formatCurrency(row.advance ?? row.advanceAmount),
            right: true,
            sortable: true,
        },
        {
            name: "BALANCE",
            selector: (row) => formatCurrency(row.balance),
            right: true,
            sortable: true,
        },
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
                    <Controller
                        name="party"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                placeholder="Party filter"
                                className="form-control form-control-sm"
                                style={{ width: 240 }}
                            />
                        )}
                    />
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="orderType"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: 150 }}>
                                <option>All Orders</option>
                                <option>Sale Order</option>
                                <option>Purchase Order</option>
                            </select>
                        )}
                    />
                    <Controller
                        name="orderStatus"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: 180 }}>
                                <option>All Orders</option>
                                <option>Order Open</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                placeholder="Search orders"
                                className="form-control form-control-sm"
                                style={{ width: 220 }}
                            />
                        )}
                    />
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
                    noDataComponent={<div className="py-3 text-center text-muted">No records found</div>}
                />
                <div className="text-end fw-bold mt-2">
                    Total: {formatCurrency(totalAmount)} • Advance: {formatCurrency(totalAdvance)} • Balance: {formatCurrency(totalBalance)}
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Sales Order Report Preview"
            />
        </div>
    );
};

export default SaleOrderReport;
