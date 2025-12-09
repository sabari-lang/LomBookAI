import React, { useState, useMemo } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import AccountingEntrCus from "../accountingentrycus/AccountingEntryCus";
import AccountingEntryDetailed from "../accountingentrydetail/AccountingEntryDetailed";
import AccountingEntryVen from "../accountingentryvendor/AccountingEntryVen";
import AccountingEntryVendorDetailed from "../accountingentryvendordetail/AccountingEntryVendorDetailed";
import ArrivalNotice from "../arrivalnotice/ArrivalNotice";
import JobCosting from "../jobcosting/JobCosting";
import { useNavigate } from "react-router-dom";
import RaiseAccountingEntry from "./RaiseAccountingEntry";
import CreateHouseAirWay from "../../masterairwaybill/CreateHouseAirWay";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    deleteAirInboundProvisional,
    getAirInboundProvisionals,
} from "../../../Api";

import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import moment from "moment";

const ProvisionalEntry = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [masterCollapsed, setMasterCollapsed] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData"));
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData"));

    const jobNo = storedMaster?.jobNo ?? "";
    const hawb =
        storedHouse?.hawb ??
        storedHouse?.hawbNo ??
        storedHouse?.houseNumber ??
        "";

    // ==========================================================
    //                         API
    // ==========================================================
    const { data: apiRaw, isLoading } = useQuery({
        queryKey: [
            "airInboundProvisionals",
            
            jobNo,
            hawb,
            currentPage,
            entriesPerPage,
        ],
        queryFn: () =>
            getAirInboundProvisionals(jobNo, hawb, {
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        enabled: !!jobNo && !!hawb,
        keepPreviousData: true,
        retry: 1,
    });

    // ==========================================================
    //                     RAW ENTRY MAP
    // ==========================================================
    const rawEntries = useMemo(() => {
        const src =
            apiRaw?.data?.items ??
            apiRaw?.data ??
            apiRaw?.items ??
            extractItems(apiRaw) ??
            [];

        return src.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
        }, {});
    }, [apiRaw]);

    // ==========================================================
    //                        NORMALIZE
    // ==========================================================
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry?.items) ? entry.items : [];

        // No items → One empty row (safe fallback)
        if (items.length === 0) {
            return [
                {
                    id: entry?.id ?? "",
                    provisionalDate: entry?.provisionalDate ?? "",
                    status: entry?.status ?? "-",
                    accountService: "-",
                    sac: "-",
                    currency: "-",
                    qty: 0,
                    amount: 0,
                    exRate: 0,
                    amountInINR: 0,
                    gst: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    total: 0,
                    __raw: entry,
                },
            ];
        }

        // MULTIPLE ITEM ROWS — matches old LOMO behavior
        return items.map((it) => ({
            id: entry?.id ?? "",
            provisionalDate: entry?.provisionalDate ?? "",
            status: entry?.status ?? "-",

            accountService: it?.description ?? "-",
            sac: it?.sac ?? "-",
            currency: it?.currency ?? "-",
            qty: Number(it?.qty ?? 0),
            amount: Number(it?.amount ?? 0),
            exRate: Number(it?.exRate ?? 0),
            amountInINR: Number(it?.amountInInr ?? 0),
            gst: Number(it?.gstPer ?? 0),
            cgst: Number(it?.cgst ?? 0),
            sgst: Number(it?.sgst ?? 0),
            igst: Number(it?.igst ?? 0),
            total: Number(it?.total ?? 0),

            __raw: entry,
        }));
    };

    const allItems = (extractItems(apiRaw) ?? []).flatMap(normalize);

    // ==========================================================
    //          FIXED SEARCH + CLIENT PAGINATION
    // ==========================================================

    // ⭐ FIXED: extractPagination from apiRaw.data (not apiRaw)
    const { totalCount } = extractPagination(apiRaw?.data);

    const totalRows = totalCount ?? allItems.length;

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return allItems;
        return allItems.filter((row) =>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [allItems, search]);

    // ⭐ Apply client pagination AFTER search
    const paginated = filtered.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const rowsToRender = paginated;

    const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;

    // ==========================================================
    //                          DELETE
    // ==========================================================
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteAirInboundProvisional(id),
        onSuccess: () => {
            alert("Provisional Entry Deleted");
            queryClient.invalidateQueries([
                "airInboundProvisionals",
                jobNo,
                hawb,
            ]);
        },
    });

    const handleDelete = (id) => {
        if (window.confirm("Are you sure?")) {
            deleteMutation.mutate(id);
        }
    };

    // ==========================================================
    //                  FOOTER TOTALS
    // ==========================================================
    const subtotal = rowsToRender.reduce(
        (sum, r) => sum + Number(r.amountInINR ?? 0),
        0
    );

    const total = rowsToRender.reduce(
        (sum, r) => sum + Number(r.total ?? 0),
        0
    );

    // ==========================================================
    //                     RENDER UI
    // ==========================================================
    return (
        <>
            <div className="container-fluid tw-mt-4">
                <CommonSectionHeader
                    title="House Air Waybill Details"
                    type="houseairwaybill"
                    isCollapsed={masterCollapsed}
                    onToggle={() => setMasterCollapsed(!masterCollapsed)}
                />

                {!masterCollapsed && <CreateHouseAirWay />}

                <CommonSectionHeader
                    title="Provisional Entry (for Customer)"
                    type="provisional"
                    buttonText="Create Provisional Entry"
                    onButtonClick={() =>
                        navigate(
                            "/air-inbound/masterreport/housereport/create-provisional"
                        )
                    }
                    isCollapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                    rightButton2Text="Raise Accounting Entry"
                    rightButton2ModalId="raiseAccountingModal"
                />

                {!collapsed && (
                    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                        {/* SEARCH + PAGE SIZE */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <label className="me-2">Show</label>

                                <select
                                    className="form-select d-inline-block w-auto"
                                    value={entriesPerPage}
                                    onChange={(e) => {
                                        setEntriesPerPage(Number(e.target.value));
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
                                placeholder="Search..."
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
                                        <th>Provisional Date</th>
                                        <th>Status</th>
                                        <th>Account/Service</th>
                                        <th>SAC</th>
                                        <th>Currency</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                        <th>Ex.Rate</th>
                                        <th>Amount in INR</th>
                                        <th>GST %</th>
                                        <th>CGST</th>
                                        <th>SGST</th>
                                        <th>IGST</th>
                                        <th>Total</th>
                                        <th>Edit</th>
                                        <th>Delete</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading && (
                                        <tr>
                                            <td colSpan="16" className="text-center py-3">
                                                Loading...
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading &&
                                        rowsToRender.length === 0 && (
                                            <tr>
                                                <td colSpan="16" className="text-center py-3">
                                                    No records found
                                                </td>
                                            </tr>
                                        )}

                                    {!isLoading &&
                                        rowsToRender.map((row, idx) => (
                                            <tr key={row.id + idx}>
                                                <td>
                                                    {row.provisionalDate
                                                        ? moment(row.provisionalDate).format(
                                                              "YYYY-MM-DD"
                                                          )
                                                        : "-"}
                                                </td>

                                                <td>{row.status ?? "-"}</td>
                                                <td>{row.accountService ?? "-"}</td>
                                                <td>{row.sac ?? "-"}</td>
                                                <td>{row.currency ?? "-"}</td>

                                                <td>{row.qty}</td>
                                                <td>{row.amount.toFixed(2)}</td>
                                                <td>{row.exRate}</td>

                                                <td className="text-success fw-bold">
                                                    {row.amountInINR.toFixed(2)}
                                                </td>

                                                <td>{row.gst}</td>
                                                <td>{row.cgst}</td>
                                                <td>{row.sgst}</td>
                                                <td>{row.igst}</td>

                                                <td>{row.total.toFixed(2)}</td>

                                                {/* EDIT BUTTON */}
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() =>
                                                            navigate(
                                                                "/air-inbound/masterreport/housereport/create-provisional",
                                                                { state: row.__raw }
                                                            )
                                                        }
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </td>

                                                {/* DELETE BUTTON */}
                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(row.id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>

                                {/* FOOTER TOTALS */}
                                <tfoot>
                                    <tr className="fw-bold">
                                        <td colSpan="8" className="text-end">
                                            Subtotal
                                        </td>

                                        <td className="text-success">
                                            {subtotal.toLocaleString()}
                                        </td>

                                        <td colSpan="3" className="text-end">
                                            Total
                                        </td>

                                        <td>{total.toLocaleString()}</td>

                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="d-flex justify-content-between mt-3">
                            <span>
                                Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                                {Math.min(currentPage * entriesPerPage, filtered.length)} of{" "}
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

                {/* All side components */}
                <AccountingEntrCus />
                <AccountingEntryDetailed />
                <ArrivalNotice />
                <AccountingEntryVen />
                <AccountingEntryVendorDetailed />
                <JobCosting />
            </div>

            <RaiseAccountingEntry />
        </>
    );
};

export default ProvisionalEntry;
