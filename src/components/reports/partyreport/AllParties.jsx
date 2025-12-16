import React, { useMemo, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getPartyAllBalances } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const fallbackRows = [
    { id: 1, partyName: "kannan", email: "kannan@gmail.com", phone: "7010489432", receivable: 0, payable: 0 },
    { id: 2, partyName: "Party 1", email: "abc1@xyz.com", phone: "1234567891", receivable: 200, payable: 0 },
    { id: 3, partyName: "Party 2", email: "abc2@xyz.com", phone: "1234567892", receivable: 300, payable: 0 },
    { id: 4, partyName: "Party 3", email: "abc3@xyz.com", phone: "1234567893", receivable: 40, payable: 0 },
    { id: 5, partyName: "Party 4", email: "abc4@xyz.com", phone: "1234567894", receivable: 200, payable: 0 },
    { id: 6, partyName: "Party 5", email: "abc5@xyz.com", phone: "1234567895", receivable: 300, payable: 0 },
    { id: 7, partyName: "Party 6", email: "abc6@xyz.com", phone: "1234567896", receivable: 0, payable: 300 },
    { id: 8, partyName: "Party 7", email: "abc7@xyz.com", phone: "1234567897", receivable: 200, payable: 0 },
    { id: 9, partyName: "ranjith", email: "ranjith@gmail.com", phone: "7010489435", receivable: 0, payable: 17700 },
];

const AllParties = () => {
    const today = new Date();
    const defaultToDate = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const form = useForm({
        defaultValues: {
            filterType: "All parties",
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            searchText: "",
        },
    });

    const control = form.control;
    const filterType = useWatch({ control, name: "filterType" });
    const searchText = useWatch({ control, name: "searchText" });
    const fromDate = useWatch({ control, name: "fromDate" });
    const toDate = useWatch({ control, name: "toDate" });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainer = useRef(null);

    const requestParams = useMemo(() => {
        const params = { Page: page, PageSize: perPage };
        if (filterType && filterType !== "All parties") params.FilterType = filterType;
        if (fromDate) params.FromDate = fromDate;
        if (toDate) params.ToDate = toDate;
        return params;
    }, [filterType, fromDate, page, perPage, toDate]);

    const queryKey = useMemo(
        () => ["report-party-all-balances", filterType, fromDate, toDate, page, perPage],
        [filterType, fromDate, toDate, page, perPage]
    );

    const { data: fetched, isLoading } = useQuery({
        queryKey,
        queryFn: () => getPartyAllBalances(requestParams),
        enabled: Boolean(fromDate && toDate),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Party Balances"),
    });

    const apiRows = extractItems(fetched);
    const pagination = extractPagination(fetched);
    const tableRows = apiRows.length > 0 ? apiRows : fallbackRows;
    const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

    const filteredRows = useMemo(() => {
        const text = (searchText ?? "").toLowerCase();
        if (!text) return tableRows;
        return tableRows.filter((row) => {
            const party = (row.partyName ?? row.name ?? "").toString().toLowerCase();
            const email = (row.email ?? "").toString().toLowerCase();
            return party.includes(text) || email.includes(text);
        });
    }, [searchText, tableRows]);

    const totalReceivable = useMemo(
        () =>
            filteredRows.reduce(
                (sum, row) => sum + Number(row.receivable ?? row.outstandingReceivable ?? row.credit ?? 0),
                0
            ),
        [filteredRows]
    );
    const totalPayable = useMemo(
        () =>
            filteredRows.reduce(
                (sum, row) => sum + Number(row.payable ?? row.outstandingPayable ?? row.debit ?? 0),
                0
            ),
        [filteredRows]
    );

    const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

    const handlePageChange = (newPage) => setPage(newPage);
    const handlePerRowsChange = (newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
    };

    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredRows.map((row) => ({
                "Party Name": row.partyName ?? row.name ?? "",
                Email: row.email ?? "",
                Phone: row.phone ?? "",
                Receivable: row.receivable ?? row.outstandingReceivable ?? 0,
                Payable: row.payable ?? row.outstandingPayable ?? 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "All Parties");
        XLSX.writeFile(workbook, `AllParties_${fromDate || "start"}_${toDate || "end"}.xlsx`);
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "fixed";
            tempDiv.style.top = "-9999px";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "22px";
            tempDiv.innerHTML = `
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; }
          h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
          table { border-collapse: collapse; width:100%; margin-top:8px; }
          th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
          th { background:#f1f1f1; font-weight:600; }
          .text-start { text-align:left; }
          .fw-bold { font-weight:700; }
        </style>

        <h4>All Parties Report</h4>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Party Name</th><th>Email</th><th>Phone</th><th>Receivable (₹)</th><th>Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
                .map(
                    (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td class="text-start">${row.partyName ?? row.name ?? ""}</td>
                <td>${row.email ?? ""}</td>
                <td>${row.phone ?? ""}</td>
                <td>${formatCurrency(row.receivable ?? row.outstandingReceivable ?? 0)}</td>
                <td>${formatCurrency(row.payable ?? row.outstandingPayable ?? 0)}</td>
              </tr>`
                )
                .join("")}
            <tr class="fw-bold">
              <td colspan="4" class="text-start">Totals</td>
              <td>${formatCurrency(totalReceivable)}</td>
              <td>${formatCurrency(totalPayable)}</td>
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
            alert("Failed to generate PDF");
        } finally {
            if (tempContainer.current) {
                document.body.removeChild(tempContainer.current);
                tempContainer.current = null;
            }
            setIsGenerating(false);
        }
    };

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        if (action === "print") window.open(pdfUrl)?.print();
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `AllParties_${fromDate}_${toDate}.pdf`;
            link.click();
        }
        if (action === "email") alert("Email feature coming soon");
    };

    const columns = [
        { name: "#", selector: (_, index) => index + 1, width: "60px" },
        { name: "PARTY NAME", selector: (row) => row.partyName ?? row.name ?? "—", sortable: true, grow: 2 },
        { name: "EMAIL", selector: (row) => row.email ?? "—" },
        { name: "PHONE", selector: (row) => row.phone ?? "—" },
        {
            name: "RECEIVABLE",
            selector: (row) => formatCurrency(row.receivable ?? row.outstandingReceivable ?? 0),
            right: true,
            sortable: true,
        },
        {
            name: "PAYABLE",
            selector: (row) => formatCurrency(row.payable ?? row.outstandingPayable ?? 0),
            right: true,
            sortable: true,
        },
    ];

    return (
        <div className="container-fluid bg-light pt-1 pb-4 overflow-auto rounded-3" style={{ height: "calc(100vh - 11vh)" }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Controller
                        name="filterType"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="form-select form-select-sm" style={{ width: "180px" }}>
                                <option>All parties</option>
                                <option>Receivable</option>
                                <option>Payable</option>
                            </select>
                        )}
                    />
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} style={{ width: 150 }} />
                        )}
                    />
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input type="date" className="form-control form-control-sm" {...field} style={{ width: 150 }} />
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Controller
                        name="searchText"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                placeholder="Search by party or email"
                                className="form-control form-control-sm"
                                style={{ width: 220 }}
                            />
                        )}
                    />
                    <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>
                        <i className="bi bi-file-earmark-excel"></i> Excel
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={generatePDF} disabled={isGenerating}>
                        <i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print / PDF"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden p-3" style={{ minHeight: "55vh" }}>
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationDefaultPage={page}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    highlightOnHover
                    striped
                    dense
                    persistTableHead
                    progressPending={isLoading}
                    noDataComponent={<div className="py-3 text-center text-muted">No records to display</div>}
                />
                <div className="d-flex justify-content-between fw-bold mt-2">
                    <div>Parties: {filteredRows.length}</div>
                    <div>Total Receivable: {formatCurrency(totalReceivable)}</div>
                    <div>Total Payable: {formatCurrency(totalPayable)}</div>
                </div>
            </div>

            <PdfPreviewModal
                pdfUrl={pdfUrl}
                show={showPreview}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
                title="All Parties Report"
            />
        </div>
    );
};

export default AllParties;
