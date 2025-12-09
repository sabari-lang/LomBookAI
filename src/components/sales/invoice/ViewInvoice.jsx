import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Button } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import { getInvoices, deleteInvoice } from "../api";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import Popup from "../../common/popup/Popup";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";


const ViewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Filters & UI state (keeps layout unchanged)
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInvoice, setShareInvoice] = useState(null);

  // PDF preview state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, perPage]);

  // ================================
  // Fetch Invoices (React Query + server pagination)
  // ================================
  const { data: fetchedInvoices, isLoading } = useQuery({
    queryKey: ["invoices", page, perPage],
    queryFn: () =>
      getInvoices({
        Page: page,
        PageSize: perPage,
      }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Invoices"),
  });

  const rawInvoices = extractItems(fetchedInvoices) ?? [];
  // map backend -> UI fields (keep original layout fields)
  const invoices = rawInvoices.map((o) => ({
    id: o.id,
    date: (o.invoiceDate || o.date || "").split?.("T")[0] ?? "",
    invoiceNumber: o.invoiceNumber ?? o.number ?? o.invoiceNo ?? "",
    orderNumber: o.orderNumber ?? o.orderNo ?? o.order_number ?? o.order?.number ?? "",
    referenceNumber: o.referenceNumber ?? o.reference ?? o.ref ?? "",
    customerName: o.customerName ?? o.party ?? "",
    amount: o.totalAmount ?? o.amount ?? 0,
    status: o.status ?? "Draft",
    paymentStatus: o.paymentStatus ?? "Pending",
    dueDate: o.dueDate ? o.dueDate.split("T")[0] : "",
    _original: o,
  }));

  const { totalCount } = extractPagination(fetchedInvoices);
  const totalRows = Number.isFinite(totalCount) ? totalCount : invoices.length;

  // ================================
  // Delete mutation
  // ================================
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      setSelectedIds([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Invoice"),
  });

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one invoice to delete.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected invoices?")) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ================================
  // Filter logic (search + status + date range)
  // ================================
  const filteredInvoices = useMemo(() => {
    const text = (filterText || "").trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return invoices.filter((inv) => {
      // date check
      const invDate = inv.date ? new Date(inv.date) : null;
      const withinDate = (!from || (invDate && invDate >= from)) && (!to || (invDate && invDate <= to));

      // search
      const matchesSearch =
        !text ||
        (inv.customerName || "").toLowerCase().includes(text) ||
        (inv.invoiceNumber || "").toLowerCase().includes(text) ||
        (inv.referenceNumber || "").toLowerCase().includes(text);

      // status
      const matchesStatus = statusFilter === "All" || (inv.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus && withinDate;
    });
  }, [invoices, filterText, statusFilter, fromDate, toDate]);

  // ================================
  // Totals (Sales / Received / Balance) — same logic as your original
  // ================================
  const { totalSales, totalReceived, totalBalance } = useMemo(() => {
    let total = 0,
      received = 0,
      balance = 0;

    filteredInvoices.forEach((inv) => {
      total += Number(inv.amount ?? 0);
      if ((inv.status || "").toLowerCase() === "paid") received += Number(inv.amount ?? 0);
      else if ((inv.status || "").toLowerCase() === "partially paid") {
        // approximate (keep your previous heuristic)
        const rec = Number(inv.amount ?? 0) * 0.8;
        received += rec;
        balance += Number(inv.amount ?? 0) - rec;
      } else balance += Number(inv.amount ?? 0);
    });

    return { totalSales: total, totalReceived: received, totalBalance: balance };
  }, [filteredInvoices]);

  // ================================
  // Export Excel
  // ================================
  const exportExcel = () => {
    const normalized = filteredInvoices.map((inv) => ({
      Date: inv.date,
      "Invoice No": inv.invoiceNumber,
      "Reference No": inv.referenceNumber,
      "Customer Name": inv.customerName,
      Amount: inv.amount,
      Status: inv.status,
      "Payment Status": inv.paymentStatus,
      "Due Date": inv.dueDate,
    }));
    const ws = XLSX.utils.json_to_sheet(normalized);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, "Invoices.xlsx");
  };

  // ================================
  // Clean PDF generation (fixed layout)
  // ================================
  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.width = "100%";
    div.style.background = "white";
    div.style.fontFamily = "Arial, sans-serif";

    const tableStyle = `width:100%;border-collapse:collapse;font-size:12px;`;
    const thStyle =
      "border:1px solid #000;padding:6px;background:#f1f1f1;font-weight:bold;text-align:left;";
    const tdStyle = "border:1px solid #000;padding:6px;";

    div.innerHTML = `
      <h2 style="text-align:center; margin-bottom: 12px;">Invoices Report</h2>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle} width:11%;">Date</th>
            <th style="${thStyle} width:18%;">Invoice#</th>
            <th style="${thStyle} width:18%;">Reference#</th>
            <th style="${thStyle} width:28%;">Customer</th>
            <th style="${thStyle} width:10%;">Status</th>
            <th style="${thStyle} width:10%;">Amount</th>
            <th style="${thStyle} width:12%;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${filteredInvoices
        .map(
          (o) => `
            <tr>
              <td style="${tdStyle}">${o.date}</td>
              <td style="${tdStyle}">${o.invoiceNumber}</td>
              <td style="${tdStyle}">${o.referenceNumber}</td>
              <td style="${tdStyle}">${o.customerName}</td>
              <td style="${tdStyle}">${o.status}</td>
              <td style="${tdStyle}">₹ ${Number(o.amount ?? 0).toLocaleString()}</td>
              <td style="${tdStyle}">${o.dueDate}</td>
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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const pageHeight = pageWidth * ratio;
    pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setShowPreview(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (!pdfUrl) return;
    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "Invoices.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  // ================================
  // Row actions (keep original behavior)
  // ================================
  const handlePrint = (e, invoice) => {
    e.stopPropagation();
    navigate("/sales-invoice", { state: invoice._original ?? invoice });
  };

  const handleShare = (e, invoice) => {
    e.stopPropagation();
    setShareInvoice(invoice._original ?? invoice);
    setShowShareModal(true);
  };

  // ================================
  // Columns (keep UI exactly same)
  // ================================
  const columns = [
    { name: "DATE", selector: (row) => row.date, sortable: true },
    {
      name: "INVOICE#",
      selector: (row) => row.invoiceNumber,
      sortable: true,
      cell: (row) => (
        <span
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/newinvoice", { state: row._original ?? row })}
        >
          {row.invoiceNumber}
        </span>
      )
    },
    { name: "ORDER NUMBER", selector: (row) => row.orderNumber ?? "", sortable: true },
    { name: "CUSTOMER NAME", selector: (row) => row.customerName, sortable: true },
    {
      name: "STATUS",
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`badge rounded-pill ${row.status === "Paid" ? "bg-success" : row.status === "Unpaid" ? "bg-danger" : "bg-warning text-dark"}`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
    { name: "DUE DATE", selector: (row) => row.dueDate || "", sortable: true },
    {
      name: "AMOUNT",
      selector: (row) => `₹ ${Number(row.amount ?? 0).toLocaleString()}`,
      right: true,
      sortable: true,
    },
    {
      name: "Actions",
      minWidth: "220px",  // 👈 Added min-width here
      cell: (row) => (
        <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-sm btn-outline-secondary" onClick={(e) => handlePrint(e, row)}>
            <i className="bi bi-printer" style={{ fontSize: "12px" }}></i>
          </button>

          <button className="btn btn-sm btn-outline-primary" onClick={(e) => handleShare(e, row)}>
            <i className="bi bi-share" style={{ fontSize: "12px" }}></i>
          </button>

          {/* Convert to Payment */}
          <button
            className="btn btn-sm btn-outline-success"
            title="Record Payment"
            onClick={(e) => {
              e.stopPropagation();
              try {
                const original = row._original ?? row;
                if (!original || typeof original !== "object") throw new Error("Invalid invoice data");
                const id = original?.id;
                if (!id) throw new Error("Invoice id missing");

                navigate("/newpaymentmade", {
                  state: {
                    ...original,
                    isNew: true,
                    sourceInvoiceId: id,
                    sourceInvoiceNumber: original?.invoiceNumber ?? original?.invoiceNo,
                    sourceType: "invoice",
                    conversionTimestamp: new Date().toISOString(),
                  },
                });
              } catch (err) {
                console.error("Convert -> Payment error", err);
                handleProvisionalError(err, "Convert to Payment", err?.message || "Failed to navigate");
              }
            }}
          >
            <i className="bi bi-currency-dollar" style={{ fontSize: "12px" }}></i>
          </button>

          {/* Convert to Credit Note */}
          <button
            className="btn btn-sm btn-outline-warning"
            title="Create Credit Note"
            onClick={(e) => {
              e.stopPropagation();
              try {
                const original = row._original ?? row;
                const id = original?.id;
                if (!id) throw new Error("Invoice id missing");

                navigate("/newcreditnotes", {
                  state: {
                    ...original,
                    isNew: true,
                    sourceInvoiceId: id,
                    sourceInvoiceNumber: original?.invoiceNumber ?? original?.invoiceNo,
                    sourceType: "invoice",
                    conversionTimestamp: new Date().toISOString(),
                  },
                });
              } catch (err) {
                console.error("Convert -> Credit Note error", err);
                handleProvisionalError(err, "Convert", err?.message || "Failed to create credit note");
              }
            }}
          >
            <i className="bi bi-receipt-cutoff" style={{ fontSize: "12px" }}></i>
          </button>

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Are you sure you want to delete this invoice?")) return;
              try {
                await deleteMutation.mutateAsync(row.id);
              } catch (err) {
                console.error(err);
              }
            }}
          >
            <i className="bi bi-trash" style={{ fontSize: "12px" }}></i>
          </button>
        </div>
      ),
      ignoreRowClick: true,
      center: true,
      allowOverflow: true,
    }

  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#f9fafb",
        fontWeight: "600",
        color: "#333",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
    cells: {
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
    rows: { style: { fontSize: "14px" } },
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
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
        <h5 className="fw-semibold mb-0"><i className="bi bi-file-earmark-text me-2"></i>Invoices</h5>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel"></i>
          </button>

          <button className="btn btn-outline-secondary btn-sm" onClick={generatePDF}>
            <i className="bi bi-printer"></i>
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={selectedIds.length === 0 || deleteMutation.isLoading}
          >
            <i className="bi bi-trash"></i> Delete
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newinvoice")}
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">Search Invoice</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer or invoice number"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partially Paid</option>
              <option>Draft</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">From Date</label>
            <input type="date" className="form-control form-control-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">To Date</label>
            <input type="date" className="form-control form-control-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="col-lg-4 col-md-12">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Totals</h6>
              <h4 className="fw-bold text-dark mb-1">₹ {totalSales.toLocaleString()}</h4>
              <div className="small text-muted">
                Received: <span className="fw-semibold text-dark">₹ {totalReceived.toLocaleString()}</span> | Balance:{" "}
                <span className="fw-semibold text-dark">₹ {totalBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredInvoices}
          selectableRows={location.pathname !== "/reports"}
          selectableRowsHighlight
          onSelectedRowsChange={(state) =>
            setSelectedIds(state.selectedRows.map((r) => r.id))
          }
          onRowClicked={(row) =>
            navigate("/newinvoice", { state: row._original ?? row })
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationDefaultPage={page}
          onChangePage={(p) => {
            setPage(p);
          }}
          onChangeRowsPerPage={(newPerPage, currentPage) => {
            setPerPage(newPerPage);
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
          noDataComponent={<EmptyStateMessage title="Invoice" />}
        />

      </div>

      {/* SHARE POPUP (keeps original) */}
      <Popup show={showShareModal} onClose={() => setShowShareModal(false)} invoice={shareInvoice} type="salesInvoice" />


      <PdfPreviewModal show={showPreview} pdfUrl={pdfUrl} title="Invoices Report" onClose={() => setShowPreview(false)} onAction={handlePdfAction} />
    </div>
  );
};

export default ViewInvoice;
