import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getRecurringBills, deleteRecurringBill } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";

const RecurringBills = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // DATE FORMATTER
  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-IN");
  };

  // FORMAT AMOUNT
  const formatAmount = (value) => {
    return `₹ ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  useEffect(() => setSelectedIds([]), [page, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedRecurringBills, isLoading } = useQuery({
    queryKey: ["recurringBills", page, perPage],
    queryFn: () => getRecurringBills({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (e) => handleProvisionalError(e, "Fetch Recurring Bills"),
  });

  const recurringBills = extractItems(fetchedRecurringBills);
  const { totalCount } = extractPagination(fetchedRecurringBills);
  const totalRows = Number.isFinite(totalCount) ? totalCount : recurringBills.length;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecurringBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringBills"]);
      setSelectedIds([]);
    },
    onError: (e) => handleProvisionalError(e, "Delete Recurring Bill"),
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // FILTER
  const filteredRecurringBills = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return recurringBills;
    return recurringBills.filter((b) =>
      [
        b?.profileName,
        b?.vendorName,
        b?.frequency,
        b?.repeatEvery,
        b?.status,
        b?.amount,
        b?.totalAmount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [recurringBills, filterText]);

  // TOTAL SUMMARY
  const { totalAmount, activeCount } = useMemo(() => {
    const totalA = filteredRecurringBills.reduce(
      (s, b) => s + Number(b?.totalAmount ?? b?.amount ?? 0),
      0
    );
    const activeC = filteredRecurringBills.filter((b) => b?.status === "Active").length;
    return { totalAmount: totalA, activeCount: activeC };
  }, [filteredRecurringBills]);

  const handleDelete = async () => {
    if (!selectedIds.length) return alert("Select recurring bills to delete");
    if (!window.confirm("Are you sure you want to delete?")) return;

    await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
    setSelectedIds([]);
  };

  // EXCEL EXPORT
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredRecurringBills.map((b) => ({
        "Profile Name": b?.profileName,
        "Vendor": b?.vendorName,
        "Start Date": formatDate(b?.startOn ?? b?.startDate),
        "Next Bill Date": formatDate(b?.nextDate),
        "Frequency": b?.repeatEvery ?? b?.frequency,
        "Status": b?.status,
        "Amount": b?.totalAmount ?? b?.amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RecurringBills");
    XLSX.writeFile(wb, "RecurringBillsReport.xlsx");
  };

  // PDF EXPORT
  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-4000px";
    div.style.left = "-4000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    div.innerHTML = `
      <h2 style="text-align:center;margin-bottom:10px;">RECURRING BILLS REPORT</h2>

      <table style="width:100%; border-collapse:separate; border-spacing:0; font-size:12px;">
        <thead>
          <tr style="border:1px solid #000;">
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Profile Name</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Vendor</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Start Date</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Next Bill Date</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Frequency</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">Status</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;text-align:right;">Amount</th>
          </tr>
        </thead>

        <tbody>
          ${filteredRecurringBills
        .map(
          (b) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${b?.profileName ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.vendorName ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;">${formatDate(b?.startOn ?? b?.startDate)}</td>
            <td style="border:1px solid #000;padding:6px;">${formatDate(b?.nextDate)}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.repeatEvery ?? b?.frequency ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;">${b?.status ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right;">${formatAmount(b?.totalAmount ?? b?.amount)}</td>
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
      a.download = "RecurringBillsReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  // VIEW SINGLE PDF
  const openSinglePdf = (row) => {
    setPdfUrl(`/download/recurringbill/${row.id}`);
    setShowPreview(true);
  };

  const columns = [
    {
      name: "Profile Name",
      selector: (row) => row?.profileName ?? "",
      sortable: true,
      grow: 2,
    },
    {
      name: "Vendor",
      selector: (row) => row?.vendorName ?? "",
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => formatDate(row?.startOn ?? row?.startDate),
      sortable: true,
    },
    {
      name: "Next Bill Date",
      selector: (row) => formatDate(row?.nextDate),
      sortable: true,
    },
    {
      name: "Frequency",
      selector: (row) => row?.repeatEvery ?? row?.frequency ?? "",
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row?.status ?? "",
      sortable: true,
      center: true,
      cell: (row) => {
        const status = row?.status ?? "Active";
        return (
          <span
            className={`badge ${
              status === "Active"
                ? "bg-success"
                : status === "Paused"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      name: "Amount",
      selector: (row) => formatAmount(row?.totalAmount ?? row?.amount),
      right: true,
      sortable: true,
    },
    {
      name: "Actions",
      center: true,
      width: "100px",
      cell: (row) => (
        <div className="d-flex gap-3" onClick={(e) => e.stopPropagation()}>
          <i
            className="bi bi-file-text text-info fs-5"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/recurring-bill-report", { state: row._original ?? row });
            }}
            title="View Report"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid bg-light pt-0 pb-4 rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
      <div className="container-xl">
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
          <h5 className="fw-semibold m-0">
            <i className="bi bi-calendar2-check text-primary me-2"></i> Recurring Bills
          </h5>

          <div className="d-flex gap-2">
            <button className="btn btn-success btn-sm" onClick={exportExcel}>
              <i className="bi bi-file-earmark-excel"></i>
            </button>

            <button className="btn btn-outline-secondary btn-sm" onClick={generatePDF}>
              <i className="bi bi-printer"></i>
            </button>

            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleDelete}
              disabled={!selectedIds.length || deleteMutation.isLoading}
            >
              <i className="bi bi-trash"></i>
            </button>

            <button className="btn btn-primary btn-sm" onClick={() => navigate("/newrecurringbill")}>
              + New Recurring Bill
            </button>
          </div>
        </div>

        {/* FILTER + SUMMARY */}
        <div className="bg-white border rounded-3 p-3 shadow-sm my-2">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="small text-secondary fw-semibold">Search</label>
              <input
                className="form-control form-control-sm"
                placeholder="Search Recurring Bills..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <div className="bg-light border rounded-3 p-3 h-100">
                <h6 className="text-muted small fw-semibold mb-1">Total Amount</h6>
                <h4 className="fw-bold mb-0">{formatAmount(totalAmount)}</h4>
                <small className="text-muted">Active Profiles: <b>{activeCount}</b></small>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
          <DataTable
            columns={columns}
            data={filteredRecurringBills}
            selectableRows
            selectableRowsHighlight
            onSelectedRowsChange={(state) => setSelectedIds(state.selectedRows.map((r) => r.id))}
            onRowClicked={(row) => navigate("/newrecurringbill", { state: row })}
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
            noDataComponent={<EmptyStateMessage title="Recurring Bills" />}
          />
        </div>
      </div>

      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Recurring Bills Report"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default RecurringBills;
