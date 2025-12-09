import React, { useState, useMemo, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import { getSalesOrders, deleteSalesOrder } from "../api";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";


const ViewSalesOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => setSelectedRows([]), [page, perPage]);

  // ================================
  // FETCH API
  // ================================
  const { data: fetchedOrders, isLoading } = useQuery({
    queryKey: ["salesOrders", page, perPage],
    queryFn: () => getSalesOrders({ Page: page, PageSize: perPage }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Sales Orders"),
  });

  const rawOrders = extractItems(fetchedOrders) ?? [];

  // ================================
  // MAP BACKEND → UI FORMAT
  // ================================
  const salesOrders = rawOrders.map((o) => ({
    id: o.id,
    date: o.salesOrderDate?.split("T")[0] ?? "",
    number: o.salesOrderNumber ?? "",
    reference: o.referenceNumber ?? "",
    customer: o.customerName ?? "",
    status: o.status ?? "Draft",
    invoiced: false,
    payment: false,
    amount: o.totalAmount ?? 0,
    shipmentDate: o.expectedShipmentDate?.split("T")[0] ?? "",
    orderStatus: o.status ?? "Draft",
    deliveryMethod: o.deliveryMethod ?? "",
    _original: o,
  }));

  const { totalCount } = extractPagination(fetchedOrders);
  const totalRows = Number.isFinite(totalCount) ? totalCount : salesOrders.length;

  // Mini-dashboard counts
  const totalOrders = salesOrders.length;
  const totalAmount = salesOrders.reduce((sum, o) => sum + Number(o?.amount ?? 0), 0);
  const draftCount = salesOrders.filter((o) => o?.status === "Draft").length;
  const confirmedCount = salesOrders.filter((o) => o?.status === "Confirmed" || o?.status === "Open").length;

  // ================================
  // DELETE MUTATION
  // ================================
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["salesOrders"]);
      setSelectedRows([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Sales Order"),
  });

  const handleDelete = async () => {
    if (selectedRows.length === 0)
      return alert("Please select at least one record to delete.");

    if (!window.confirm("Are you sure you want to delete selected Sales Orders?"))
      return;

    try {
      await Promise.all(
        selectedRows.map((row) => deleteMutation.mutateAsync(row.id))
      );
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // ================================
  // FILTER
  // ================================
  const filteredData = useMemo(() => {
    return salesOrders.filter(
      (item) =>
        item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesOrders, searchTerm]);

  // ================================
  // EXCEL EXPORT
  // ================================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesOrders");
    XLSX.writeFile(wb, "SalesOrders.xlsx");
  };

  // ================================
  // CLEAN PDF EXPORT
  // ================================
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.width = "100%";
    div.style.background = "white";
    div.style.fontFamily = "Arial, sans-serif";

    const tableStyle = `
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    `;

    const thStyle = `
      border: 1px solid #000;
      padding: 6px;
      background: #f1f1f1;
      font-weight: bold;
      text-align: left;
    `;

    const tdStyle = `
      border: 1px solid #000;
      padding: 6px;
    `;

    div.innerHTML = `
      <h2 style="text-align:center; margin-bottom: 15px;">Sales Orders Report</h2>

      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle} width: 10%;">Date</th>
            <th style="${thStyle} width: 14%;">Sales Order#</th>
            <th style="${thStyle} width: 14%;">Reference#</th>
            <th style="${thStyle} width: 20%;">Customer</th>
            <th style="${thStyle} width: 10%;">Status</th>
            <th style="${thStyle} width: 10%;">Amount</th>
            <th style="${thStyle} width: 14%;">Expected Shipment</th>
            <th style="${thStyle} width: 12%;">Delivery Method</th>
          </tr>
        </thead>

        <tbody>
          ${filteredData
        .map(
          (o) => `
            <tr>
              <td style="${tdStyle}">${o.date}</td>
              <td style="${tdStyle}">${o.number}</td>
              <td style="${tdStyle}">${o.reference}</td>
              <td style="${tdStyle}">${o.customer}</td>
              <td style="${tdStyle}">${o.status}</td>
              <td style="${tdStyle}">₹ ${o.amount.toLocaleString()}</td>
              <td style="${tdStyle}">${o.shipmentDate}</td>
              <td style="${tdStyle}">${o.deliveryMethod}</td>
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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const pageHeight = pageWidth * ratio;

    pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    setPdfUrl(url);
    setShowPreview(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "SalesOrders.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  // ================================
  // Row click → Edit
  // ================================
  const handleRowClick = (row) => {
    navigate("/newsalesorder", { state: row._original });
  };

  // ================================
  // FINAL TABLE COLUMNS (Zoho style)
  // ================================
  const columns = [
    { name: "DATE", selector: (row) => row.date, sortable: true },

    {
      name: "SALES ORDER#",
      selector: (row) => row.number,
      sortable: true,
      cell: (row) => (
        <span
          className="text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/newsalesorder", { state: row._original })}
        >
          {row.number}
        </span>
      ),
    },

    { name: "REFERENCE#", selector: (row) => row.reference, sortable: true },
    { name: "CUSTOMER NAME", selector: (row) => row.customer, sortable: true },

    {
      name: "STATUS",
      selector: (row) => row.status,
      cell: (row) => <span className="text-muted">{row.status}</span>,
    },

    {
      name: "INVOICED",
      selector: () => "•",
      cell: () => <span style={{ opacity: 0.4 }}>●</span>,
    },

    {
      name: "PAYMENT",
      selector: () => "•",
      cell: () => <span style={{ opacity: 0.4 }}>●</span>,
    },

    {
      name: "AMOUNT",
      selector: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      right: true,
    },

    {
      name: "EXPECTED SHIPMENT DATE",
      selector: (row) => row.shipmentDate,
      sortable: true,
    },

    {
      name: "ORDER STATUS",
      selector: (row) => row.orderStatus,
      sortable: true,
      cell: (row) => <span className="text-muted">{row.orderStatus}</span>,
    },

    {
      name: "DELIVERY METHOD",
      selector: (row) => row.deliveryMethod,
      sortable: true,
    },
    {
      name: "ACTIONS",
      minWidth: "180px",   // 👈 Add this
      cell: (row) => (
        <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-outline-primary"
            title="View Sales Order"
            onClick={() => navigate("/downloadsalesorder", { state: row._original })}
          >
            <i className="bi bi-eye" style={{ fontSize: "12px" }}></i>
          </button>

          <button
            className="btn btn-sm btn-outline-success"
            title="Convert to Invoice"
            style={{ minWidth: "140px" }}
            onClick={(e) => {
              e.stopPropagation();
              const original = row._original || row;
              navigate("/newinvoice", { state: original });
            }}
          >
            Convert to Invoice
          </button>
        </div>
      ),
      center: true,
    }

  ];

  const customStyles = {
    headCells: {
      style: {
        fontWeight: "600",
        fontSize: "12px",
        backgroundColor: "#f8f9fa",
        color: "#555",
        textTransform: "uppercase",
      },
    },
    rows: { style: { fontSize: "13px" } },
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      {/* Header */}
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
        <h5 className="fw-semibold mb-0"><i className="bi bi-cart3 me-2"></i>Sales Orders</h5>

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
            disabled={selectedRows.length === 0}
          >
            <i className="bi bi-trash"></i> Delete
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/newsalesorder")}
          >
            + New Sales Order
          </button>
        </div>
      </div>

      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Sales Order
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer, order number, reference, or status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Orders</h6>
              <h4 className="fw-bold text-dark mb-1">{totalOrders}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Status Summary</h6>
              <div className="small text-muted mb-1">
                Confirmed/Open: <span className="fw-semibold text-success">{confirmedCount}</span>
              </div>
              <div className="small text-muted">
                Draft: <span className="fw-semibold text-warning">{draftCount}</span>
              </div>
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
          data={filteredData}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
          onRowClicked={handleRowClick}
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
          noDataComponent={<EmptyStateMessage title="Sales Orders" />}
        />
      </div>


      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Sales Orders Report"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default ViewSalesOrder;
