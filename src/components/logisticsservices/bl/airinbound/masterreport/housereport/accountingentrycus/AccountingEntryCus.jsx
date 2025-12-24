import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";







import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import { deleteAirInboundCustomerAccount, getAirInboundCustomerAccounts } from "../../../Api";
import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import RaiseAccountingEntry from "../provisionalentry/RaiseAccountingEntry";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../../utils/notifications";
import { confirm } from "../../../../../../../utils/confirm";

const AccountingEntryCus = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [collapsed, setCollapsed] = useState(false);

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    // SESSION STORAGE (same keys as other screens)
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hawb =
        storedHouse?.hawb ??
        storedHouse?.hawbNo ??
        storedHouse?.houseNumber ??
        "";

    // refresh helper
    const refresh = useCallback(() => {
        queryClient.invalidateQueries(["customerAccountingEntries"]);
    }, [queryClient]);

    // ================================================================
    // API Query — follow same pattern as ProvisionalEntry
    // ================================================================
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["customerAccountingEntries", jobNo, hawb, currentPage, pageSize],
        queryFn: () => getAirInboundCustomerAccounts(jobNo, hawb, {
            page: currentPage,
            pageSize,
        }),
        enabled: Boolean(jobNo && hawb),
        keepPreviousData: true,
        retry: 1,
    });

    // ================================================================
    // RAW ENTRY MAP (so edit gets full original object)
    // This mirrors ProvisionalEntry's rawEntries pattern.
    // ================================================================
    const rawEntries = useMemo(() => {
        // try several shapes your backend might return; fallback to extractItems util
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        return src.reduce((acc, entry) => {
            if (entry?.id) acc[entry.id] = entry;
            return acc;
        }, {});
    }, [apiRaw]);

    // ================================================================
    // NORMALIZE: make a single row per voucher (summing items)
    // This follows the normalization logic in ProvisionalEntry.
    // ================================================================
    const normalize = (entry = {}) => {
        // Ensure items is an array
        const items = Array.isArray(entry?.items) ? entry.items : [];

        // If no items, still return an object from entry fields
        if (items.length === 0) {
            return [
                {
                    id: entry?.id ?? "",
                    voucherDate: entry?.voucherDate ?? "",
                    voucherNo: entry?.voucherNo ?? "",
                    status: entry?.status ?? "",
                    voucherType: entry?.voucherType ?? "",
                    hawbNo: entry?.hawbno ?? entry?.hawbNo ?? "",
                    partyName: entry?.partyName ?? "",
                    partyAddress: entry?.partyAddress ?? "",
                    contactPerson: entry?.contactPerson ?? entry?.tel ?? "",
                    currency: entry?.baseCurrency ?? entry?.currency ?? "INR",
                    amount: Number(entry?.amount ?? 0),
                    total: Number(entry?.total ?? 0),
                    __raw: entry,
                },
            ];
        }

        // If there are items, summarize numeric columns
        const amountSum = items.reduce((s, it) => s + Number(it?.amount ?? 0), 0);
        const totalSum = items.reduce((s, it) => s + Number(it?.total ?? 0), 0);

        // take some representative fields from parent entry
        return [
            {
                id: entry?.id ?? "",
                voucherDate: entry?.voucherDate ?? "",
                voucherNo: entry?.voucherNo ?? "",
                status: entry?.status ?? "",
                voucherType: entry?.voucherType ?? "",
                hawbNo: entry?.hawbno ?? entry?.hawbNo ?? "",
                partyName: entry?.partyName ?? "",
                partyAddress: entry?.partyAddress ?? "",
                contactPerson: entry?.contactPerson ?? entry?.tel ?? "",
                currency: entry?.baseCurrency ?? entry?.currency ?? "INR",
                amount: amountSum,
                total: totalSum,
                __raw: entry,
            },
        ];
    };

    // ================================================================
    // Build flattened rows for table display (one row per voucher)
    // This matches Provisional: flatten then normalize and concat
    // ================================================================
    const rows = useMemo(() => {
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        // Map every entry through normalize, then flatten
        const flattened = src.flatMap((entry) => normalize(entry));
        return flattened;
    }, [apiRaw]);

    // ================================================================
    // Search / Filter / Pagination (client-side filtering like provisional)
    // ================================================================
    const filtered = useMemo(() => {
        const q = (search ?? "").trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) => {
            return (
                (r.voucherNo ?? "").toString().toLowerCase().includes(q) ||
                (r.partyName ?? "").toString().toLowerCase().includes(q) ||
                (r.partyAddress ?? "").toString().toLowerCase().includes(q) ||
                (r.hawbNo ?? "").toString().toLowerCase().includes(q) ||
                (r.voucherType ?? "").toString().toLowerCase().includes(q)
            );
        });
    }, [rows, search]);

    // compute pagination values using same extractPagination util when possible
    const { totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)), totalCount = filtered.length } = useMemo(() => {
        // attempt to use backend pagination if present
        const pag = extractPagination(apiRaw ?? {});
        if (pag && pag.totalPages && pag.totalCount) {
            return { totalPages: pag.totalPages, totalCount: pag.totalCount };
        }
        // fallback
        return { totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)), totalCount: filtered.length };
    }, [apiRaw, filtered.length, pageSize]);

    // Ensure current page within bounds
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1);
    }, [currentPage, totalPages]);

    // compute paginated slice
    const safePage = Math.max(1, currentPage);
    const startIdx = (safePage - 1) * pageSize;
    const paginated = filtered.slice(startIdx, startIdx + pageSize);

    // ================================================================
    // DELETE mutation (pattern like Provisional)
    // ================================================================
    const deleteMutation = useMutation({
        mutationFn: ({ id }) => deleteAirInboundCustomerAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["customerAccountingEntries"]);
            notifySuccess("Deleted successfully");
        },
        onError: (err) => {
            // best-effort error message like handleProvisionalError
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Delete failed";
            notifyError(msg);
        },
    });

    const handleDelete = async (row) => {
        if (!row?.id) {
            notifyError("Missing ID");
            return;
        }
        const confirmed = await confirm("Delete this entry?");
        if (!confirmed) return;
        deleteMutation.mutate({ id: row.id });
    };

    // ================================================================
    // VIEW / EDIT handlers
    // - handleView keeps existing behavior (session + navigate)
    // - handleEdit uses rawEntries map to populate modal (option B)
    // ================================================================
    const handleView = (row) => {
        sessionStorage.setItem("customerAccView", JSON.stringify(row));
        navigate("/air-inbound/masterreport/housereport/view-customer-account");
    };

    const handleEdit = (row) => {
        if (!row?.id) {
            setEditData(null);
            return;
        }
        // prefer raw map to get the full original payload
        const full = rawEntries[row.id] ?? row.__raw ?? null;
        setEditData(full);
        // open existing modal (preserve UI behavior)
        const el = document.getElementById("raiseAccountingModal");
        if (el) {
            const bs = window.bootstrap;
            if (bs?.Modal) {
                const inst = bs.Modal.getInstance(el) || new bs.Modal(el);
                inst.show();
            } else {
                el.classList.add("show");
                el.style.display = "block";
            }
        }
    };

    // ================================================================
    // UI (kept unchanged) — same structure as your original file.
    // ================================================================
    return (
        <>
            <CommonSectionHeader
                title="Accounting Entry (for Customer)"
                type="accounting-customer"
                rightButton2Text="Raise Accounting Entry"
                rightButton2ModalId="raiseAccountingModal"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">
                    {/* SEARCH + PAGE SIZE */}
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
                            placeholder="Search."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {/* TABLE */}
                    <div style={{ overflowX: "auto" }}>
                        <table className="table table-bordered table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Voucher Date</th>
                                    <th>Voucher No</th>
                                    <th>Status</th>
                                    <th>Voucher Type</th>
                                    <th>H.B/L No</th>
                                    <th>Party Name</th>
                                    <th>Party Address</th>
                                    <th>Contact</th>
                                    <th>Currency</th>
                                    <th className="text-end">Amount</th>
                                    <th className="text-end">Total</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="12" className="text-center py-3">Loading...</td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="12" className="text-center text-danger py-3">Error fetching data</td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="text-center py-3">No data available</td>
                                    </tr>
                                ) : (
                                    paginated.map((row) => (
                                        <tr key={row?.id}>
                                            <td>{(row?.voucherDate ?? "").slice(0, 10)}</td>
                                            <td>{row?.voucherNo}</td>
                                            <td>{row?.status}</td>
                                            <td>{row?.voucherType}</td>
                                            <td>{row?.hawbNo}</td>
                                            <td>{row?.partyName}</td>
                                            <td>{row?.partyAddress}</td>
                                            <td>{row?.contactPerson ?? row?.tel}</td>
                                            <td>{row?.currency ?? "INR"}</td>

                                            {/* AMOUNT */}
                                            <td className="text-end">
                                                {Number(row?.amount ?? 0).toFixed(2)}
                                            </td>

                                            <td className="text-end">
                                                {Number(row?.total ?? 0).toFixed(2)}
                                            </td>

                                            <td className="text-center">
                                                <div className="d-flex justify-content-center gap-1">
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleView(row)}
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#raiseAccountingModal"
                                                        onClick={() => handleEdit(row)}
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(row)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-3">
                        <span>
                            Showing {(safePage - 1) * pageSize + 1} to{" "}
                            {Math.min(safePage * pageSize, totalCount)} of {totalCount} entries
                        </span>

                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* KEEP THE RAISE ACCOUNTING MODAL (UI handler) */}
            <RaiseAccountingEntry editData={editData} setEditData={setEditData} />
        </>
    );
};

export default AccountingEntryCus;
