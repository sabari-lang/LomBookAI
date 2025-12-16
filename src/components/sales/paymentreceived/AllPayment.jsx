import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";


import {
  getPaymentsReceived,          // GET
  deletePaymentReceived         // DELETE
} from "../api";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";


// ---------------- SAFE extractItems ----------------
const extractItems = (raw) => {
  if (!raw || typeof raw !== "object") return [];
  return raw.items ?? raw.data?.items ?? raw.data ?? [];
};

// ---------------- SAFE extractPagination ----------------
const extractPagination = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { page: 1, pageSize: 10, totalCount: 0, totalPages: 1 };
  }
  return {
    page: raw.page ?? raw.data?.page ?? 1,
    pageSize: raw.pageSize ?? raw.data?.pageSize ?? 10,
    totalCount: raw.totalCount ?? raw.data?.totalCount ?? 0,
    totalPages: raw.totalPages ?? raw.data?.totalPages ?? 1,
  };
};

// ---------------- NORMALIZE FIELDS ----------------
const normalizePayment = (o = {}) => ({
  id: o.id ?? o._id ?? "",
  date: o.date ?? o.paymentDate ?? "",
  paymentNumber:
    o.paymentNumber ?? o.paymentNo ?? o.receiptNo ?? o.number ?? "",
  referenceNumber:
    o.referenceNumber ?? o.reference ?? "",
  customerName:
    o.customerName ?? o.clientName ?? o.partyName ?? "",
  invoiceNumber:
    o.invoiceNumber ?? o.invoiceNo ?? "",
  mode: o.mode ?? o.paymentMode ?? "",
  amount: o.amount ?? o.totalAmount ?? 0,
  unusedAmount: o.unusedAmount ?? o.balanceAmount ?? 0,
  status: o.status ?? "Draft",
  _original: o,
});


const AllPayment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------------- STATE ----------------
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  // ---------------- FETCH ----------------
  const { data, isLoading } = useQuery({
    queryKey: ["payments-received", page, perPage],
    queryFn: () =>
      getPaymentsReceived({
        Page: page,
        PageSize: perPage,
      }),
    keepPreviousData: true,
    retry: 1,
  });

  const rawItems = extractItems(data);
  const items = rawItems.map(normalizePayment);

  const { totalCount } = extractPagination(data);
  const totalRows = Number(totalCount) || 0;

  // Mini-dashboard counts
  const totalPayments = items.length;
  const totalAmount = items.reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);
  const totalUnused = items.reduce((sum, p) => sum + Number(p?.unusedAmount ?? 0), 0);


  // -------------- FILTER LOGIC --------------
  const filteredData = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter(
      (i) =>
        i.paymentNumber.toLowerCase().includes(s) ||
        i.customerName.toLowerCase().includes(s) ||
        i.referenceNumber.toLowerCase().includes(s)
    );
  }, [items, search]);


  // ---------------- DELETE ----------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deletePaymentReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["payments-received"]);
      setSelectedIds([]);
    },
  });

  const handleDelete = () => {
    if (selectedIds.length === 0) return alert("Select rows to delete");

    if (!window.confirm("Delete selected payments?")) return;

    selectedIds.forEach((id) => deleteMutation.mutate(id));
  };


  // ---------------- EXPORT EXCEL ----------------
  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "Payments_Received.xlsx");
  };


  // ---------------- EXPORT PDF ----------------
  const openPdf = (row) => {
    setPdfUrl(`/pdf/payment-${row.id}.pdf`);
    setShowPdf(true);
  };


  // ---------------- COLUMNS ----------------
  const columns = [
    {
      name: "DATE",
      selector: (row) => row.date,
      sortable: true,
      width: "120px",
    },
    {
      name: "PAYMENT #",
      selector: (row) => row.paymentNumber,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <span
          className="text-primary fw-semibold"
          style={{ cursor: "pointer" }}
          onClick={() =>
            navigate("/recordpaymentreceived", { state: row._original })
          }
        >
          {row.paymentNumber}
        </span>
      ),
    },
    {
      name: "REFERENCE #",
      selector: (row) => row.referenceNumber,
      width: "150px",
    },
    {
      name: "CUSTOMER",
      selector: (row) => row.customerName,
      grow: 2,
    },
    {
      name: "INVOICE #",
      selector: (row) => row.invoiceNumber,
      width: "140px",
    },
    {
      name: "MODE",
      selector: (row) => row.mode,
      width: "120px",
    },
    {
      name: "AMOUNT",
      selector: (row) => row.amount,
      sortable: true,
      right: true,
      width: "140px",
      cell: (row) => `₹${row.amount.toLocaleString()}`,
    },
    {
      name: "UNUSED",
      selector: (row) => row.unusedAmount,
      right: true,
      width: "140px",
      cell: (row) => `₹${row.unusedAmount.toLocaleString()}`,
    },
    {
      name: "STATUS",
      selector: (row) => row.status,
      width: "120px",
      center: true,
      cell: (row) => (
        <span
          className={`badge ${row.status === "Paid"
            ? "bg-success"
            : row.status === "Partial"
              ? "bg-warning text-dark"
              : "bg-secondary"
            }`}
        >
          {row.status}
        </span>
      ),
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
              navigate("/payment-received-report", { state: row._original ?? row });
            }}
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      ),
    },
  ];


  // ---------------- TABLE CUSTOM STYLE ----------------
  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#f8f9fa",
        fontWeight: 600,
        fontSize: "12px",
      },
    },
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
        <h5 className="fw-semibold m-0"><i className="bi bi-cash-stack me-2"></i>Payments Received</h5>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm"
            onClick={handleExcel}
            style={{ width: 36, height: 36 }}
          >
            <i className="bi bi-file-earmark-excel text-white"></i>
          </button>

          <button
            className="btn btn-danger btn-sm px-3"
            disabled={selectedIds.length === 0}
            onClick={handleDelete}
          >
            <i className="bi bi-trash"></i> Delete
          </button>

          <button
            className="btn btn-primary btn-sm px-3"
            onClick={() => navigate("/recordpayment")}
          >
            + New Payment
          </button>
        </div>
      </div>


      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Payment
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by payment number, customer, or reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Payments</h6>
              <h4 className="fw-bold text-dark mb-1">{totalPayments}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Unused Amount</h6>
              <h4 className="fw-bold text-dark mb-1">₹ {totalUnused.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>


      {/* -------- TABLE WRAPPER -------- */}
      <div
        className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2"
        style={{ minHeight: "60vh" }}
      >



        <DataTable
          columns={columns}
          data={filteredData}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) =>
            setSelectedIds(state.selectedRows.map((r) => r.id))
          }
          onRowClicked={(row) =>
            navigate("/recordpaymentreceived", { state: row._original })
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationDefaultPage={page}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(p) => {
            setPerPage(p);
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
          noDataComponent={<EmptyStateMessage title="Payments Received" />}
        />


      </div>


      {/* -------- PDF Preview -------- */}
      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        title="Payment Received PDF"
        onClose={() => setShowPdf(false)}
      />
    </div>
  );
};

export default AllPayment;
