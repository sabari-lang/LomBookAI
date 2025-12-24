import React, { useState, useMemo, useEffect } from "react";
import CommonSectionHeader from "../../../../../logisticsservices/bl/navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../utils/extractItems";
import { getOceanInboundVendorAccounts } from "../../../../../../services/personal-effects/oceanInbound/peOceanInboundApi"; // API CALL


const AccountingVendorDetailSeaIn = () => {
    const [collapsed, setCollapsed] = useState(false);

    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    // Load session values
    const storedMaster = JSON.parse(sessionStorage.getItem("peUbMasterBillOfLaddingData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("peUbHouseBillOfLaddingData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hbl =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ?? "";

    // API Query
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["vendorSeaInbound", jobNo, hbl, currentPage, pageSize],
        queryFn: () =>
            getOceanInboundVendorAccounts(jobNo, hbl, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hbl),
        keepPreviousData: true,
        retry: 1,
    });

    // Normalize each item into a row
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

    // Extract parent entries safely
    const parentEntries = useMemo(() => {
        const extracted = extractItems(apiRaw);
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;

        if (apiRaw && Array.isArray(apiRaw.data)) return apiRaw.data;

        if (Array.isArray(apiRaw)) return apiRaw;

        if (apiRaw && typeof apiRaw === "object") return [apiRaw];

        return [];
    }, [apiRaw]);

    // Flatten
    const allItems = useMemo(() => {
        return parentEntries.flatMap((entry) => normalizeDetailed(entry));
    }, [parentEntries]);

    // Search
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return allItems;

        return allItems.filter((r) =>
            (
                r.description +
                " " +
                r.currency +
                " " +
                r.sac
            ).toLowerCase().includes(s)
        );
    }, [search, allItems]);

    useEffect(() => setCurrentPage(1), [search]);

    // Pagination (computed)
    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const paginated = filtered.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    // Totals
    const subtotalINR = filtered.reduce((sum, r) => sum + Number(r.amountInInr ?? 0), 0);
    const totalAmount = filtered.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

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

                    {/* Show + Search */}
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
                                    <tr><td colSpan={14} className="text-center">Loading...</td></tr>
                                ) : isError ? (
                                    <tr><td colSpan={14} className="text-center text-danger">Error loading data</td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr><td colSpan={14} className="text-center text-muted">No data available</td></tr>
                                ) : (
                                    paginated.map((row, i) => (
                                        <tr key={i}>
                                            <td>{(row.voucherDate ?? "").slice(0, 10)}</td>
                                            <td>{row.mawbNo}</td>
                                            <td>{row.hawbNo}</td>
                                            <td style={{ whiteSpace: "pre-line" }}>{row.description}</td>
                                            <td>{row.sac}</td>
                                            <td>{row.currency}</td>
                                            <td className="text-end">{row.amount.toFixed(2)}</td>
                                            <td>{row.exRate}</td>
                                            <td className="text-end">{row.amountInInr.toFixed(2)}</td>
                                            <td>{row.gstPer}</td>
                                            <td className="text-end">{row.cgst.toFixed(2)}</td>
                                            <td className="text-end">{row.sgst.toFixed(2)}</td>
                                            <td className="text-end">{row.igst.toFixed(2)}</td>
                                            <td className="text-end">{row.total.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}

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

                    {/* Pagination */}
                    <div className="d-flex justify-content-between mt-2">
                        <span>
                            Showing {(safePage - 1) * pageSize + 1} to{" "}
                            {Math.min(safePage * pageSize, totalRows)} of {totalRows} entries
                        </span>

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

export default AccountingVendorDetailSeaIn;
