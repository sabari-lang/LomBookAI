import React, { useState, useMemo } from "react";
import { FaEdit, FaEye, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import CommonSectionHeader from "../../../../logisticsservices/bl/navbar/CommonSectionHeader";
import CreateHouse from "./CreateHouse";
import CreateMasterAirWayBillOut from "../masterairwaybill/CreateMasterAirWayBillOut";
import HouseStatusUpdateAirOut from "./HouseStatusUpdateAirOut";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../utils/handleProvisionalError";


import Pagination from "../../../../common/pagination/Pagination";
import { extractPagination } from "../../../../../utils/extractPagination";
import { extractItems } from "../../../../../utils/extractItems";
import { getUbAirOutboundHouses, deleteUbAirOutboundHouse, updateUbAirOutboundHouseStatus } from "../../../../../services/personal-effects/airOutbound/peAirOutboundApi";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../utils/notifications";
import { confirm } from "../../../../../utils/confirm";

const HouseAirwayBillOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [masterCollapsed, setMasterCollapsed] = useState(true);
    const [houseCollapsed, setHouseCollapsed] = useState(false);
    const [editData, setEditData] = useState(null);

    // SAFE fallback state values
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");

    // SAFE session lookup
    const storedData = JSON.parse(sessionStorage.getItem("peUbMasterAirwayData") || "{}");
    const jobNo = storedData?.jobNo ?? "";

    // SAFE query with fallbacks
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["peUbAirOutboundHouses", jobNo, currentPage, entriesPerPage],
        queryFn: () =>
            getUbAirOutboundHouses(
                jobNo,
                {
                    page: currentPage,
                    pageSize: entriesPerPage,
                }
            ),
        enabled: !!jobNo,
        keepPreviousData: true,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: ({ jobNo, hawb }) => deleteUbAirOutboundHouse(jobNo, hawb),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["peUbAirOutboundHouses", jobNo] });
        },
    });

    // Status update mutation
    const statusUpdateMutation = useMutation({
        mutationFn: ({ jobNo, hawb, payload }) => updateUbAirOutboundHouseStatus(jobNo, hawb, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["peUbAirOutboundHouses", jobNo] });
            setEditData(null);
            notifySuccess("Status updated successfully!");
            const modalElement = document.getElementById("airoutboundHouseStatusUpdateModal");
            if (modalElement) {
                const modal = window.bootstrap?.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        },
        onError: (error) => handleProvisionalError(error, "Status Update"),
    });

    const handleDelete = async (row) => {
        const hawb = row.hawb ?? row.hawbNo ?? row.houseNumber;
        if (!hawb || !jobNo) {
            notifyError("Missing jobNo or hawb information");
            return;
        }
        const confirmed = await confirm(`Are you sure you want to delete house ${hawb}?`);
        if (confirmed) {
            deleteMutation.mutate({ jobNo, hawb });
        }
    };

    const handleStatusUpdate = (formData) => {
        if (!editData) return;
        const hawb = editData.hawb ?? editData.hawbNo ?? editData.houseNumber;
        if (!hawb || !jobNo) {
            notifyError("Missing jobNo or hawb information");
            return;
        }
        statusUpdateMutation.mutate({ jobNo, hawb, payload: formData });
    };

    // ITEMS (always safe)
    const allItems = extractItems(apiRaw) ?? [];

    // PAGINATION (always safe)
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } =
        extractPagination(apiRaw);

    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length ?? 0;

    // ENSURE safe page
    const safePage =
        totalPages && totalPages > 0
            ? Math.min(Math.max(1, currentPage), totalPages)
            : 1;

    // SEARCH (safe conversion)
    const filtered = useMemo(() => {
        const s = (search ?? "").toLowerCase().trim();
        if (!s) return allItems;

        return allItems.filter((row) =>
            Object.values(row ?? {})
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [allItems, search]);

    // SLICE only for fallback if API returns full list
    const paginated = allItems.slice(
        (safePage - 1) * (entriesPerPage ?? 10),
        safePage * (entriesPerPage ?? 10)
    );

    // FINAL rows to display
    const rowsToRender = search ? filtered ?? [] : paginated ?? [];

    const handlePageChange = (page) => {
        if (!page) return;
        if (page < 1 || page > (totalPages ?? 1)) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="container-fluid tw-mt-4">

                {/* MASTER */}
                <CommonSectionHeader
                    title="Master Air Waybill Details"
                    type="master"
                    isCollapsed={masterCollapsed}
                    onToggle={() => setMasterCollapsed(!masterCollapsed)}
                />

                {!masterCollapsed && <CreateMasterAirWayBillOut />}

                {/* HOUSE */}
                <CommonSectionHeader
                    title="House Air Waybills"
                    type="house"
                    isCollapsed={houseCollapsed}
                    onToggle={() => setHouseCollapsed(!houseCollapsed)}
                    buttonText="Create House"
                    openModalId="airoutboundCreateHouseModal"
                />

                {!houseCollapsed && (
                    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                        {/* Search row */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <label className="me-2">Show</label>

                                <select
                                    className="form-select d-inline-block w-auto"
                                    value={entriesPerPage}
                                    onChange={(e) => {
                                        const value = Number(e.target.value) || 10;
                                        setEntriesPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>

                                <span className="ms-2">entries</span>
                            </div>

                            <input
                                className="form-control w-25"
                                placeholder="Search..."
                                value={search ?? ""}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped">
                                <thead className="tw-bg-gray-100">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job No</th>
                                        <th>HAWB NO</th>
                                        <th>B/L Type</th>
                                        <th>INCOTERMS</th>
                                        <th>Shipper</th>
                                        <th>Consignee</th>
                                        <th>Edit/View</th>
                                        <th>S_Update</th>
                                        <th>Delete</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* Loading */}
                                    {isLoading && (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4">
                                                Loading...
                                            </td>
                                        </tr>
                                    )}

                                    {/* Error */}
                                    {isError && (
                                        <tr>
                                            <td colSpan="10" className="text-danger text-center py-4">
                                                API Error
                                            </td>
                                        </tr>
                                    )}

                                    {/* No results */}
                                    {!isLoading &&
                                        !isError &&
                                        (rowsToRender?.length ?? 0) === 0 && (
                                            <tr>
                                                <td colSpan="10" className="text-center py-4">
                                                    No records found
                                                </td>
                                            </tr>
                                        )}

                                    {/* SAFE rendering */}
                                    {!isLoading &&
                                        !isError &&
                                        rowsToRender?.map((row = {}) => {
                                            const safeRow = row ?? {};

                                            return (
                                                <tr key={safeRow.id ?? Math.random()}>
                                                    <td>{safeRow.id ?? "–"}</td>
                                                    <td>{safeRow.jobNo ?? "–"}</td>
                                                    <td>
                                                        {safeRow.hawb ??
                                                            safeRow.hawbNo ??
                                                            safeRow.houseNumber ??
                                                            "–"}
                                                    </td>
                                                    <td>{safeRow.blType ?? "–"}</td>
                                                    <td>
                                                        {safeRow.incoterms ??
                                                            safeRow.shipment ??
                                                            "–"}
                                                    </td>
                                                    <td>
                                                        {safeRow.shipper ??
                                                            safeRow.shipperName ??
                                                            "–"}
                                                    </td>
                                                    <td>
                                                        {safeRow.consignee ??
                                                            safeRow.consigneeName ??
                                                            "–"}
                                                    </td>

                                                    <td>
                                                        <button
                                                            className="btn btn-success btn-sm me-1"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#airoutboundCreateHouseModal"
                                                            onClick={() =>
                                                                setEditData(safeRow)
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => {
                                                                sessionStorage.setItem(
                                                                    "peUbHouseAirwayData",
                                                                    JSON.stringify(
                                                                        safeRow
                                                                    )
                                                                );
                                                                navigate(
                                                                    "/pe/air-outbound/masterreport/housereport"
                                                                );
                                                            }}
                                                        >
                                                            <FaEye />
                                                        </button>
                                                    </td>

                                                    <td>
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#airoutboundHouseStatusUpdateModal"
                                                            onClick={() =>
                                                                setEditData(safeRow)
                                                            }
                                                        >
                                                            <FaSyncAlt />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(safeRow)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            {deleteMutation.isPending ? "..." : "Delete"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="d-flex justify-content-between mt-3">
                            <span>
                                Showing {(safePage - 1) * entriesPerPage + 1} to{" "}
                                {Math.min(
                                    safePage * entriesPerPage,
                                    totalRows ?? 0
                                )}{" "}
                                of {totalRows ?? 0} entries
                            </span>

                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages ?? 1}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            <CreateHouse editData={editData} setEditData={setEditData} />
            <HouseStatusUpdateAirOut 
                editData={editData} 
                setEditData={setEditData}
                onSubmitStatus={handleStatusUpdate}
                isLoading={statusUpdateMutation.isPending}
            />
        </>
    );
};

export default HouseAirwayBillOut;
