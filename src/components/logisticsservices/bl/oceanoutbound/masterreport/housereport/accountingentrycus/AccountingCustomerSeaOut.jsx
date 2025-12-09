import React, { useState, useMemo, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";

import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";

import {
    getOceanOutboundCustomerAccounts,
    deleteOceanOutboundCustomerAccount
} from "../../../oceanOutboundApi";
import RaiseAccountingEntrySeaOut from "../provisionalentry/RaiseAccountingEntrySeOut";



const AccountingCustomerSeaOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    // -------------------------------------
    // SESSION STORAGE
    // -------------------------------------
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hblNo =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ??
        "";

    // -------------------------------------
    // API QUERY
    // -------------------------------------
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanOutboundCustomerAcc", jobNo, hblNo, currentPage, pageSize, search],
        queryFn: () =>
            getOceanOutboundCustomerAccounts(jobNo, hblNo, {
                page: currentPage,
                pageSize,
                search,
            }),
        enabled: Boolean(jobNo && hblNo),
        keepPreviousData: true,
    });

    // -------------------------------------
    // RAW ENTRIES MAP (for editing)
    // -------------------------------------
    const rawEntries = useMemo(() => {
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        return src.reduce((acc, e) => {
            if (e?.id) acc[e.id] = e;
            return acc;
        }, {});
    }, [apiRaw]);

    // -------------------------------------
    // NORMALIZATION LOGIC (same as Provisional)
    // -------------------------------------
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry?.items) ? entry.items : [];

        if (items.length === 0) {
            return [{
                id: entry.id,
                voucherDate: entry.voucherDate || "",
                voucherNo: entry.voucherNo || "",
                status: entry.status || "",
                voucherType: entry.voucherType || "",
                hawbNo: entry.hblNo ?? entry.hbl ?? "",
                partyName: entry.partyName ?? "",
                partyAddress: entry.partyAddress ?? "",
                contactPerson: entry.contactPerson ?? entry.tel ?? "",
                currency: entry.baseCurrency ?? "INR",
                amount: Number(entry.amount ?? 0),
                total: Number(entry.total ?? 0),
                __raw: entry
            }];
        }

        const amountSum = items.reduce((s, it) => s + Number(it.amount ?? 0), 0);
        const totalSum = items.reduce((s, it) => s + Number(it.total ?? 0), 0);

        return [{
            id: entry.id,
            voucherDate: entry.voucherDate || "",
            voucherNo: entry.voucherNo || "",
            status: entry.status || "",
            voucherType: entry.voucherType || "",
            hawbNo: entry.hblNo ?? entry.hbl ?? "",
            partyName: entry.partyName ?? "",
            partyAddress: entry.partyAddress ?? "",
            contactPerson: entry.contactPerson ?? entry.tel ?? "",
            currency: entry.baseCurrency ?? "INR",
            amount: amountSum,
            total: totalSum,
            __raw: entry
        }];
    };

    // -------------------------------------
    // FLATTEN ENTRIES
    // -------------------------------------
    const rows = useMemo(() => {
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        return src.flatMap((entry) => normalize(entry));
    }, [apiRaw]);

    // -------------------------------------
    // SEARCH FILTER
    // -------------------------------------
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return rows;

        return rows.filter((r) => {
            return (
                (r.voucherNo ?? "").toLowerCase().includes(q) ||
                (r.partyName ?? "").toLowerCase().includes(q) ||
                (r.partyAddress ?? "").toLowerCase().includes(q) ||
                (r.hawbNo ?? "").toLowerCase().includes(q)
            );
        });
    }, [search, rows]);

    // -------------------------------------
    // PAGINATION FIX (same pattern as others)
    // -------------------------------------
    const pagination = extractPagination(apiRaw ?? {});
    const backendHasPagination =
        pagination?.totalPages > 0 && pagination?.totalCount > 0;

    const totalPages = backendHasPagination
        ? pagination.totalPages
        : Math.max(1, Math.ceil(filtered.length / pageSize));

    const totalCount = backendHasPagination
        ? pagination.totalCount
        : filtered.length;

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1);
    }, [totalPages]);

    const start = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    // -------------------------------------
    // DELETE
    // -------------------------------------
    const deleteMutation = useMutation({
        mutationFn: ({ id }) => deleteOceanOutboundCustomerAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanOutboundCustomerAcc"]);
            alert("Deleted Successfully");
        },
        onError: (err) =>
            handleProvisionalError(err, "Delete Ocean Outbound Customer Accounting"),
    });

    const handleDelete = (row) => {
        if (!row?.id) return alert("Missing ID!");
        if (!window.confirm("Delete this entry?")) return;

        deleteMutation.mutate({ id: row.id });
    };

    // -------------------------------------
    // VIEW
    // -------------------------------------
    const handleView = (row) => {
        sessionStorage.setItem("customerAccViewSeaOut", JSON.stringify(row));
        navigate("/ocean-outbound/masterreport/housereport/view-customer-accounting");
    };

    // -------------------------------------
    // EDIT — OPEN MODAL
    // -------------------------------------
    const handleEdit = (row) => {
        if (!row?.id) {
            setEditData(null);
            return;
        }
        // prefer raw map to get the full original payload
        const full = rawEntries[row.id] ?? row.__raw ?? null;
        setEditData(full);
        // open existing modal (preserve UI behavior)
        const el = document.getElementById("seaoutraiseAccountingModalOut");
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

    // -------------------------------------
    // UI (UNCHANGED)
    // -------------------------------------
    return (
        <>
            <CommonSectionHeader
                title="Accounting Entry (for Customer)"
                type="accounting-customer"
                rightButton2Text="Raise Accounting Entry"
                rightButton2ModalId="seaoutraiseAccountingModalOut"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                    {/* SHOW + SEARCH */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
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
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                            </select>
                            <span className="ms-2">entries</span>
                        </div>

                        <input
                            className="form-control w-25"
                            placeholder="Search:"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
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
                                    <th>HBL No</th>
                                    <th>Party Name</th>
                                    <th>Party Address</th>
                                    <th>Contact</th>
                                    <th>Cur</th>
                                    <th>Amount</th>
                                    <th>Total</th>
                                    <th>View</th>
                                    <th>Edit</th>
                                    <th>Cancel</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="14" className="text-center py-3">Loading...</td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="14" className="text-center text-danger py-3">
                                            Error fetching data
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="14" className="text-center text-muted py-3">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((row) => (
                                        <tr key={row.id}>
                                            <td>{(row.voucherDate ?? "").slice(0, 10)}</td>
                                            <td>{row.voucherNo}</td>
                                            <td>{row.status}</td>
                                            <td>{row.voucherType}</td>
                                            <td>{row.hawbNo}</td>
                                            <td>{row.partyName}</td>
                                            <td>{row.partyAddress}</td>
                                            <td>{row.contactPerson}</td>
                                            <td>{row.currency}</td>
                                            <td>{Number(row.amount).toFixed(2)}</td>
                                            <td>{Number(row.total).toFixed(2)}</td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleView(row)}
                                                >
                                                    <FaEye />
                                                </button>
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleEdit(row)}
                                                >
                                                    <FaEdit />
                                                </button>
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                <tr className="fw-bold">
                                    <td colSpan={9} className="text-end text-danger">Cancelled Total</td>
                                    <td>0.00</td>
                                    <td className="text-end text-success">Total</td>
                                    <td>0.00</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-3">
                        <span>
                            Showing{" "}
                            {filtered.length === 0 ? 0 : start + 1} to{" "}
                            {Math.min(start + pageSize, filtered.length)} of{" "}
                            {filtered.length} entries
                        </span>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* MODAL */}
            <RaiseAccountingEntrySeaOut
                editData={editData}
                setEditData={setEditData}
            />
        </>
    );
};

export default AccountingCustomerSeaOut;
