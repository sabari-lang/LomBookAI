import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { deleteCustomer, getCustomers } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";

const ViewCustomer = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, perPage]);

  const queryClient = useQueryClient();
  const { data: fetchedCustomers, isLoading } = useQuery({
    queryKey: ["customers", page, perPage],
    queryFn: () =>
      getCustomers({ Page: page, PageSize: perPage }),
    retry: 1,
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Customers"),
  });
  const customers = extractItems(fetchedCustomers);
  const { totalCount } = extractPagination(fetchedCustomers);
  const totalRows = Number.isFinite(totalCount) ? totalCount : customers.length;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setSelectedIds([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Customer"),
  });

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const filteredCustomers = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    if (!text) return customers;

    return customers.filter((customer) => {
      const name = (customer?.name ?? "").toLowerCase();
      const company = (customer?.companyName ?? "").toLowerCase();
      const email = (customer?.email ?? "").toLowerCase();
      const phone = (customer?.phone ?? "").toLowerCase();

      return (
        name.includes(text) ||
        company.includes(text) ||
        email.includes(text) ||
        phone.includes(text)
      );
    });
  }, [customers, filterText]);

  const { totalReceivables, totalCredits } = useMemo(() => {
    const totalR = filteredCustomers.reduce(
      (sum, customer) => sum + (customer?.receivables ?? 0),
      0
    );
    const totalC = filteredCustomers.reduce(
      (sum, customer) => sum + (customer?.unusedCredits ?? 0),
      0
    );
    return { totalReceivables: totalR, totalCredits: totalC };
  }, [filteredCustomers]);

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one customer to delete.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected customers?")) return;

    const idsToDelete = selectedIds.filter(Boolean);
    if (idsToDelete.length === 0) return;

    try {
      await Promise.all(idsToDelete.map((id) => deleteMutation.mutateAsync(id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to delete customers", error);
      alert("Unable to delete selected customers. Please try again.");
    }
  };

  // ✅ Excel Export
  const buildWorkPhone = (customer) => customer?.workPhone ?? customer?.phone ?? "";
  const exportExcel = () => {
    const normalized = filteredCustomers.map((customer) => ({
      Name: customer?.name,
      "Company Name": customer?.companyName,
      Email: customer?.email,
      "Work Phone": buildWorkPhone(customer),
      "Place of Supply": customer?.placeOfSupply ?? "",
      "Receivables (BCY)": customer?.receivables ?? 0,
      "Unused Credits (BCY)": customer?.unusedCredits ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(normalized);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "CustomerReport.xlsx");
  };

  // ✅ Generate PDF + Show PDF Preview Modal
  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-3000px";
    div.style.left = "-3000px";
    div.style.width = "210mm";
    div.style.padding = "20px";
    div.style.background = "white";

    div.innerHTML = `
      <h2 style="text-align:center;margin-bottom:10px;">CUSTOMER REPORT</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:6px;">Name</th>
            <th style="border:1px solid #000;padding:6px;">Company</th>
            <th style="border:1px solid #000;padding:6px;">Email</th>
            <th style="border:1px solid #000;padding:6px;">Work Phone</th>
            <th style="border:1px solid #000;padding:6px;">Place of Supply</th>
            <th style="border:1px solid #000;padding:6px;">Receivables</th>
            <th style="border:1px solid #000;padding:6px;">Unused Credits</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCustomers
        .map(
          (c) => `
          <tr>
            <td style="border:1px solid #000;padding:6px;">${c.name}</td>
            <td style="border:1px solid #000;padding:6px;">${c.companyName}</td>
            <td style="border:1px solid #000;padding:6px;">${c.email}</td>
            <td style="border:1px solid #000;padding:6px;">${buildWorkPhone(c)}</td>
            <td style="border:1px solid #000;padding:6px;">${c.placeOfSupply ?? ""}</td>
            <td style="border:1px solid #000;padding:6px;">₹ ${(c.receivables ?? 0).toLocaleString()}</td>
            <td style="border:1px solid #000;padding:6px;">₹ ${(c.unusedCredits ?? 0).toLocaleString()}</td>
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
    setShowPreview(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (!pdfUrl) return;

    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "CustomerReport.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
    if (action === "email") {
      window.location.href = `mailto:?subject=Customer Report&body=Please check the attached PDF.`;
    }
  };

  const handleWhatsApp = (e, phone) => {
    e.stopPropagation();
    if (!phone) return;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return;
    window.open(`https://wa.me/${digits}`, "_blank");
  };

  const handleEmail = (e, email) => {
    e.stopPropagation();
    if (!email) return;
    window.location.href = `mailto:${email}`;
  };

  const formatCurrency = (amount) => `₹ ${Number(amount ?? 0).toLocaleString()}`;
  const formatText = (value) => value ?? "";

  const columns = [
    { name: "Name", selector: (row) => row?.displayName ?? "", sortable: true },
    { name: "Company Name", selector: (row) => row?.companyName ?? "", sortable: true },
    { name: "Email", selector: (row) => row?.email ?? "", sortable: true },
    {
      name: "Work Phone",
      selector: (row) => row?.workPhone ?? row?.phone ?? "",
      sortable: true,
    },
    {
      name: "Place of Supply",
      selector: (row) => formatText(row?.placeOfSupply),
      sortable: true,
    },
    {
      name: "Receivables (BCY)",
      selector: (row) => formatCurrency(row?.receivables),
      sortable: true,
      right: true,
    },
    {
      name: "Unused Credits (BCY)",
      selector: (row) => formatCurrency(row?.unusedCredits),
      sortable: true,
      right: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-3 justify-content-center">
          <i
            className="bi bi-whatsapp text-success fs-5"
            title="WhatsApp"
            style={{ cursor: "pointer" }}
            onClick={(e) => handleWhatsApp(e, row.phone)}
          ></i>
          <i
            className="bi bi-envelope-fill text-primary fs-5"
            title="Email"
            style={{ cursor: "pointer" }}
            onClick={(e) => handleEmail(e, row.email)}
          ></i>
        </div>
      ),
      center: true,
    },
  ];

  const customStyles = {
    headCells: {
      style: { backgroundColor: "#f9fafb", fontWeight: "600", color: "#333" },
    },
    rows: { style: { fontSize: "14px" } },
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
        <h5 className="fw-semibold mb-0"><i className="fa fa-users me-2" aria-hidden="true"></i>Customers</h5>

        <div className="d-flex gap-2">

          <button
            className="btn btn-success btn-sm"
            onClick={exportExcel}
          >
            <i className="bi bi-file-earmark-excel"></i>
          </button>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={generatePDF}
          >
            <i className="bi bi-printer"></i>
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={selectedIds.length === 0 || deleteMutation.isLoading}
          >
            <i className="bi bi-trash"></i> Delete
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newcustomer")}
          >
            + New Customer
          </button>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-lg-4 col-md-6">
            <label className="form-label text-secondary small fw-semibold">
              Search Customer
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name, company, email, phone"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">
                Total Receivables
              </h6>
              <h4 className="fw-bold text-dark mb-1">
                ₹ {totalReceivables.toLocaleString()}
              </h4>
              <div className="small text-muted">
                Unused Credits:{" "}
                <span className="fw-semibold text-dark">
                  ₹ {totalCredits.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div
        className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2"
        style={{ minHeight: "60vh" }}
      >
        <DataTable
          columns={columns}
          data={filteredCustomers}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) =>
            setSelectedIds(state.selectedRows.map((r) => r.id))
          }
          onRowClicked={(row) => navigate("/newcustomer", { state: row })}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationDefaultPage={page}
          onChangePage={(newPage) => setPage(newPage)}
          onChangeRowsPerPage={(newPerPage) => {
            setPerPage(newPerPage);
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
          noDataComponent={<EmptyStateMessage title="Customers" />}
        />
      </div>



      {/* ✅ PDF Preview Modal */}
      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Customer Report"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default ViewCustomer;
