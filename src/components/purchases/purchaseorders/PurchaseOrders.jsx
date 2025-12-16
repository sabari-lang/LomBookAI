import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";

import { deletePurchaseOrder, getPurchaseOrders } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";

const formatAmount = (value) =>
  `₹ ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN");
};

const PurchaseOrders = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    setSelected([]);
  }, [page, perPage]);

  const { data: fetchedOrders, isLoading } = useQuery({
    queryKey: ["purchaseOrders", page, perPage],
    queryFn: () => getPurchaseOrders({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Purchase Orders"),
  });

  // const orders = extractItems(fetchedOrders);
  const orders = extractItems(fetchedOrders);
  const { totalCount } = extractPagination(fetchedOrders);
  const totalRows = Number.isFinite(totalCount) ? totalCount : orders.length;

  // Mini-dashboard counts
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + Number(o?.amount ?? o?.total ?? 0), 0);
  const openCount = orders.filter((o) => o?.status === "Open").length;
  const receivedCount = orders.filter((o) => o?.status === "Received").length;

  const filteredOrders = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return orders;
    return orders.filter((row) => {
      const parts = [
        row?.purchaseOrderNo ?? row?.poNumber ?? "",
        row?.vendorName ?? "",
        row?.status ?? "",
        String(row?.amount ?? ""),
        row?.paymentTerms ?? "",
        row?.reference ?? "",
      ];
      return parts.join(" ").toLowerCase().includes(text);
    });
  }, [orders, filterText]);

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchaseOrders"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Purchase Order"),
  });

  const handleDelete = async () => {
    if (selected.length === 0) return alert("Select orders to delete.");
    if (!window.confirm("Are you sure you want to delete selected purchase orders?")) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Purchase Order");
    }
  };

  const exportExcel = () => {
    // Only export the visible columns in the correct order, with safe fallbacks
    const exportData = filteredOrders.map((row) => ({
      "DATE": formatDate(row?.date ?? row?.createdAt),
      "PURCHASE ORDER#": row?.purchaseOrderNo ?? row?.poNumber ?? "",
      "REFERENCE#": row?.reference ?? row?.referenceNo ?? "",
      "VENDOR NAME": row?.vendorName ?? (row?.vendor?.name ?? ""),
      "STATUS": row?.status ?? "",
      "AMOUNT": row?.amount ?? row?.total ?? 0,
      "DELIVERY DATE": formatDate(row?.deliveryDate ?? row?.delivery_date ?? ""),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PurchaseOrders");
    XLSX.writeFile(wb, "PurchaseOrders_Report.xlsx");
  };

  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-3000px";
    div.style.left = "-3000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    // Compact table, no fixed/min-widths, smaller font
    const tableStyle = `
      <style>
        .po-pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .po-pdf-table th, .po-pdf-table td { border: 1px solid #000; padding: 4px 3px; text-align: left; }
        .po-pdf-table th { background: #f2f2f2; }
        .po-pdf-table td.currency { text-align: right; }
        .po-pdf-title { text-align: center; margin: 0 0 6px 0; padding: 0; font-size: 12px; }
        body, html { margin: 0; padding: 0; }
      </style>
    `;

    div.innerHTML = `
      ${tableStyle}
      <h2 class=\"po-pdf-title\">PURCHASE ORDER REPORT</h2>
      <table class=\"po-pdf-table\">
        <thead>
          <tr>
            <th>DATE</th>
            <th>PURCHASE ORDER#</th>
            <th>REFERENCE#</th>
            <th>VENDOR NAME</th>
            <th>STATUS</th>
            <th>AMOUNT</th>
            <th>DELIVERY DATE</th>
          </tr>
        </thead>
        <tbody>
          ${filteredOrders
            .map(
              (row) => `
              <tr>
                <td>${formatDate(row?.date ?? row?.createdAt)}</td>
                <td>${row?.purchaseOrderNo ?? row?.poNumber ?? ""}</td>
                <td>${row?.reference ?? row?.referenceNo ?? ""}</td>
                <td>${row?.vendorName ?? (row?.vendor?.name ?? "")}</td>
                <td>${row?.status ?? ""}</td>
                <td class=\"currency\">${formatAmount(row?.amount ?? row?.total ?? 0)}</td>
                <td>${formatDate(row?.deliveryDate ?? row?.delivery_date ?? "")}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    document.body.appendChild(div);

    const canvas = await html2canvas(div, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, width, height);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    setPdfUrl(url);
    setShowPdf(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "PurchaseOrderReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
    if (action === "email") {
      window.location.href = `mailto:?subject=Purchase Order Report`;
    }
  };

  const columns = [
    {
      name: "DATE",
      selector: (row) => formatDate(row?.date ?? row?.createdAt),
      sortable: true,
    },
    {
      name: "PURCHASE ORDER#",
      selector: (row) => row?.purchaseOrderNo ?? row?.poNumber ?? "",
      sortable: true,
      cell: (row) => (
        <span className="text-primary text-decoration-underline" style={{ cursor: "pointer" }}
          onClick={e => {
            e.preventDefault();
            navigate("/purchase-order-report", { state: row._original ?? row });
          }}
        >
          {row?.purchaseOrderNo ?? row?.poNumber ?? ""}
        </span>
      ),
    },
    {
      name: "REFERENCE#",
      selector: (row) => row?.reference ?? row?.referenceNo ?? "",
      sortable: true,
    },
    {
      name: "VENDOR NAME",
      selector: (row) => row?.vendorName ?? (row?.vendor?.name ?? ""),
      sortable: true,
    },
    {
      name: "STATUS",
      selector: (row) => row?.status ?? "",
      sortable: true,
      cell: (row) => (
        <span className={`badge ${
          row?.status === "Open"
            ? "bg-primary"
            : row?.status === "Issued"
              ? "bg-info text-dark"
              : row?.status === "Received"
                ? "bg-success"
                : "bg-secondary text-dark"
        }`}>
          {row?.status ?? ""}
        </span>
      ),
    },
    {
      name: "AMOUNT",
      selector: (row) => formatAmount(row?.amount ?? row?.total ?? 0),
      right: true,
      sortable: true,
    },
    {
      name: "DELIVERY DATE",
      selector: (row) => formatDate(row?.deliveryDate ?? row?.delivery_date ?? ""),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="btn p-0 border-0 bg-transparent"
          onClick={e => {
            e.stopPropagation();
            navigate("/purchase-order-report", { state: row._original ?? row });
          }}
          title="View Report"
        >
          <i className="bi bi-eye text-primary" style={{ fontSize: 18 }}></i>
        </button>
      ),
      center: true,
    },
  ];

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.10)",
        }}
      >
        <h5 className="fw-semibold m-0"><i className="bi bi-box-seam me-2"></i>Purchase Orders</h5>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" title="Export Excel" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel" />
          </button>

          <button className="btn btn-danger btn-sm" title="Export PDF" onClick={generatePDF}>
            <i className="bi bi-filetype-pdf" />
          </button>

          <button
            className="btn btn-danger btn-sm"
            disabled={selected.length === 0 || deleteMutation.isLoading}
            onClick={handleDelete}
          >
            <i className="bi bi-trash" />
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => navigate("/newpurchaseorder")}>
            + New Purchase Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">Search</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by PO no, vendor, status"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Orders</h6>
              <h4 className="fw-bold text-dark mb-1">{totalOrders}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Status Summary</h6>
              <div className="small text-muted mb-1">
                Open: <span className="fw-semibold text-primary">{openCount}</span>
              </div>
              <div className="small text-muted">
                Received: <span className="fw-semibold text-success">{receivedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredOrders}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelected(state.selectedRows.map((row) => row?.id))}
          onRowClicked={(row) => navigate("/newpurchaseorder", { state: row })}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(r) => {
            setPerPage(r);
            setPage(1);
          }}
          fixedHeader
          // fixedHeaderScrollHeight="60vh"
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
                verticalAlign: "middle",
              },
            },
            cells: {
              style: {
                padding: "12px",
              },
            },
            tableWrapper: {
              style: {
                minHeight: "60vh",
              },
            },
          }}
          noDataComponent={<EmptyStateMessage title="Purchase Orders" />}
        />
      </div>

      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Purchase Order Report"
      />
    </div>
  );
};

export default PurchaseOrders;
