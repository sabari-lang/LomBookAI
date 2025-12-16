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

import { deleteExpense, getExpenses } from "../api";
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


const Expenses = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    setSelected([]);
  }, [page, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedExpenses, isLoading } = useQuery({
    queryKey: ["expenses", page, perPage],
    queryFn: () => getExpenses({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Expenses"),
  });

  const expenses = extractItems(fetchedExpenses);
  const { totalCount } = extractPagination(fetchedExpenses);
  const totalRows = Number.isFinite(totalCount) ? totalCount : expenses.length;

  const filteredExpenses = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return expenses;
    return expenses.filter((row) =>
      [row?.invoice, row?.expenseAccount, row?.vendor, row?.vendorName, row?.paidThrough, row?.customerName, row?.status, row?.amount]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [expenses, filterText]);

  // Mini-dashboard counts
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e?.amount ?? 0), 0);
  const approvedCount = expenses.filter((e) => e?.status === "Approved" || e?.status === "Paid").length;
  const pendingCount = expenses.filter((e) => e?.status === "Pending").length;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Expense"),
  });

  const handleDelete = async () => {
    if (selected.length === 0) return alert("Select expenses to delete.");
    if (!window.confirm("Are you sure you want to delete selected expenses?")) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Expense");
    }
  };

  // ✅ ===== EXCEL EXPORT =====
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredExpenses.map((e) => ({
        "DATE": formatDate(e?.date),
        "EXPENSE ACCOUNT": e?.expenseAccount || "",
        "REFERENCE#": e?.invoice || "",
        "VENDOR NAME": e?.vendor || e?.vendorName || "",
        "PAID THROUGH": e?.paidThrough || "",
        "CUSTOMER NAME": e?.customerName || "",
        "STATUS": e?.status || "Pending",
        "AMOUNT": e?.amount || 0,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "Expenses_Report.xlsx");
  };



  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-3000px";
    div.style.left = "-3000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    div.innerHTML = `
      <h2 style="text-align:center;margin-bottom:10px;">EXPENSES REPORT</h2>
      <table style="width:100%;border-collapse:separate;border-spacing:0;font-size:11px;">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">DATE</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">EXPENSE ACCOUNT</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">REFERENCE#</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">VENDOR NAME</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">PAID THROUGH</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">CUSTOMER NAME</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">STATUS</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;text-align:right;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${filteredExpenses
        .map(
          (e) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${formatDate(e?.date)}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.expenseAccount || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.invoice || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.vendor || e?.vendorName || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.paidThrough || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.customerName || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${e?.status || "Pending"}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right;">${formatAmount(e?.amount)}</td>
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
      a.download = "ExpensesReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
    if (action === "email") {
      window.location.href = `mailto:?subject=Expenses Report`;
    }
  };

  const columns = [
    { 
      name: "DATE", 
      selector: (row) => formatDate(row?.date), 
      sortable: true,
      width: "120px"
    },
    { 
      name: "EXPENSE ACCOUNT", 
      selector: (row) => row?.expenseAccount || "", 
      sortable: true,
      width: "150px"
    },
    { 
      name: "REFERENCE#", 
      selector: (row) => row?.invoice || "", 
      sortable: true,
      width: "150px"
    },
    { 
      name: "VENDOR NAME", 
      selector: (row) => row?.vendor || row?.vendorName || "", 
      sortable: true,
      width: "180px"
    },
    { 
      name: "PAID THROUGH", 
      selector: (row) => row?.paidThrough || "", 
      sortable: true,
      width: "130px"
    },
    { 
      name: "CUSTOMER NAME", 
      selector: (row) => row?.customerName || "", 
      sortable: true,
      width: "180px"
    },
    {
      name: "STATUS",
      cell: (row) => {
        const status = row?.status || "Pending";
        return (
          <span
            className={`badge ${
              status === "Approved" || status === "Paid"
                ? "bg-success"
                : status === "Pending"
                  ? "bg-warning text-dark"
                  : "bg-danger"
            }`}
          >
            {status}
          </span>
        );
      },
      sortable: true,
      width: "120px"
    },
    {
      name: "AMOUNT",
      selector: (row) => formatAmount(row?.amount),
      right: true,
      sortable: true,
      width: "120px"
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
        <h5 className="fw-semibold m-0"><i className="bi bi-wallet2 me-2"></i>Expenses</h5>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" title="Export Excel" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel" />
          </button>

          <button className="btn btn-danger btn-sm" title="Export PDF" onClick={generatePDF}>
            <i className="bi bi-filetype-pdf"></i>
          </button>

          <button
            className="btn btn-danger btn-sm"
            disabled={selected.length === 0 || deleteMutation.isLoading}
            onClick={handleDelete}
          >
            <i className="bi bi-trash"></i>
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => navigate("/newexpense")}>
            + New Expense
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
              placeholder="Search by reference, expense account, vendor, customer, status"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Expenses</h6>
              <h4 className="fw-bold text-dark mb-1">{totalExpenses}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Status Summary</h6>
              <div className="small text-muted mb-1">
                Approved/Paid: <span className="fw-semibold text-success">{approvedCount}</span>
              </div>
              <div className="small text-muted">
                Pending: <span className="fw-semibold text-warning">{pendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredExpenses}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) =>
            setSelected(state.selectedRows.map((row) => row?.id))
          }
          onRowClicked={(row) => navigate("/newexpense", { state: row })}
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
          noDataComponent={<EmptyStateMessage title="Expenses" />}
        />
      </div>

      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Expenses Report"
      />
    </div>
  );
};

export default Expenses;
