import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import EmptyStateMessage from "../common/emptytable/EmptyStateMessage";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../common/popup/PdfPreviewModal";

import * as XLSX from "xlsx";   // ✅ EXCEL ADDED
import { deleteItem, getItems } from "./api";
import { extractItems } from "../../utils/extractItems";

const Items = () => {
    const navigate = useNavigate();

    const pickField = (row, ...keys) => {
        for (const key of keys) {
            const value = row?.[key];
            if (value !== null && value !== undefined && value !== "") return value;
        }
        return "—";
    };

    const getCategoryValue = (item) =>
        item?.category ?? item?.itemCategory ?? item?.commandCategory ?? "";

    const getUnitValue = (item) => item?.usageUnit ?? item?.unit ?? "";

    // ✅ Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [unitFilter, setUnitFilter] = useState("All");
    const [stockFilter, setStockFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const [items, setItems] = useState([]);

    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["items", currentPage, entriesPerPage],
        queryFn: () =>
            getItems({
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    useEffect(() => {
        const extracted = extractItems(apiRaw) ?? [];
        setItems(extracted);
    }, [apiRaw]);

    const [selectedRows, setSelectedRows] = useState([]);


    const buildOptions = (getter) => {
        const set = new Set();
        items.forEach((item) => {
            const value = getter(item);
            if (value) set.add(value);
        });
        return ["All", ...Array.from(set).sort()];
    };

    const categoryOptions = useMemo(() => {
        const base = buildOptions(getCategoryValue);
        const special = ["All", "Active", "Inactive", "Sales", "Purchases", "Services"];
        const set = new Set([...base, ...special]);
        // Ensure 'All' appears first
        const arr = Array.from(set).filter(v => v !== "All").sort();
        return ["All", ...arr];
    }, [items]);
    const unitOptions = useMemo(() => buildOptions(getUnitValue), [items]);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["items"]);
        },
    });

    // ✅ Delete Selected
    const handleDelete = async () => {
        if (selectedRows.length === 0) {
            alert("Please select items to delete.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete selected items?")) return;

        const idsToDelete = selectedRows.map((r) => r?.id).filter(Boolean);
        if (idsToDelete.length === 0) return;

        try {
            await Promise.all(idsToDelete.map((id) => deleteMutation.mutateAsync(id)));
            setItems((prev) => prev.filter((item) => !idsToDelete.includes(item?.id)));
            setSelectedRows([]);
        } catch (error) {
            console.error("Failed to delete items", error);
            alert("Unable to delete selected items. Please try again.");
        }
    };

    // ✅ Edit on Click
    const handleRowClick = (row) => {
        navigate("/newitem", { state: row });
    };

    // ✅ Filter Logic
    const filteredItems = useMemo(() => {
        const searchTerm = search.toLowerCase();
        const availableItems = items ?? [];

        return availableItems.filter((item) => {
            const name = pickField(item, "name", "itemName", "title").toLowerCase();
            const sku = pickField(item, "sku", "itemSku", "code").toLowerCase();
            const matchesSearch = name.includes(searchTerm) || sku.includes(searchTerm);

            const category = getCategoryValue(item);
            const statusVal = (item?.status ?? item?.itemStatus ?? "").toString().toLowerCase();
            const activeFlag = (item?.isActive ?? item?.active ?? null);
            const isActive = activeFlag !== null ? !!activeFlag : statusVal === "active";

            const salesFlag = (item?.isSalesItem ?? item?.isSellable ?? item?.sellable ?? null);
            const isSales = salesFlag !== null ? !!salesFlag : (item?.salesDesc ?? item?.sellingPrice ?? null) !== null;

            const purchaseFlag = (item?.isPurchaseItem ?? item?.isPurchasable ?? item?.purchasable ?? null);
            const isPurchases = purchaseFlag !== null ? !!purchaseFlag : (item?.purchaseDesc ?? item?.costPrice ?? item?.rate ?? null) !== null;

            const typeVal = (item?.type ?? item?.itemType ?? "").toString().toLowerCase();
            const isService = typeVal === "service" || typeVal === "services";

            const specialIncludes = {
                Active: isActive,
                Inactive: !isActive,
                Sales: isSales,
                Purchases: isPurchases,
                Services: isService,
            };

            const matchesCategory =
                categoryFilter === "All" ||
                (categoryFilter in specialIncludes
                    ? specialIncludes[categoryFilter]
                    : category === categoryFilter);

            const unit = getUnitValue(item);
            const matchesUnit = unitFilter === "All" || unit === unitFilter;
            const stock = Number(item?.stockOnHand ?? item?.stock ?? item?.quantity ?? 0);

            const matchesStock =
                stockFilter === "All" ||
                (stockFilter === "Out of Stock" && stock === 0) ||
                (stockFilter === "Low Stock" && stock > 0 && stock <= 5) ||
                (stockFilter === "In Stock" && stock > 5);

            return matchesSearch && matchesCategory && matchesUnit && matchesStock;
        });
    }, [items, search, categoryFilter, unitFilter, stockFilter]);

    // ✅ PDF States
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const tempContainerRef = useRef(null);

    const prepareItemRow = (item) => ({
        name: pickField(item, "name", "itemName", "title"),
        purchaseDesc: pickField(item, "purchaseDesc", "description"),
        costPrice: pickField(item, "costPrice", "rate"),
        salesDesc: pickField(item, "salesDesc", "details"),
        rate: pickField(item, "rate", "sellingPrice"),
        hsn: pickField(item, "hsn", "sac"),
        usageUnit: pickField(item, "usageUnit", "unit"),
    });

    const exportExcel = () => {
        const normalized = filteredItems.map((row) => {
            const formatted = prepareItemRow(row);
            return {
                Name: formatted.name,
                "Purchase Description": formatted.purchaseDesc,
                "Purchase Rate": formatted.costPrice,
                Description: formatted.salesDesc,
                Rate: formatted.rate,
                "HSN/SAC": formatted.hsn,
                "Usage Unit": formatted.usageUnit,
            };
        });

        const ws = XLSX.utils.json_to_sheet(normalized);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Items");
        XLSX.writeFile(wb, "Items.xlsx");
    };

    // ✅ Generate PDF
    const generatePDF = async () => {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-2000px";
        container.style.left = "-2000px";
        container.style.width = "210mm";
        container.style.background = "#fff";
        container.style.padding = "20px";

        const rowsMarkup = filteredItems
            .map((item) => {
                const formatted = prepareItemRow(item);
                return `
                        <tr>
                            <td class="c-name">${formatted.name}</td>
                            <td class="c-pdesc">${formatted.purchaseDesc}</td>
                            <td class="c-prate num">${formatted.costPrice}</td>
                            <td class="c-sdesc">${formatted.salesDesc}</td>
                            <td class="c-rate num">${formatted.rate}</td>
                            <td class="c-hsn">${formatted.hsn}</td>
                            <td class="c-unit">${formatted.usageUnit}</td>
                        </tr>`;
            })
            .join("");

        container.innerHTML = `
            <style>
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
                th { background: #f2f2f2; font-weight: 600; }
                .num { text-align: right; }
                .c-name { word-break: break-word; }
                .c-pdesc { word-break: break-word; }
                .c-prate { }
                .c-sdesc { word-break: break-word; }
                .c-rate { }
                .c-hsn { word-break: break-all; }
                .c-unit { word-break: break-word; }
                .title { text-align: center; margin-bottom: 12px; font-size: 16px; }
            </style>
            <h2 class="title">ITEMS REPORT</h2>
            <table>
                <thead>
                    <tr>
                        <th class="c-name">NAME</th>
                        <th class="c-pdesc">PURCHASE DESCRIPTION</th>
                        <th class="c-prate">PURCHASE RATE</th>
                        <th class="c-sdesc">DESCRIPTION</th>
                        <th class="c-rate">RATE</th>
                        <th class="c-hsn">HSN/SAC</th>
                        <th class="c-unit">USAGE UNIT</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsMarkup}
                </tbody>
            </table>
        `;

        document.body.appendChild(container);
        tempContainerRef.current = container;

        const canvas = await html2canvas(container, { scale: 2 });
        const img = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);

        setPdfUrl(url);
        setShowPreview(true);

        document.body.removeChild(container);
    };

    // ✅ PDF Actions
    const handlePdfAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl);
        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "ItemsReport.pdf";
            a.click();
        }
        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }
        if (action === "email") {
            window.location.href = `mailto:?subject=Items Report&body=Find the attached report`;
        }
    };

    // ✅ Table Columns
    const columns = [
        {
            name: "NAME",
            selector: (row) => pickField(row, "name", "itemName", "title"),
            sortable: true,
        },
        {
            name: "PURCHASE DESCRIPTION",
            selector: (row) => pickField(row, "purchaseDesc", "description"),
            wrap: true,
        },
        {
            name: "PURCHASE RATE",
            selector: (row) => pickField(row, "costPrice", "rate"),
            cell: (row) => (
                <div style={{ textAlign: "right" }}>{pickField(row, "costPrice", "rate")}</div>
            ),
        },
        {
            name: "DESCRIPTION",
            selector: (row) => pickField(row, "salesDesc", "details"),
            wrap: true,
        },
        {
            name: "RATE",
            selector: (row) => pickField(row, "rate", "sellingPrice"),
            cell: (row) => (
                <div style={{ textAlign: "right" }}>{pickField(row, "rate", "sellingPrice")}</div>
            ),
        },
        {
            name: "HSN/SAC",
            selector: (row) => pickField(row, "hsn", "sac"),
        },
        { name: "USAGE UNIT", selector: (row) => pickField(row, "usageUnit", "unit") },
    ];

    return (
        <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4">
            <div
                className="d-flex justify-content-between align-items-center pt-3 pb-2"
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    background: "#f8f9fa",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.10)",
                }}
            >
                <h5 className="fw-semibold mb-0"><i className="fa fa-box me-2" aria-hidden="true"></i>All Items</h5>

                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-sm"
                        disabled={selectedRows.length === 0 || deleteMutation.isLoading}
                        onClick={handleDelete}
                    >
                        <i className="bi bi-trash"></i> Delete
                    </button>

                    {/* ✅ ✅ ✅ EXCEL BUTTON ADDED */}
                    <button
                        className="btn btn-success btn-sm"
                        onClick={exportExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    {/* PRINT */}
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={generatePDF}
                    >
                        <i className="bi bi-printer"></i>
                    </button>

                    {/* NEW */}
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate("/newitem")}
                    >
                        + New
                    </button>
                </div>
            </div>

            {/* ✅ FILTER BAR */}
            <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
                <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                        <label className="small fw-semibold mb-1">Category</label>
                        <select
                            className="form-select form-select-sm"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {categoryOptions.map((option) => (
                                <option key={`category-${option}`} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-2">
                        <label className="small fw-semibold mb-1">Unit</label>
                        <select
                            className="form-select form-select-sm"
                            value={unitFilter}
                            onChange={(e) => setUnitFilter(e.target.value)}
                        >
                            {unitOptions.map((option) => (
                                <option key={`unit-${option}`} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* <div className="col-md-3">
                        <label className="small fw-semibold mb-1">Stock Status</label>
                        <select
                            className="form-select form-select-sm"
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                        >
                            <option>All</option>
                            <option>Out of Stock</option>
                            <option>Low Stock</option>
                            <option>In Stock</option>
                        </select>
                    </div> */}

                    <div className="col-md-4">
                        <label className="small fw-semibold mb-1">Search</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ✅ TABLE */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2"
                style={{ minHeight: "60vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredItems}
                    selectableRows
                    selectableRowsHighlight
                    onSelectedRowsChange={(state) =>
                        setSelectedRows(state.selectedRows)
                    }
                    onRowClicked={handleRowClick}
                    pagination
                    paginationPerPage={entriesPerPage}
                    paginationRowsPerPageOptions={[ 25, 50, 100]}
                    onChangeRowsPerPage={(newPerPage) => {
                        setEntriesPerPage(newPerPage);
                        setCurrentPage(1);
                    }}
                    fixedHeader
                    fixedHeaderScrollHeight="60vh"
                    highlightOnHover
                    pointerOnHover
                    responsive
                    striped
                    dense
                    persistTableHead
                    progressPending={isLoading}
                    customStyles={{
                        headCells: {
                            style: {
                                fontWeight: "bold",
                                padding: "12px",
                                // verticalAlign: "middle",
                                fontSize: "12px",
                                width: "auto",
                                whiteSpace: "nowrap",
                            },
                        },
                        cells: {
                            style: {
                                padding: "12px",
                                fontSize: "12px",
                                width: "auto",
                                whiteSpace: "nowrap",
                            },
                        },
                        tableWrapper: {
                            style: {
                                minHeight: "60vh",
                            },
                        },
                    }}
                    noDataComponent={<EmptyStateMessage title="Items" />}
                />
            </div>

            {/* ✅ PDF MODAL */}
            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="Items Report"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </div>
    );
};

export default Items;
