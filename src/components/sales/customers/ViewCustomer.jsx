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
import { norm, toNumberSafe, toBoolSafe, getId, safeArray } from "../../../utils/safe";
import { notifyError } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const ViewCustomer = () => {
  const navigate = useNavigate();

  const [filterText, setFilterText] = useState("");
  const [customerFilter, setCustomerFilter] = useState("All Customers");
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

  // Precompute duplicates by email/phone/name
  const duplicateIdSet = useMemo(() => {
    const emailCount = new Map();
    const phoneCount = new Map();
    const nameCount = new Map();
    const addCount = (map, key) => {
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    };
    customers.forEach((c) => {
      const email = norm(c?.email);
      const phone = (c?.workPhone ?? c?.phone ?? "").replace(/\D/g, "");
      const name = norm(c?.name ?? c?.displayName);
      addCount(emailCount, email);
      addCount(phoneCount, phone);
      addCount(nameCount, name);
    });
    const dupIds = new Set();
    customers.forEach((c) => {
      const email = norm(c?.email);
      const phone = (c?.workPhone ?? c?.phone ?? "").replace(/\D/g, "");
      const name = norm(c?.name ?? c?.displayName);
      const isDup =
        (email && (emailCount.get(email) || 0) > 1) ||
        (phone && (phoneCount.get(phone) || 0) > 1) ||
        (name && (nameCount.get(name) || 0) > 1);
      const id = getId(c);
      if (isDup && id) dupIds.add(id);
    });
    return dupIds;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    const textFiltered = customers.filter((customer) => {
      if (!text) return true;
      const name = norm(customer?.name ?? customer?.displayName);
      const company = norm(customer?.companyName);
      const email = norm(customer?.email);
      const phone = norm(customer?.workPhone ?? customer?.phone);
      return (
        name.includes(text) ||
        company.includes(text) ||
        email.includes(text) ||
        phone.includes(text)
      );
    });

    const isActive = (c) => {
      const status = norm(c?.status ?? c?.customerStatus);
      const activeFlag = c?.isActive ?? c?.active;
      return activeFlag != null ? !!activeFlag : status === "active";
    };
    const hasOverdue = (c) => toBoolSafe(c?.hasOverdue) || toBoolSafe(c?.overdue) || toNumberSafe(c?.overdueAmount) > 0;
    const isUnpaid = (c) => toNumberSafe(c?.receivables) > 0;
    const isDuplicate = (c) => duplicateIdSet.has(getId(c));

    return textFiltered.filter((c) => {
      switch (customerFilter) {
        case "All Customers":
          return true;
        case "Active Customers":
          return isActive(c);
        case "Inactive Customers":
          return !isActive(c);
        case "Duplicate Customers":
          return isDuplicate(c);
        case "Overdue Customers":
          return hasOverdue(c);
        case "Unpaid Customers":
          return isUnpaid(c);
        default:
          return true;
      }
    });
  }, [customers, filterText, customerFilter, duplicateIdSet]);

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
      notifyError("Please select at least one customer to delete.");
      return;
    }
    const confirmed = await confirm("Are you sure you want to delete selected customers?");
    if (!confirmed) return;

    const idsToDelete = selectedIds.filter(Boolean);
    if (idsToDelete.length === 0) return;

    try {
      await Promise.all(idsToDelete.map((id) => deleteMutation.mutateAsync(id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to delete customers", error);
      notifyError("Unable to delete selected customers. Please try again.");
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
      <style>
        table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #000; padding: 6px; vertical-align: middle; }
        th { background: #f2f2f2; font-weight: 600; }
        .num { text-align: right; white-space: nowrap; }
        .wrap { word-break: break-word; }
        .title { text-align: center; margin-bottom: 12px; font-size: 16px; }
      </style>
      <h2 class="title">CUSTOMER REPORT</h2>
      <table>
        <thead>
          <tr>
            <th class="wrap">Name</th>
            <th class="wrap">Company</th>
            <th class="wrap">Email</th>
            <th class="wrap">Work Phone</th>
            <th class="wrap">Place of Supply</th>
            <th class="num">Receivables</th>
            <th class="num">Unused Credits</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCustomers
            .filter((c) => {
              const name = c?.name ?? c?.displayName ?? "";
              const company = c?.companyName ?? "";
              const email = c?.email ?? "";
              const phone = buildWorkPhone(c) ?? "";
              return Boolean(name || company || email || phone);
            })
            .map((c) => `
              <tr>
                <td class="wrap">${c?.name ?? c?.displayName ?? ""}</td>
                <td class="wrap">${c?.companyName ?? ""}</td>
                <td class="wrap">${c?.email ?? ""}</td>
                <td class="wrap">${buildWorkPhone(c) ?? ""}</td>
                <td class="wrap">${c?.placeOfSupply ?? ""}</td>
                <td class="num">₹ ${toNumberSafe(c?.receivables).toLocaleString()}</td>
                <td class="num">₹ ${toNumberSafe(c?.unusedCredits).toLocaleString()}</td>
              </tr>`)
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
            <label className="form-label text-secondary small fw-semibold">
              Filter Category
            </label>
            <select
              className="form-select form-select-sm"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              {[
                "All Customers",
                "Active Customers",
                "Inactive Customers",
                "Duplicate Customers",
                "Overdue Customers",
                "Unpaid Customers",
              ].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
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
                whiteSpace: "nowrap",
                width: "auto",
              },
            },
            cells: {
              style: {
                padding: "12px",
                whiteSpace: "nowrap",
                width: "auto",
              },
            },
            tableWrapper: {
              style: {
                minHeight: "60vh",
                overflowY: "auto",
                scrollbarWidth: "none", // Firefox
              },
            },
            // Hide scrollbar for Webkit browsers
            table: {
              style: {
                // This will be applied to the table element
              },
            },
          }}
          noDataComponent={<EmptyStateMessage title="Customers" />}
        />
        {/* Hide scrollbar for Webkit browsers */}
        <style>{`
          .rdt_TableWrapper::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
