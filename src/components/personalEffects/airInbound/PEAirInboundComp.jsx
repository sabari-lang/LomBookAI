import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePEAirInboundJob, getPEAirInboundJobs } from "./api";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { confirm } from "../../../utils/confirm";
import { notifySuccess } from "../../../utils/notifications";

const PEAirInboundComp = () => {
    const navigate = useNavigate();
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deletePEAirInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["peAirInboundJobs"] });
            notifySuccess("Job Deleted!");
        },
        onSettled: () => {
            setDeletingJobKey(null);
        },
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete Personal Effects Air Inbound job ${jobNo}?`);
        if (!confirmed) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

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
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } = extractPagination(apiRaw);
    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length;

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return allItems;
        return allItems.filter((row = {}) =>
            Object.values(row).join(" ").toLowerCase().includes(s)
        );
    }, [allItems, search]);

    const paginated = allItems.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    const rowsToRender = search ? filtered : paginated;

    return (
        <div className="container-fluid mt-3">
            <div className="d-flex justify-content-between align-items-center bg-primary text-white px-3 py-2 rounded-top">
                <h5 className="m-0">Personal Effects Air Inbound</h5>
                <button
                    className="btn btn-success btn-sm"
                    onClick={() => navigate("/pe/air-inbound/create")}
                >
                    <i className="fa fa-plus me-1"></i>
                    Create Job
                </button>
            </div>

            <div className="p-3 border border-top-0 rounded-bottom bg-white">
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

                <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <table className="table table-bordered table-striped table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Job No</th>
                                <th>MAWB No</th>
                                <th>B/L Type</th>
                                <th>Status</th>
                                <th>Shipper</th>
                                <th>Consignee</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        <div className="spinner-border me-2 text-primary"></div>
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {isError && (
                                <tr>
                                    <td colSpan="8" className="text-center text-warning py-4">
                                        ⚠ API Error — No Data
                                    </td>
                                </tr>
                            )}
                            {!isLoading && !isError && rowsToRender.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        No records found
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                !isError &&
                                rowsToRender?.map((row = {}) => (
                                    <tr key={row.id ?? Math.random()}>
                                        <td>{row.id ?? "–"}</td>
                                        <td>{row.jobNo ?? "–"}</td>
                                        <td>{row.mawb ?? row.mawbNo ?? "–"}</td>
                                        <td>{row.blType ?? "–"}</td>
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
                                                onClick={() => navigate(`/pe/air-inbound/${row.jobNo}`)}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(row)}
                                                disabled={deletingJobKey === row.jobNo}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-2">
                    <p className="m-0">
                        Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                        {Math.min(currentPage * entriesPerPage, totalRows)} of {totalRows} entries
                    </p>
                    <div>
                        <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PEAirInboundComp;

