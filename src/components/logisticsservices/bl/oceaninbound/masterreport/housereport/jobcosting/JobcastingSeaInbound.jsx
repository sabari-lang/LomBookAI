import React, { useMemo, useState, useRef } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";
import {
    getOceanInboundJobCosting,
    getOceanInboundCustomerAccounts,
    getOceanInboundVendorAccounts,
} from "../../../oceanInboundApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import { extractItems } from "../../../../../../../utils/extractItems";

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

    // PDF Generation (same as Air, but Sea Inbound label & hbl)
    const generatePDF = async () => {
        if (!summaryAvailable || isGenerating) return;

        setIsGenerating(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "210mm"; // A4 width
            tempDiv.style.padding = "15mm";
            tempDiv.style.fontFamily = "Arial, sans-serif";
            tempDiv.style.fontSize = "11px";
            tempDiv.style.backgroundColor = "#fff";
            tempDiv.style.lineHeight = "1.4";

            const formatDate = (dateStr) => {
                if (!dateStr) return "";
                try {
                    const d = new Date(dateStr);
                    return d.toISOString().split("T")[0];
                } catch {
                    return dateStr;
                }
            };

            const formatCurrencyPlain = (val) => {
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

            const masterNo = masterData?.masterNo ?? masterData?.masterNumber ?? "";
            const shipper = masterData?.shipper ?? masterData?.shipperName ?? "";
            const origin = masterData?.origin ?? masterData?.originPort ?? "";
            const grossWeight = masterData?.grossWeight ?? masterData?.gwt ?? "";
            const type = masterData?.type ?? masterData?.incoterm ?? "";
            const container = masterData?.container ?? "";
            const deptDate = formatDate(
                masterData?.departureDate ?? masterData?.etd
            );
            const profitDate = formatDate(summary?.profitDate);
            const consignee =
                houseData?.consignee ?? houseData?.consigneeName ?? "";
            const destination =
                houseData?.destination ?? houseData?.destinationPort ?? "";
            const chargeWeight =
                houseData?.chargeWeight ?? houseData?.chargeableWeight ?? "";
            const term = houseData?.term ?? houseData?.incoterm ?? "";
            const arrivalDate = formatDate(
                houseData?.arrivalDate ?? houseData?.eta
            );

            const incomeRows = incomeItems
                .map(
                    (item) => `
                <tr>
                    <td style="border:1px solid #000;padding:3px;">${item.partyName || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.voucherNo || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.code || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.currency || ""}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.amountExRate
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.exRate
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.amountInr
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.sgst
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.cgst
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.total
                    )}</td>
                </tr>
            `
                )
                .join("");

            const expenseRows = expenseItems
                .map(
                    (item) => `
                <tr>
                    <td style="border:1px solid #000;padding:3px;">${item.partyName || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.voucherNo || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.code || ""}</td>
                    <td style="border:1px solid #000;padding:3px;">${item.currency || ""}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.amountExRate
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.exRate
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.amountInr
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.sgst
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.cgst
                    )}</td>
                    <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                        item.total
                    )}</td>
                </tr>
            `
                )
                .join("");

            tempDiv.innerHTML = `
                <div style="text-align:center;margin-bottom:12px;">
                    <h2 style="margin:0;font-size:18px;font-weight:bold;">
                        House Profit & Loss (Sea Inbound)
                    </h2>
                </div>
                
                <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px;">
                    <tr>
                        <td style="border:1px solid #000;padding:4px;width:50%;vertical-align:top;">
                            <strong>Job No:</strong> ${jobNo || ""}<br>
                            <strong>Master No:</strong> ${masterNo}<br>
                            <strong>Shipper:</strong> ${shipper}<br>
                            <strong>Origin:</strong> ${origin}<br>
                            <strong>Gross Weight:</strong> ${grossWeight}<br>
                            <strong>Type:</strong> ${type}<br>
                            <strong>Container:</strong> ${container}<br>
                            <strong>Dept Date:</strong> ${deptDate}
                        </td>
                        <td style="border:1px solid #000;padding:4px;width:50%;vertical-align:top;">
                            <strong>Profit Date:</strong> ${profitDate}<br>
                            <strong>House No (HBL):</strong> ${hbl || ""}<br>
                            <strong>Consignee:</strong> ${consignee}<br>
                            <strong>Destination:</strong> ${destination}<br>
                            <strong>Charge Weight:</strong> ${chargeWeight}<br>
                            <strong>Term:</strong> ${term}<br>
                            <strong>Arrival Date:</strong> ${arrivalDate}
                        </td>
                    </tr>
                </table>

                <div style="margin-bottom:10px;">
                    <h3 style="margin:0 0 6px 0;font-size:11px;font-weight:bold;">Income</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:9px;">
                        <thead>
                            <tr>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Party Name</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Voucher No</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Code</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">CUR</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Amount Ex.Rate</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Ex.Rate</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Amnt INR</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Sgst</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Cgst</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                incomeRows ||
                                '<tr><td colspan="10" style="border:1px solid #000;padding:3px;text-align:center;">No income data</td></tr>'
                            }
                            <tr style="font-weight:bold;">
                                <td colspan="4" style="border:1px solid #000;padding:3px;text-align:right;">Total</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    incomeTotals.amountExRate
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;"></td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    incomeTotals.amountInr
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    incomeTotals.sgst
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    incomeTotals.cgst
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    incomeTotals.total
                                )}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin-bottom:10px;">
                    <h3 style="margin:0 0 6px 0;font-size:11px;font-weight:bold;">Expense</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:9px;">
                        <thead>
                            <tr>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Party Name</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Voucher No</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">Code</th>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">CUR</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Amount Ex.Rate</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Ex.Rate</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Amnt INR</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Sgst</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Cgst</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                expenseRows ||
                                '<tr><td colspan="10" style="border:1px solid #000;padding:3px;text-align:center;">No expense data</td></tr>'
                            }
                            <tr style="font-weight:bold;">
                                <td colspan="4" style="border:1px solid #000;padding:3px;text-align:right;">Total</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    expenseTotals.amountExRate
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;"></td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    expenseTotals.amountInr
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    expenseTotals.sgst
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    expenseTotals.cgst
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyPlain(
                                    expenseTotals.total
                                )}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="margin-top:12px;">
                    <h3 style="margin:0 0 6px 0;font-size:11px;font-weight:bold;">Profit</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:9px;">
                        <thead>
                            <tr>
                                <th style="border:1px solid #000;padding:3px;text-align:left;font-weight:bold;">House Number (HBL)</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Income</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Expense</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Total</th>
                                <th style="border:1px solid #000;padding:3px;text-align:right;font-weight:bold;">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border:1px solid #000;padding:3px;">${hbl || ""}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyWithCommas(
                                    income
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyWithCommas(
                                    expense
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatCurrencyWithCommas(
                                    profit
                                )}</td>
                                <td style="border:1px solid #000;padding:3px;text-align:right;">${formatPercentage(
                                    profitPercentage
                                )}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.body.appendChild(tempDiv);
            tempContainerRef.current = tempDiv;

            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
            });
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
