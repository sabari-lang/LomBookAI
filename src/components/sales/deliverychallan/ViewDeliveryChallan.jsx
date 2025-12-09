import React, { useState, useMemo, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getDeliveryChallans, deleteDeliveryChallan } from "../api";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";

const ViewDeliveryChallan = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => setSelectedRows([]), [page, perPage]);

  // ---------------- API CALL ----------------
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ["deliveryChallans", page, perPage],
    queryFn: () =>
      getDeliveryChallans({
        Page: page,
        PageSize: perPage,
      }),
    keepPreviousData: true,
    retry: 1,
    onError: (err) => handleProvisionalError(err, "Fetch Delivery Challans"),
  });

  const rawItems = extractItems(fetchedData) ?? [];

  // ---------------- NORMALIZED UI ROWS ----------------
  const challans = rawItems.map((o) => ({
    ...o,
    _date:
      o.deliveryDate?.split("T")[0] ||
      o.challanDate?.split("T")[0] ||
      o.date ||
      "",
    _number:
      o.deliveryChallanNo ||
      o.challanNo ||
      o.dcNo ||
      o.number ||
      "",
    _reference:
      o.reference ||
      o.referenceNumber ||
      o.refNo ||
      "",
    _customerName:
      o.customerName ||
      o.cusName ||
      o.clientName ||
      o.partyName ||
      o.name ||
      "",
    _amount:
      o.totalAmount ||
      o.amount ||
      o.total ||
      0,
    _status:
      o.status ||
      o.challanStatus ||
      "Draft",
    _invoiceStatus:
      o.invoiceStatus ||
      o.billStatus ||
      "—",
    _challanType:
      o.challanType || o.type || o.challan_type || "",
    _notes: o.customerNotes || o.notes || o.note || "",
  }));

  const { totalCount } = extractPagination(fetchedData);
  const totalRows = Number.isFinite(totalCount) ? totalCount : challans.length;

  // Mini-dashboard counts
  const totalChallans = challans.length;
  const totalAmount = challans.reduce((sum, c) => sum + Number(c?._amount ?? 0), 0);

  // ---------------- DELETE ----------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDeliveryChallan(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["deliveryChallans"]);
      setSelectedRows([]);
    },
    onError: (err) => handleProvisionalError(err, "Delete Delivery Challan"),
  });

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0)
      return alert("Please select at least one record");

    if (!window.confirm("Are you sure you want to delete?")) return;

    await Promise.all(selectedRows.map((r) => deleteMutation.mutateAsync(r.id)));
  };

  // ---------------- SEARCH ----------------
  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return challans.filter(
      (i) =>
        i._customerName.toLowerCase().includes(s) ||
        i._number.toLowerCase().includes(s) ||
        i._challanType.toLowerCase().includes(s) ||
        i._notes.toLowerCase().includes(s)
    );
  }, [challans, searchTerm]);

  // ---------------- EXPORT EXCEL ----------------
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DeliveryChallans");
    XLSX.writeFile(wb, "DeliveryChallans.xlsx");
  };

  // ---------------- EXPORT PDF ----------------
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generatePDF = async () => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.background = "white";
    div.style.fontFamily = "Arial, sans-serif";

    div.innerHTML = `
      <h2 style="text-align:center;">Delivery Challans</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
            <tr>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Date</th>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Challan No</th>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Challan Type</th>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Customer</th>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Notes</th>
            <th style="border:1px solid #000;padding:6px;background:#f1f1f1;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${filteredData
        .map(
          (c) => `
            <tr>
              <td style="border:1px solid #000;padding:6px;">${c._date}</td>
              <td style="border:1px solid #000;padding:6px;">${c._number}</td>
              <td style="border:1px solid #000;padding:6px;">${c._challanType}</td>
              <td style="border:1px solid #000;padding:6px;">${c._customerName}</td>
              <td style="border:1px solid #000;padding:6px;">${(c._notes || '').replace(/\n/g,' ')}</td>
              <td style="border:1px solid #000;padding:6px;">₹ ${c._amount}</td>
            </tr>
          `
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
    const height = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, pageWidth, height);

    const blob = pdf.output("blob");
    setPdfUrl(URL.createObjectURL(blob));
    setShowPreview(true);

    document.body.removeChild(div);
  };

  const handlePdfAction = (action) => {
    if (action === "open") window.open(pdfUrl);
    if (action === "save") {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "DeliveryChallans.pdf";
      a.click();
    }
    if (action === "print") {
      const w = window.open(pdfUrl);
      w.onload = () => w.print();
    }
  };

  const handleRowClick = (row) =>
    navigate("/newdeliverychallan", { state: row._original });

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    {
      name: "DATE",
      selector: (row) => row._date,
      sortable: true,
      width: "120px",
    },
    {
      name: "DELIVERY CHALLAN#",
      selector: (row) => row._number,
      sortable: true,
      width: "170px",
      cell: (row) => (
        <span
          className="text-primary"
          style={{ cursor: "pointer", fontWeight: 500 }}
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
        >
          {row._number}
        </span>
      ),
    },
    {
      name: "CHALLAN TYPE",
      selector: (row) => row._challanType,
      sortable: true,
      width: "140px",
      cell: (row) => <span style={{ fontWeight: 500 }}>{row._challanType}</span>,
    },
    {
      name: "CUSTOMER NAME",
      selector: (row) => row._customerName,
      sortable: true,
      grow: 2,
    },
    {
      name: "AMOUNT",
      selector: (row) => row._amount,
      sortable: true,
      right: true,
      width: "150px",
      cell: (row) => `₹ ${row._amount.toLocaleString()}`,
    },
    {
      name: "NOTES",
      selector: (row) => row._notes,
      sortable: false,
      grow: 1,
      cell: (row) => <span title={row._notes}>{row._notes ? (row._notes.length > 60 ? row._notes.slice(0, 60) + '…' : row._notes) : ''}</span>,
    },
    {
      name: "ACTIONS",
      width: "130px",
      right: true,
      ignoreRowClick: true,
      cell: (row) => (
        <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-outline-primary"
            title="View Report"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/delivery-challan-report", { state: row._original ?? row });
            }}
          >
            <i className="bi bi-eye"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this challan?")) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
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
          borderBottom: "1px solid rgba(0, 0, 0, 0.10)",
        }}
      >
        <h5 className="fw-semibold mb-0"><i className="bi bi-truck me-2"></i>Delivery Challans</h5>

        <div className="d-flex gap-2">
          <Button variant="success" size="sm" onClick={exportExcel}>
            <i className="bi bi-file-earmark-excel"></i>
          </Button>
          <Button variant="secondary" size="sm" onClick={generatePDF}>
            <i className="bi bi-filetype-pdf"></i>
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={selectedRows.length === 0}
            onClick={handleBulkDelete}
          >
            <i className="bi bi-trash"></i>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm"
            onClick={() => navigate("/newdeliverychallan")}
          >
            <i className="bi bi-plus-circle"></i> New Delivery Challan
          </Button>
        </div>
      </div>

      {/* Filter Bar + Mini Dashboard */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary small fw-semibold">
              Search Delivery Challan
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer, challan number, or reference"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">Total Challans</h6>
              <h4 className="fw-bold text-dark mb-1">{totalChallans}</h4>
              <div className="small text-muted">
                Total Amount: <span className="fw-semibold text-dark">₹ {totalAmount.toLocaleString()}</span>
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
          onSelectedRowsChange={(state) =>
            setSelectedRows(state.selectedRows)
          }
          onRowClicked={handleRowClick}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={perPage}
          paginationDefaultPage={page}
          paginationRowsPerPageOptions={[25, 50, 100]}
          onChangePage={(p) => setPage(p)}
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
          noDataComponent={<EmptyStateMessage title="Delivery Challans" />}
        />
      </div>

      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Delivery Challans"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default ViewDeliveryChallan;
