import React, { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import { Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getTransactionDaybook } from "../reportAPI";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const DayBook = () => {
    // Report filter form - always unlock on mount
    
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });

    const [selectedFirm, setSelectedFirm] = useState("ALL FIRMS");
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const queryKey = useMemo(() => ["report-daybook", page, perPage], [page, perPage]);
    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () =>
            getTransactionDaybook({
                Page: page,
                PageSize: perPage,
            }),
        enabled: Boolean(page && perPage),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Day Book"),
    });
    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows;
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : tableRows.length;

    // ===== Filtered Data =====
    const textFilter = searchText.trim().toLowerCase();
    const filteredData = useMemo(() => {
        if (!textFilter) return tableRows;
        return tableRows.filter(
            (r) =>
                r?.name?.toLowerCase().includes(textFilter) ||
                r?.refNo?.toLowerCase().includes(textFilter) ||
                r?.type?.toLowerCase().includes(textFilter)
        );
    }, [tableRows, textFilter]);

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    // ===== Excel Download =====
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DayBook Report");
        XLSX.writeFile(workbook, `DayBook_${selectedDate}.xlsx`);
    };

    // ===== Generate PDF Preview =====
    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const totalIn = filteredData.reduce((sum, row) => sum + Number(row.moneyIn ?? 0), 0);
            const totalOut = filteredData.reduce((sum, row) => sum + Number(row.moneyOut ?? 0), 0);

            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-9999px";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "20px";
            tempDiv.innerHTML = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; }
        h4 { text-align:center; text-decoration:underline; margin: 0 0 12px; }
        table { border-collapse: collapse; width:100%; margin-top:8px; }
        th, td { border:1px solid #000; padding:4px 6px; font-size:11px; text-align:center; }
        th { background:#f1f1f1; }
        .text-start { text-align:left; }
        .fw-bold { font-weight:700; }
      </style>

      <h4>Day Book Report</h4>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Ref No.</th>
            <th>Type</th>
            <th>Total</th>
            <th>Money In</th>
            <th>Money Out</th>
          </tr>
        </thead>
                <tbody>
                    ${filteredData
                                        .map(
                                                (r) => `
                        <tr>
                            <td class="text-start">${r.name}</td>
                            <td>${r.refNo}</td>
                            <td>${r.type}</td>
                            <td>${formatCurrency(r.total)}</td>
                            <td>${formatCurrency(r.moneyIn)}</td>
                            <td>${formatCurrency(r.moneyOut)}</td>
                        </tr>`
                                        )
                    .join("")}
          <tr class="fw-bold">
            <td colspan="4" class="text-start">Total</td>
                        <td>${formatCurrency(totalIn)}</td>
                        <td>${formatCurrency(totalOut)}</td>
          </tr>
        </tbody>
      </table>`;

            document.body.appendChild(tempDiv);
            tempContainer.current = tempDiv;

            const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (err) {
            console.error(err);
            notifyError("Failed to generate PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    // ===== Table Columns =====
    const columns = [
        { name: "NAME", selector: (row) => row?.name || "—", sortable: true },
        { name: "REF NO.", selector: (row) => row?.refNo || "—", sortable: true },
        { name: "TYPE", selector: (row) => row?.type || "—", sortable: true },
        {
            name: "TOTAL",
            selector: (row) => formatCurrency(row?.total),
            right: true,
        },
        {
            name: "MONEY IN",
            selector: (row) => formatCurrency(row?.moneyIn),
            right: true,
        },
        {
            name: "MONEY OUT",
            selector: (row) => formatCurrency(row?.moneyOut),
            right: true,
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: "#f1f4f7",
                color: "#333",
                fontWeight: 600,
                fontSize: "14px",
            },
        },
        rows: {
            style: { minHeight: "42px", fontSize: "14px" },
        },
    };

    // ===== Handle Modal Actions =====
    const handlePdfAction = (action) => {
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `DayBook_${selectedDate}.pdf`;
            link.click();
        }
        if (action === "email") notifyInfo("Email sending not implemented yet!");
    };

    return (
        <div
            className="container-fluid bg-white border rounded shadow-sm mt-2 p-3"
            style={{ minHeight: "85vh" }}
        >
            {/* ===== HEADER FILTER BAR ===== */}
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <label className="fw-semibold text-secondary">Date</label>
                        <Form.Control
                            type="date"
                            size="sm"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ width: "150px" }}
                        />
                    </div>
                    <Form.Select
                        size="sm"
                        value={selectedFirm}
                        onChange={(e) => setSelectedFirm(e.target.value)}
                        style={{ width: "180px" }}
                    >
                        <option>ALL FIRMS</option>
                        <option>Firm A</option>
                        <option>Firm B</option>
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="outline-success"
                        size="sm"
                        className="d-flex align-items-center gap-1"
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i> Excel Report
                    </Button>

                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center gap-1"
                        onClick={generatePDF}
                        disabled={isGenerating}
                    >
                        <i className="bi bi-printer"></i>{" "}
                        {isGenerating ? "Generating..." : "Print / PDF"}
                    </Button>
                </div>
            </div>

            {/* ===== SEARCH BAR ===== */}
            <div className="d-flex justify-content-start align-items-center mb-2">
                <div className="input-group input-group-sm" style={{ width: "250px" }}>
                    <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-search text-muted"></i>
                    </span>
                    <Form.Control
                        type="text"
                        placeholder="Search..."
                        className="border-start-0 shadow-none"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* ===== DATA TABLE ===== */}
            <div className="border rounded">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    highlightOnHover
                    pointerOnHover
                    striped
                    dense
                    responsive
                    customStyles={customStyles}
                    noDataComponent={
                        <div className="py-4 text-center text-muted">
                            No records found for this date.
                        </div>
                    }
                    progressPending={isLoading}
                    persistTableHead
                />
            </div>

            {/* ===== PDF Preview Modal ===== */}
            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="DayBook PDF Preview"
            />
        </div>
    );
};

export default DayBook;
