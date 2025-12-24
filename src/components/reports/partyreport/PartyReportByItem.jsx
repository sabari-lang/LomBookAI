import React, { useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Form } from "react-bootstrap";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getPartyByItem } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const PartyReportByItem = () => {
    // Report filter form - always unlock on mount
    
    
    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const { control } = useForm({
        defaultValues: {
            period: "This Month",
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            firm: "All Firms",
            category: "All Categories",
            item: "All Items",
            searchText: "",
        },
    });

    const period = useWatch({ control, name: "period" });
    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });
    const firm = useWatch({ control, name: "firm" });
    const category = useWatch({ control, name: "category" });
    const item = useWatch({ control, name: "item" });
    const searchText = useWatch({ control, name: "searchText" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (period) params.Period = period;
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        if (firm && firm !== "All Firms") params.Firm = firm;
        if (category && category !== "All Categories") params.Category = category;
        if (item && item !== "All Items") params.Item = item;
        return params;
    }, [period, fromDate, toDate, firm, category, item, page, perPage]);

    const queryKey = useMemo(
        () => ["report-party-by-item", period, fromDate, toDate, firm, category, item, page, perPage],
        [period, fromDate, toDate, firm, category, item, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getPartyByItem(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Party Report by Item"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredRows = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => {
            const party = (row.partyName ?? "").toString().toLowerCase();
            const itemName = (row.itemName ?? row.item ?? "").toString().toLowerCase();
            return party.includes(text) || itemName.includes(text);
        });
    }, [searchText, tableRows]);

    const totalSaleQty = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.saleQuantity ?? row.saleQty ?? 0), 0),
        [filteredRows]
    );
    const totalPurchaseQty = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.purchaseQuantity ?? row.purchaseQty ?? 0), 0),
        [filteredRows]
    );
    const totalSaleAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.saleAmount ?? row.saleValue ?? 0), 0),
        [filteredRows]
    );
    const totalPurchaseAmount = useMemo(
        () => filteredRows.reduce((sum, row) => sum + Number(row.purchaseAmount ?? row.purchaseValue ?? 0), 0),
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
                "Party Name": row.partyName ?? "",
                Item: row.itemName ?? row.item ?? "",
                "Sale Qty": row.saleQuantity ?? row.saleQty ?? 0,
                "Sale Amount": row.saleAmount ?? row.saleValue ?? 0,
                "Purchase Qty": row.purchaseQuantity ?? row.purchaseQty ?? 0,
                "Purchase Amount": row.purchaseAmount ?? row.purchaseValue ?? 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Party Report by Item");
        XLSX.writeFile(workbook, `PartyReportByItem_${fromDate || "start"}_${toDate || "end"}.xlsx`);
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
          .fw-bold { font-weight:700; }
        </style>

        <h4>Party Report By Item</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Party</th><th>Item</th><th>Sale Qty</th><th>Sale Value</th><th>Purchase Qty</th><th>Purchase Value</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
                .map(
                    (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.partyName ?? ""}</td>
                <td>${row.itemName ?? row.item ?? ""}</td>
                <td>${row.saleQuantity ?? row.saleQty ?? 0}</td>
                <td>${formatCurrency(row.saleAmount ?? row.saleValue ?? 0)}</td>
                <td>${row.purchaseQuantity ?? row.purchaseQty ?? 0}</td>
                <td>${formatCurrency(row.purchaseAmount ?? row.purchaseValue ?? 0)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="3">Totals</td>
              <td>${totalSaleQty}</td>
              <td>${formatCurrency(totalSaleAmount)}</td>
              <td>${totalPurchaseQty}</td>
              <td>${formatCurrency(totalPurchaseAmount)}</td>
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
            link.download = `PartyReportByItem_${fromDate}_${toDate}.pdf`;
            link.click();
        }
        if (action === "email") notifyInfo("Email feature coming soon");
    };

    const columns = [
        { name: "#", selector: (_, index) => index + 1, width: "60px" },
        { name: "PARTY", selector: (row) => row.partyName ?? "—", grow: 2, sortable: true },
        { name: "ITEM", selector: (row) => row.itemName ?? row.item ?? "—", sortable: true },
        { name: "SALE QTY", selector: (row) => row.saleQuantity ?? row.saleQty ?? 0, right: true, sortable: true },
        {
            name: "SALE VALUE",
            selector: (row) => formatCurrency(row.saleAmount ?? row.saleValue ?? 0),
            right: true,
            sortable: true,
        },
        {
            name: "PURCHASE QTY",
            selector: (row) => row.purchaseQuantity ?? row.purchaseQty ?? 0,
            right: true,
            sortable: true,
        },
        {
            name: "PURCHASE VALUE",
            selector: (row) => formatCurrency(row.purchaseAmount ?? row.purchaseValue ?? 0),
            right: true,
            sortable: true,
        },
    ];

    const customStyles = {
        headCells: { style: { backgroundColor: "#f8f9fa", fontWeight: 600, fontSize: "13px" } },
        rows: { style: { minHeight: "44px", fontSize: "13px" } },
    };

    return (
        <div className="container-fluid bg-light py-4 overflow-auto rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
            <div
                className="d-flex flex-wrap justify-content-between align-items-center p-3 mb-2 bg-white border rounded"
                style={{ borderColor: "#dee2e6" }}
            >
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                            <Form.Select size="sm" {...field} style={{ width: "150px" }}>
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>This Week</option>
                                <option>Custom</option>
                            </Form.Select>
                        )}
                    />
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
                            <Form.Select size="sm" {...field} style={{ width: "140px" }}>
                                <option>All Firms</option>
                                <option>Firm A</option>
                                <option>Firm B</option>
                            </Form.Select>
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i>
                        <span>Excel</span>
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i>
                        <span>{isGenerating ? "Generating..." : "Print"}</span>
                    </button>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 bg-white border rounded p-3 mb-2">
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <Form.Select size="sm" {...field} style={{ width: "180px" }}>
                            <option>All Categories</option>
                            <option>Timbers</option>
                            <option>Plywood</option>
                        </Form.Select>
                    )}
                />
                <Controller
                    name="item"
                    control={control}
                    render={({ field }) => (
                        <Form.Select size="sm" {...field} style={{ width: "180px" }}>
                            <option>All Items</option>
                            <option>Item 1</option>
                            <option>Item 2</option>
                        </Form.Select>
                    )}
                />
            </div>

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "55vh" }}>
                <div className="mb-2 d-flex justify-content-between flex-wrap gap-2">
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <Form.Control size="sm" placeholder="Search party or item" {...field} style={{ maxWidth: "260px" }} />
                        )}
                    />
                    <div className="d-flex gap-2 align-items-center">
                        <span className="text-muted">Rows:</span>
                        <Form.Select
                            size="sm"
                            value={perPage}
                            onChange={(event) => handlePerRowsChange(Number(event.target.value))}
                        >
                            {[25, 50, 100].map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    customStyles={customStyles}
                    highlightOnHover
                    striped
                    dense
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    persistTableHead
                    progressPending={isLoading}
                    noDataComponent={<div className="py-3 text-center text-muted">No data found</div>}
                />
                <div
                    className="d-flex justify-content-between align-items-center border-top pt-2 mt-2"
                    style={{ background: "#f8f9fa", fontSize: "13px", fontWeight: "600", padding: "6px 8px" }}
                >
                    <div>Total</div>
                    <div className="text-end w-50">
                        <span className="me-4">{totalSaleQty}</span>
                        <span className="me-4">{formatCurrency(totalSaleAmount)}</span>
                        <span className="me-4">{totalPurchaseQty}</span>
                        <span>{formatCurrency(totalPurchaseAmount)}</span>
                    </div>
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="Party Report by Item"
            />
        </div>
    );
};

export default PartyReportByItem;
