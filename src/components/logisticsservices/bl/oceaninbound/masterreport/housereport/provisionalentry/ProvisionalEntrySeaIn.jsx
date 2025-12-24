import React, { useState, useMemo } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import CreateHouseBillOfLadding from "../../masterbillofladding/CreateHouseBillOfLadding";

import RaiseAccountingEntrySeaIn from "./RaiseAccountingEntrySeaIn";
import AccountingVendorSeaIn from "../accountingentryvendor/AccountingVendorSeaIn";
import AccountingCustomerSeaIn from "../accountingentrycus/AccountingCustomerSeaIn";
import AccountingCustomerDetailSeaIn from "../accountingentrycustomerdetail/AccountingCustomerDetailSeaIn";
import AccountingVendorDetailSeaIn from "../accountingentryvendordetail/AccountingVendorDetailSeaIn";
import JobcastingSeaInbound from "../jobcosting/JobcastingSeaInbound";
import ArrivalNoticeSeIn from "../arrivalnotice/ArrivalNoticeSeIn";
import WarehouseEntry from "../warehouse/WarehouseEntry";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";

import Pagination from "../../../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../../utils/notifications";
import { confirm } from "../../../../../../../utils/confirm";
import {
    deleteOceanInboundProvisional,
    getOceanInboundProvisionals,
} from "../../../oceanInboundApi";

const ProvisionalEntrySeaIn = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [masterCollapsed, setMasterCollapsed] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    // Stored Data
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData"));
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData"));

    const jobNo = storedMaster?.jobNo ?? "";
    const hbl =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ??
        "";

    // Fetch Provisional Entries
    const { data: apiRaw, isLoading } = useQuery({
        queryKey: ["oceanInboundProvisionals", jobNo, hbl, currentPage, entriesPerPage],
        queryFn: () =>
            getOceanInboundProvisionals(jobNo, hbl, {
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        enabled: !!jobNo && !!hbl,
        keepPreviousData: true,
        retry: 1,
    });

    // RAW ENTRY MAP (same as Air Inbound)
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

    // NORMALIZE (same as Air Inbound)
    const normalize = (entry = {}) => {
        const items = Array.isArray(entry?.items) ? entry.items : [];

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

    // Pagination (same as inbound)
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

    const rowsToRender = filtered.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;

    // DELETE handler
    const deleteMutation = useMutation({
        mutationFn: () => deleteOceanInboundProvisional(jobNo, hbl),
        onSuccess: () => {
            notifySuccess("Ocean Inbound Provisional Entry Deleted");
            queryClient.invalidateQueries(["oceanInboundProvisionals", jobNo, hbl]);
        },
        onError: (error) => {
            notifyError("Failed to delete provisional entry: " + (error?.message || "Unknown error"));
        },
    });

    const handleDelete = async () => {
        if (!jobNo || !hbl) {
            notifyError("Job No and HBL are required for deletion");
            return;
        }
        const confirmed = await confirm("Are you sure you want to delete all provisional entries for this house?");
        if (confirmed) {
            deleteMutation.mutate();
        }
    };

    // TOTALS
    const subtotal = rowsToRender.reduce(
        (sum, r) => sum + Number(r.amountInINR ?? 0),
        0
    );

    const total = rowsToRender.reduce(
        (sum, r) => sum + Number(r.total ?? 0),
        0
    );

    return (
        <>
            <div className="container-fluid tw-mt-4">
                <CommonSectionHeader
                    title="Master Bill of Lading Details"
                    type="houseairwaybill"
                    isCollapsed={masterCollapsed}
                    onToggle={() => setMasterCollapsed(!masterCollapsed)}
                />

                {!masterCollapsed && <CreateHouseBillOfLadding />}

                <CommonSectionHeader
                    title="Provisional Entry (for Customer)"
                    type="provisional"
                    buttonText="Create Provisional Entry"
                    onButtonClick={() =>
                        navigate("/sea-inbound/masterreport/housereport/create-provisional")
                    }
                    // newButtonText="(WARE HOUSE)"
                    // newButtonModalId="warehouseEntryModalSeaIn"
                    onNewButtonClick={() => { }}
                    rightButton2Text="Raise Accounting Entry"
                    rightButton2ModalId="SeaInRaiseAccountingModal"
                    isCollapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                />

                {!collapsed && (
                    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">
                        {/* SEARCH AREA */}
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

                        {/* TABLE (UI unchanged) */}
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
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="16" className="text-center py-3">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : rowsToRender.length === 0 ? (
                                        <tr>
                                            <td colSpan="16" className="text-center py-3">
                                                No entries found
                                            </td>
                                        </tr>
                                    ) : (
                                        rowsToRender.map((row, idx) => (
                                            <tr key={row.id + "_" + idx}>
                                                <td>
                                                    {row.provisionalDate
                                                        ? moment(row.provisionalDate).format("YYYY-MM-DD")
                                                        : "-"}
                                                </td>

                                                <td>{row.status}</td>
                                                <td>{row.accountService}</td>
                                                <td>{row.sac}</td>
                                                <td>{row.currency}</td>

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
                                                                "/sea-inbound/masterreport/housereport/create-provisional",
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
                                                        onClick={() => handleDelete()}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>

                                {/* FOOTER TOTALS */}
                                <tfoot>
                                    <tr className="fw-bold">
                                        <td colSpan="8" className="text-end">Subtotal</td>
                                        <td className="text-success">
                                            {subtotal.toLocaleString()}
                                        </td>

                                        <td colSpan="3" className="text-end">Total</td>
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

                {/* MODALS */}
                <AccountingCustomerSeaIn />
                <AccountingCustomerDetailSeaIn />
                <ArrivalNoticeSeIn />
                <AccountingVendorSeaIn />
                <AccountingVendorDetailSeaIn />
                <JobcastingSeaInbound />
            </div>

            <RaiseAccountingEntrySeaIn />
            <WarehouseEntry />
        </>
    );
};

export default ProvisionalEntrySeaIn;
