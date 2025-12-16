import React, { useMemo, useState, useRef } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";
import {
    getOceanInboundJobCosting,
    getOceanInboundCustomerAccounts,
    getOceanInboundVendorAccounts,
} from "../../../oceanInboundApi";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import { extractItems } from "../../../../../../../utils/extractItems";
import { exportA4CanvasToPdf } from "../../../../../../../utils/pdf/exportA4CanvasToPdf";

const safeParseJson = (value) => {
    if (!value) return {};
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error("Failed to parse sessionStorage item for sea inbound job costing", error);
        return {};
    }
};

const JobcastingSeaInbound = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainerRef = useRef(null);

    const { jobNo, hbl, masterData, houseData } = useMemo(() => {
        if (typeof window === "undefined") {
            return { jobNo: "", hbl: "", masterData: {}, houseData: {} };
        }

        const storedMaster = safeParseJson(sessionStorage.getItem("masterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("houseAirwayData"));

        return {
            jobNo: storedMaster?.jobNo ?? "",
            hbl:
                storedHouse?.hbl ??
                storedHouse?.hblNo ??
                storedHouse?.houseNumber ??
                "",
            masterData: storedMaster ?? {},
            houseData: storedHouse ?? {},
        };
    }, []);

    const hasIdentifiers = Boolean(jobNo && hbl);

    // Summary job costing
    const {
        data: jobCostingResponse,
        isLoading,
        isError,
        isSuccess,
    } = useQuery({
        queryKey: ["oceanInboundJobCosting", jobNo, hbl],
        queryFn: () => getOceanInboundJobCosting(jobNo, hbl),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Ocean inbound customer accounting entries (Income)
    const { data: customerAccountsResponse } = useQuery({
        queryKey: ["oceanInboundCustomerAccounts", jobNo, hbl],
        queryFn: () =>
            getOceanInboundCustomerAccounts(jobNo, hbl, {
                page: 1,
                pageSize: 1000,
            }),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Ocean inbound vendor accounting entries (Expense)
    const { data: vendorAccountsResponse } = useQuery({
        queryKey: ["oceanInboundVendorAccounts", jobNo, hbl],
        queryFn: () =>
            getOceanInboundVendorAccounts(jobNo, hbl, {
                page: 1,
                pageSize: 1000,
            }),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const summary = useMemo(() => jobCostingResponse?.data ?? {}, [jobCostingResponse]);

    // Helpers
    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    // Extract income items
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

    // Extract expense items
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

    // Totals
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

    // PDF Generation with shared A4 exporter
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

            const formatCurrency = (val) => {
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
                `${formatCurrency(amount)} ${formatCurrency(exRate)}`;

            const averageExRate = (items) => {
                if (!items?.length) return 0;
                const total = items.reduce((acc, item) => acc + (Number(item?.exRate) || 0), 0);
                return total / items.length;
            };

            const masterNo = masterData?.masterNo ?? masterData?.masterNumber ?? "";
            const shipper = masterData?.shipper ?? masterData?.shipperName ?? "";
            const origin = masterData?.origin ?? masterData?.originPort ?? "";
            const grossWeight = masterData?.grossWeight ?? masterData?.gwt ?? "";
            const type = masterData?.type ?? masterData?.incoterm ?? "";
            const container = masterData?.container ?? "";
            const deptDate = formatDate(masterData?.departureDate ?? masterData?.etd);
            const profitDate = formatDate(summary?.profitDate);
            const consignee = houseData?.consignee ?? houseData?.consigneeName ?? "";
            const destination = houseData?.destination ?? houseData?.destinationPort ?? "";
            const chargeWeight = houseData?.chargeWeight ?? houseData?.chargeableWeight ?? "";
            const term = houseData?.term ?? houseData?.incoterm ?? "";
            const arrivalDate = formatDate(houseData?.arrivalDate ?? houseData?.eta);

            const incomeRows = incomeItems
                .map(
                    (item) => `
                        <tr>
                            <td class="text-cell">${item.partyName || ""}</td>
                            <td class="text-cell">${item.voucherNo || ""}</td>
                            <td class="text-cell">${item.code || ""}</td>
                            <td class="text-cell">${item.currency || ""}</td>
                            <td class="num-cell">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                            <td class="num-cell">${formatCurrency(item.amountInr)}</td>
                            <td class="num-cell">${formatCurrency(item.sgst)}</td>
                            <td class="num-cell">${formatCurrency(item.cgst)}</td>
                            <td class="num-cell">${formatCurrency(item.total)}</td>
                        </tr>
                    `
                )
                .join("");

            const expenseRows = expenseItems
                .map(
                    (item) => `
                        <tr>
                            <td class="text-cell">${item.partyName || ""}</td>
                            <td class="text-cell">${item.voucherNo || ""}</td>
                            <td class="text-cell">${item.code || ""}</td>
                            <td class="text-cell">${item.currency || ""}</td>
                            <td class="num-cell">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                            <td class="num-cell">${formatCurrency(item.amountInr)}</td>
                            <td class="num-cell">${formatCurrency(item.sgst)}</td>
                            <td class="num-cell">${formatCurrency(item.cgst)}</td>
                            <td class="num-cell">${formatCurrency(item.total)}</td>
                        </tr>
                    `
                )
                .join("");

            const incomeTotalExRate = averageExRate(incomeItems);
            const expenseTotalExRate = averageExRate(expenseItems);

            tempDiv.innerHTML = `
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    .title { text-align: center; margin-bottom: 10px; }
                    .title h2 { margin: 0; font-size: 16px; font-weight: bold; }
                    .header-table { border: 1px solid #000; margin-bottom: 12px; }
                    .header-table td { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
                    .header-table .consignee { white-space: normal; word-break: break-word; }
                    .section { margin-bottom: 12px; }
                    .section-title { margin: 0 0 6px 0; font-size: 11px; font-weight: bold; text-decoration: underline; }
                    .data-table th,
                    .data-table td { border: 1px solid #000; padding: 3px 6px; }
                    .data-table th { font-weight: bold; }
                    .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 18%; text-align: left; }
                    .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 14%; text-align: left; }
                    .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 6%; text-align: left; }
                    .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 6%; text-align: left; }
                    .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 16%; text-align: right; }
                    .data-table th:nth-child(6), .data-table td:nth-child(6) { width: 14%; text-align: right; }
                    .data-table th:nth-child(7), .data-table td:nth-child(7) { width: 8%; text-align: right; }
                    .data-table th:nth-child(8), .data-table td:nth-child(8) { width: 8%; text-align: right; }
                    .data-table th:nth-child(9), .data-table td:nth-child(9) { width: 10%; text-align: right; }
                    .text-cell { text-align: left; word-break: break-word; }
                    .num-cell { text-align: right; }
                    .total-row { font-weight: bold; }
                    .profit-table { border: 1px solid #000; margin-top: 14px; }
                    .profit-table th, .profit-table td { border: 1px solid #000; padding: 3px 6px; text-align: right; }
                    .profit-table th:first-child, .profit-table td:first-child { text-align: left; }
                </style>

                <div class="title">
                    <h2>House Profit & Loss</h2>
                </div>

                <table class="header-table">
                    <tr>
                        <td style="width:25%;"><strong>Job No</strong></td>
                        <td style="width:25%;">${jobNo || ""}</td>
                        <td style="width:25%;"><strong>Profit Date</strong></td>
                        <td style="width:25%;">${profitDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Master No</strong></td>
                        <td>${masterNo}</td>
                        <td><strong>House No</strong></td>
                        <td>${hbl || ""}</td>
                    </tr>
                    <tr>
                        <td><strong>Shipper</strong></td>
                        <td>${shipper}</td>
                        <td><strong>Consignee</strong></td>
                        <td class="consignee">${consignee}</td>
                    </tr>
                    <tr>
                        <td><strong>Origin</strong></td>
                        <td>${origin}</td>
                        <td><strong>Destination</strong></td>
                        <td>${destination}</td>
                    </tr>
                    <tr>
                        <td><strong>Gross Weight</strong></td>
                        <td>${grossWeight}</td>
                        <td><strong>Charge Weight</strong></td>
                        <td>${chargeWeight}</td>
                    </tr>
                    <tr>
                        <td><strong>Type</strong></td>
                        <td>${type}</td>
                        <td><strong>Term</strong></td>
                        <td>${term}</td>
                    </tr>
                    <tr>
                        <td><strong>Container</strong></td>
                        <td>${container}</td>
                        <td><strong>Arrival Date</strong></td>
                        <td>${arrivalDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Dept Date</strong></td>
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
                                <th>Party Name</th>
                                <th>Voucher No</th>
                                <th>Code</th>
                                <th>CUR</th>
                                <th>Amount Ex.Rate</th>
                                <th>Amnt INR</th>
                                <th>Sgst</th>
                                <th>Cgst</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                incomeRows ||
                                '<tr><td colspan="9" style="text-align:center;">No income data</td></tr>'
                            }
                            <tr class="total-row">
                                <td colspan="4" style="text-align:right;">Total</td>
                                <td class="num-cell">${formatAmountWithRate(incomeTotals.amountExRate, incomeTotalExRate)}</td>
                                <td class="num-cell">${formatCurrency(incomeTotals.amountInr)}</td>
                                <td class="num-cell">${formatCurrency(incomeTotals.sgst)}</td>
                                <td class="num-cell">${formatCurrency(incomeTotals.cgst)}</td>
                                <td class="num-cell">${formatCurrency(incomeTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h3 class="section-title">Expense</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Party Name</th>
                                <th>Voucher No</th>
                                <th>Code</th>
                                <th>CUR</th>
                                <th>Amount Ex.Rate</th>
                                <th>Amnt INR</th>
                                <th>Sgst</th>
                                <th>Cgst</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                expenseRows ||
                                '<tr><td colspan="9" style="text-align:center;">No expense data</td></tr>'
                            }
                            <tr class="total-row">
                                <td colspan="4" style="text-align:right;">Total</td>
                                <td class="num-cell">${formatAmountWithRate(expenseTotals.amountExRate, expenseTotalExRate)}</td>
                                <td class="num-cell">${formatCurrency(expenseTotals.amountInr)}</td>
                                <td class="num-cell">${formatCurrency(expenseTotals.sgst)}</td>
                                <td class="num-cell">${formatCurrency(expenseTotals.cgst)}</td>
                                <td class="num-cell">${formatCurrency(expenseTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section" style="margin-top:14px;">
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
                                <td style="font-weight:bold; text-align:left;">${hbl || ""}</td>
                                <td style="font-weight:bold;">${formatCurrencyWithCommas(income)}</td>
                                <td style="font-weight:bold;">${formatCurrencyWithCommas(expense)}</td>
                                <td style="font-weight:bold;">${formatCurrencyWithCommas(profit)}</td>
                                <td style="font-weight:bold;">${formatPercentageText(profitPercentage)}</td>
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
                filename: `HouseProfitLoss_SeaInbound_${jobNo}_${hbl}`,
                footerTextFn: (page) => `Page ${page}`,
                scale: 2,
            });

            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF");
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
            link.download = `SeaInbound_HouseProfitLoss_${jobNo}_${hbl}.pdf`;
            link.click();
        }
    };

    return (
        <>
            <CommonSectionHeader
                title="Job Costing for Particular House (Sea Inbound)"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
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
            )}

            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="House Profit & Loss Report - Sea Inbound"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </>
    );
};

export default JobcastingSeaInbound;
