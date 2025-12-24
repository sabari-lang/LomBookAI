import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { deleteUbAirOutboundCustomerAccount, getUbAirOutboundCustomerAccounts } from "../../../../../../services/personal-effects/airOutbound/peAirOutboundApi";
import CommonSectionHeader from "../../../../../logisticsservices/bl/navbar/CommonSectionHeader";
import Pagination from "../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../utils/extractItems";
import { handleProvisionalError } from "../../../../../../utils/handleProvisionalError";
import { extractPagination } from "../../../../../../utils/extractPagination";
import RaiseAccountingEntryOut from "../provisionalentry/RaiseAccountingEntryOut";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../utils/notifications";
import { confirm } from "../../../../../../utils/confirm";

const AccountingEntryCusOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    // SESSION STORAGE
    const storedMaster = JSON.parse(sessionStorage.getItem("peUbMasterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("peUbHouseAirwayData") || "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hawbNo =
        storedHouse?.hawb ??
        storedHouse?.hawbNo ??
        storedHouse?.houseNumber ??
        "";

    // API QUERY
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["airOutboundCustomerAcc", jobNo, hawbNo, currentPage, pageSize, search],
        queryFn: () => getAirOutboundCustomerAccounts(jobNo, hawbNo, {
            page: currentPage,
            pageSize,
            search
        }),
        enabled: Boolean(jobNo && hawbNo),
        keepPreviousData: true,
        retry: 1,
    });

    // RAW MAP
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

    // NORMALIZE
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry?.items) ? entry.items : [];

        if (items.length === 0) {
            return [{
                id: entry.id,
                voucherDate: entry.voucherDate || "",
                voucherNo: entry.voucherNo || "",
                status: entry.status || "",
                voucherType: entry.voucherType || "",
                hawbNo: entry.hawbno ?? entry.hawbNo ?? "",
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
            hawbNo: entry.hawbno ?? entry.hawbNo ?? "",
            partyName: entry.partyName ?? "",
            partyAddress: entry.partyAddress ?? "",
            contactPerson: entry.contactPerson ?? entry.tel ?? "",
            currency: entry.baseCurrency ?? "INR",
            amount: amountSum,
            total: totalSum,
            __raw: entry
        }];
    };

    // TABLE ROWS
    const rows = useMemo(() => {
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        return src.flatMap((entry) => normalize(entry));
    }, [apiRaw]);

    // SEARCH
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return rows;

        return rows.filter((r) =>
            (r.voucherNo ?? "").toLowerCase().includes(q) ||
            (r.partyName ?? "").toLowerCase().includes(q) ||
            (r.partyAddress ?? "").toLowerCase().includes(q) ||
            (r.hawbNo ?? "").toLowerCase().includes(q)
        );
    }, [search, rows]);

    // FIXED PAGINATION
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

    // DELETE
    const deleteMutation = useMutation({
        mutationFn: ({ id }) => deleteAirOutboundCustomerAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundCustomerAcc"]);
            notifySuccess("Deleted successfully");
        },
        onError: (err) => handleProvisionalError(err, "Delete Customer Accounting Entry"),
    });

    const handleDelete = async (row) => {
        if (!row?.id) return notifyError("Missing ID");
        const confirmed = await confirm("Are you sure?");
    if (!confirmed) return;
        deleteMutation.mutate({ id: row.id });
    };

    // VIEW
    const handleView = (row) => {
        sessionStorage.setItem("customerAccViewOut", JSON.stringify(row));
        navigate("/pe/air-outbound/masterreport/housereport/view-customer-accounting");
    };

    // EDIT
    const handleEdit = (row) => {
        setEditData(rawEntries[row.id] ?? row.__raw ?? null);
        const el = document.getElementById("raiseCustomerAccountingModalOut");
        const bs = window.bootstrap;
        if (bs?.Modal) {
            const inst = bs.Modal.getInstance(el) || new bs.Modal(el);
            inst.show();
        }
    };

    return (
        <>
            <CommonSectionHeader
                title="Customer Accounting Entry (UB Air Outbound)"
                type="customer-accounting"
                rightButton2Text="Raise Accounting Entry"
                rightButton2ModalId="raiseCustomerAccountingModalOut"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                    {/* TOP BUTTONS */}
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
                            placeholder="Search.."
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
                                    <th>H.AWB No</th>
                                    <th>Party Name</th>
                                    <th>Address</th>
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
                                        <td colSpan="12" className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="12" className="text-center text-danger py-3">
                                            Error fetching data
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="text-center py-3">
                                            No data available
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
                                            <td className="text-end">{Number(row.amount).toFixed(2)}</td>
                                            <td className="text-end">{Number(row.total).toFixed(2)}</td>

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
                                                        onClick={() => handleEdit(row)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#raiseCustomerAccountingModalOut"
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

                    {/* FIXED PAGINATION FOOTER */}
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
            <RaiseAccountingEntryOut editData={editData} setEditData={setEditData} />
        </>
    );
};

export default AccountingEntryCusOut;
