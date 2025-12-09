import React, { useState, useMemo } from "react";
import { FaEdit, FaEye, FaSyncAlt, FaTrash } from "react-icons/fa";
import CommonSectionHeader from "../../../navbar/CommonSectionHeader";
import CreateHouse from "./CreateHouse";
import { useNavigate } from "react-router-dom";
import HouseStatusUpdate from "./HouseStatusUpdate";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAirInboundHouses, deleteAirInboundHouse, updateAirInboundHouseStatus } from "../../Api";
import { handleProvisionalError } from "../../../../../../utils/handleProvisionalError";
import CreateMasterAirway from "../masterairwaybill/CreateMasterAirway";





// ⭐ Reusable Pagination Extractor
import Pagination from "../../../../../common/pagination/Pagination";
import { extractPagination } from "../../../../../../utils/extractPagination";
import { extractItems } from "../../../../../../utils/extractItems";

const HouseAirwaybill = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [masterCollapsed, setMasterCollapsed] = useState(true);
    const [houseCollapsed, setHouseCollapsed] = useState(false);
    const [editData, setEditData] = useState(null);

    // Ocean naming
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const storedData = JSON.parse(sessionStorage.getItem("masterAirwayData"));
    const jobNo = storedData?.jobNo;

    // ⭐ API CALL WITH backend pagination
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["airInboundHouseList", jobNo, currentPage, entriesPerPage],
        queryFn: () =>
            getAirInboundHouses(jobNo, {
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        enabled: !!jobNo,
        keepPreviousData: true,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: ({ jobNo, hawb }) => deleteAirInboundHouse(jobNo, hawb),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["airInboundHouseList", jobNo] });
        },
    });

    const handleDelete = (row) => {
        const hawb = row.hawb ?? row.hawbNo ?? row.houseNumber;
        if (!hawb) {
            alert("House number not found");
            return;
        }
        if (window.confirm(`Are you sure you want to delete house ${hawb}?`)) {
            deleteMutation.mutate({ jobNo, hawb });
        }
    };

    // Status update mutation
    const statusUpdateMutation = useMutation({
        mutationFn: ({ jobNo, hawb, payload }) => updateAirInboundHouseStatus(jobNo, hawb, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["airInboundHouseList", jobNo] });
            setEditData(null);
            alert("Status updated successfully!");
            // Close modal
            const modalElement = document.getElementById("airinboundHouseStatusUpdateModal");
            if (modalElement) {
                const modal = window.bootstrap?.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        },
        onError: (error) => handleProvisionalError(error, "Status Update"),
    });

    const handleStatusUpdate = (formData) => {
        if (!editData) return;
        const hawb = editData.hawb ?? editData.hawbNo ?? editData.houseNumber;
        if (!hawb) {
            alert("House number not found");
            return;
        }
        statusUpdateMutation.mutate({ jobNo, hawb, payload: formData });
    };

    // ⭐ Normalize items (Ocean style)
    const allItems = extractItems(apiRaw);

    // ⭐ Extract reusable pagination data
    const { totalPages, totalCount } = extractPagination(apiRaw);

    const totalRows = totalCount ?? allItems.length;

    // ⭐ SEARCH (Ocean-style)
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return allItems ?? [];
        return (allItems ?? []).filter((row = {}) =>
            Object.values(row).join(" ").toLowerCase().includes(s)
        );
    }, [allItems, search]);

    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    // ⭐ Fallback for API that returns more items than page-size
    const paginated = (allItems ?? []).slice(
        (safePage - 1) * entriesPerPage,
        safePage * entriesPerPage
    );

    const rowsToRender = search ? filtered : paginated;

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="container-fluid tw-mt-4">

                <CommonSectionHeader
                    title="Master Air Waybill"
                    type="master"
                    isCollapsed={masterCollapsed}
                    onToggle={() => setMasterCollapsed(!masterCollapsed)}
                />

                {!masterCollapsed && <CreateMasterAirway />}

                <CommonSectionHeader
                    title="House Air Waybill List"
                    type="house"
                    isCollapsed={houseCollapsed}
                    onToggle={() => setHouseCollapsed(!houseCollapsed)}
                    openModalId="airoinboundCreateHouseModal"
                    buttonText="Create House"
                />

                {!houseCollapsed && (
                    <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                        {/* TOP BAR */}
                        <div className="d-flex justify-content-between mb-3">
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
                                    <option value={100}>100</option>
                                </select>
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
                            <table className="table table-bordered">
                                <thead className="tw-bg-gray-100">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job No</th>
                                        <th>House No</th>
                                        <th>B/L Type</th>
                                        <th>Status</th>
                                        <th>Shipper</th>
                                        <th>Consignee</th>
                                        <th>Edit/View</th>
                                        <th>Status Update</th>
                                        <th>Delete</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading && (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4">Loading...</td>
                                        </tr>
                                    )}

                                    {isError && (
                                        <tr>
                                            <td colSpan="10" className="text-danger text-center py-4">
                                                API Failed
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && rowsToRender.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4">
                                                No records found
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading &&
                                        rowsToRender.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.id}</td>
                                                <td>{row.jobNo}</td>
                                                <td>{row.hawb ?? row.hawbNo ?? row.houseNumber}</td>
                                                <td>{row.blType}</td>
                                                <td>{row.status}</td>
                                                <td>{row.shipperName ?? row.shipper}</td>
                                                <td>{row.consigneeName ?? row.consignee}</td>

                                                <td>
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#airoinboundCreateHouseModal"
                                                        onClick={() => setEditData(row)}
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => {
                                                            sessionStorage.setItem(
                                                                "houseAirwayData",
                                                                JSON.stringify(row)
                                                            );
                                                            navigate(
                                                                "/air-inbound/masterreport/housereport"
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
                                                        data-bs-target="#airinboundHouseStatusUpdateModal"
                                                        onClick={() => setEditData(row)}
                                                    >
                                                        <FaSyncAlt />
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(row)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION (NOW USING Pagination.jsx) */}
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

            <CreateHouse editData={editData} setEditData={setEditData} />
            <HouseStatusUpdate 
                editData={editData} 
                setEditData={setEditData}
                onSubmitStatus={handleStatusUpdate}
                isLoading={statusUpdateMutation.isPending}
            />
        </>
    );
};

export default HouseAirwaybill;
