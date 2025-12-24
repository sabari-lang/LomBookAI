import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import Dropdown from "react-bootstrap/Dropdown";
import "bootstrap/dist/css/bootstrap.min.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

import { getQuotes, deleteQuote } from "../api"; // ✅ API added
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems"; // same as ViewCustomer.jsx
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import EmptyStateMessage from "../../common/emptytable/EmptyStateMessage";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const ViewQuote = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ===============================
  // Pagination States (same as ViewCustomer.jsx)
  // ===============================
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, perPage]);

  // ===============================
  // Filters
  // ===============================
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);

  // ===============================
  // Fetch Quotes (React Query)
  // ===============================
  const { data: fetchedQuotes, isLoading } = useQuery({
    queryKey: ["quotes", page, perPage],
    queryFn: () => getQuotes({ Page: page, PageSize: perPage }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Quotes"),
  });

  const quotes = extractItems(fetchedQuotes) ?? [];
  const { totalCount } = extractPagination(fetchedQuotes);
  const totalRows = Number.isFinite(totalCount) ? totalCount : quotes.length;

  // ===============================
  // Delete Quote Mutation
  // ===============================
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotes"]);
      setSelectedIds([]);
    },
    onError: (error) => handleProvisionalError(error, "Delete Quote"),
  });

  const handleDelete = async () => {
    try {
      if (!selectedIds || selectedIds.length === 0) {
        notifyInfo("Please select at least one quote to delete.");
        return;
      }
      const confirmed = await confirm("Are you sure you want to delete selected quotes?");
    if (!confirmed) return;

      const validIds = selectedIds.filter(id => Boolean(id));
      if (validIds.length === 0) {
        handleProvisionalError(new Error("No valid quote IDs selected"), "Delete Quote");
        return;
      }

      const deletePromises = validIds.map((id) =>
        deleteMutation.mutateAsync(id).catch(err => {
          console.error(`Failed to delete quote ${id}:`, err);
          return null;
        })
      );

      await Promise.all(deletePromises);
      setSelectedIds([]);
      notifySuccess("Quote(s) deleted successfully");
    } catch (error) {
      console.error("Failed to delete quotes:", error);
      handleProvisionalError(error, "Delete Quote");
    }
  };

  // ===============================
  // Filters (Search + Status + Date)
  // ===============================
  const filteredQuotes = useMemo(() => {
    try {
      if (!Array.isArray(quotes)) return [];

      const text = (filterText || "").toLowerCase().trim();

      return quotes.filter((quote) => {
        if (!quote) return false;

        try {
          const quoteDate = quote?.date ? new Date(quote.date) : null;
          const from = fromDate ? new Date(fromDate) : null;
          const to = toDate ? new Date(toDate) : null;

          const matchesSearch =
            (quote?.customerName || "").toLowerCase().includes(text) ||
            (quote?.quoteNumber || "").toLowerCase().includes(text);

          const matchesStatus =
            statusFilter === "All" || quote?.status === statusFilter;

          const withinDate =
            (!from || !quoteDate || quoteDate >= from) &&
            (!to || !quoteDate || quoteDate <= to);

          return matchesSearch && matchesStatus && withinDate;
        } catch (err) {
          console.error("Error filtering quote:", err, quote);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filteredQuotes:", error);
      return [];
    }
  }, [quotes, filterText, statusFilter, fromDate, toDate]);

  // ===============================
  // Summary Cards
  // ===============================
  const { totalQuotes, totalConverted, totalOpen } = useMemo(() => {
    try {
      if (!Array.isArray(filteredQuotes)) {
        return { totalQuotes: 0, totalConverted: 0, totalOpen: 0 };
      }

      let total = 0,
        converted = 0,
        open = 0;

      filteredQuotes.forEach((q) => {
        try {
          const amt = Number(q?.amount) || 0;
          if (!Number.isFinite(amt)) return;

          total += amt;
          if (q?.status === "Converted") converted += amt;
          if (q?.status === "Open") open += amt;
        } catch (err) {
          console.error("Error processing quote amount:", err, q);
        }
      });

      return {
        totalQuotes: Number.isFinite(total) ? total : 0,
        totalConverted: Number.isFinite(converted) ? converted : 0,
        totalOpen: Number.isFinite(open) ? open : 0,
      };
    } catch (error) {
      console.error("Error calculating summary:", error);
      return { totalQuotes: 0, totalConverted: 0, totalOpen: 0 };
    }
  }, [filteredQuotes]);

  // ===============================
  // Excel Export
  // ===============================
  const exportExcel = () => {
    try {
      if (!Array.isArray(filteredQuotes) || filteredQuotes.length === 0) {
        notifyInfo("No quotes to export.");
        return;
      }

      const safeData = filteredQuotes.map((q) => ({
        date: q?.date ?? "N/A",
        quoteNumber: q?.quoteNumber ?? "N/A",
        referenceNumber: q?.referenceNumber ?? "N/A",
        customerName: q?.customerName ?? "N/A",
        status: q?.status ?? "N/A",
        amount: q?.amount ?? 0,
      }));

      const ws = XLSX.utils.json_to_sheet(safeData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotes");
      XLSX.writeFile(wb, `QuoteReport_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      handleProvisionalError(error, "Export Excel");
    }
  };

  // ===============================
  // PDF Preview Logic
  // ===============================
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const generatePDF = async () => {
    try {
      if (!Array.isArray(filteredQuotes) || filteredQuotes.length === 0) {
        notifyInfo("No quotes to generate PDF.");
        return;
      }

      setPdfLoading(true);

      const div = document.createElement("div");
      if (!div) throw new Error("Failed to create div element");

      div.style.position = "fixed";
      div.style.top = "-3000px";
      div.style.left = "-3000px";
      div.style.width = "210mm";
      div.style.padding = "20px";
      div.style.background = "white";

      const htmlContent = `
        <h2 style="text-align:center;margin-bottom:10px;">QUOTATION REPORT</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr>
              <th style="border:1px solid #000;padding:6px;">Date</th>
              <th style="border:1px solid #000;padding:6px;">Quote No</th>
              <th style="border:1px solid #000;padding:6px;">Reference No</th>
              <th style="border:1px solid #000;padding:6px;">Customer Name</th>
              <th style="border:1px solid #000;padding:6px;">Status</th>
              <th style="border:1px solid #000;padding:6px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredQuotes
          .map((q) => {
            const date = q?.date ?? "N/A";
            const quoteNumber = q?.quoteNumber ?? "N/A";
            const refNumber = q?.referenceNumber ?? "N/A";
            const customerName = q?.customerName ?? "N/A";
            const status = q?.status ?? "N/A";
            const amount = Number(q?.amount) || 0;
            return `
                  <tr>
                    <td style="border:1px solid #000;padding:6px;">${date}</td>
                    <td style="border:1px solid #000;padding:6px;">${quoteNumber}</td>
                    <td style="border:1px solid #000;padding:6px;">${refNumber}</td>
                    <td style="border:1px solid #000;padding:6px;">${customerName}</td>
                    <td style="border:1px solid #000;padding:6px;">${status}</td>
                    <td style="border:1px solid #000;padding:6px;">₹ ${amount.toLocaleString()}</td>
                  </tr>
                `;
          })
          .join("")}
          </tbody>
        </table>
      `;

      div.innerHTML = htmlContent;

      if (!document.body) throw new Error("Document body not found");
      document.body.appendChild(div);

      const canvas = await html2canvas(div, { scale: 2 });
      if (!canvas) throw new Error("Canvas generation failed");

      const img = canvas.toDataURL("image/png");
      if (!img) throw new Error("Image data URL generation failed");

      const pdf = new jsPDF("p", "mm", "a4");
      if (!pdf) throw new Error("PDF creation failed");

      pdf.addImage(
        img,
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width
      );

      const blob = pdf.output("blob");
      if (!blob) throw new Error("PDF blob generation failed");

      const url = URL.createObjectURL(blob);
      if (!url) throw new Error("Object URL creation failed");

      setPdfUrl(url);
      setShowPreview(true);

      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }

      setPdfLoading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfLoading(false);
      handleProvisionalError(error, "Generate PDF");
    }
  };

  const handlePdfAction = (action) => {
    try {
      const validUrl = pdfUrl && typeof pdfUrl === "string";
      if (!validUrl) {
        handleProvisionalError(new Error("PDF URL not available"), "PDF Action");
        return;
      }

      if (action === "open") {
        const newWindow = window.open(pdfUrl);
        if (!newWindow) {
          notifyInfo("Please disable your popup blocker to open PDF.");
        }
      }
      if (action === "save") {
        const a = document.createElement("a");
        if (!a) throw new Error("Failed to create anchor element");
        a.href = pdfUrl;
        a.download = `QuoteReport_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      if (action === "print") {
        const w = window.open(pdfUrl);
        if (!w) {
          notifyInfo("Please disable your popup blocker to print PDF.");
        } else {
          w.onload = () => {
            if (typeof w.print === "function") {
              w.print();
            }
          };
        }
      }
      if (action === "email") {
        const subject = encodeURIComponent("Quote Report");
        window.location.href = `mailto:?subject=${subject}`;
      }
    } catch (error) {
      console.error("Error in PDF action:", error);
      handleProvisionalError(error, "PDF Action");
    }
  };

  // ===============================
  // Table Columns (with safe fallbacks)
  // ===============================
  const columns = [
    {
      name: "Date",
      selector: (row) => row?.quoteDate ?? "N/A",
      sortable: true,
    },
    {
      name: "Quote No",
      selector: (row) => row?.quoteNumber ?? "N/A",
      sortable: true,
    },
    {
      name: "Reference No",
      selector: (row) => row?.referenceNumber ?? "N/A",
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row?.customerName ?? "N/A",
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row) => {
        const amount = Number(row?.amount) || 0;
        return `₹ ${amount.toLocaleString()}`;
      },
      right: true,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row?.status ?? "N/A",
      cell: (row) => {
        const status = row?.status ?? "Unknown";
        const badgeClass =
          status === "Converted"
            ? "bg-success"
            : status === "Open"
              ? "bg-warning text-dark"
              : "bg-secondary";
        return (
          <span className={`badge rounded-pill ${badgeClass}`}>
            {status}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
        if (!row?.id) {
          return <span className="text-muted small">No actions</span>;
        }
        return (
          <div
            className="d-flex align-items-center gap-2"
            onClick={(e) => e?.stopPropagation?.()}
          >
            <i
              className="bi bi-eye text-dark"
              style={{ cursor: "pointer", fontSize: "20px" }}
              onClick={async () => {
                try {
                  if (row && typeof row === "object") {
                    // Fetch all items to get HSN codes
                    const itemsResp = await getItems({ page: 1, pageSize: 10000 });
                    const allItems = Array.isArray(itemsResp?.items) ? itemsResp.items : [];
                    // For each item in the quote, match itemDetails to item.name and add hsn
                    let itemsWithHSN = Array.isArray(row.items)
                      ? row.items.map((qItem) => {
                          const found = allItems.find(
                            (item) =>
                              item?.name?.toLowerCase?.() === String(qItem?.itemDetails).toLowerCase?.()
                          );
                          return {
                            ...qItem,
                            hsn: found?.hsn || "",
                          };
                        })
                      : row.items;
                    navigate("/downloadquote", { state: { ...row, items: itemsWithHSN } });
                  }
                } catch (err) {
                  console.error("Error navigating to quote:", err);
                  handleProvisionalError(err, "View Quote");
                }
              }}
              title="View Quote"
            ></i>

            <Dropdown className="d-inline-block">
              <Dropdown.Toggle
                variant="outline-primary"
                size="sm"
                id={`dropdownConvert${row?.id}`}
                className="dropdown-toggle"
                disabled={!row?.id}
              >
                Convert
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Item
                  href="#"
                  onClick={(e) => {
                    try {
                      e.preventDefault();
                      e.stopPropagation();

                      if (!row || typeof row !== "object") throw new Error("Invalid quote data");

                      const quoteId = row?.id;
                      const quoteNum = row?.quoteNumber ?? "Unknown";

                      if (!quoteId) throw new Error("Quote ID is missing");

                      if (!row?.customerName || !row?.customerName.trim()) {
                        throw new Error("Customer name is required to convert to invoice");
                      }

                      if (!Array.isArray(row?.items) || row.items.length === 0) {
                        throw new Error("Quote must contain at least one item to convert");
                      }

                      console.info(`[Sales Conversion] Quote #${quoteNum} (ID: ${quoteId}) → Invoice`);

                      // Navigate to new invoice form with conversion metadata
                      navigate("/newinvoice", {
                        state: {
                          ...row,
                          isNew: true,
                          sourceQuoteId: quoteId,
                          sourceQuoteNumber: quoteNum,
                          sourceType: "quote",
                          conversionTimestamp: new Date().toISOString(),
                        },
                      });
                    } catch (err) {
                      console.error("[Convert to Sale] Error:", err);
                      handleProvisionalError(err, "Convert to Sale", err?.message || "Failed to convert quote to invoice");
                    }
                  }}
                >
                  Convert to Sale
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  href="#"
                  onClick={(e) => {
                    try {
                      e.preventDefault();
                      e.stopPropagation();

                      // Validate row data
                      if (!row || typeof row !== "object") {
                        throw new Error("Invalid quote data for sales order generation");
                      }

                      const quoteId = row?.id;
                      const quoteNumber = row?.quoteNumber ?? "Unknown";

                      if (!quoteId) {
                        throw new Error("Quote ID is required to generate sales order");
                      }

                      // Validate essential quote fields
                      if (!row?.customerName || !row?.customerName.trim()) {
                        throw new Error("Customer name is required in the quote");
                      }

                      if (!Array.isArray(row?.items) || row.items.length === 0) {
                        throw new Error("Quote must have at least one item");
                      }

                      // Validate items have required fields
                      const invalidItems = row.items.filter(
                        (item) => !item?.itemDetails || !item?.rate
                      );
                      if (invalidItems.length > 0) {
                        console.warn(
                          `[Generate Sales Order] ${invalidItems.length} items missing required fields`,
                          invalidItems
                        );
                      }

                      // Log action with context
                      console.info(
                        `[Sales Order Generation] Creating new sales order from Quote #${quoteNumber} (ID: ${quoteId})`,
                        {
                          quoteId,
                          quoteNumber,
                          customerName: row.customerName,
                          itemCount: row.items.length,
                          totalAmount: row.amount ?? 0,
                        }
                      );

                      // Navigate with safe data structure
                      navigate("/newsalesorder", {
                        state: {
                          // Quote data
                          ...row,

                          // Conversion metadata
                          isNew: true,
                          sourceQuoteId: quoteId,
                          sourceQuoteNumber: quoteNumber,
                          sourceType: "quote",
                          conversionTimestamp: new Date().toISOString(),

                          // Reset fields to ensure clean state
                          salesOrderNumber: null,
                          salesOrderId: null,
                        },
                      });
                    } catch (err) {
                      console.error("[Generate New Sales Order] Error:", err);
                      handleProvisionalError(
                        err,
                        "Generate New Sales Order",
                        err?.message || "Failed to generate sales order from quote"
                      );
                    }
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Generate New Sales Order
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        );
      },
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
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4">
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
        <h4 className="fw-bold text-dark mb-0">
          <i className="bi bi-file-earmark-text text-primary me-2"></i>
          Quotation Report
        </h4>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-success btn-sm"
            onClick={() => {
              try {
                exportExcel();
              } catch (err) {
                console.error("Error exporting Excel:", err);
                handleProvisionalError(err, "Export Excel");
              }
            }}
            disabled={!filteredQuotes || filteredQuotes.length === 0}
            title={filteredQuotes?.length === 0 ? "No quotes to export" : "Export to Excel"}
          >
            <i className="bi bi-file-earmark-excel"></i>
          </button>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              try {
                generatePDF();
              } catch (err) {
                console.error("Error generating PDF:", err);
                handleProvisionalError(err, "Generate PDF");
              }
            }}
            disabled={pdfLoading || !filteredQuotes || filteredQuotes.length === 0}
            title={filteredQuotes?.length === 0 ? "No quotes to generate PDF" : "Generate PDF"}
          >
            <i className="bi bi-printer"></i>
            {pdfLoading && <span className="ms-2">Loading...</span>}
          </button>

          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              try {
                handleDelete();
              } catch (err) {
                console.error("Error deleting quotes:", err);
                handleProvisionalError(err, "Delete Quote");
              }
            }}
            disabled={!selectedIds || selectedIds.length === 0}
            title={selectedIds?.length === 0 ? "Select quotes to delete" : "Delete selected quotes"}
          >
            <i className="bi bi-trash"></i> Delete
          </button>

          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={() => {
              try {
                navigate("/newquotes");
              } catch (err) {
                console.error("Error navigating to new quote:", err);
                handleProvisionalError(err, "Navigate to New Quote");
              }
            }}
          >
            <i className="bi bi-plus-circle"></i> New Quote
          </button>
        </div>
      </div>

      {/* FILTER BAR (UI unchanged) */}
      <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
        <div className="row g-3 align-items-end">
          <div className="col-lg-3 col-md-6">
            <label className="form-label text-secondary small fw-semibold">
              Search Quote
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by customer or quote number"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">
              From Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">
              To Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="col-lg-2 col-md-6">
            <label className="form-label text-secondary small fw-semibold">
              Status
            </label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Converted</option>
              <option>Open</option>
            </select>
          </div>

          <div className="col-lg-3 col-md-12">
            <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
              <h6 className="text-muted small fw-semibold mb-1">
                Total Quotations
              </h6>
              <h4 className="fw-bold text-dark mb-1">
                ₹ {totalQuotes.toLocaleString()}
              </h4>
              <div className="small text-muted">
                Converted:{" "}
                <span className="fw-semibold text-dark">
                  ₹ {totalConverted.toLocaleString()}
                </span>{" "}
                | Open:{" "}
                <span className="fw-semibold text-dark">
                  ₹ {totalOpen.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION (UI unchanged) */}

      <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2" style={{ minHeight: "60vh" }}>
        <DataTable
          columns={columns}
          data={filteredQuotes ?? []}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={(state) => {
            try {
              const ids = state?.selectedRows
                ?.map((r) => r?.id)
                .filter((id) => Boolean(id)) || [];
              setSelectedIds(ids);
            } catch (err) {
              console.error("Error selecting rows:", err);
              setSelectedIds([]);
            }
          }}

          onRowClicked={(row) => {
            try {
              if (row && typeof row === "object") {
                navigate("/newquotes", { state: row });
              }
            } catch (err) {
              console.error("Error navigating on row click:", err);
              handleProvisionalError(err, "Row Click Navigation");
            }
          }}

          pagination
          paginationServer
          paginationTotalRows={totalRows ?? 0}
          paginationPerPage={perPage}
          paginationRowsPerPageOptions={[25, 50, 100]}
          paginationDefaultPage={page ?? 1}
          onChangePage={(newPage) => {
            try {
              setPage(newPage);
            } catch (err) {
              console.error("Error changing page:", err);
            }
          }}

          onChangeRowsPerPage={(newPerPage) => {
            try {
              setPerPage(newPerPage);
              setPage(1);
            } catch (err) {
              console.error("Error changing rows per page:", err);
            }
          }}

          fixedHeader
          fixedHeaderScrollHeight="60vh"
          highlightOnHover
          pointerOnHover
          responsive
          striped
          dense
          persistTableHead
          progressPending={isLoading ?? false}

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

          noDataComponent={
            <EmptyStateMessage title="Quotations" />
          }
        />

      </div>



      <PdfPreviewModal
        show={showPreview}
        pdfUrl={pdfUrl}
        title="Quotation Report"
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
      />
    </div>
  );
};

export default ViewQuote;
