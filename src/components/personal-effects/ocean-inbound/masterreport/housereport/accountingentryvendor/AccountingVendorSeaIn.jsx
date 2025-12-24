import React, { useState, useMemo, useCallback, useEffect } from "react";
import CommonSectionHeader from "../../../../../logisticsservices/bl/navbar/CommonSectionHeader";
import RaisingEntryVendorSeaIn from "./RaisingEntryVendorSeaIn";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";



import Pagination from "../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../utils/extractPagination";
import { deleteOceanInboundVendorAccount, getOceanInboundVendorAccounts } from "../../../../../../services/personal-effects/oceanInbound/peOceanInboundApi";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../utils/notifications";
import { confirm } from "../../../../../../utils/confirm";

const AccountingVendorSeaIn = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    // Load Master/HBL
    const storedMaster = JSON.parse(sessionStorage.getItem("peUbMasterBillOfLaddingData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("peUbHouseBillOfLaddingData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hbl =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ?? "";

    const refresh = useCallback(() => {
        queryClient.invalidateQueries(["oceanInboundVendor"]);
    }, [queryClient]);

    // API Query
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanInboundVendor", jobNo, hbl, currentPage, pageSize],
        queryFn: () =>
            getOceanInboundVendorAccounts(jobNo, hbl, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hbl),
        keepPreviousData: true,
        retry: 1,
    });

    // RAW entries map
    const rawEntries = useMemo(() => {
        return (apiRaw?.data ?? []).reduce((acc, e) => {
            acc[e.id] = e;
            return acc;
        }, {});
    }, [apiRaw]);

    // Normalize
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry?.items) ? entry.items : [];

        const totalSum = items.reduce(
            (s, it) => s + Number(it?.total ?? 0),
            0
        );

        const safeStr = (v) => (v ?? "").toString();

        return {
            id: safeStr(entry?.id ?? entry?._id),
            voucherDate: safeStr(entry?.voucherDate),
            voucherNo: safeStr(entry?.voucherNo),
            status: safeStr(entry?.status),
            voucherType: safeStr(entry?.voucherType),

            // ✅ Safe fallback (Air + Sea support)
            mawbNo: safeStr(
                entry?.mawbNo ??
                entry?.mblNo ??
                entry?.masterNo ??
                ""
            ),

            // ✅ Safe fallback
            hawbNo: safeStr(
                entry?.hawbNo ??
                entry?.hblNo ??
                entry?.houseNo ??
                ""
            ),

            partyName: safeStr(entry?.partyName),
            partyAddress: safeStr(entry?.partyAddress),
            contactPerson: safeStr(entry?.tel ?? entry?.contactPerson),

            total: totalSum,
            __raw: entry,
        };
    };


    const allItems = (extractItems(apiRaw) ?? []).map(normalize);

    // Pagination
    const { totalPages: apiTP, totalCount: apiTC } = extractPagination(apiRaw);

    const totalRows = apiTC ?? allItems.length;
    const totalPages = apiTP ?? Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    // Search
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

    const deleteMutation = useMutation({
        mutationFn: () => deleteOceanInboundVendorAccount(jobNo, hbl),
        onSuccess: () => {
            notifySuccess("Deleted successfully!");
            refresh();
        },
        onError: (error) => {
            console.error("Delete failed:", error);
            notifyError("Delete failed: " + (error?.message || "Unknown error"));
        },
    });

    const handleDelete = async (row) => {
        if (!jobNo || !hbl) {
            notifyError("Job No and HBL are required for deletion");
            return;
        }
        const confirmed = await confirm("Delete this vendor accounting entry?");
        if (!confirmed) return;
        deleteMutation.mutate();
    };

    const handleView = (row) => {
        sessionStorage.setItem("vendorSeaInView", JSON.stringify(row.__raw));
        navigate("/pe/ocean-inbound/vendor-view");
    };

    const handleEdit = (row) => {
        const full = rawEntries[row.id] ?? row.__raw;
        setEditData(full);
    };

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
                rightButton2ModalId="raiseVendorSeaInModal"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                    {/* Search + PageSize */}
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
                                    <tr><td colSpan={12} className="text-center">Loading...</td></tr>
                                ) : isError ? (
                                    <tr><td colSpan={12} className="text-danger text-center">Error loading</td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr><td colSpan={12} className="text-center">No data</td></tr>
                                ) : (
                                    paginated.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.voucherDate?.slice(0, 10)}</td>
                                            <td>{row.voucherNo}</td>
                                            <td>{row.status}</td>
                                            <td>{row.voucherType}</td>
                                            <td>{row.mawbNo}</td>
                                            <td>{row.hawbNo}</td>
                                            <td>{row.partyName}</td>
                                            <td>{row.partyAddress}</td>
                                            <td>{row.contactPerson}</td>
                                            <td className="text-end">
                                                {Number(row.total).toFixed(2)}
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-success btn-sm me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#raiseVendorSeaInModal"
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
                                        <td colSpan={9} className="text-end">
                                            Total
                                        </td>
                                        <td className="text-end">
                                            {footerTotal.toFixed(2)}
                                        </td>
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

            <RaisingEntryVendorSeaIn editData={editData} setEditData={setEditData} />
        </>
    );
};

export default AccountingVendorSeaIn;
