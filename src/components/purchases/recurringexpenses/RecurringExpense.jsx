import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { deleteRecurringExpense, getRecurringExpenses } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const RecurringExpense = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ===== PAGINATION =====
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState([]);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    setSelected([]);
  }, [page, perPage]);

  // ===== FETCH DATA FROM API =====
  const { data: fetchedRecurringExpenses, isLoading } = useQuery({
    queryKey: ["recurringExpenses", page, perPage],
    queryFn: () => getRecurringExpenses({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Recurring Expenses"),
  });

  const recurring = extractItems(fetchedRecurringExpenses) || [];
  const { totalCount } = extractPagination(fetchedRecurringExpenses);
  const totalRows = Number.isFinite(totalCount) ? totalCount : recurring.length;
  const currentData = recurring;

  // ===== DELETE MUTATION =====
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringExpenses"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Recurring Expense"),
  });

  const deleteSelected = async () => {
    if (selected.length === 0) return notifyInfo("Select recurring expenses to delete.");
    const confirmed = await confirm("Are you sure you want to delete selected recurring expenses?");
    if (!confirmed) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Recurring Expense");
    }
  };

  // ✅ EXCEL EXPORT
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(recurring);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RecurringExpenses");
    XLSX.writeFile(wb, "RecurringExpense_Report.xlsx");
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
      <h2 style="text-align:center;margin-bottom:10px;">RECURRING EXPENSE REPORT</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:6px;">Profile Name</th>
            <th style="border:1px solid #000;padding:6px;">Expense Account</th>
            <th style="border:1px solid #000;padding:6px;">Start Date</th>
            <th style="border:1px solid #000;padding:6px;">Next Date</th>
            <th style="border:1px solid #000;padding:6px;">Frequency</th>
            <th style="border:1px solid #000;padding:6px;">Status</th>
            <th style="border:1px solid #000;padding:6px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${recurring
        .map(
          (r) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${r.profileName}</td>
            <td style="border:1px solid #000;padding:6px;">${r.expenseAccount}</td>
            <td style="border:1px solid #000;padding:6px;">${r.startDate}</td>
            <td style="border:1px solid #000;padding:6px;">${r.nextDate}</td>
            <td style="border:1px solid #000;padding:6px;">${r.frequency}</td>
            <td style="border:1px solid #000;padding:6px;">${r.status}</td>
            <td style="border:1px solid #000;padding:6px;">${r.amount}</td>
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
      a.download = "RecurringExpenseReport.pdf";
      a.click();
    }

    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }

    if (action === "email") {
      window.location.href = `mailto:?subject=Recurring Expense Report`;
    }
  };

  // ==========================
  // DataTable columns
  // ==========================
  const formatAmount = (value) => {
    if (typeof value === "string" && value.includes("₹")) return value;
    return `₹ ${Number(value ?? 0).toLocaleString()}`;
  };

  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-IN");
  };

  const columns = useMemo(
    () => [
      { name: "Profile Name", selector: (r) => r.profileName ?? r.profile_name ?? "", sortable: true, grow: 2 },
      { name: "Expense Account", selector: (r) => r.expenseAccount ?? r.expense_account ?? "", sortable: true },
      { name: "Start Date", selector: (r) => formatDate(r.startDate ?? r.start_date ?? r.startOn), sortable: true },
      { name: "Next Date", selector: (r) => formatDate(r.nextDate ?? r.next_date ?? r.nextBillDate), sortable: true },
      { name: "Frequency", selector: (r) => r.frequency ?? r.repeatEvery ?? "", sortable: true },
      {
        name: "Status",
        selector: (r) => r.status ?? "Active",
        center: true,
        cell: (r) => {
          const status = r.status ?? "Active";
          return <span className={`badge ${status === "Active" ? "bg-success" : status === "Paused" ? "bg-warning text-dark" : "bg-secondary"}`}>{status}</span>;
        },
      },
      { 
        name: "Amount", 
        selector: (r) => formatAmount(r.amount ?? r.totalAmount ?? 0), 
        right: true 
      },
      { 
        name: "Actions", 
        center: true, 
        width: "80px", 
        cell: (r) => (
          <button 
            className="btn p-0 border-0 bg-transparent" 
            title="View PDF" 
            onClick={(e) => { 
              e.stopPropagation(); 
              openSinglePdf(r); 
            }}
          >
            <i className="bi bi-eye text-primary" style={{ fontSize: 18 }}></i>
          </button>
        ) 
      },
    ],
    []
  );

  const editRecurringExpense = (row) => navigate(`/newrecurringexpense`, { state: row });

  // ✅ VIEW SINGLE PDF
  const openSinglePdf = (row) => {
    setPdfUrl(`/download/recurringexpense/${row.id}`);
    setShowPdf(true);
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">

      {/* HEADER */}
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
        <h5 className="fw-semibold m-0"><i className="bi bi-calendar2-check me-2"></i>Recurring Expenses</h5>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel"></i>
          </button>

          <button className="btn btn-danger btn-sm" onClick={generatePDF}>
            <i className="bi bi-filetype-pdf"></i>
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={selected.length === 0 || deleteMutation.isLoading}
            onClick={deleteSelected}
          >
            <i className="bi bi-trash"></i>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newrecurringexpense")}
          >
            + New Recurring Expense
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={recurring}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelected(state.selectedRows.map((r) => r.id))}
          onRowClicked={(row) => editRecurringExpense(row)}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(r) => { setPerPage(r); setPage(1); }}
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
          noDataComponent={<EmptyStateMessage title="Recurring Expenses" />}
        />
      </div>

      {/* DataTable handles pagination for client side data */}

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Recurring Expense Report"
      />
    </div>
  );
};

export default RecurringExpense;
