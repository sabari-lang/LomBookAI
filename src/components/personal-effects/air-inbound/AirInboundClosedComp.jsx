import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUbAirInboundJob, getUbAirInboundClosedJobs } from "../../../services/personal-effects/airInbound/peAirInboundApi";
import { useNavigate } from "react-router-dom";
import JobCreation from "./JobCreation";

import Pagination from "../../common/pagination/Pagination";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { confirm } from "../../../utils/confirm";

const AirInboundClosedComp = () => {
    const navigate = useNavigate();

    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedBL, setSelectedBL] = useState(null);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteUbAirInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pe-ub-air-inbound-closed"] });
        },
        onSettled: () => setDeletingJobKey(null),
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete UB Air Inbound job ${jobNo}?`);
    if (!confirmed) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    // ------------------------------------------------------------------
    // ⭐ API CALL — Match EXACT pattern of AirInboundComp.jsx
    // ------------------------------------------------------------------
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["pe-ub-air-inbound-closed", currentPage, entriesPerPage],
        queryFn: () =>
            getUbAirInboundClosedJobs({
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    // ------------------------------------------------------------------
    // ⭐ Extract Items (Safe)
    // ------------------------------------------------------------------
    const allItems = extractItems(apiRaw) ?? [];

    // ------------------------------------------------------------------
    // ⭐ Pagination Extract (Safe)
    // ------------------------------------------------------------------
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } =
        extractPagination(apiRaw);

    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length;

    const safePage =
        totalPages > 0
            ? Math.min(Math.max(1, currentPage), totalPages)
            : 1;

    // ------------------------------------------------------------------
    // ⭐ SEARCH (same logic as AirInboundComp.jsx)
    // ------------------------------------------------------------------
    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return allItems;

        return allItems.filter((row = {}) =>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [search, allItems]);

    // ------------------------------------------------------------------
    // ⭐ PAGINATION (fallback on filtered data)
    // ------------------------------------------------------------------
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
            <div className="container-fluid mt-3">

                {/* Header */}
                <div
                    className="d-flex justify-content-between align-items-center px-3 py-2 rounded-top"
                    style={{ backgroundColor: "#0097A7", color: "white" }}
                >
                    <h5 className="m-0">UB Air Inbound - Closed</h5>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">

                    {/* Filter Section */}
                    <div className="row mb-3">
                        {/* Show entries */}
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Show</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "80px" }}
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <label>entries</label>
                        </div>

                        {/* Search */}
                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "200px" }}
                                placeholder="Search by Job No, MAWB No"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div
                        className="table-responsive"
                        style={{ maxHeight: "60vh", overflowY: "auto" }}
                    >
                        <table className="table table-bordered table-striped table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Job No</th>
                                    <th>MAWB No</th>
                                    <th>B/L Type</th>
                                    <th>INCOTERMS</th>
                                    <th>Status</th>
                                    <th>Shipper</th>
                                    <th>Consignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {/* LOADING */}
                                {isLoading && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4">
                                            <div className="spinner-border text-primary me-2"></div>
                                            Loading Closed Jobs...
                                        </td>
                                    </tr>
                                )}

                                {/* API ERROR */}
                                {isError && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-3 text-warning">
                                            ⚠ API failed — no data loaded
                                        </td>
                                    </tr>
                                )}

                                {/* NO DATA */}
                                {!isLoading &&
                                    !isError &&
                                    rowsToRender.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center py-3">
                                                No matching closed jobs found
                                            </td>
                                        </tr>
                                    )}

                                {/* DATA ROWS */}
                                {!isLoading &&
                                    !isError &&
                                    rowsToRender.map((row = {}) => (
                                        <tr key={row.id ?? Math.random()}>
                                            <td>{row.id ?? "–"}</td>
                                            <td>{row.jobNo ?? "–"}</td>
                                            <td>{row.mawb ?? row.airWayBill ?? "–"}</td>
                                            <td>{row.blType ?? "–"}</td>
                                            <td>{row.incoterms ?? row.shipment ?? "–"}</td>

                                            <td>
                                                <span className="badge bg-success">
                                                    {row.status ?? "–"}
                                                </span>
                                            </td>

                                            <td>{row.shipper ?? row.shipperName ?? "–"}</td>
                                            <td>{row.consignee ?? row.consigneeName ?? "–"}</td>

                                            <td>
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    onClick={() => {
                                                        setSelectedBL(row);
                                                        setShowJobModal(true);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        sessionStorage.setItem(
                                                            "peUbMasterAirwayData",
                                                            JSON.stringify(row)
                                                        );
                                                    navigate("/pe/air-inbound/masterreport");
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-danger ms-1"
                                                    disabled={
                                                        deletingJobKey === row.jobNo &&
                                                        deleteMutation.isLoading
                                                    }
                                                    onClick={() => handleDelete(row)}
                                                    title="Delete job"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <span>
                            Showing {(safePage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(safePage * entriesPerPage, totalRows)} of {totalRows} entries
                        </span>

                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showJobModal && (
                <JobCreation
                    onClose={() => {
                        setShowJobModal(false);
                        setSelectedBL(null);
                    }}
                    editData={selectedBL}
                    setEditData={setSelectedBL}
                />
            )}
        </>
    );
};

export default AirInboundClosedComp;
