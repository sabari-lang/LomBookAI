import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { deleteVendorCredit, getVendorCredits } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";

const formatAmount = (value) =>
  `₹ ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN");
};


const VendorCredits = () => {
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setSelected([]);
  }, [currentPage, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedCredits, isLoading } = useQuery({
    queryKey: ["vendorCredits", currentPage, perPage],
    queryFn: () => getVendorCredits({ Page: currentPage, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Vendor Credits"),
  });

  const credits = extractItems(fetchedCredits);
  const { totalCount } = extractPagination(fetchedCredits);
  const totalRows = Number.isFinite(totalCount) ? totalCount : credits.length;

  const [filterText, setFilterText] = useState("");

  const filteredCredits = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return credits;
    return credits.filter((row) =>
      [row?.creditNote, row?.referenceNumber, row?.vendorName, row?.status, row?.amount]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [credits, filterText]);

  const columns = [
    { 
      name: "DATE", 
      selector: (row) => formatDate(row?.vendorCreditDate || row?.date), 
      sortable: true,
      width: "120px"
    },
    { 
      name: "CREDIT NOTE#", 
      selector: (row) => row?.creditNote || row?.creditNumber || "", 
      sortable: true,
      width: "150px"
    },
    { 
      name: "REFERENCE NUMBER", 
      selector: (row) => row?.referenceNumber || row?.orderNumber || "", 
      sortable: true,
      width: "180px"
    },
    { 
      name: "VENDOR NAME", 
      selector: (row) => row?.vendorName || "", 
      sortable: true,
      width: "200px"
    },
    {
      name: "STATUS",
      cell: (row) => {
        const status = row?.status || "Open";
        return (
          <span
            className={`badge ${
              status === "Open"
                ? "bg-primary"
                : status === "Closed" || status === "Paid"
                  ? "bg-success"
                  : "bg-warning text-dark"
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
      selector: (row) => formatAmount(row?.totalAmount || row?.amount),
      right: true,
      sortable: true,
      width: "120px"
    },
    {
      name: "BALANCE",
      selector: (row) => formatAmount(row?.balance || row?.balanceDue || 0),
      right: true,
      sortable: true,
      width: "120px"
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-3 justify-content-center" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn p-0 border-0 bg-transparent"
            title="View Report"
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate("/vendor-credit-report", { state: row._original ?? row }); 
            }}
          >
            <i className="bi bi-file-text text-info" style={{ fontSize: 18 }}></i>
          </button>
        </div>
      ),
      center: true,
      width: "100px"
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVendorCredit(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorCredits"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Vendor Credit"),
  });


  const handleDelete = async () => {
    if (selected.length === 0) return alert("Select vendor credits to delete.");
    if (!window.confirm("Are you sure you want to delete selected vendor credits?")) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Vendor Credit");
    }
  };

  // ✅ EXCEL EXPORT
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCredits.map((c) => ({
        "DATE": formatDate(c?.vendorCreditDate || c?.date),
        "CREDIT NOTE#": c?.creditNote || c?.creditNumber || "",
        "REFERENCE NUMBER": c?.referenceNumber || c?.orderNumber || "",
        "VENDOR NAME": c?.vendorName || "",
        "STATUS": c?.status || "Open",
        "AMOUNT": c?.totalAmount || c?.amount || 0,
        "BALANCE": c?.balance || c?.balanceDue || 0,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VendorCredits");
    XLSX.writeFile(wb, "VendorCredits_Report.xlsx");
  };



  // ✅ PDF REPORT EXPORT
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-3000px";
    div.style.left = "-3000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    div.innerHTML = `
      <h2 style="text-align:center;margin-bottom:10px;">VENDOR CREDITS REPORT</h2>
      <table style="width:100%;border-collapse:separate;border-spacing:0;font-size:11px;">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">DATE</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">CREDIT NOTE#</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">REFERENCE NUMBER</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">VENDOR NAME</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;">STATUS</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;text-align:right;">AMOUNT</th>
            <th style="border:1px solid #000;padding:6px;background-color:#f0f0f0;font-weight:bold;text-align:right;">BALANCE</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCredits
        .map(
          (c) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${formatDate(c?.vendorCreditDate || c?.date)}</td>
            <td style="border:1px solid #000;padding:6px;">${c?.creditNote || c?.creditNumber || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${c?.referenceNumber || c?.orderNumber || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${c?.vendorName || ""}</td>
            <td style="border:1px solid #000;padding:6px;">${c?.status || "Open"}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right;">${formatAmount(c?.totalAmount || c?.amount)}</td>
            <td style="border:1px solid #000;padding:6px;text-align:right;">${formatAmount(c?.balance || c?.balanceDue || 0)}</td>
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
      a.download = "VendorCreditsReport.pdf";
      a.click();
    }

    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }

    if (action === "email") {
      window.location.href = `mailto:?subject=Vendor Credits Report`;
    }
  };

  // ✅ VIEW SINGLE PDF (EYE ICON)
  const openSinglePdf = (row) => {
    setPdfUrl(`/download/vendorcredit/${row.id}`); // adjust backend API if different
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
        <h5 className="fw-semibold m-0"><i className="bi bi-receipt me-2"></i>Vendor Credits</h5>

        <div className="d-flex gap-2">

          {/* Excel */}
          <button
            className="btn btn-success btn-sm"
            onClick={exportExcel}
            title="Export Excel"
          >
            <i className="bi bi-file-earmark-excel"></i>
          </button>



          {/* PDF Export */}
          <button
            className="btn btn-danger btn-sm"
            onClick={generatePDF}
            title="Export PDF"
          >
            <i className="bi bi-filetype-pdf"></i>
          </button>

          {/* Delete */}
          <button
            className="btn btn-danger btn-sm"
            disabled={selected.length === 0 || deleteMutation.isLoading}
            onClick={handleDelete}
            title="Delete"
          >
            <i className="bi bi-trash"></i>
          </button>

          {/* New Vendor Credit */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newvendorcredit")}
          >
            + New Vendor Credit
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">Search</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by credit note, reference, vendor, status"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
      </div>

        {/* ===== TABLE (react-data-table-component) ===== */}
        <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
          <DataTable
            columns={columns}
            data={filteredCredits}
            selectableRows
            selectableRowsHighlight
            onSelectedRowsChange={(state) => setSelected(state.selectedRows.map((r) => r.id))}
            onRowClicked={(row) => navigate("/newvendorcredit", { state: row })}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={perPage}
            paginationRowsPerPageOptions={[25, 50, 100]}
            paginationDefaultPage={currentPage}
            onChangePage={(newPage) => setCurrentPage(newPage)}
            onChangeRowsPerPage={(newPerPage) => { setPerPage(newPerPage); setCurrentPage(1); }}
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
            noDataComponent={<EmptyStateMessage title="Vendor Credits" />}
          />
        </div>

      {/* DataTable pagination is used; removed manual Bootstrap pager */}

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Vendor Credits Report"
      />
    </div>
  );
};

export default VendorCredits;
