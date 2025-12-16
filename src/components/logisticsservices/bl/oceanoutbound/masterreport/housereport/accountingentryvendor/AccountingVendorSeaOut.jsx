import React, { useState, useMemo, useCallback, useEffect } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import RaisingEntryVendorSeaOut from "./RaisingEntryVendorSeaOut";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import { deleteOceanOutboundVendorAccount, getOceanOutboundVendorAccounts } from "../../../oceanOutboundApi";

const AccountingVendorSeaOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    // Ocean Outbound SessionStorage Loaded Values
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hbl =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ?? "";

    const refresh = useCallback(() => {
        queryClient.invalidateQueries(["oceanOutboundVendor"]);
    }, [queryClient]);

    // ========================= API QUERY =========================
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanOutboundVendor", jobNo, hbl, currentPage, pageSize],
        queryFn: () =>
            getOceanOutboundVendorAccounts(jobNo, hbl, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hbl),
        keepPreviousData: true,
        retry: 1,
    });

    // ========================= RAW ENTRIES MAP =========================
    const rawEntries = useMemo(() => {
        return (apiRaw?.data ?? []).reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
        }, {});
    }, [apiRaw]);

    // ========================= NORMALIZE (ONE ROW PER VOUCHER) =========================
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry.items) ? entry.items : [];

        const totalSum = items.reduce(
            (sum, it) => sum + Number(it?.total ?? 0),
            0
        );

        return {
            id: entry.id,
            voucherDate: entry.voucherDate ?? "",
            voucherNo: entry.voucherNo ?? "",
            status: entry.status ?? "",
            voucherType: entry.voucherType ?? "",
            mblNo: entry.mawbNo ?? entry.mblNo ?? "",
            hblNo: entry.hblNo ?? "",
            partyName: entry.partyName ?? "",
            partyAddress: entry.partyAddress ?? "",
            contactPerson: entry.tel ?? "",
            total: totalSum,
            __raw: entry,
        };
    };

    const allItems = (extractItems(apiRaw) ?? []).map(normalize);

    // ========================= PAGINATION =========================
    const { totalPages: apiTP, totalCount: apiTC } = extractPagination(apiRaw);

    const totalRows = apiTC ?? allItems.length;
    const totalPages = apiTP ?? Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    // ========================= SEARCH =========================
    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return allItems;

        return allItems.filter((r) =>
            (
                r.voucherNo +
                " " +
                r.partyName +
                " " +
                r.mblNo +
                " " +
                r.hblNo
            )
                .toLowerCase()
                .includes(s)
        );
    }, [allItems, search]);

    useEffect(() => setCurrentPage(1), [search]);

    const paginated = filtered.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    // ========================= DELETE =========================
    const deleteMutation = useMutation({
        mutationFn: ({ id }) => deleteOceanOutboundVendorAccount(id),

        onSuccess: () => {
            alert("Deleted successfully!");
            refresh();
        },

        onError: () => alert("Delete failed"),
    });

    const handleDelete = (row) => {
        if (!row?.id) return;
        if (!window.confirm("Delete this entry?")) return;
        deleteMutation.mutate({ id: row.id });
    };

    // ========================= VIEW / EDIT =========================
    const handleView = (row) => {
        sessionStorage.setItem("vendorSeaOutViewData", JSON.stringify(row.__raw));
        navigate("/ocean-outbound/vendor-view");
    };

    const handleEdit = (row) => {
        const full = rawEntries[row.id] ?? row.__raw;
        setEditData(full);
    };

    // Footer TOTAL
    const footerTotal = filtered.reduce(
        (sum, r) => sum + Number(r.total ?? 0),
        0
    );

    return (
        <>
            <CommonSectionHeader
                title="Accounting Entry (for Vendor)"
                type="accounting-vendor"
                rightButton2Text="Raise Accounting Entry"
                rightButton2ModalId="seaoutraiseVendorModalOut"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                    {/* TOP: PAGE SIZE + SEARCH */}
                    <div className="d-flex justify-content-between mb-3">
                        <div>
                            <span className="me-2">Show</span>
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
                                    <th>Voucher Date</th>
                                    <th>Voucher No</th>
                                    <th>Status</th>
                                    <th>Voucher Type</th>
                                    <th>MBL NO</th>
                                    <th>HBL NO</th>
                                    <th>Party Name</th>
                                    <th>Party Address</th>
                                    <th>Contact Person</th>
                                    <th className="text-end">Total</th>
                                    <th>Edit / View</th>
                                    <th>Cancel</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-3">Loading...</td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={12} className="text-center text-danger py-3">
                                            Error loading
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-3">No data available</td>
                                    </tr>
                                ) : (
                                    paginated.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.voucherDate?.slice(0, 10)}</td>
                                            <td>{row.voucherNo}</td>
                                            <td>{row.status}</td>
                                            <td>{row.voucherType}</td>
                                            <td>{row.mblNo}</td>
                                            <td>{row.hblNo}</td>
                                            <td>{row.partyName}</td>
                                            <td>{row.partyAddress}</td>
                                            <td>{row.contactPerson}</td>

                                            <td className="text-end">
                                                {Number(row.total).toFixed(2)}
                                            </td>

                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-1">
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#seaoutraiseVendorModalOut"
                                                        onClick={() => handleEdit(row)}
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleView(row)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* FOOTER TOTAL */}
                                {filtered.length > 0 && (
                                    <tr className="fw-bold">
                                        <td colSpan={9} className="text-end">Total</td>
                                        <td className="text-end">{footerTotal.toFixed(2)}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-3">
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

            <RaisingEntryVendorSeaOut editData={editData} setEditData={setEditData} />
        </>
    );
};

export default AccountingVendorSeaOut;
