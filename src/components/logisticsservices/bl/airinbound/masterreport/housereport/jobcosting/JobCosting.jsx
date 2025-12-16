import React, { useMemo, useState, useRef } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";
import { getAirInboundJobCosting, getAirInboundCustomerAccounts, getAirInboundVendorAccounts } from "../../../Api";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import { extractItems } from "../../../../../../../utils/extractItems";
import { exportA4CanvasToPdf } from "../../../../../../../utils/pdf/exportA4CanvasToPdf";

const safeParseJson = (value) => {
    if (!value) return {};
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error("Failed to parse sessionStorage item for job costing", error);
        return {};
    }
};

const JobCosting = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempContainerRef = useRef(null);

    const { jobNo, hawb, masterData, houseData } = useMemo(() => {
        if (typeof window === "undefined") {
            return { jobNo: "", hawb: "", masterData: {}, houseData: {} };
        }

        const storedMaster = safeParseJson(sessionStorage.getItem("masterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("houseAirwayData"));

        return {
            jobNo: storedMaster?.jobNo ?? "",
            hawb:
                storedHouse?.hawb ??
                storedHouse?.hawbNo ??
                storedHouse?.houseNumber ??
                "",
            masterData: storedMaster ?? {},
            houseData: storedHouse ?? {},
        };
    }, []);

    const hasIdentifiers = Boolean(jobNo && hawb);

    const {
        data: jobCostingResponse,
        isLoading,
        isError,
        isSuccess,
    } = useQuery({
        queryKey: ["airInboundJobCosting", jobNo, hawb],
        queryFn: () => getAirInboundJobCosting(jobNo, hawb),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch customer accounting entries (Income)
    const { data: customerAccountsResponse } = useQuery({
        queryKey: ["airInboundCustomerAccounts", jobNo, hawb],
        queryFn: () => getAirInboundCustomerAccounts(jobNo, hawb, { page: 1, pageSize: 1000 }),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Fetch vendor accounting entries (Expense)
    const { data: vendorAccountsResponse } = useQuery({
        queryKey: ["airInboundVendorAccounts", jobNo, hawb],
        queryFn: () => getAirInboundVendorAccounts(jobNo, hawb, { page: 1, pageSize: 1000 }),
        enabled: hasIdentifiers,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const summary = useMemo(() => jobCostingResponse?.data ?? {}, [jobCostingResponse]);
    
    // Extract income items from customer accounting entries
    const incomeItems = useMemo(() => {
        const entries = extractItems(customerAccountsResponse) ?? [];
        return entries.flatMap((entry) => {
            const items = Array.isArray(entry?.items) ? entry.items : [];
            if (items.length === 0) {
                // If no items, create one entry from the main entry
                return [{
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
                }];
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
                return [{
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
                }];
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

    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const income = toNumber(summary?.totalRevenue ?? summary?.income ?? 0);
    const expense = toNumber(summary?.totalCost ?? summary?.expense ?? 0);
    const profit = toNumber(summary?.profit ?? income - expense);
    const profitPercentage = toNumber(
        summary?.profitPercentage ?? (income === 0 ? 0 : (profit / income) * 100)
    );

    const appearsEmpty = income === 0 && expense === 0 && profit === 0 && profitPercentage === 0;
    const summaryAvailable = hasIdentifiers && isSuccess && !appearsEmpty;

    const helperMessage = useMemo(() => {
        if (!hasIdentifiers) {
            return "Select a job house to load the job costing summary.";
        }

        if (isLoading) {
            return "Loading job costing summary...";
        }

        if (isError) {
            return "Unable to load job costing summary.";
        }

        if (isSuccess && appearsEmpty) {
            return "No job costing data is available yet for this house.";
        }

        return "";
    }, [hasIdentifiers, isLoading, isError, isSuccess, appearsEmpty]);

    const formatCurrency = (value) =>
        `Rs. ${value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatPercentage = (value) => `${value.toFixed(2)}%`;

    const detailsButtonDisabled = !summaryAvailable || isLoading || isError || isGenerating;

    // Calculate totals for income
    const incomeTotals = useMemo(() => {
        return incomeItems.reduce((acc, item) => ({
            amountExRate: acc.amountExRate + item.amountExRate,
            amountInr: acc.amountInr + item.amountInr,
            sgst: acc.sgst + item.sgst,
            cgst: acc.cgst + item.cgst,
            total: acc.total + item.total,
        }), { amountExRate: 0, amountInr: 0, sgst: 0, cgst: 0, total: 0 });
    }, [incomeItems]);

    // Calculate totals for expense
    const expenseTotals = useMemo(() => {
        return expenseItems.reduce((acc, item) => ({
            amountExRate: acc.amountExRate + item.amountExRate,
            amountInr: acc.amountInr + item.amountInr,
            sgst: acc.sgst + item.sgst,
            cgst: acc.cgst + item.cgst,
            total: acc.total + item.total,
        }), { amountExRate: 0, amountInr: 0, sgst: 0, cgst: 0, total: 0 });
    }, [expenseItems]);

    // Generate PDF
    const generatePDF = async () => {
        if (!summaryAvailable || isGenerating) return;

        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm"; // A4 width
            tempDiv.style.padding = "10mm"; // 10mm padding as per requirements
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.fontSize = "12px"; // Base font size 12px
            tempDiv.style.backgroundColor = "#fff";
            tempDiv.style.lineHeight = "1.2"; // Tight line height like template
            tempDiv.style.boxSizing = "border-box";
            tempDiv.style.margin = "0";
            tempDiv.style.border = "none";

            // Format date helper
            const formatDate = (dateStr) => {
                if (!dateStr) return "";
                try {
                    const date = new Date(dateStr);
                    return date.toISOString().split("T")[0];
                } catch {
                    return dateStr;
                }
            };

            // Format currency helper
            const formatCurrency = (val) => {
                const num = Number(val) || 0;
                return num.toFixed(2);
            };

            // Format currency with commas
            const formatCurrencyWithCommas = (val) => {
                const num = Number(val) || 0;
                return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            // Format amount with exchange rate (for Amount Ex.Rate column)
            const formatAmountWithRate = (amount, exRate) => {
                const amt = formatCurrency(amount);
                const rate = formatCurrency(exRate);
                return `${amt} ${rate}`;
            };

            // Get master and house data
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

            // Build HTML content with fixed column widths - NO borders on tbody cells
            const incomeRows = incomeItems.map(item => `
                <tr>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.partyName || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.voucherNo || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.code || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.currency || ""}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.amountInr)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.sgst)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.cgst)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.total)}</td>
                </tr>
            `).join("");

            const expenseRows = expenseItems.map(item => `
                <tr>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.partyName || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.voucherNo || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.code || ""}</td>
                    <td style="padding:2px 4px;word-wrap:break-word;word-break:break-word;text-align:left;">${item.currency || ""}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatAmountWithRate(item.amountExRate, item.exRate)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.amountInr)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.sgst)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.cgst)}</td>
                    <td style="padding:2px 4px;text-align:right;">${formatCurrency(item.total)}</td>
                </tr>
            `).join("");

            // Calculate totals with exchange rate display
            const incomeTotalAmountExRate = incomeTotals.amountExRate;
            const incomeTotalExRate = incomeItems.length > 0 
                ? incomeItems.reduce((sum, item) => sum + (item.exRate || 0), 0) / incomeItems.length 
                : 0;

            const expenseTotalAmountExRate = expenseTotals.amountExRate;
            const expenseTotalExRate = expenseItems.length > 0 
                ? expenseItems.reduce((sum, item) => sum + (item.exRate || 0), 0) / expenseItems.length 
                : 0;

            tempDiv.innerHTML = `
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    table { table-layout: fixed; width: 100%; border-collapse: collapse; }
                    .header-table { border: 1px solid #000; }
                    .header-table td { border: 1px solid #000; padding: 3px 6px; }
                    .header-table td:first-child { text-align: left; }
                    .header-table td:last-child { text-align: center; }
                    .income-table, .expense-table { border-collapse: collapse; border: none; }
                    .income-table thead, .expense-table thead { border: none !important; }
                    .income-table thead th, .expense-table thead th { 
                        border: none !important; 
                        border-bottom: none !important;
                        padding: 4px 4px; 
                        font-weight: bold; 
                        text-align: left; 
                    }
                    .income-table thead tr, .expense-table thead tr { 
                        border: none !important;
                        border-bottom: none !important; 
                    }
                    .income-table tbody tr:first-child, .expense-table tbody tr:first-child {
                        border-top: none !important;
                    }
                    .income-table thead th:nth-child(5),
                    .income-table thead th:nth-child(6),
                    .income-table thead th:nth-child(7),
                    .income-table thead th:nth-child(8),
                    .income-table thead th:nth-child(9),
                    .expense-table thead th:nth-child(5),
                    .expense-table thead th:nth-child(6),
                    .expense-table thead th:nth-child(7),
                    .expense-table thead th:nth-child(8),
                    .expense-table thead th:nth-child(9) { text-align: right; }
                    .income-table tbody td, .expense-table tbody td { border: none; }
                    .income-table tbody tr.total-row { 
                        // border-top: 2px solid #000; 
                        font-weight: bold !important; 
                        padding-top: 4px; 
                    }
                    .income-table tbody tr.total-row td,
                    .expense-table tbody tr.total-row td { 
                        padding-top: 6px; 
                        font-weight: bold !important; 
                    }
                    .expense-table tbody tr.total-row {
                        // border-top: 2px solid #000;
                        font-weight: bold !important;
                        padding-top: 4px;
                    }
                    .income-table th:nth-child(1), .income-table td:nth-child(1) { width: 18%; }
                    .income-table th:nth-child(2), .income-table td:nth-child(2) { width: 14%; }
                    .income-table th:nth-child(3), .income-table td:nth-child(3) { width: 6%; }
                    .income-table th:nth-child(4), .income-table td:nth-child(4) { width: 6%; }
                    .income-table th:nth-child(5), .income-table td:nth-child(5) { width: 16%; }
                    .income-table th:nth-child(6), .income-table td:nth-child(6) { width: 14%; }
                    .income-table th:nth-child(7), .income-table td:nth-child(7) { width: 8%; }
                    .income-table th:nth-child(8), .income-table td:nth-child(8) { width: 8%; }
                    .income-table th:nth-child(9), .income-table td:nth-child(9) { width: 10%; }
                    .expense-table th:nth-child(1), .expense-table td:nth-child(1) { width: 18%; }
                    .expense-table th:nth-child(2), .expense-table td:nth-child(2) { width: 14%; }
                    .expense-table th:nth-child(3), .expense-table td:nth-child(3) { width: 6%; }
                    .expense-table th:nth-child(4), .expense-table td:nth-child(4) { width: 6%; }
                    .expense-table th:nth-child(5), .expense-table td:nth-child(5) { width: 16%; }
                    .expense-table th:nth-child(6), .expense-table td:nth-child(6) { width: 14%; }
                    .expense-table th:nth-child(7), .expense-table td:nth-child(7) { width: 8%; }
                    .expense-table th:nth-child(8), .expense-table td:nth-child(8) { width: 8%; }
                    .expense-table th:nth-child(9), .expense-table td:nth-child(9) { width: 10%; }
                    .profit-table { border: 1px solid #000; }
                    .profit-table th, .profit-table td { border: 1px solid #000; padding: 3px 6px; }
                </style>
                <div style="text-align:center;margin-bottom:10px;">
                    <h2 style="margin:0;font-size:16px;font-weight:normal;">House Profit & Loss</h2>
                </div>
                
                <table class="header-table" style="width:100%;margin-bottom:10px;font-size:12px;">
                    <tr>
                        <td style="width:50%;vertical-align:top;">
                            <strong>Job No:</strong> ${jobNo || ""}<br>
                            <strong>Master No:</strong> ${masterNo}<br>
                            <strong>Shipper:</strong> ${shipper}<br>
                            <strong>Origin:</strong> ${origin}<br>
                            <strong>Gross Weight:</strong> ${grossWeight}<br>
                            <strong>Type:</strong> ${type}<br>
                            <strong>Container:</strong> ${container}<br>
                            <strong>Dept Date:</strong> ${deptDate}
                        </td>
                        <td style="width:50%;vertical-align:top;text-align:center;">
                            <strong>Profit Date:</strong> ${profitDate}<br>
                            <strong>House No:</strong> ${hawb || ""}<br>
                            <strong>Consignee:</strong> ${consignee}<br>
                            <strong>Destination:</strong> ${destination}<br>
                            <strong>Charge Weight:</strong> ${chargeWeight}<br>
                            <strong>Term:</strong> ${term}<br>
                            <strong>Arrival Date:</strong> ${arrivalDate}
                        </td>
                    </tr>
                </table>

                <div style="margin-bottom:8px;">
                    <h3 style="margin:0 0 4px 0;font-size:12px;font-weight:bold;text-decoration:underline;">Income</h3>
                    <table class="income-table" style="width:100%;font-size:12px;">
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
                            ${incomeRows || '<tr><td colspan="9" style="padding:2px 4px;text-align:center;">No income data</td></tr>'}
                            <tr class="total-row">
                                <td colspan="4" style="text-align:right;padding-right:8px;">Total</td>
                                <td style="text-align:right;">${formatAmountWithRate(incomeTotalAmountExRate, incomeTotalExRate)}</td>
                                <td style="text-align:right;">${formatCurrency(incomeTotals.amountInr)}</td>
                                <td style="text-align:right;">${formatCurrency(incomeTotals.sgst)}</td>
                                <td style="text-align:right;">${formatCurrency(incomeTotals.cgst)}</td>
                                <td style="text-align:right;">${formatCurrency(incomeTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin-bottom:8px;">
                    <h3 style="margin:0 0 4px 0;font-size:12px;font-weight:bold;text-decoration:underline;">Expense</h3>
                    <table class="expense-table" style="width:100%;font-size:12px;">
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
                            ${expenseRows || '<tr><td colspan="9" style="padding:2px 4px;text-align:center;">No expense data</td></tr>'}
                            <tr class="total-row">
                                <td colspan="4" style="text-align:right;padding-right:8px;">Total</td>
                                <td style="text-align:right;">${formatAmountWithRate(expenseTotalAmountExRate, expenseTotalExRate)}</td>
                                <td style="text-align:right;">${formatCurrency(expenseTotals.amountInr)}</td>
                                <td style="text-align:right;">${formatCurrency(expenseTotals.sgst)}</td>
                                <td style="text-align:right;">${formatCurrency(expenseTotals.cgst)}</td>
                                <td style="text-align:right;">${formatCurrency(expenseTotals.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin-top:20px;">
                    <h3 style="margin:0 0 4px 0;font-size:12px;font-weight:bold;text-decoration:underline;">Profit</h3>
                    <table class="profit-table" style="width:100%;font-size:12px;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">House Number</th>
                                <th style="text-align:right;">Income</th>
                                <th style="text-align:right;">Expense</th>
                                <th style="text-align:right;">Total</th>
                                <th style="text-align:right;">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:bold;">${hawb || ""}</td>
                                <td style="text-align:right;font-weight:bold;">${formatCurrencyWithCommas(income)}</td>
                                <td style="text-align:right;font-weight:bold;">${formatCurrencyWithCommas(expense)}</td>
                                <td style="text-align:right;font-weight:bold;">${formatCurrencyWithCommas(profit)}</td>
                                <td style="text-align:right;font-weight:bold;">${formatPercentage(profitPercentage)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.body.appendChild(tempDiv);
            tempContainerRef.current = tempDiv;

            // Wait a bit for rendering
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use shared helper for multi-page PDF
            const blob = await exportA4CanvasToPdf({
                element: tempDiv,
                filename: `HouseProfitLoss_${jobNo}_${hawb}`,
                footerTextFn: (page, totalPages) => `Page ${page}`,
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
            link.download = `HouseProfitLoss_${jobNo}_${hawb}.pdf`;
            link.click();
        }
    };

    return (
        <>
            <CommonSectionHeader
                title="Job Costing for Particular House"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg py-5 text-center">
                    {helperMessage && (
                        <p className="text-muted mb-3">{helperMessage}</p>
                    )}

                    <h4 className="fw-bold text-success">Income = {formatCurrency(income)}</h4>
                    <h4 className="fw-bold text-danger">Expense = {formatCurrency(expense)}</h4>
                    <h4 className="fw-bold text-primary">Profit = {formatCurrency(profit)}</h4>
                    <h4 className="fw-bold">Profit Percentage = {formatPercentage(profitPercentage)}</h4>

                    <button
                        className="btn btn-primary mt-3"
                        disabled={detailsButtonDisabled}
                        type="button"
                        onClick={generatePDF}
                    >
                        {isGenerating ? (
                            <>
                                <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Generating PDF...
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
                title="House Profit & Loss Report"
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </>
    );
};

export default JobCosting;
