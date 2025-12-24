import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Button } from "react-bootstrap";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { getRecurringInvoices, deleteRecurringInvoice } from "../api";
import moment from "moment";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

/* ---------------------- No Data Component ------------------------ */
const NoDataComponent = () => (
  <div className="text-center py-5">
    <i
      className="bi bi-exclamation-triangle text-danger fs-1 mb-2 d-block"
      style={{ opacity: 0.8 }}
    ></i>
    <h6 className="fw-bold text-secondary mb-1">No Recurring Invoices Found</h6>
    <p className="text-muted small mb-0">
      We could not find any recurring invoices.
    </p>
  </div>
);

const ViewRecurringInvoice = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    setSelectedRows([]);
  }, [page, perPage]);

  // ============================================
  // FETCH DATA (React Query)
  // ============================================
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ["recurringInvoices", page, perPage],
    queryFn: () =>
      getRecurringInvoices({
        Page: page,
        PageSize: perPage,
      }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) =>
      handleProvisionalError(error, "Fetch Recurring Invoices"),
  });

  const recurringItems = extractItems(fetchedData) ?? [];

  // ============================================
  // MAP BACKEND → UI
  // ============================================
  const recurringInvoices = recurringItems.map((o) => ({
    id: o.id,
    customerName: o.customerName ?? "",
    profileName: o.profileName ?? "",
    orderNumber: o.orderNumber ?? "",
    frequency: o.repeatEvery ?? "",
    startOn: o.startOn ? moment(o.startOn).format("YYYY-MM-DD") : "",
    endsOn: o.endsOn ? moment(o.endsOn).format("YYYY-MM-DD") : "",
    status: o.status ?? "Active",
    amount: o.totalAmount ?? 0,
    _original: o,
  }));

  const { totalCount } = extractPagination(fetchedData);
  const totalRows = Number.isFinite(totalCount)
    ? totalCount
    : recurringInvoices.length;

  // Mini-dashboard counts
  const totalRecurring = recurringInvoices.length;
  const totalAmount = recurringInvoices.reduce((sum, r) => sum + Number(r?.amount ?? 0), 0);
  const activeCount = recurringInvoices.filter((r) => r?.status === "Active").length;
  const pausedCount = recurringInvoices.filter((r) => r?.status === "Paused").length;

  // ============================================
  // DELETE MUTATION
  // ============================================
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecurringInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringInvoices"]);
      setSelectedRows([]);
    },
    onError: (err) =>
      handleProvisionalError(err, "Delete Recurring Invoice"),
  });

  const handleDelete = async () => {
    if (selectedRows.length === 0)
      return notifyInfo("Please select at least one recurring invoice.");

    const confirmed = await confirm("Are you sure you want to delete selected items?");
    if (!confirmed) return;

    try {
      await Promise.all(selectedRows.map((r) => deleteMutation.mutateAsync(r.id)));
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================
  // FILTER
  // ============================================
  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return recurringInvoices.filter(
      (i) =>
        i.customerName.toLowerCase().includes(s) ||
        i.profileName.toLowerCase().includes(s) ||
        i.frequency.toLowerCase().includes(s)
    );
  }, [recurringInvoices, searchTerm]);

  // ============================================
  // EXCEL EXPORT
  // ============================================
  const exportExcel = () => {
    const dataToExport = filteredData.map((row) => ({
      "Customer Name": row.customerName,
      "Profile Name": row.profileName,
      "Order Number": row.orderNumber,
      "Frequency": row.frequency,
      "Start Date": row.startOn,
      "End Date": row.endsOn,
      "Status": row.status,
      "Amount": row.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RecurringInvoices");
    XLSX.writeFile(wb, "RecurringInvoices.xlsx");
  };

  // ============================================
  // PDF EXPORT
  // ============================================
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.width = "100%";
    div.style.background = "white";
    div.style.fontFamily = "Arial, sans-serif";

    const tableStyle = `
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      `;
    const thStyle = `
        border: 1px solid #000;
        padding: 6px;
        background: #f1f1f1;
        font-weight: bold;
        text-align: left;
      `;
    const tdStyle = `
        border: 1px solid #000;
        padding: 6px;
      `;

    div.innerHTML = `
        <h2 style="text-align:center;margin-bottom:10px;">Recurring Invoices</h2>
        <table style="${tableStyle}">
          <thead>
            <tr>
              <th style="${thStyle}">Customer Name</th>
              <th style="${thStyle}">Profile Name</th>
              <th style="${thStyle}">Order Number</th>
              <th style="${thStyle}">Frequency</th>
              <th style="${thStyle}">Start Date</th>
              <th style="${thStyle}">End Date</th>
              <th style="${thStyle}">Status</th>
              <th style="${thStyle}">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${filteredData
        .map(
          (r) => `
              <tr>
                <td style="${tdStyle}">${r.customerName}</td>
                <td style="${tdStyle}">${r.profileName}</td>
                <td style="${tdStyle}">${r.orderNumber}</td>
                <td style="${tdStyle}">${r.frequency}</td>
                <td style="${tdStyle}">${r.startOn}</td>
                <td style="${tdStyle}">${r.endsOn}</td>
                <td style="${tdStyle}">${r.status}</td>
                <td style="${tdStyle}">₹ ${r.amount.toLocaleString()}</td>
              </tr>
            `
        )
        .join("")}
          </tbody>
        </table>
      `;

    document.body.appendChild(div);
    const canvas = await html2canvas(div, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 0, 0, 210, 297);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setShowPreview(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "RecurringInvoices.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  // ============================================
  // COLUMNS (KEEP EXACT LAYOUT YOU PROVIDED)
  // ============================================
  const columns = [
    {
      name: "CUSTOMER NAME",
      selector: (row) => row.customerName,
      sortable: true,
    },
    {
      name: "PROFILE NAME",
      selector: (row) => row.profileName,
      sortable: true,
    },
    {
      name: "ORDER NUMBER",
      selector: (row) => row.orderNumber,
      sortable: true,
    },
    {
      name: "FREQUENCY",
      selector: (row) => row.frequency,
      sortable: true,
    },
    {
      name: "START DATE",
      selector: (row) => row.startOn,
      sortable: true,
    },
    {
      name: "END DATE",
      selector: (row) => row.endsOn,
      sortable: true,
    },
    {
      name: "STATUS",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span
          className={`badge rounded-pill ${row.status === "Active"
            ? "bg-success"
            : row.status === "Paused"
              ? "bg-warning text-dark"
              : "bg-danger"
            }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "AMOUNT",
      selector: (row) => `₹ ${row.amount.toLocaleString()}`,
      sortable: true,
      right: true,
    },
    {
      name: "ACTIONS",
      width: "130px",
      right: true,
      ignoreRowClick: true,
      cell: (row) => (
        <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-outline-primary"
            title="View Report"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/recurring-invoice-report", { state: row._original ?? row });
            }}
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      ),
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
          borderBottom: "1px solid rgba(0, 0, 0, 0.10)",
        }}
      >
        <h5 className="fw-semibold mb-0"><i className="bi bi-calendar2-check me-2"></i>Recurring Invoices</h5>

        <div className="d-flex gap-2">
          <Button variant="success" size="sm" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel"></i>
          </Button>

          <Button variant="secondary" size="sm" onClick={generatePDF}>
            <i className="bi bi-filetype-pdf"></i>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={selectedRows.length === 0}
          >
            <i className="bi bi-trash"></i>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm"
            onClick={() => navigate("/newcurring")}
          >
            <i className="bi bi-plus-circle"></i> New Recurring Invoice
          </Button>
        </div>
      </div>

      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Recurring Invoice
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer, profile name, or frequency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Recurring</h6>
              <h4 className="fw-bold text-dark mb-1">{totalRecurring}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Status Summary</h6>
              <div className="small text-muted mb-1">
                Active: <span className="fw-semibold text-success">{activeCount}</span>
              </div>
              <div className="small text-muted">
                Paused: <span className="fw-semibold text-warning">{pausedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredData}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
          onRowClicked={(row) => navigate("/newcurring", { state: row._original ?? row })}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationDefaultPage={page}
          paginationRowsPerPageOptions={[25, 50, 100]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(newPerPage) => {
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
          noDataComponent={<EmptyStateMessage title="Recurring Invoices" />}
        />
      </div>

      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Recurring Invoices"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default ViewRecurringInvoice;
