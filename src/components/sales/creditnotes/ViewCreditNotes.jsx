import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getCreditNotes,
  deleteCreditNote,
} from "../api";


import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

// ⭐ USE GLOBAL UTILITIES


import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";


// ---------------- NORMALIZE FIELDS ----------------
const normalizeCreditNote = (o = {}) => ({
  id: o.id ?? o._id ?? "",
  date: o.date ?? o.creditNoteDate ?? "",
  creditNoteNumber:
    o.creditNoteNumber ?? o.noteNumber ?? o.referenceNo ?? o.number ?? "",
  referenceNumber: o.referenceNumber ?? o.reference ?? "",
  customerName: o.customerName ?? o.clientName ?? o.partyName ?? "",
  invoiceNumber: o.invoiceNumber ?? o.invoiceNo ?? "",
  amount: o.amount ?? o.totalAmount ?? 0,
  status: o.status ?? "Draft",
  _original: o,
});


const ViewCreditNotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------------- STATE ----------------
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  // ---------------- FETCH DATA ----------------
  const { data, isLoading } = useQuery({
    queryKey: ["creditNotes", page, perPage],
    queryFn: () =>
      getCreditNotes({
        Page: page,
        PageSize: perPage,
      }),
    keepPreviousData: true,
    retry: 1,
  });

  // ⭐ UNIVERSAL ITEMS + PAGINATION
  const rawItems = extractItems(data);
  const items = rawItems.map(normalizeCreditNote);

  const { totalPages, totalCount } = extractPagination(data);
  const totalRows = Number(totalCount) || 0;

  // Mini-dashboard counts
  const totalCreditNotes = items.length;
  const totalAmount = items.reduce((sum, c) => sum + Number(c?.amount ?? 0), 0);


  // ---------------- SEARCH FILTER ----------------
  const filteredData = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter(
      (i) =>
        i.creditNoteNumber.toLowerCase().includes(s) ||
        i.customerName.toLowerCase().includes(s) ||
        i.referenceNumber.toLowerCase().includes(s)
    );
  }, [items, search]);


  // ---------------- DELETE LOGIC ----------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCreditNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["credit-notes"]);
      setSelectedIds([]);
    },
  });

  const handleDelete = () => {
    if (selectedIds.length === 0)
      return alert("Select at least one credit note.");

    if (!window.confirm("Delete selected credit notes?")) return;

    selectedIds.forEach((id) => deleteMutation.mutate(id));
  };


  // ---------------- EXCEL EXPORT ----------------
  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credit Notes");
    XLSX.writeFile(wb, "Credit_Notes.xlsx");
  };


  // ---------------- PDF PREVIEW ----------------
  const openPdf = (row) => {
    setPdfUrl(`/pdf/credit-note-${row.id}.pdf`);
    setShowPdf(true);
  };


  // ---------------- COLUMNS ----------------
  const columns = [
    {
      name: "DATE",
      selector: (row) => row.date,
      width: "120px",
    },
    {
      name: "CREDIT NOTE #",
      selector: (row) => row.creditNoteNumber,
      sortable: true,
      width: "170px",
      cell: (row) => (
        <span
          className="text-primary fw-semibold"
          style={{ cursor: "pointer" }}
          onClick={() =>
            navigate("/newcreditnote", { state: row._original })
          }
        >
          {row.creditNoteNumber}
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
      width: "150px",
    },
    {
      name: "AMOUNT",
      selector: (row) => row.amount,
      right: true,
      width: "140px",
      cell: (row) => `₹${row.amount.toLocaleString()}`,
    },
    {
      name: "STATUS",
      selector: (row) => row.status,
      width: "120px",
      center: true,
      cell: (row) => (
        <span
          className={`badge ${row.status === "Open"
            ? "bg-warning text-dark"
            : row.status === "Closed"
              ? "bg-success"
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
              navigate("/credit-note-report", { state: row._original ?? row });
            }}
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      ),
    },
  ];


  // ---------------- TABLE STYLE ----------------
  const tableStyles = {
    headCells: {
      style: {
        backgroundColor: "#f8f9fa",
        fontWeight: 600,
        fontSize: "12px",
      },
    },
    tableWrapper: {
      style: {
        minHeight: "46vh", // ⭐ required
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
        <h5 className="fw-semibold m-0">Credit Notes</h5>

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
            onClick={() => navigate("/newcreditnotes")}
          >
            + New Credit Note
          </button>
        </div>
      </div>


      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Credit Note
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by credit note number, customer, or reference"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Credit Notes</h6>
              <h4 className="fw-bold text-dark mb-1">{totalCreditNotes}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* -------- TABLE -------- */}
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
            navigate("/newcreditnotes", { state: row._original })
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
          noDataComponent={<EmptyStateMessage title="Credit Notes" />}
        />
      </div>


      {/* -------- PDF MODAL -------- */}
      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        title="Credit Note PDF"
        onClose={() => setShowPdf(false)}
      />
    </div>
  );
};

export default ViewCreditNotes;
