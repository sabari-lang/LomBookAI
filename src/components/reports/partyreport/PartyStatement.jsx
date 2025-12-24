import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";
import { getPartyStatement } from "../reportAPI";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const PartyStatement = () => {
	// Report filter form - always unlock on mount
	
	
	const form = useForm({
		defaultValues: {
			fromDate: "2025-11-01",
			toDate: "2025-11-30",
			party: "",
		},
	});
	const control = form.control;
	const fromDate = useWatch({ control, name: "fromDate" });
	const toDate = useWatch({ control, name: "toDate" });
	const selectedParty = useWatch({ control, name: "party" });

	const [filterText, setFilterText] = useState("");
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(25);
	const [pdfUrl, setPdfUrl] = useState(null);
	const [showPreview, setShowPreview] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const tempContainer = useRef(null);

	const requestParams = useMemo(() => {
		const params = {
			Page: page,
			PageSize: perPage,
		};
		if (fromDate) params.FromDate = fromDate;
		if (toDate) params.ToDate = toDate;
		if (selectedParty) params.PartyName = selectedParty;
		return params;
	}, [fromDate, page, perPage, selectedParty, toDate]);

	const queryKey = useMemo(
		() => ["report-party-statement", fromDate, toDate, selectedParty, page, perPage],
		[fromDate, toDate, selectedParty, page, perPage]
	);

	const { data: fetched, isLoading } = useQuery({
		queryKey,
		queryFn: () => getPartyStatement(requestParams),
		enabled: Boolean(fromDate && toDate),
		keepPreviousData: true,
		retry: 1,
		onError: (error) => handleProvisionalError(error, "Party Statement"),
	});

	const apiRows = extractItems(fetched);
	const pagination = extractPagination(fetched);
	const tableRows = apiRows;
	const totalRows = Number.isFinite(pagination.totalCount) ? pagination.totalCount : tableRows.length;

	const filteredRows = useMemo(() => {
		if (!filterText) return tableRows;
		const lower = filterText.toLowerCase();
		return tableRows.filter(
			(row) =>
				(row.txnType ?? "").toLowerCase().includes(lower) ||
				(row.refNo ?? "").toLowerCase().includes(lower) ||
				(row.paymentType ?? "").toLowerCase().includes(lower)
		);
	}, [filterText, tableRows]);

	const totalDebit = useMemo(
		() => filteredRows.reduce((sum, row) => sum + Number(row.debit ?? 0), 0),
		[filteredRows]
	);
	const totalCredit = useMemo(
		() => filteredRows.reduce((sum, row) => sum + Number(row.credit ?? 0), 0),
		[filteredRows]
	);
	const closingBalance = totalDebit - totalCredit;

	const formatCurrency = (value) => `₹ ${Number(value ?? 0).toLocaleString()}`;

	const handlePageChange = (newPage) => setPage(newPage);
	const handlePerRowsChange = (newPerPage) => {
		setPerPage(newPerPage);
		setPage(1);
	};

	const downloadExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet(filteredRows);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Party Statement");
		XLSX.writeFile(workbook, `PartyStatement_${fromDate || "custom"}_${toDate || "custom"}.xlsx`);
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
			tempDiv.style.padding = "20px";
			tempDiv.innerHTML = `
		<style>
		  body { font-family: Arial, sans-serif; font-size: 11px; }
		  h4 { text-align:center; text-decoration:underline; margin: 0 0 12px; }
		  table { border-collapse: collapse; width:100%; margin-top:8px; }
		  th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
		  th { background:#f1f1f1; font-weight:600; }
		  .text-start { text-align:left; }
		  .fw-bold { font-weight:700; }
		</style>

		<h4>Party Statement Report</h4>
		<table>
		  <tr>
			<td class="text-start fw-bold" colspan="2">Period</td>
			<td colspan="4">${fromDate || "—"} to ${toDate || "—"}</td>
		  </tr>
		</table>
		<table>
		  <thead>
			<tr>
			  <th>Date</th><th>Txn Type</th><th>Ref No</th>
			  <th>Payment Type</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Running Balance (₹)</th>
			</tr>
		  </thead>
		  <tbody>
			${filteredRows
				.map(
					(row) => `
			  <tr>
				<td>${row.date ?? ""}</td>
				<td>${row.txnType ?? ""}</td>
				<td>${row.refNo ?? ""}</td>
				<td>${row.paymentType ?? ""}</td>
				<td>${formatCurrency(row.debit)}</td>
				<td>${formatCurrency(row.credit)}</td>
				<td>${formatCurrency(row.runningBalance)}</td>
			  </tr>`
				)
				.join("")}
			<tr class="fw-bold">
			  <td colspan="4" class="text-start">Totals</td>
			  <td>${formatCurrency(totalDebit)}</td>
			  <td>${formatCurrency(totalCredit)}</td>
			  <td>${formatCurrency(closingBalance)}</td>
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

	const handlePdfAction = (action) => {
		if (!pdfUrl) return;
		if (action === "print") window.open(pdfUrl)?.print();
		if (action === "open") window.open(pdfUrl, "_blank");
		if (action === "save") {
			const link = document.createElement("a");
			link.href = pdfUrl;
			link.download = "PartyStatement.pdf";
			link.click();
		}
		if (action === "email") {
			const subject = encodeURIComponent("Party Statement Report");
			const body = encodeURIComponent("Please find attached the Party Statement.");
			window.location.href = `mailto:?subject=${subject}&body=${body}`;
		}
	};

	const columns = [
		{ name: "DATE", selector: (row) => row.date || "—", sortable: true },
		{ name: "TXN TYPE", selector: (row) => row.txnType || "—", sortable: true },
		{ name: "REF NO.", selector: (row) => row.refNo || "—", sortable: true },
		{ name: "PAYMENT TYPE", selector: (row) => row.paymentType || "—", sortable: true },
		{
			name: "DEBIT",
			selector: (row) => formatCurrency(row.debit),
			right: true,
			sortable: true,
		},
		{
			name: "CREDIT",
			selector: (row) => formatCurrency(row.credit),
			right: true,
			sortable: true,
		},
		{
			name: "RUNNING BALANCE",
			selector: (row) => formatCurrency(row.runningBalance),
			right: true,
			sortable: true,
		},
	];

	const customStyles = {
		headCells: {
			style: {
				backgroundColor: "#f8f9fa",
				fontWeight: "600",
				fontSize: "13px",
			},
		},
		rows: { style: { minHeight: "45px" } },
	};

	return (
		<div className="container-fluid bg-white p-3 rounded shadow-sm" style={{ minHeight: "85vh" }}>
			<div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
				<div className="d-flex flex-wrap align-items-center gap-2">
					<div className="d-flex align-items-center gap-1">
						<span className="fw-semibold text-secondary">From</span>
						<Controller
							name="fromDate"
							control={control}
							render={({ field }) => (
								<input type="date" className="form-control form-control-sm" {...field} />
							)}
						/>
					</div>
					<div className="d-flex align-items-center gap-1">
						<span className="fw-semibold text-secondary">To</span>
						<Controller
							name="toDate"
							control={control}
							render={({ field }) => (
								<input type="date" className="form-control form-control-sm" {...field} />
							)}
						/>
					</div>
					<Controller
						name="party"
						control={control}
						render={({ field }) => (
							<input
								{...field}
								placeholder="Party Name"
								className="form-control form-control-sm"
								style={{ width: "180px" }}
							/>
						)}
					/>
				</div>

				<div className="d-flex align-items-center gap-2">
					<button
						className="btn btn-light border btn-sm"
						onClick={downloadExcel}
					>
						<i className="bi bi-file-earmark-excel"></i> Excel Report
					</button>
					<button
						className="btn btn-light border btn-sm"
						onClick={generatePDF}
						disabled={isGenerating}
					>
						<i className="bi bi-printer"></i> {isGenerating ? "Generating..." : "Print"}
					</button>
				</div>
			</div>

			<div className="mb-2">
				<input
					type="text"
					className="form-control form-control-sm"
					placeholder="Search by Txn Type or Ref No..."
					value={filterText}
					onChange={(e) => setFilterText(e.target.value)}
					style={{ maxWidth: "280px" }}
				/>
			</div>

			<DataTable
				columns={columns}
				data={filteredRows}
				noDataComponent="No transactions to show"
				highlightOnHover
				striped
				dense
				customStyles={customStyles}
				pagination
				paginationServer
				paginationTotalRows={totalRows}
				paginationPerPage={perPage}
				paginationDefaultPage={page}
				paginationRowsPerPageOptions={[25, 50, 100]}
				onChangePage={handlePageChange}
				onChangeRowsPerPage={handlePerRowsChange}
				progressPending={isLoading}
				persistTableHead
			/>

			<div
				className="d-flex justify-content-end align-items-center mt-2 small fw-bold"
				style={{ background: "#fafafa", borderTop: "1px solid #ddd" }}
			>
				<div className="p-2">Total</div>
				<div className="p-2" style={{ width: "120px", textAlign: "right" }}>
					{formatCurrency(totalDebit)}
				</div>
				<div className="p-2" style={{ width: "120px", textAlign: "right" }}>
					{formatCurrency(totalCredit)}
				</div>
				<div className="p-2" style={{ width: "150px", textAlign: "right" }}>
					{formatCurrency(closingBalance)}
				</div>
			</div>

			<div className="mt-3 p-2 border-top" style={{ background: "#fafafa", borderRadius: "6px" }}>
				<h6 className="fw-semibold mb-2">Party Statement Summary</h6>
				<div className="row small text-muted">
					<div className="col-md-3 col-sm-6">
						<div><strong>Total Sale:</strong> {formatCurrency(totalDebit)}</div>
						<div className="text-secondary">(Sale - Sale Return)</div>
					</div>
					<div className="col-md-3 col-sm-6">
						<div><strong>Total Purchase:</strong> {formatCurrency(totalCredit)}</div>
						<div className="text-secondary">(Purchase - Purchase Return)</div>
					</div>
					<div className="col-md-3 col-sm-6">
						<div><strong>Total Expense:</strong> {formatCurrency(0)}</div>
					</div>
					<div className="col-md-3 col-sm-6 text-end">
						<div><strong className="text-success">Total Receivable:</strong> <span className="text-success">{formatCurrency(closingBalance)}</span></div>
					</div>
				</div>
				<div className="mt-2 small text-muted">
					<span>Total Money-In: {formatCurrency(totalDebit)}</span>
					<span className="ms-3">Total Money-Out: {formatCurrency(totalCredit)}</span>
				</div>
			</div>

			<PdfPreviewModal
				pdfUrl={pdfUrl}
				show={showPreview}
				onClose={() => setShowPreview(false)}
				onAction={handlePdfAction}
				title="Party Statement PDF Preview"
			/>
		</div>
	);
};

export default PartyStatement;
