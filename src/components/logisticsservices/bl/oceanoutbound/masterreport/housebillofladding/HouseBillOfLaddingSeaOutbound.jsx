import React, { useState, useMemo } from "react";
import { FaEdit, FaEye, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import CommonSectionHeader from "../../../navbar/CommonSectionHeader";
import CreateHouseSeaOutbound from "./CreateHouseSeaOutbound";
import CreateMasterBillOfLaddingOut from "../masterbillofladding/CreateMasterBillOfLaddingOut";
import HouseStatusUpdateSeaOut from "./HouseStatusUpdateSeaOut";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../../utils/handleProvisionalError";
import Pagination from "../../../../../common/pagination/Pagination";

import { extractPagination } from "../../../../../../utils/extractPagination";
import { extractItems } from "../../../../../../utils/extractItems";

import { getOceanOutboundHouses, deleteOceanOutboundHouse, updateOceanOutboundHouseStatus } from "../../oceanOutboundApi";

const HouseBillOfLaddingSeaOutbound = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [masterCollapsed, setMasterCollapsed] = useState(true);
    const [houseCollapsed, setHouseCollapsed] = useState(false);
    const [editData, setEditData] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");

    // Master data from session
    const storedData = JSON.parse(
        sessionStorage.getItem("masterAirwayData") || "{}"
    );

    const jobNo = storedData?.jobNo ?? "";

    // ========== API CALL (Same pattern as Air and Inbound) ==========
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanOutboundHouseList", jobNo, currentPage, entriesPerPage],
        queryFn: () =>
            getOceanOutboundHouses(jobNo, {
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        enabled: !!jobNo,
        keepPreviousData: true,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: ({ jobNo, hblNo }) => deleteOceanOutboundHouse(jobNo, hblNo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanOutboundHouseList", jobNo] });
        },
    });

    // Status update mutation
    const statusUpdateMutation = useMutation({
        mutationFn: ({ jobNo, hblNo, payload }) => updateOceanOutboundHouseStatus(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanOutboundHouseList", jobNo] });
            setEditData(null);
            alert("Status updated successfully!");
            const modalElement = document.getElementById("seaoutboundHouseStatusUpdateModal");
            if (modalElement) {
                const modal = window.bootstrap?.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        },
        onError: (error) => handleProvisionalError(error, "Status Update"),
    });

    const handleDelete = (row) => {
        const hblNo = row.hbl ?? row.hblNo;
        if (!hblNo || !jobNo) {
            alert("Missing jobNo or hblNo information");
            return;
        }
        if (window.confirm(`Are you sure you want to delete house ${hblNo}?`)) {
            deleteMutation.mutate({ jobNo, hblNo });
        }
    };

    const handleStatusUpdate = (formData) => {
        if (!editData) return;
        const hblNo = editData.hbl ?? editData.hblNo;
        if (!hblNo || !jobNo) {
            alert("Missing jobNo or hblNo information");
            return;
        }
        statusUpdateMutation.mutate({ jobNo, hblNo, payload: formData });
    };

    // Extract items safely
    const allItems = extractItems(apiRaw) ?? [];

    // Pagination safely
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } =
        extractPagination(apiRaw);

    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length;

    const safePage =
        totalPages > 0
            ? Math.min(Math.max(1, currentPage), totalPages)
            : 1;

    // SEARCH
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return allItems;
        return allItems.filter((row) =>
            Object.values(row ?? {})
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [allItems, search]);

    // Fallback local pagination
    const paginated = allItems.slice(
        (safePage - 1) * entriesPerPage,
        safePage * entriesPerPage
    );

    const rowsToRender = search ? filtered : paginated;

    const handlePageChange = (page) => {
        if (!page) return;
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="container-fluid tw-mt-4">

                {/* MASTER SECTION */}
                <CommonSectionHeader
                    title="Master Bill of Lading Details"
                    type="master"
                    isCollapsed={masterCollapsed}
                    onToggle={() => setMasterCollapsed(!masterCollapsed)}
                />

                {!masterCollapsed && <CreateMasterBillOfLaddingOut />}

                {/* HOUSE SECTION */}
                <CommonSectionHeader
                    title="House Bill of Lading"
                    type="house"
                    buttonText="Create House"
                    isCollapsed={houseCollapsed}
                    onToggle={() => setHouseCollapsed(!houseCollapsed)}
                    openModalId="seaoutboundCreateHouseModal"
                />

                {!houseCollapsed && (
                    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                        {/* SEARCH ROW */}
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
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* TABLE */}
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped">
                                <thead className="tw-bg-gray-100">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job No</th>
                                        <th>HBL NO</th>
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
                                    {isLoading && (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4">
                                                Loading...
                                            </td>
                                        </tr>
                                    )}

                                    {isError && (
                                        <tr>
                                            <td colSpan="10" className="text-danger text-center py-4">
                                                API Error
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading &&
                                        !isError &&
                                        rowsToRender.length === 0 && (
                                            <tr>
                                                <td colSpan="10" className="text-center py-4">
                                                    No records found
                                                </td>
                                            </tr>
                                        )}

                                    {!isLoading &&
                                        !isError &&
                                        rowsToRender?.map((row = {}) => {
                                            const safeRow = row ?? {};

                                            return (
                                                <tr key={safeRow.id ?? Math.random()}>
                                                    <td>{safeRow.id ?? "–"}</td>
                                                    <td>{safeRow.jobNo ?? "–"}</td>
                                                    <td>{safeRow.hbl ?? safeRow.hblNo ?? "–"}</td>
                                                    <td>{safeRow.blType ?? "–"}</td>
                                                    <td>{safeRow.shipment ?? "–"}</td>
                                                    <td>{safeRow.shipperName ?? safeRow.shipper ?? "–"}</td>
                                                    <td>{safeRow.consigneeName ?? safeRow.consignee ?? "–"}</td>

                                                    <td>
                                                        <button
                                                            className="btn btn-success btn-sm me-1"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#seaoutboundCreateHouseModal"
                                                            onClick={() => setEditData(safeRow)}
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => {
                                                                sessionStorage.setItem(
                                                                    "houseAirwayData",
                                                                    JSON.stringify(safeRow)
                                                                );
                                                                navigate(
                                                                    "/sea-outbound/masterreport/housereport"
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
                                                            data-bs-target="#seaoutboundHouseStatusUpdateModal"
                                                            onClick={() => setEditData(safeRow)}
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

                        {/* PAGINATION */}
                        <div className="d-flex justify-content-between mt-3">
                            <span>
                                Showing {(safePage - 1) * entriesPerPage + 1} to{" "}
                                {Math.min(safePage * entriesPerPage, totalRows)} of{" "}
                                {totalRows} entries
                            </span>

                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            <CreateHouseSeaOutbound editData={editData} setEditData={setEditData} />

            <HouseStatusUpdateSeaOut 
                editData={editData} 
                setEditData={setEditData}
                onSubmitStatus={handleStatusUpdate}
                isLoading={statusUpdateMutation.isPending}
            />
        </>
    );
};

export default HouseBillOfLaddingSeaOutbound;
