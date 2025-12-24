import React, { useEffect, useMemo, useState } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { useQuery } from "@tanstack/react-query";

import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { getOceanOutboundCustomerAccounts } from "../../../oceanOutboundApi";

const AccountingCustomerDetailSeaOut = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hblNo =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ??
        storedHouse?.houseNo ??
        "";

    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanOutboundCustomerAccDetail", jobNo, hblNo, currentPage, pageSize],
        queryFn: () =>
            getOceanOutboundCustomerAccounts(jobNo, hblNo, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hblNo),
        keepPreviousData: true,
        retry: 1,
    });

    const normalizeEntry = (entry = {}) => {
        const items = Array.isArray(entry.items) ? entry.items : [];

        return items.map((item) => ({
            voucherDate: entry.voucherDate ?? "",
            hawbNo: entry.hblNo ?? entry.hawbNo ?? "",
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

    const parentEntries = useMemo(() => {
        const extracted = extractItems(apiRaw);
        if (Array.isArray(extracted) && extracted.length > 0) return extracted;
        if (apiRaw && Array.isArray(apiRaw.data)) return apiRaw.data;
        if (Array.isArray(apiRaw)) return apiRaw;
        if (apiRaw && typeof apiRaw === "object") return [apiRaw];
        return [];
    }, [apiRaw]);

    const allItems = useMemo(() => parentEntries.flatMap((entry) => normalizeEntry(entry)), [parentEntries]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return allItems;

        return allItems.filter((row) =>
            ((row.description ?? "") + " " + (row.currency ?? "") + " " + (row.sac ?? ""))
                .toLowerCase()
                .includes(query)
        );
    }, [search, allItems]);

    useEffect(() => setCurrentPage(1), [search]);

    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const subtotalINR = filtered.reduce((sum, r) => sum + Number(r.amountInInr ?? 0), 0);
    const totalAmount = filtered.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

    return (
        <>
            <CommonSectionHeader
                title="Accounting Entry Detailed (for Customer)"
                type="accounting-detailed"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">
                    <div className="d-flex justify-content-between mb-3 align-items-center">
                        <div className="d-flex align-items-center gap-1">
                            <label className="mb-0">Show</label>
                            <select
                                className="form-select d-inline-block w-auto"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-muted">entries</span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 text-muted small" style={{ fontSize: 12 }}>
                                Search
                            </label>
                            <input
                                className="form-control"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Voucher | HBL | Description | SAC"
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered table-striped table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Voucher Date</th>
                                    <th>HBL No</th>
                                    <th>Description</th>
                                    <th>SAC</th>
                                    <th>Currency</th>
                                    <th className="text-end">Amount</th>
                                    <th>Ex.Rate</th>
                                    <th className="text-end">Amount INR</th>
                                    <th>GST %</th>
                                    <th className="text-end">CGST</th>
                                    <th className="text-end">SGST</th>
                                    <th className="text-end">IGST</th>
                                    <th className="text-end">Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={13} className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={13} className="text-center text-danger">
                                            Error loading data
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="text-center text-muted">
                                            No entries to show
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((row, index) => (
                                        <tr key={`${row.hawbNo}-${index}`}>
                                            <td>{(row.voucherDate ?? "").slice(0, 10)}</td>
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
                                        <td colSpan={7} className="text-end">
                                            Subtotal
                                        </td>
                                        <td className="text-end">{subtotalINR.toFixed(2)}</td>
                                        <td colSpan={3}></td>
                                        <td className="text-end">{totalAmount.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="small text-muted">
                            Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, totalRows)} of {totalRows} entries
                        </span>
                        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}
        </>
    );
};

export default AccountingCustomerDetailSeaOut;

