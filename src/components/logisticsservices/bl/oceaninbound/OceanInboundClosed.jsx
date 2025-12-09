// OceanInboundClosedComp.jsx
import React, { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";




import Pagination from "../../../common/pagination/Pagination";
import { extractItems } from "../../../../utils/extractItems";
import { extractPagination } from "../../../../utils/extractPagination";
import {
    deleteOceanInboundJob,
    getOceanInboundClosedJobs,
} from "./oceanInboundApi";

const OceanInboundClosedComp = () => {
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteOceanInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundClosed"], exact: false });
        },
        onSettled: () => setDeletingJobKey(null),
    });

    const handleDelete = (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        if (!window.confirm(`Delete Ocean Inbound job ${jobNo}?`)) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    // ------------------------------------------------------------------
    // API QUERY — Server Pagination
    // ------------------------------------------------------------------
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanInboundClosed", currentPage, pageSize],
        queryFn: () =>
            getOceanInboundClosedJobs({
                Page: currentPage,
                PageSize: pageSize,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    // ------------------------------------------------------------------
    // Extract items from API (data.items)
    // ------------------------------------------------------------------
    const items = useMemo(() => {
        return apiRaw?.data?.items ?? extractItems(apiRaw) ?? [];
    }, [apiRaw]);

    // ------------------------------------------------------------------
    // Extract pagination info
    // ------------------------------------------------------------------
    const { totalPages, totalCount } = extractPagination(apiRaw?.data ?? apiRaw);

    // ------------------------------------------------------------------
    // Search (client-side on returned page)
    // ------------------------------------------------------------------
    const filtered = useMemo(() => {
        const s = (search ?? "").toLowerCase().trim();
        if (!s) return items;

        return items.filter((row = {}) =>
            ([
                row.jobNo,
                row.masterNumber,
                row.hblNo,
                row.shipperName,
                row.consigneeName,
            ]
                .filter(Boolean)
                .join(" "))
                .toLowerCase()
                .includes(s)
        );
    }, [items, search]);

    // Reset to first page on search/page size change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    // ------------------------------------------------------------------
    // For this endpoint, backend already returns paginated items.
    // Just display filtered results.
    // ------------------------------------------------------------------
    const rowsToRender = filtered;

    const handlePageChange = (page) => {
        if (!page) return;
        const p = Number(page);
        setCurrentPage(p);
    };

    // ------------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------------
    return (
        <>
            <div className="container-fluid mt-3">

                {/* Header */}
                <div
                    className="d-flex justify-content-between align-items-center px-3 py-2 rounded-top"
                    style={{ backgroundColor: "#0097A7", color: "white" }}
                >
                    <h5 className="m-0">Ocean Inbound - Closed</h5>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">

                    {/* Filters */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Page Size</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "120px" }}
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                {[10, 25, 50, 100].map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search by Job No, HBL, Shipper…"
                                style={{ width: "240px" }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        <table className="table table-bordered table-striped table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Master No</th>
                                    <th>Job No</th>
                                    <th>HBL</th>
                                    <th>Shipment Type</th>
                                    <th>Status</th>
                                    <th>Shipper</th>
                                    <th>Consignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {/* Loading */}
                                {isLoading && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4">
                                            <div className="spinner-border text-primary me-2"></div>
                                            Loading…
                                        </td>
                                    </tr>
                                )}

                                {/* Error */}
                                {isError && (
                                    <tr>
                                        <td colSpan={9} className="text-center text-warning py-3">
                                            Error loading data
                                        </td>
                                    </tr>
                                )}

                                {/* No data */}
                                {!isLoading && !isError && rowsToRender.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-3">
                                            No closed jobs found.
                                        </td>
                                    </tr>
                                )}

                                {/* Rows */}
                                {!isLoading &&
                                    !isError &&
                                    rowsToRender.map((row) => (
                                        <tr key={row.id ?? row.masterNumber}>
                                            <td>{row.id ?? "—"}</td>
                                            <td>{row.masterNumber ?? "—"}</td>
                                            <td>{row.jobNo ?? "—"}</td>
                                            <td>{row.hblNo ?? "—"}</td>
                                            <td>{row.shipment ?? "—"}</td>

                                            <td>
                                                <span className="badge bg-success">
                                                    {row.status ?? "Closed"}
                                                </span>
                                            </td>

                                            <td>{row.shipperName ?? "—"}</td>
                                            <td>{row.consigneeName ?? "—"}</td>

                                            <td>
                                                {/* Edit */}
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    onClick={() => {
                                                        setSelected(row);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                {/* View */}
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        sessionStorage.setItem(
                                                            "masterOceanDataInbound",
                                                            JSON.stringify(row)
                                                        );
                                                        navigate("/ocean-inbound/masterreport");
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

                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <span>
                            Showing {(currentPage - 1) * pageSize + 1} to{" "}
                            {Math.min(currentPage * pageSize, totalCount ?? rowsToRender.length)} of{" "}
                            {totalCount ?? rowsToRender.length} entries
                        </span>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages ?? 1}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

           
            {/* {showModal && (
                <JobCreation
                    onClose={() => {
                        setShowModal(false);
                        setSelected(null);
                    }}
                    editData={selected}
                    setEditData={setSelected}
                />
            )} */}
        </>
    );
};

export default OceanInboundClosedComp;
