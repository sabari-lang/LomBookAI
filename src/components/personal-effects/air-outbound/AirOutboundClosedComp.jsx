// AirOutboundClosedComp.jsx
import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUbAirOutboundJob, getUbAirOutboundClosedJobs } from "../../../services/personal-effects/airOutbound/peAirOutboundApi";
import { useNavigate } from "react-router-dom";


import JobCreation from "./JobCreation";
import Pagination from "../../common/pagination/Pagination";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { confirm } from "../../../utils/confirm";

const AirOutboundClosedComp = () => {
    const navigate = useNavigate();
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [showJobModal, setShowJobModal] = useState(false);
    const [selectedBL, setSelectedBL] = useState(null);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteUbAirOutboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pe-ub-air-outbound-closed"] });
        },
        onSettled: () => setDeletingJobKey(null),
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete UB Air Outbound job ${jobNo}?`);
    if (!confirmed) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["pe-ub-air-outbound-closed", currentPage, pageSize],
        queryFn: () =>
            getUbAirOutboundClosedJobs({
                page: currentPage,
                pageSize,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    // rows come from apiRaw.data.items (safe)
    const items = useMemo(() => {
        return apiRaw?.data?.items ?? extractItems(apiRaw) ?? [];
    }, [apiRaw]);

    // pagination info from api
    const { totalPages: apiTotalPages, totalCount: apiTotalCount } = extractPagination(apiRaw?.data ?? apiRaw);

    // client-side search on returned page items (you can switch to server search later)
    const filtered = useMemo(() => {
        const s = (search ?? "").toLowerCase().trim();
        if (!s) return items;
        return items.filter((r = {}) =>
            ([
                r.jobNo, r.masterNumber, r.mawbNo, r.shipperName, r.consigneeName
            ].filter(Boolean).join(" ")).toLowerCase().includes(s)
        );
    }, [search, items]);

    // If you want search over entire dataset server-side, add params to queryFn instead.
    // Pagination uses server-provided totals; but we will paginate client-side over filtered items for display
    useEffect(() => setCurrentPage(1), [search, pageSize]);

    // final totals & page calculations
    const totalRows = apiTotalCount ?? filtered.length;
    const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    // if backend returns full page items, use those (filtered will be subset only of page)
    // Here we show filtered (client-side) results from current page's items
    const paginated = filtered.slice(0, filtered.length); // already page-limited by backend
    // show rows (if you want to slice client-side across full dataset, fetch full dataset from server)
    const rowsToRender = paginated;

    const handlePageChange = (page) => {
        if (!page) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="container-fluid mt-3">
                <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-top" style={{ backgroundColor: "#0097A7", color: "white" }}>
                    <h5 className="m-0">UB Air Outbound - Closed</h5>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">
                    {/* Controls */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Page Size</label>
                            <select className="form-select form-select-sm" style={{ width: 120 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input type="text" className="form-control form-control-sm" style={{ width: 260 }} placeholder="Search job, MAWB, shipper..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                    <th>MAWB/HBL</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Shipper</th>
                                    <th>Consignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (<tr><td colSpan={9} className="text-center py-4">Loading...</td></tr>)}
                                {isError && (<tr><td colSpan={9} className="text-center text-warning">Error loading data</td></tr>)}
                                {!isLoading && !isError && rowsToRender.length === 0 && (<tr><td colSpan={9} className="text-center py-3">No closed jobs found.</td></tr>)}

                                {!isLoading && !isError && rowsToRender.map((r) => (
                                    <tr key={r.id ?? r.masterNumber}>
                                        <td>{r.id ?? "—"}</td>
                                        <td>{r.masterNumber ?? "—"}</td>
                                        <td>{r.jobNo ?? "—"}</td>
                                        <td>{r.mawbNo ?? r.hbl ?? "—"}</td>
                                        <td>{r.blType ?? "—"}</td>
                                        <td><span className="badge bg-success">{r.status ?? "Closed"}</span></td>
                                        <td>{r.shipperName ?? "—"}</td>
                                        <td>{r.consigneeName ?? "—"}</td>
                                        <td>
                                            <button className="btn btn-sm btn-success me-1" onClick={() => { setSelectedBL(r); setShowJobModal(true); }}>
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    sessionStorage.setItem("peUbMasterAirwayData", JSON.stringify(r));
                                                    navigate("/pe/air-outbound/masterreport");
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger ms-1"
                                                disabled={
                                                    deletingJobKey === r.jobNo &&
                                                    deleteMutation.isLoading
                                                }
                                                onClick={() => handleDelete(r)}
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

                    {/* Pagination UI uses server totalPages/totalCount */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <span>Showing {(apiTotalCount === 0 ? 0 : ((currentPage - 1) * pageSize + 1))} to {Math.min(currentPage * pageSize, apiTotalCount ?? rowsToRender.length)} of {apiTotalCount ?? rowsToRender.length} entries</span>

                        <Pagination currentPage={currentPage} totalPages={apiTotalPages ?? Math.max(1, Math.ceil((apiTotalCount ?? rowsToRender.length) / pageSize))} onPageChange={handlePageChange} />
                    </div>
                </div>
            </div>

            {showJobModal && <JobCreation onClose={() => { setShowJobModal(false); setSelectedBL(null); }} editData={selectedBL} setEditData={setSelectedBL} />}
        </>
    );
};

export default AirOutboundClosedComp;
