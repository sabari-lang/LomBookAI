import React, { useMemo, useState, useRef } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";
import {
    getOceanOutboundJobCosting,
    getOceanOutboundCustomerAccounts,
    getOceanOutboundVendorAccounts
} from "../../../oceanOutboundApi";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { extractItems } from "../../../../../../../utils/extractItems";


// ----------------------------------------
// Safe JSON parsing from session storage
// ----------------------------------------
const safeParseJson = (value) => {
    if (!value) return {};
    try { return JSON.parse(value); }
    catch { return {}; }
};


// ----------------------------------------
// COMPONENT START
// ----------------------------------------
const JobcastingSeaOutbound = () => {

    const [collapsed, setCollapsed] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const tempRef = useRef(null);


    // ----------------------------------------
    // Load saved job + house identifiers from session
    // ----------------------------------------
    const { jobNo, hbl, masterData, houseData } = useMemo(() => {

        const storedMaster = safeParseJson(sessionStorage.getItem("masterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("houseAirwayData"));

        return {
            jobNo: storedMaster?.jobNo ?? "",
            hbl: storedHouse?.hbl ?? storedHouse?.hblNo ?? storedHouse?.houseNumber ?? "",
            masterData: storedMaster ?? {},
            houseData: storedHouse ?? {}
        };

    }, []);


    const identifiersValid = Boolean(jobNo && hbl);


    // ----------------------------------------
    // API Calls (Summary + Income + Expense)
    // ----------------------------------------

    const { data: costingResponse, isLoading, isError, isSuccess } = useQuery({
        queryKey: ["oceanOutboundCosting", jobNo, hbl],
        queryFn: () => getOceanOutboundJobCosting(jobNo, hbl),
        enabled: identifiersValid,
        staleTime: 5000
    });

    const { data: customerAccountsResponse } = useQuery({
        queryKey: ["oceanOutboundCustomerAccounts", jobNo, hbl],
        queryFn: () =>
            getOceanOutboundCustomerAccounts(jobNo, hbl, {
                page: 1,
                pageSize: 500
            }),
        enabled: identifiersValid
    });

    const { data: vendorAccountsResponse } = useQuery({
        queryKey: ["oceanOutboundVendorAccounts", jobNo, hbl],
        queryFn: () =>
            getOceanOutboundVendorAccounts(jobNo, hbl, {
                page: 1,
                pageSize: 500
            }),
        enabled: identifiersValid
    });


    // ----------------------------------------
    // Extract and normalize line items
    // ----------------------------------------
    const incomeItems = useMemo(
        () => extractItems(customerAccountsResponse) ?? [],
        [customerAccountsResponse]
    );

    const expenseItems = useMemo(
        () => extractItems(vendorAccountsResponse) ?? [],
        [vendorAccountsResponse]
    );


    // ----------------------------------------
    // Costing Summary
    // ----------------------------------------
    const summary = costingResponse?.data ?? {};

    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    const income = toNum(summary?.totalRevenue ?? summary?.income ?? 0);
    const expense = toNum(summary?.totalCost ?? summary?.expense ?? 0);
    const profit = toNum(summary?.profit ?? income - expense);
    const profitPercent = toNum(
        summary?.profitPercentage ?? (income ? (profit / income) * 100 : 0)
    );


    const noData =
        income === 0 && expense === 0 && profit === 0 && profitPercent === 0;

    const ready = identifiersValid && isSuccess && !noData;


    // ----------------------------------------
    // Format Helpers
    // ----------------------------------------
    const currency = (val) =>
        `₹ ${Number(val || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const percent = (v) => `${Number(v || 0).toFixed(2)}%`;


    // ----------------------------------------
    // PDF GENERATION
    // ----------------------------------------
    const generatePDF = async () => {

        if (!ready || isGenerating) return;
        setIsGenerating(true);

        try {

            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.background = "#fff";
            tempDiv.style.padding = "15px";
            tempDiv.style.width = "210mm";
            tempDiv.style.fontFamily = "Arial, sans-serif";

            document.body.appendChild(tempDiv);
            tempRef.current = tempDiv;

            // -------- Build PDF Content --------
            const incomeRows = incomeItems
                .map(
                    (i) => `
                <tr>
                    <td>${i.partyName || ""}</td>
                    <td>${i.voucherNo || ""}</td>
                    <td>${i.code || ""}</td>
                    <td style="text-align:right;">${currency(i.total)}</td>
                </tr>
            `
                )
                .join("");

            const expenseRows = expenseItems
                .map(
                    (i) => `
                <tr>
                    <td>${i.partyName || ""}</td>
                    <td>${i.voucherNo || ""}</td>
                    <td>${i.code || ""}</td>
                    <td style="text-align:right;">${currency(i.total)}</td>
                </tr>
            `
                )
                .join("");


            tempDiv.innerHTML = `
                <h2 style="text-align:center;margin-bottom:10px;">House Profit & Loss (Sea Outbound)</h2>

                <table style="width:100%;margin-bottom:15px;font-size:12px;">
                    <tr><td><strong>Job No:</strong></td><td>${jobNo}</td></tr>
                    <tr><td><strong>House BL:</strong></td><td>${hbl}</td></tr>
                    <tr><td><strong>Destination:</strong></td><td>${houseData?.destination ?? ""}</td></tr>
                </table>

                <h3 style="margin-top:18px;">Summary</h3>
                <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:15px;">
                    <tr><td><strong>Income</strong></td><td style="text-align:right;">${currency(income)}</td></tr>
                    <tr><td><strong>Expense</strong></td><td style="text-align:right;">${currency(expense)}</td></tr>
                    <tr><td><strong>Profit</strong></td><td style="text-align:right;">${currency(profit)}</td></tr>
                    <tr><td><strong>Profit %</strong></td><td style="text-align:right;">${percent(profitPercent)}</td></tr>
                </table>

                <h3>Income Breakdown</h3>
                <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:15px;">
                    <thead><tr><th>Party</th><th>Voucher</th><th>Code</th><th>Total</th></tr></thead>
                    <tbody>
                        ${
                            incomeRows ||
                            `<tr><td colspan="4" style="text-align:center;">No income entries</td></tr>`
                        }
                    </tbody>
                </table>

                <h3>Expense Breakdown</h3>
                <table border="1" style="border-collapse:collapse;width:100%;font-size:12px;">
                    <thead><tr><th>Party</th><th>Voucher</th><th>Code</th><th>Total</th></tr></thead>
                    <tbody>
                        ${
                            expenseRows ||
                            `<tr><td colspan="4" style="text-align:center;">No expense entries</td></tr>`
                        }
                    </tbody>
                </table>
            `;

            const canvas = await html2canvas(tempDiv, { scale: 2 });
            const img = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * pageWidth) / canvas.width;

            pdf.addImage(img, "PNG", 0, 0, pageWidth, height);

            const blob = pdf.output("blob");
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPreview(true);
        } finally {
            setIsGenerating(false);
            if (tempRef.current) document.body.removeChild(tempRef.current);
        }
    };


    // ----------------------------------------
    // PDF ACTION HANDLERS
    // ----------------------------------------
    const handlePdfAction = (action) => {
        if (!pdfUrl) return;

        if (action === "open") window.open(pdfUrl, "_blank");

        if (action === "print") {
            const w = window.open(pdfUrl);
            w.onload = () => w.print();
        }

        if (action === "save") {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = `HouseProfitLoss_SeaOutbound_${jobNo}_${hbl}.pdf`;
            a.click();
        }
    };


    // ----------------------------------------
    // UI Rendering
    // ----------------------------------------
    const showMessage = !identifiersValid
        ? "Select a job house to load costing."
        : isLoading
        ? "Loading job costing..."
        : isError
        ? "Unable to load costing."
        : noData
        ? "No costing data available."
        : "";


    return (
        <>
            <CommonSectionHeader
                title="Job Costing - Sea Outbound"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-5 text-center">

                    {showMessage && <p className="text-muted">{showMessage}</p>}

                    {ready && (
                        <>
                            <h4 className="fw-bold text-success">Income = {currency(income)}</h4>
                            <h4 className="fw-bold text-danger">Expense = {currency(expense)}</h4>
                            <h4 className="fw-bold text-primary">Profit = {currency(profit)}</h4>
                            <h4 className="fw-bold">Profit % = {percent(profitPercent)}</h4>
                        </>
                    )}

                    <button
                        className="btn btn-primary mt-4"
                        disabled={!ready || isGenerating}
                        onClick={generatePDF}
                        type="button"
                    >
                        {isGenerating ? "Generating PDF..." : "View Job Cost Detail"}
                    </button>
                </div>
            )}

            <PdfPreviewModal
                show={showPreview}
                title="House Profit & Loss Report - Sea Outbound"
                pdfUrl={pdfUrl}
                onClose={() => setShowPreview(false)}
                onAction={handlePdfAction}
            />
        </>
    );
};

export default JobcastingSeaOutbound;
