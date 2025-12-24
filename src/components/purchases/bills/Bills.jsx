// src/components/purchases/ViewBills.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import { getBills, deleteBill } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const Bills = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // DATE FORMATTER FIX
  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-IN"); // DD/MM/YYYY
  };

  useEffect(() => setSelectedIds([]), [page, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedBills, isLoading } = useQuery({
    queryKey: ["bills", page, perPage],
    queryFn: () => getBills({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (e) => handleProvisionalError(e, "Fetch Bills"),
  });

  const bills = extractItems(fetchedBills);
  const { totalCount } = extractPagination(fetchedBills);
  const totalRows = Number.isFinite(totalCount) ? totalCount : bills.length;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["bills"]);
      setSelectedIds([]);
    },
    onError: (e) => handleProvisionalError(e, "Delete Bill"),
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // FILTER
  const filteredBills = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return bills;
    return bills.filter((b) =>
      [
        b?.billNumber,
        b?.vendorName,
        b?.status,
        b?.amount,
        b?.totalAmount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [bills, filterText]);

  // TOTAL SUMMARY
  const { totalPayables, totalDue } = useMemo(() => {
    const totalP = filteredBills.reduce(
      (s, b) => s + Number(b?.totalAmount ?? b?.amount ?? 0),
      0
    );
    const totalD = filteredBills.reduce(
      (s, b) => s + Number(b?.balanceDue ?? b?.due ?? 0),
      0
    );
    return { totalPayables: totalP, totalDue: totalD };
  }, [filteredBills]);

  const handleDelete = async () => {
    if (!selectedIds.length) return notifyInfo("Select bills to delete");
    const confirmed = await confirm("Are you sure you want to delete?");
    if (!confirmed) return;

    await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
    setSelectedIds([]);
  };

  // EXCEL EXPORT
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredBills.map((b) => ({
        "Bill Date": formatDate(b?.date ?? b?.billDate),
        "Bill Number": b?.billNumber,
        Vendor: b?.vendorName,
        Status: b?.status,
        "Total Amount": b?.totalAmount ?? b?.amount,
        "Balance Due": b?.balanceDue ?? b?.due,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills");
    XLSX.writeFile(wb, "BillsReport.xlsx");
  };

  // 📌 FIXED PDF — BORDER COLLAPSE FIXED
  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-4000px";
    div.style.left = "-4000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    div.innerHTML = `
      <h2 style="text-align:center;margin-bottom:10px;">BILLS REPORT</h2>

      <table style="width:100%; border-collapse:separate; border-spacing:0; font-size:12px;">
        <thead>
          <tr style="border:1px solid #000;">
            <th style="border:1px solid #000;padding:6px;">Date</th>
            <th style="border:1px solid #000;padding:6px;">Bill Number</th>
            <th style="border:1px solid #000;padding:6px;">Vendor</th>
            <th style="border:1px solid #000;padding:6px;">Status</th>
            <th style="border:1px solid #000;padding:6px;">Total</th>
            <th style="border:1px solid #000;padding:6px;">Balance</th>
          </tr>
        </thead>

        <tbody>
          ${filteredBills
        .map(
          (b) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${formatDate(b?.date ?? b?.billDate)}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.billNumber}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.vendorName}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.status ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;">₹ ${Number(
            b?.totalAmount ?? b?.amount ?? 0
          ).toLocaleString()}</td>
            <td style="border:1px solid #000;padding:6px;">₹ ${Number(
            b?.balanceDue ?? b?.due ?? 0
          ).toLocaleString()}</td>
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
    pdf.addImage(img, "PNG", 0, 0, 210, 0);

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
      a.download = "BillsReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  const columns = [
    { name: "Date", selector: (row) => formatDate(row?.date ?? row?.billDate), sortable: true },
    { name: "Bill No.", selector: (row) => row?.billNumber, sortable: true },
    { name: "Vendor", selector: (row) => row?.vendorName, sortable: true },
    { name: "Status", selector: (row) => row?.status, sortable: true },
    {
      name: "Total",
      selector: (row) => `₹ ${Number(row?.totalAmount ?? row?.amount ?? 0).toLocaleString()}`,
      right: true,
    },
    {
      name: "Balance",
      selector: (row) => `₹ ${Number(row?.balanceDue ?? row?.due ?? 0).toLocaleString()}`,
      right: true,
    },
    {
      name: "Actions",
      center: true,
      cell: (row) => (
        <div className="d-flex gap-3">
          <i
            className="bi bi-file-text text-info fs-5"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/bill-report", { state: row._original ?? row });
            }}
            title="View Report"
          />

        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4">
      {/* HEADER */}
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
        <h5 className="fw-semibold mb-0"><i className="bi bi-receipt-cutoff me-2"></i>Bills</h5>

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

          <button className="btn btn-primary btn-sm" onClick={() => navigate("/newbill")}>
            + New Bill
          </button>
        </div>
      </div>

      {/* FILTER + SUMMARY */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">Search</label>
            <input
              className="form-control form-control-sm"
              placeholder="Search Bills..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100">
              <h6 className="text-muted small fw-semibold mb-1">Total Payables</h6>
              <h4 className="fw-bold mb-0">₹ {totalPayables.toLocaleString()}</h4>
              <small className="text-muted">Balance Due: <b>₹ {totalDue.toLocaleString()}</b></small>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div
        className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2"
        style={{ minHeight: "60vh" }}
      >
        <DataTable
          columns={columns}
          data={filteredBills}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelectedIds(state.selectedRows.map((r) => r.id))}
          onRowClicked={(row) => navigate("/newbill", { state: row })}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationDefaultPage={page}
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
          noDataComponent={<EmptyStateMessage title="Bills" />}
        />
      </div>

      {/* PDF MODAL */}
      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Bills Report"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default Bills;
