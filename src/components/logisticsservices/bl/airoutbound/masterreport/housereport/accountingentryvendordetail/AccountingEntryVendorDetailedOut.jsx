import React, { useState, useMemo, useEffect } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";

import Pagination from "../../../../../../common/pagination/Pagination";

import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import { getAirOutboundVendorAccounts } from "../../../airOutboundApi"; // use the working API

const AccountingEntryVendorDetailedOut = () => {
    const [collapsed, setCollapsed] = useState(false);

    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    // Load jobNo + hawb from session
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hawb =
        storedHouse?.hawb ??
        storedHouse?.hawbNo ??
        storedHouse?.houseNumber ?? "";

    // API FETCH — using the working API (same pattern as vendorAccountingOutbound)
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["vendorAccountingOutbound", jobNo, hawb, currentPage, pageSize],
        queryFn: () =>
            getAirOutboundVendorAccounts(jobNo, hawb, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hawb),
        keepPreviousData: true,
        retry: 1,
    });

    // Normalizer for detailed items (one row per item)
    const normalizeDetailed = (entry = {}) => {
        const items = Array.isArray(entry.items) ? entry.items : [];

        return items.map((item) => ({
            voucherDate: entry.voucherDate ?? "",
            mawbNo: entry.mawbNo ?? entry.mblNo ?? "",
            hawbNo: entry.hawbNo ?? entry.hblNo ?? "",
            description: item.description ?? "",
            sac: item.sac ?? "",
            currency: item.currency ?? "",
            amount: Number(item.amount ?? 0),
            exRate: Number(item.exRate ?? 1),
            amountInInr: Number(item.amountInInr ?? 0),
            gstPer: Number(item.gstPer ?? 0),
            cgst: Number(item.cgst ?? 0),
            sgst: Number(item.sgst ?? 0),
            igst: Number(item.igst ?? 0),
            total: Number(item.total ?? 0),
        }));
    };

    // Build list of parent entries (supports multiple API response shapes)
    // Priorities:
    // 1) If extractItems(apiRaw) returns an array (API returns a list), use that.
    // 2) Else if apiRaw?.data is an array use that.
    // 3) Else if apiRaw is an object (single voucher), wrap into array [apiRaw].
    const parentEntries = useMemo(() => {
        // try extractItems first (works when apiRaw wraps data)
        const extracted = extractItems(apiRaw);
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;

        // if apiRaw.data is array (some APIs return { data: [...] })
        if (apiRaw && Array.isArray(apiRaw.data) && apiRaw.data.length > 0) {
            return apiRaw.data;
        }

        // if apiRaw itself is array
        if (Array.isArray(apiRaw) && apiRaw.length > 0) return apiRaw;

        // if apiRaw is an object with items[] (detailed single/voucher response)
        if (apiRaw && typeof apiRaw === "object") return [apiRaw];

        // fallback empty
        return [];
    }, [apiRaw]);

    // Flatten items into rows
    const allItems = useMemo(() => {
        if (!parentEntries || parentEntries.length === 0) return [];
        return parentEntries.flatMap((entry) => normalizeDetailed(entry));
    }, [parentEntries]);

    // Pagination: try to use extractPagination(apiRaw), fallback to derived values
    const { totalPages: apiTP, totalCount: apiTC } = extractPagination(apiRaw);

    const totalRows = apiTC ?? allItems.length;
    const totalPages = apiTP ?? Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    // Search filter
    const filtered = useMemo(() => {
        const s = (search ?? "").toLowerCase().trim();
        if (!s) return allItems;

        return allItems.filter((r) =>
            (
                (r.description ?? "") +
                " " +
                (r.currency ?? "") +
                " " +
                (r.sac ?? "")
            )
                .toLowerCase()
                .includes(s)
        );
    }, [search, allItems]);

    useEffect(() => setCurrentPage(1), [search]);

    const paginated = filtered.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    // Footer totals
    const subtotalINR = filtered.reduce((sum, r) => sum + Number(r.amountInInr ?? 0), 0);
    const totalAmount = filtered.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

    // UI
    return (
        <>
            <CommonSectionHeader
                title="Accounting Entry Detailed (for Vendor)"
                type="accounting-detailed-vendor"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">
                    {/* TOP BAR */}
                    <div className="d-flex justify-content-between mb-3">
                        <div>
                            <label className="me-2">Show</label>
                            <select
                                className="form-select d-inline-block w-auto"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="ms-2">entries</span>
                        </div>

                        <input
                            className="form-control w-25"
                            placeholder="Search:"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* TABLE */}
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>voucher Date</th>
                                    <th>M.B/L No</th>
                                    <th>H.B/L No</th>
                                    <th>Description</th>
                                    <th>SAC</th>
                                    <th>Currency</th>
                                    <th>Amount</th>
                                    <th>Ex.Rate</th>
                                    <th>Amount in INR</th>
                                    <th>GST %</th>
                                    <th>CGST</th>
                                    <th>SGST</th>
                                    <th>IGST</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={14} className="text-center py-3">Loading...</td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={14} className="text-center text-danger py-3">Error loading data</td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="text-center text-muted">No data available in table</td>
                                    </tr>
                                ) : (
                                    paginated.map((row, index) => (
                                        <tr key={index}>
                                            <td>{(row.voucherDate ?? "").slice(0, 10)}</td>
                                            <td>{row.mawbNo}</td>
                                            <td>{row.hawbNo}</td>
                                            <td style={{ whiteSpace: "pre-line" }}>{row.description}</td>
                                            <td>{row.sac}</td>
                                            <td>{row.currency}</td>
                                            <td className="text-end">{row.amount.toFixed(2)}</td>
                                            <td>{row.exRate}</td>
                                            <td className="text-end">{row.amountInInr.toFixed(2)}</td>
                                            <td className="text-end">{row.gstPer}</td>
                                            <td className="text-end">{row.cgst.toFixed(2)}</td>
                                            <td className="text-end">{row.sgst.toFixed(2)}</td>
                                            <td className="text-end">{row.igst.toFixed(2)}</td>
                                            <td className="text-end">{row.total.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}

                                {/* FOOTER TOTAL */}
                                {filtered.length > 0 && (
                                    <tr className="fw-bold">
                                        <td colSpan={8} className="text-end">Subtotal</td>
                                        <td className="text-end">{subtotalINR.toFixed(2)}</td>
                                        <td colSpan={4}></td>
                                        <td className="text-end">{totalAmount.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-2">
                        <span>Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, totalRows)} of {totalRows} entries</span>

                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default AccountingEntryVendorDetailedOut;
