import React, { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

// Note: PEJobCreation will need to be created separately
// import PEJobCreation from "./PEJobCreation";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePEAirInboundJob, getPEAirInboundJobs } from "../../../../../services/personal-effects/airInboundService";

import Pagination from "../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../utils/extractItems";
import { extractPagination } from "../../../../../utils/extractPagination";
import { confirm } from "../../../../../utils/confirm";
import { notifyError } from "../../../../../utils/notifications";

/**
 * Personal Effects Air Inbound Component
 * Uses PE-specific services and query keys (peAirInboundJobs)
 * Navigates to /pe/air-inbound/* routes (not /air-inbound/*)
 */
const PEAirInboundComp = () => {
    const navigate = useNavigate();

    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedBL, setSelectedBL] = useState(null);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deletePEAirInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["peAirInboundJobs"] });
        },
        onSettled: () => {
            setDeletingJobKey(null);
        },
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete Personal Effects Air Inbound job ${jobNo}?`);
        if (!confirmed) {
            return;
        }

        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    // PE-specific query with unique key
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["peAirInboundJobs", currentPage, entriesPerPage],
        queryFn: () =>
            getPEAirInboundJobs({
                page: currentPage,
                pageSize: entriesPerPage,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    const allItems = extractItems(apiRaw) ?? [];
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } =
        extractPagination(apiRaw);

    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length;

    const safePage =
        totalPages > 0
            ? Math.min(Math.max(1, currentPage), totalPages)
            : 1;

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return allItems;

        return allItems.filter((row = {}) =>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [allItems, search]);

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
                <div className="d-flex justify-content-between align-items-center bg-primary text-white px-3 py-2 rounded-top">
                    <h5 className="m-0">Personal Effects - Air Inbound</h5>

                    <button
                        className="btn btn-success btn-sm"
                        onClick={() => {
                            notifyError("PE Job Creation component needs to be implemented");
                            // setShowJobModal(true);
                        }}
                    >
                        <i className="fa fa-plus me-1"></i>
                        Create Job
                    </button>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">
                    {/* FILTER ROW */}
                    <div className="row mb-3">
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

                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "200px" }}
                                placeholder="Search Job No, MAWB"
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
                        <table className="table table-bordered table-striped table-hover mb-0">
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
                                            <div className="spinner-border me-2 text-primary"></div>
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {/* ERROR */}
                                {isError && (
                                    <tr>
                                        <td colSpan="9" className="text-center text-warning py-4">
                                            ⚠ API Error — No Data
                                        </td>
                                    </tr>
                                )}

                                {/* NO DATA */}
                                {!isLoading &&
                                    !isError &&
                                    rowsToRender.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                                No records found
                                            </td>
                                        </tr>
                                    )}

                                {/* DATA ROWS */}
                                {!isLoading &&
                                    !isError &&
                                    rowsToRender?.map((row = {}) => (
                                        <tr key={row.id ?? Math.random()}>
                                            <td>{row.id ?? "–"}</td>
                                            <td>{row.jobNo ?? "–"}</td>
                                            <td>{row.mawb ?? row.mawbNo ?? "–"}</td>
                                            <td>{row.blType ?? "–"}</td>
                                            <td>{row.shipment ?? "–"}</td>
                                            <td>
                                                <span className="badge bg-success">
                                                    {row.status ?? "–"}
                                                </span>
                                            </td>
                                            <td>{row.shipperName ?? row.shipper ?? "–"}</td>
                                            <td>{row.consigneeName ?? row.consignee ?? "–"}</td>

                                            <td>
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    onClick={() => {
                                                        notifyError("PE Job Edit component needs to be implemented");
                                                        // setSelectedBL(row);
                                                        // setShowJobModal(true);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        sessionStorage.setItem(
                                                            "masterAirwayData",
                                                            JSON.stringify(row)
                                                        );
                                                        // Navigate to PE route, not Commercial
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
            </div>
                                    
            {/* TODO: Implement PE Job Creation Modal */}
            {/* {showJobModal && (
                <PEJobCreation
                    onClose={() => {
                        setShowJobModal(false);
                        setSelectedBL(null);
                    }}
                    editData={selectedBL}
                    setEditData={setSelectedBL}
                />
            )} */}
        </>
    );
};

export default PEAirInboundComp;
