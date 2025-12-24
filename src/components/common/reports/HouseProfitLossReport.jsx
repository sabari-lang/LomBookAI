import React, { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import PdfPreviewModal from "../popup/PdfPreviewModal";
import { extractItems } from "../../../utils/extractItems";
import { exportA4CanvasToPdf } from "../../../utils/pdf/exportA4CanvasToPdf";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import "../../../styles/houseProfitLoss.css";

/**
 * Shared House Profit & Loss Report component for all Logistics modules.
 * 
 * This is the SINGLE SOURCE OF TRUTH for Job Costing layout across:
 * - Air Inbound
 * - Air Outbound  
 * - Ocean Inbound
 * - Ocean Outbound
 * 
 * Layout matches the approved screenshot exactly.
 * All PDF styling is defined inline in generatePDF().
 * Screen styling is in houseProfitLoss.css.
 * 
 * @param {Object} props
 * @param {string} props.moduleType - 'air-inbound' | 'air-outbound' | 'ocean-inbound' | 'ocean-outbound'
 * @param {string} props.title - Section title
 * @param {Function} props.getJobCostingFn - API function to fetch job costing summary
 * @param {Function} props.getCustomerAccountsFn - API function to fetch customer accounting entries
 * @param {Function} props.getVendorAccountsFn - API function to fetch vendor accounting entries
 * @param {string} props.jobNo - Job number
 * @param {string} props.houseNo - House number (hawb/hbl)
 * @param {Object} props.masterData - Master data from session storage
 * @param {Object} props.houseData - House data from session storage
 */
const HouseProfitLossReport = ({
    moduleType = "air-inbound",
    title = "Job Costing for Particular House",
    getJobCostingFn,
    getCustomerAccountsFn,
    getVendorAccountsFn,
    jobNo,
    houseNo,
    masterData = {},
    houseData = {},
}) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainerRef = useRef(null);

    const hasIdentifiers = Boolean(jobNo && houseNo);

    // Fetch job costing summary
    const {
        data: jobCostingResponse,
        isLoading,
        isError,
        isSuccess,
    } = useQuery({
        queryKey: [`${moduleType}JobCosting`, jobNo, houseNo],
        queryFn: () => getJobCostingFn(jobNo, houseNo),
        enabled: hasIdentifiers && !!getJobCostingFn,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch customer accounting entries (Income)
    const { data: customerAccountsResponse } = useQuery({
        queryKey: [`${moduleType}CustomerAccounts`, jobNo, houseNo],
        queryFn: () =>
            getCustomerAccountsFn(jobNo, houseNo, { page: 1, pageSize: 1000 }),
        enabled: hasIdentifiers && !!getCustomerAccountsFn,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Fetch vendor accounting entries (Expense)
    const { data: vendorAccountsResponse } = useQuery({
        queryKey: [`${moduleType}VendorAccounts`, jobNo, houseNo],
        queryFn: () =>
            getVendorAccountsFn(jobNo, houseNo, { page: 1, pageSize: 1000 }),
        enabled: hasIdentifiers && !!getVendorAccountsFn,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const summary = useMemo(() => jobCostingResponse?.data ?? {}, [jobCostingResponse]);

    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    // Extract income items from customer accounting entries
    const incomeItems = useMemo(() => {
        const entries = extractItems(customerAccountsResponse) ?? [];
        return entries.flatMap((entry) => {
            const items = Array.isArray(entry?.items) ? entry.items : [];
            if (items.length === 0) {
                return [
                    {
                        partyName: entry?.partyName ?? "",
                        voucherNo: entry?.voucherNo ?? "",
                        code: entry?.voucherType ?? "",
                        currency: entry?.baseCurrency ?? "INR",
                        amountExRate: Number(entry?.amount ?? 0),
                        exRate: 1,
                        amountInr: Number(entry?.total ?? 0),
                        sgst: 0,
                        cgst: 0,
                        total: Number(entry?.total ?? 0),
                    },
                ];
            }
            return items.map((item) => ({
                partyName: entry?.partyName ?? "",
                voucherNo: entry?.voucherNo ?? "",
                code: item?.account ?? item?.accountService ?? "",
                currency: item?.currency ?? entry?.baseCurrency ?? "INR",
                amountExRate: Number(item?.amount ?? 0),
                exRate: Number(item?.exRate ?? 1),
                amountInr: Number(item?.amountInInr ?? item?.amountInINR ?? 0),
                sgst: Number(item?.sgst ?? 0),
                cgst: Number(item?.cgst ?? 0),
                total: Number(item?.total ?? 0),
            }));
        });
    }, [customerAccountsResponse]);

    // Extract expense items from vendor accounting entries
    const expenseItems = useMemo(() => {
        const entries = extractItems(vendorAccountsResponse) ?? [];
        return entries.flatMap((entry) => {
            const items = Array.isArray(entry?.items) ? entry.items : [];
            if (items.length === 0) {
                return [
                    {
                        partyName: entry?.partyName ?? "",
                        voucherNo: entry?.voucherNo ?? "",
                        code: entry?.voucherType ?? "",
                        currency: entry?.baseCurrency ?? "INR",
                        amountExRate: Number(entry?.amount ?? 0),
                        exRate: 1,
                        amountInr: Number(entry?.total ?? 0),
                        sgst: 0,
                        cgst: 0,
                        total: Number(entry?.total ?? 0),
                    },
                ];
            }
            return items.map((item) => ({
                partyName: entry?.partyName ?? "",
                voucherNo: entry?.voucherNo ?? "",
                code: item?.account ?? item?.accountService ?? "",
                currency: item?.currency ?? entry?.baseCurrency ?? "INR",
                amountExRate: Number(item?.amount ?? 0),
                exRate: Number(item?.exRate ?? 1),
                amountInr: Number(item?.amountInInr ?? item?.amountInINR ?? 0),
                sgst: Number(item?.sgst ?? 0),
                cgst: Number(item?.cgst ?? 0),
                total: Number(item?.total ?? 0),
            }));
        });
    }, [vendorAccountsResponse]);

    // Summary values
    const income = toNumber(summary?.totalRevenue ?? summary?.income ?? 0);
    const expense = toNumber(summary?.totalCost ?? summary?.expense ?? 0);
    const profit = toNumber(summary?.profit ?? income - expense);
    const profitPercentage = toNumber(
        summary?.profitPercentage ?? (income === 0 ? 0 : (profit / income) * 100)
    );

    const appearsEmpty =
        income === 0 && expense === 0 && profit === 0 && profitPercentage === 0;
    const summaryAvailable = hasIdentifiers && isSuccess && !appearsEmpty;

    const helperMessage = useMemo(() => {
        if (!hasIdentifiers) return "Select a job house to load the job costing summary.";
        if (isLoading) return "Loading job costing summary...";
        if (isError) return "Unable to load job costing summary.";
        if (isSuccess && appearsEmpty)
            return "No job costing data is available yet for this house.";
        return "";
    }, [hasIdentifiers, isLoading, isError, isSuccess, appearsEmpty]);

    const formatCurrency = (value) =>
        `Rs. ${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatPercentage = (value) => `${value.toFixed(2)}%`;

    const detailsButtonDisabled =
        !summaryAvailable || isLoading || isError || isGenerating;

    // Calculate totals
    const incomeTotals = useMemo(
        () =>
            incomeItems.reduce(
                (acc, item) => ({
                    amountExRate: acc.amountExRate + item.amountExRate,
                    amountInr: acc.amountInr + item.amountInr,
                    sgst: acc.sgst + item.sgst,
                    cgst: acc.cgst + item.cgst,
                    total: acc.total + item.total,
                }),
                { amountExRate: 0, amountInr: 0, sgst: 0, cgst: 0, total: 0 }
            ),
        [incomeItems]
    );

    const expenseTotals = useMemo(
        () =>
            expenseItems.reduce(
                (acc, item) => ({
                    amountExRate: acc.amountExRate + item.amountExRate,
                    amountInr: acc.amountInr + item.amountInr,
                    sgst: acc.sgst + item.sgst,
                    cgst: acc.cgst + item.cgst,
                    total: acc.total + item.total,
                }),
                { amountExRate: 0, amountInr: 0, sgst: 0, cgst: 0, total: 0 }
            ),
        [expenseItems]
    );

    // PDF Generation matching the screenshot layout exactly
    const generatePDF = async () => {
        if (!summaryAvailable || isGenerating) return;

        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm";
            tempDiv.style.padding = "10mm";
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.fontSize = "10px";
            tempDiv.style.lineHeight = "1.2";
            tempDiv.style.backgroundColor = "#fff";
            tempDiv.style.boxSizing = "border-box";
            tempDiv.style.margin = "0";
            tempDiv.style.border = "none";

            const formatDate = (dateStr) => {
                if (!dateStr) return "";
                try {
                    const d = new Date(dateStr);
                    return d.toISOString().split("T")[0];
                } catch {
                    return dateStr;
                }
            };

            const formatCurrencyPdf = (val) => {
                const num = Number(val) || 0;
                return num.toFixed(2);
            };

            const formatCurrencyWithCommas = (val) => {
                const num = Number(val) || 0;
                return num.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            };

            const formatPercentageText = (val) => `${(Number(val) || 0).toFixed(2)}%`;

            const formatAmountWithRate = (amount, exRate) =>
                `${formatCurrencyPdf(amount)} ${formatCurrencyPdf(exRate)}`;

            const averageExRate = (items) => {
                if (!items?.length) return 0;
                const total = items.reduce((acc, item) => acc + (Number(item?.exRate) || 0), 0);
                return total / items.length;
            };

            // Extract master and house data
            const masterNo = masterData?.masterNo ?? masterData?.masterNumber ?? masterData?.mawbNo ?? "";
            const shipper = masterData?.shipper ?? masterData?.shipperName ?? "";
            const origin = masterData?.origin ?? masterData?.originPort ?? masterData?.airportDeparture ?? "";
            const grossWeight = masterData?.grossWeight ?? masterData?.gwt ?? "";
            const type = masterData?.type ?? masterData?.incoterm ?? masterData?.shipment ?? "";
            const container = masterData?.container ?? "";
            const deptDate = formatDate(masterData?.departureDate ?? masterData?.etd);
            const profitDate = formatDate(summary?.profitDate);
            const consignee = houseData?.consignee ?? houseData?.consigneeName ?? "";
            const destination = houseData?.destination ?? houseData?.destinationPort ?? houseData?.airportDestination ?? "";
            const chargeWeight = houseData?.chargeWeight ?? houseData?.chargeableWeight ?? "";
            const term = houseData?.term ?? houseData?.incoterm ?? houseData?.freightTerm ?? "";
            const arrivalDate = formatDate(houseData?.arrivalDate ?? houseData?.eta);

            // Build income rows
            const incomeRows = incomeItems
                .map(
                    (item) => `
                    <tr>
                        <td class="text-cell">${item.partyName || ""}</td>
                        <td class="text-cell">${item.voucherNo || ""}</td>
                        <td class="text-cell">${item.code || ""}</td>
                        <td class="text-cell">${item.currency || ""}</td>
                        <td class="num-cell">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.amountInr)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.sgst)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.cgst)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.total)}</td>
                    </tr>
                `
                )
                .join("");

            // Build expense rows
            const expenseRows = expenseItems
                .map(
                    (item) => `
                    <tr>
                        <td class="text-cell">${item.partyName || ""}</td>
                        <td class="text-cell">${item.voucherNo || ""}</td>
                        <td class="text-cell">${item.code || ""}</td>
                        <td class="text-cell">${item.currency || ""}</td>
                        <td class="num-cell">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.amountInr)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.sgst)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.cgst)}</td>
                        <td class="num-cell">${formatCurrencyPdf(item.total)}</td>
                    </tr>
                `
                )
                .join("");

            const incomeTotalExRate = averageExRate(incomeItems);
            const expenseTotalExRate = averageExRate(expenseItems);

            // HTML template matching screenshot exactly
            // Income/Expense tables: NO BORDERS at all (clean text-only appearance)
            // Header box and Profit table: WITH borders
            tempDiv.innerHTML = `
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    table { width: 100%; border-collapse: collapse; }
                    
                    /* Title */
                    .title { text-align: center; margin-bottom: 8px; }
                    .title h2 { margin: 0; font-size: 14px; font-weight: bold; }
                    
                    /* Header table - WITH borders */
                    .header-table { border: 1px solid #000; margin-bottom: 10px; }
                    .header-table td { border: 1px solid #000; padding: 2px 5px; vertical-align: top; font-size: 9px; }
                    .header-table .consignee { white-space: normal; word-break: break-word; }
                    
                    /* Section styling */
                    .section { margin-bottom: 10px; }
                    .section-title { margin: 0 0 4px 0; font-size: 10px; font-weight: bold; text-decoration: underline; }
                    
                    /* Data table - NO BORDERS (clean appearance) */
                    .data-table { border: none; }
                    .data-table th, .data-table td { 
                        border: none; 
                        padding: 2px 4px; 
                        font-size: 9px;
                        vertical-align: top;
                    }
                    
                    /* Header row - bold, no lines */
                    .data-table th { font-weight: bold; text-align: left; }
                    
                    /* Total row - bold, no separator */
                    .data-table .total-row td { font-weight: bold; padding-top: 4px; }
                    
                    /* Text and number alignment */
                    .text-cell { text-align: left; word-break: break-word; }
                    .num-cell { text-align: right; }
                    
                    /* Profit table - WITH borders */
                    .profit-table { border: 1px solid #000; margin-top: 12px; }
                    .profit-table th, .profit-table td { border: 1px solid #000; padding: 3px 5px; font-size: 9px; text-align: right; }
                    .profit-table th:first-child, .profit-table td:first-child { text-align: left; }
                </style>

                <div class="title">
                    <h2>House Profit & Loss</h2>
                </div>

                <table class="header-table">
                    <tr>
                        <td><strong>Job No:</strong></td>
                        <td>${jobNo || ""}</td>
                        <td><strong>Profit Date:</strong></td>
                        <td>${profitDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Master No:</strong></td>
                        <td>${masterNo}</td>
                        <td><strong>House No:</strong></td>
                        <td>${houseNo || ""}</td>
                    </tr>
                    <tr>
                        <td><strong>Shipper:</strong></td>
                        <td>${shipper}</td>
                        <td><strong>Consignee:</strong></td>
                        <td class="consignee">${consignee}</td>
                    </tr>
                    <tr>
                        <td><strong>Origin:</strong></td>
                        <td>${origin}</td>
                        <td><strong>Destination:</strong></td>
                        <td>${destination}</td>
                    </tr>
                    <tr>
                        <td><strong>Gross Weight:</strong></td>
                        <td>${grossWeight}</td>
                        <td><strong>Charge Weight:</strong></td>
                        <td>${chargeWeight}</td>
                    </tr>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td>${type}</td>
                        <td><strong>Term:</strong></td>
                        <td>${term}</td>
                    </tr>
                    <tr>
                        <td><strong>Container:</strong></td>
                        <td>${container}</td>
                        <td><strong>Arrival Date:</strong></td>
                        <td>${arrivalDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Dept Date:</strong></td>
                        <td>${deptDate}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </table>

                <div class="section">
                    <h3 class="section-title">Income</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th class="text-cell">Party Name</th>
                                <th class="text-cell">Voucher No</th>
                                <th class="text-cell">Code</th>
                                <th class="text-cell">CUR</th>
                                <th class="num-cell">Amount Ex.Rate</th>
                                <th class="num-cell">Amnt INR</th>
                                <th class="num-cell">Sgst</th>
                                <th class="num-cell">Cgst</th>
                                <th class="num-cell">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${incomeRows || '<tr><td colspan="9" style="text-align:center;">No income data</td></tr>'}
                            <tr class="total-row">
                                <td colspan="4" class="num-cell">Total</td>
                                <td class="num-cell">${formatAmountWithRate(incomeTotals.amountExRate, incomeTotalExRate)}</td>
                                <td class="num-cell">${formatCurrencyPdf(incomeTotals.amountInr)}</td>
                                <td class="num-cell">${formatCurrencyPdf(incomeTotals.sgst)}</td>
                                <td class="num-cell">${formatCurrencyPdf(incomeTotals.cgst)}</td>
                                <td class="num-cell">${formatCurrencyPdf(incomeTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h3 class="section-title">Expense</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th class="text-cell">Party Name</th>
                                <th class="text-cell">Voucher No</th>
                                <th class="text-cell">Code</th>
                                <th class="text-cell">CUR</th>
                                <th class="num-cell">Amount Ex.Rate</th>
                                <th class="num-cell">Amnt INR</th>
                                <th class="num-cell">Sgst</th>
                                <th class="num-cell">Cgst</th>
                                <th class="num-cell">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenseRows || '<tr><td colspan="9" style="text-align:center;">No expense data</td></tr>'}
                            <tr class="total-row">
                                <td colspan="4" class="num-cell">Total</td>
                                <td class="num-cell">${formatAmountWithRate(expenseTotals.amountExRate, expenseTotalExRate)}</td>
                                <td class="num-cell">${formatCurrencyPdf(expenseTotals.amountInr)}</td>
                                <td class="num-cell">${formatCurrencyPdf(expenseTotals.sgst)}</td>
                                <td class="num-cell">${formatCurrencyPdf(expenseTotals.cgst)}</td>
                                <td class="num-cell">${formatCurrencyPdf(expenseTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section" style="margin-top:10px;">
                    <h3 class="section-title">Profit</h3>
                    <table class="profit-table">
                        <thead>
                            <tr>
                                <th>House Number</th>
                                <th>Income</th>
                                <th>Expense</th>
                                <th>Total</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${houseNo || ""}</td>
                                <td>${formatCurrencyWithCommas(income)}</td>
                                <td>${formatCurrencyWithCommas(expense)}</td>
                                <td>${formatCurrencyWithCommas(profit)}</td>
                                <td>${formatPercentageText(profitPercentage)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.body.appendChild(tempDiv);
            tempContainerRef.current = tempDiv;

            await new Promise((resolve) => setTimeout(resolve, 100));

            const blob = await exportA4CanvasToPdf({
                element: tempDiv,
                filename: `HouseProfitLoss_${moduleType}_${jobNo}_${houseNo}`,
                footerTextFn: (page) => `Page ${page}`,
                scale: 2,
            });

            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (err) {
            console.error(err);
            notifyError("Failed to generate PDF");
        } finally {
            if (tempContainerRef.current) {
                document.body.removeChild(tempContainerRef.current);
                tempContainerRef.current = null;
            }
            setIsGenerating(false);
        }
    };

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        if (action === "print") {
            const w = window.open(pdfUrl);
            if (w) w.onload = () => w.print();
        }
        if (action === "open") window.open(pdfUrl, "_blank");
        if (action === "save") {
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `HouseProfitLoss_${moduleType}_${jobNo}_${houseNo}.pdf`;
            link.click();
        }
    };

    return (
        <>
            <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg py-5 text-center">
                {helperMessage && (
                    <p className="text-muted mb-3">{helperMessage}</p>
                )}

                <h4 className="fw-bold text-success">
                    Income = {formatCurrency(income)}
                </h4>
                <h4 className="fw-bold text-danger">
                    Expense = {formatCurrency(expense)}
                </h4>
                <h4 className="fw-bold text-primary">
                    Profit = {formatCurrency(profit)}
                </h4>
                <h4 className="fw-bold">
                    Profit Percentage = {formatPercentage(profitPercentage)}
                </h4>

                <button
                    className="btn btn-primary mt-3"
                    disabled={detailsButtonDisabled}
                    type="button"
                    onClick={generatePDF}
                >
                    {isGenerating ? (
                        <>
                            <i className="fa fa-circle-o-notch fa-spin"></i>
                            &nbsp;Generating PDF...
                        </>
                    ) : (
                        "View Job Cost Detail"
                    )}
                </button>
            </div>

            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title={`House Profit & Loss Report - ${title}`}
                onClose={() => {
                    setShowPreview(false);
                    // Revoke ObjectURL to prevent memory leaks
                    if (pdfUrl) {
                        URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                    }
                }}
                onAction={handlePdfAction}
            />
        </>
    );
};

export default HouseProfitLossReport;
