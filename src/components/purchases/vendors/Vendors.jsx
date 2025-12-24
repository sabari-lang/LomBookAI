import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { deleteVendor, getVendors } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";


const Vendors = () => {
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setSelected([]);
  }, [currentPage, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedVendors, isLoading } = useQuery({
    queryKey: ["vendors", currentPage, perPage],
    queryFn: () => getVendors({ Page: currentPage, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Vendors"),
  });

  const vendors = extractItems(fetchedVendors);
  const { totalCount } = extractPagination(fetchedVendors);
  const totalRows = Number.isFinite(totalCount) ? totalCount : vendors.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const currentData = vendors;

  // Filter state
  const [filterText, setFilterText] = useState("");

  // Filter logic
  const filteredVendors = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return currentData;
    return currentData.filter((v) =>
      [
        v?.displayName,
        v?.email,
        v?.phoneWork,
        v?.pan,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [currentData, filterText]);

  // Mini-dashboard counts
  const totalVendors = vendors.length;
  const totalBalance = vendors.reduce((sum, v) => sum + Number(v?.openingBalance ?? 0), 0);

  const formatCurrency = (amount) => `₹ ${Number(amount ?? 0).toLocaleString()}`;

  const columns = [
    {
      name: "NAME",
      selector: (row) => row?.displayName ?? "",
      sortable: true,
      cell: (row) => (
        <a
          href="#"
          className="text-primary text-decoration-underline"
          onClick={e => {
            e.preventDefault();
            navigate("/newvendor", { state: row });
          }}
        >
          {row?.displayName ?? ""}
        </a>
      ),
    },
    {
      name: "COMPANY NAME",
      selector: (row) => row?.companyName ?? "",
      sortable: true,
    },
    {
      name: "EMAIL",
      selector: (row) => row?.email ?? "",
      sortable: true,
    },
    {
      name: "WORK PHONE",
      selector: (row) => row?.phoneWork ?? "",
      sortable: true,
    },
    {
      name: "SOURCE OF SUPPLY",
      selector: (row) => row?.sourceOfSupplyName || row?.sourceOfSupply || "",
      sortable: true,
    },
    {
      name: "PAYABLES (BCY)",
      selector: (row) => formatCurrency(row?.openingBalance ?? 0),
      sortable: true,
      right: true,
    },
    {
      name: "UNUSED CREDITS (BCY)",
      selector: (row) => formatCurrency(row?.unusedCredits ?? 0),
      sortable: true,
      right: true,
    },
  ];


  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendors"]);
      setSelected([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Vendor"),
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(currentData.map((row) => row.id));
    else setSelected([]);
  };

  const handleDelete = async () => {
    if (selected.length === 0) return notifyInfo("Select vendors to delete.");
    const confirmed = await confirm("Are you sure you want to delete selected vendors?");
    if (!confirmed) return;

    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
    } catch (error) {
      handleProvisionalError(error, "Delete Vendor");
    }
  };

  // ✅ ===== EXCEL EXPORT =====
  const exportExcel = () => {
    // Only export the visible columns in the correct order
    const exportData = currentData.map((row) => ({
      NAME: row.displayName ?? "",
      "COMPANY NAME": row.companyName ?? "",
      EMAIL: row.email ?? "",
      "WORK PHONE": row.phoneWork ?? "",
      "SOURCE OF SUPPLY": row.sourceOfSupplyName || row.sourceOfSupply || "",
      "PAYABLES (BCY)": row.openingBalance ?? 0,
      "UNUSED CREDITS (BCY)": row.unusedCredits ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "Vendors_Report.xlsx");
  };


  // ✅ ===== PDF EXPORT (FULL REPORT) =====
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

    // Add CSS for compact table, no fixed/min-widths, smaller font
    const tableStyle = `
      <style>
        .vendors-pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .vendors-pdf-table th, .vendors-pdf-table td { border: 1px solid #000; padding: 4px 3px; text-align: left; font-size:"12px";}
        .vendors-pdf-table th { background: #f2f2f2; }
        .vendors-pdf-table td.currency { text-align: right;font-size:"12px"; }
        .vendors-pdf-title { text-align: center; margin: 0 0 6px 0; padding: 0; font-size: 12px; }
        body, html { margin: 0; padding: 0; }
      </style>
    `;

    div.innerHTML = `
      ${tableStyle}
      <h2 class=\"vendors-pdf-title\">VENDORS REPORT</h2>
      <table class=\"vendors-pdf-table\">
        <thead>
          <tr>
            <th>NAME</th>
            <th>COMPANY NAME</th>
            <th>EMAIL</th>
            <th>WORK PHONE</th>
            <th>SOURCE OF SUPPLY</th>
            <th>PAYABLES (BCY)</th>
            <th>UNUSED CREDITS (BCY)</th>
          </tr>
        </thead>
        <tbody>
          ${currentData
        .map(
          (v) => `
            <tr>
              <td>${v.displayName ?? ""}</td>
              <td>${v.companyName ?? ""}</td>
              <td>${v.email ?? ""}</td>
              <td>${v.phoneWork ?? ""}</td>
              <td>${v.sourceOfSupplyName || v.sourceOfSupply || ""}</td>
              <td class=\"currency\">${formatCurrency(v.openingBalance ?? 0)}</td>
              <td class=\"currency\">${formatCurrency(v.unusedCredits ?? 0)}</td>
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
      a.download = "VendorsReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
    if (action === "email") {
      window.location.href = `mailto:?subject=Vendors Report`;
    }
  };

  // ✅ ===== EDIT VENDOR =====
  const editVendor = (row) => {
    navigate(`/newvendor`, { state: row });
  };

  // ✅ ===== VIEW PDF FOR SINGLE VENDOR =====
  const openSinglePdf = (row) => {
    setPdfUrl(`/download/vendor/${row.id}`); // adjust backend route
    setShowPdf(true);
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      {/* ✅ HEADER */}
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
        <h5 className="fw-semibold m-0"><i className="bi bi-people me-2"></i>Vendors</h5>

        <div className="d-flex gap-2">

          {/* Excel */}
          <button
            className="btn btn-success btn-sm"
            title="Export Excel"
            onClick={exportExcel}
          >
            <i className="bi bi-file-earmark-excel"></i>
          </button>



          {/* PDF Export */}
          <button
            className="btn btn-danger btn-sm"
            title="Export PDF"
            onClick={generatePDF}
          >
            <i className="bi bi-filetype-pdf"></i>
          </button>

          {/* Delete */}
          <button
            className="btn btn-danger btn-sm"
            disabled={selected.length === 0 || deleteMutation.isLoading}
            onClick={handleDelete}
          >
            <i className="bi bi-trash"></i>
          </button>

          {/* New Vendor */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newvendor")}
          >
            + New Vendor
          </button>
        </div>
      </div>

      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Vendor
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name, email, phone, or GST"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Vendors</h6>
              <h4 className="fw-bold text-dark mb-1">{totalVendors}</h4>
              <div className="small text-muted">
                Total Balance: <span className="fw-semibold text-dark">₹ {totalBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABLE (react-data-table-component) ===== */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredVendors}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelected(state.selectedRows.map((r) => r.id))}
          onRowClicked={(row) => navigate("/newvendor", { state: row })}
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
          noDataComponent={<EmptyStateMessage title="Vendors" />}
        />
      </div>

      {/* DataTable pagination is used; removed manual Bootstrap pager */}

      {/* ✅ PDF PREVIEW MODAL */}
      <PdfPreviewModal
        show={showPdf}
        pdfUrl={pdfUrl}
        onClose={() => setShowPdf(false)}
        onAction={handlePdfAction}
        title="Vendors Report"
      />
    </div>
  );
};

export default Vendors;
