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

import { deletePayment, getPayments } from "../api";
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

const Payments = () => {
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

  const { data: fetchedPayments, isLoading } = useQuery({
    queryKey: ["payments", page, perPage],
    queryFn: () => getPayments({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Payments"),
  });

  const payments = extractItems(fetchedPayments);
  const { totalCount } = extractPagination(fetchedPayments);
  const totalRows = Number.isFinite(totalCount) ? totalCount : payments.length;

  // Mini-dashboard counts
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);
  const successCount = payments.filter((p) => p?.status === "Success").length;
  const pendingCount = payments.filter((p) => p?.status === "Pending").length;

  const filteredPayments = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return payments;
    return payments.filter((row) =>
      [row?.receiptNumber, row?.customerName, row?.mode, row?.status, row?.amount]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [payments, filterText]);

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["payments"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Payment"),
  });

  const handleDelete = async () => {
    if (selected.length === 0) return alert("Select payments to delete.");
    if (!window.confirm("Are you sure you want to delete selected payments?")) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Payment");
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPayments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "Payments_Report.xlsx");
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
      <h2 style="text-align:center;margin-bottom:10px;">PAYMENTS REPORT</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:6px;">Date</th>
            <th style="border:1px solid #000;padding:6px;">Receipt No</th>
            <th style="border:1px solid #000;padding:6px;">Customer</th>
            <th style="border:1px solid #000;padding:6px;">Mode</th>
            <th style="border:1px solid #000;padding:6px;">Status</th>
            <th style="border:1px solid #000;padding:6px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${filteredPayments
        .map(
          (row) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${formatDate(row?.date)}</td>
            <td style="border:1px solid #000;padding:6px;">${row?.receiptNumber}</td>
            <td style="border:1px solid #000;padding:6px;">${row?.customerName}</td>
            <td style="border:1px solid #000;padding:6px;">${row?.mode}</td>
            <td style="border:1px solid #000;padding:6px;">${row?.status}</td>
            <td style="border:1px solid #000;padding:6px;">${formatAmount(row?.amount)}</td>
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
      a.download = "PaymentsReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
    if (action === "email") {
      window.location.href = `mailto:?subject=Payments Report`;
    }
  };

  const columns = [
    { name: "Date", selector: (row) => formatDate(row?.date), sortable: true },
    { name: "Receipt No", selector: (row) => row?.receiptNumber, sortable: true },
    { name: "Customer", selector: (row) => row?.customerName, sortable: true },
    { name: "Mode", selector: (row) => row?.mode, sortable: true },
    {
      name: "Amount",
      selector: (row) => formatAmount(row?.amount),
      right: true,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${
            row?.status === "Success"
              ? "bg-success"
              : row?.status === "Pending"
                ? "bg-warning text-dark"
                : "bg-danger"
          }`}
        >
          {row?.status}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn p-0 border-0 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/payment-made-report", { state: row._original ?? row });
            }}
            title="View Report"
          >
            <i className="bi bi-file-text text-info" style={{ fontSize: 18 }}></i>
          </button>
         
        </div>
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
        <h5 className="fw-semibold m-0"><i className="bi bi-cash-stack me-2"></i>Payments </h5>

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

          <button className="btn btn-primary btn-sm" onClick={() => navigate("/recordpayment")}>
            + Record Payment
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
              placeholder="Search by receipt no, customer, status"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
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
              <h6 className="text-muted small fw-semibold mb-1">Status Summary</h6>
              <div className="small text-muted mb-1">
                Success: <span className="fw-semibold text-success">{successCount}</span>
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
          data={filteredPayments}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelected(state.selectedRows.map((row) => row?.id))}
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
          onRowClicked={(row) => navigate("/newpaymentmade", { state: row })}
          noDataComponent={<EmptyStateMessage title="Payments" />}
        />
      </div>

      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Payments Report"
      />
    </div>
  );
};

export default Payments;
