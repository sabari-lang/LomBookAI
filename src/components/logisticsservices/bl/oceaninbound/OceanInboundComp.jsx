import React, { useState, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import JobCreationSeaInbound from "./JobCreationSeaInbound";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Pagination from "../../../common/pagination/Pagination";
import { extractItems } from "../../../../utils/extractItems";
import { confirm } from "../../../../utils/confirm";
import {
    deleteOceanInboundJob,
    getOceanInboundJobs,
} from "./oceanInboundApi"; // <-- You will create this API

const OceanInboundComp = () => {
    const navigate = useNavigate();

    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [editData, setEditData] = useState(null);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteOceanInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundJobs"] });
        },
        onSettled: () => setDeletingJobKey(null),
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete Ocean Inbound job ${jobNo}?`);
    if (!confirmed) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    // -------------------------------------------------------------
    // ⭐ FETCH API — SAME PATTERN AS AIR OUTBOUND
    // -------------------------------------------------------------
    const { data: apiData, isLoading, isError } = useQuery({
        queryKey: ["oceanInboundJobs"],
        queryFn: getOceanInboundJobs,
        retry: 1,
        staleTime: 1000 * 60 * 5,
    });

    // -------------------------------------------------------------
    // ⭐ NORMALIZE USING extractItems() — SAME PATTERN
    // -------------------------------------------------------------
    const allItems = extractItems(apiData);

    // -------------------------------------------------------------
    // ⭐ SEARCH FILTER — SAME CLEAN LOGIC
    // -------------------------------------------------------------
    const filteredData = useMemo(() => {
        return (allItems ?? []).filter((row = {}) =>
            Object.values(row ?? {})
                .join(" ")
                .toLowerCase()
                .includes((search ?? "").toLowerCase())
        );
    }, [allItems, search]);

    // -------------------------------------------------------------
    // ⭐ PAGINATION — SAME AS AIR OUTBOUND
    // -------------------------------------------------------------
    const totalPages = Math.ceil((filteredData?.length ?? 0) / (entriesPerPage ?? 10));

    const paginatedData =
        filteredData?.slice?.(
            ((currentPage ?? 1) - 1) * (entriesPerPage ?? 10),
            (currentPage ?? 1) * (entriesPerPage ?? 10)
        ) ?? [];

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="container-fluid mt-3">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center bg-primary text-white px-3 py-2 rounded-top">
                    <h5 className="m-0">Ocean Inbound</h5>

                    <button
                        className="btn btn-success btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#seainCreateJobModal"
                    >
                        <i className="fa fa-plus me-1"></i> Create Job
                    </button>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">

                    {/* SEARCH + ENTRIES */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Show</label>

                            <select
                                className="form-select form-select-sm"
                                style={{ width: "80px" }}
                                value={entriesPerPage ?? 10}
                                onChange={(e) => {
                                    setEntriesPerPage(+e.target.value || 10);
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((n) => (
                                    <option key={n} value={n}>{n}</option>
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
                                value={search ?? ""}
                                placeholder="Search Job No, MBL No"
                                onChange={(e) => {
                                    setSearch(e.target.value ?? "");
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                        <table className="table table-bordered table-striped table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Job No</th>
                                    <th>MBL No</th>
                                    <th>B/L Type</th>
                                    <th>INCOTERMS</th>
                                    <th>Status</th>
                                    <th>Shipper</th>
                                    <th>Consignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading && (
                                    <tr><td colSpan="9" className="text-center">Loading...</td></tr>
                                )}

                                {isError && (
                                    <tr><td colSpan="9" className="text-danger text-center">API Failed</td></tr>
                                )}

                                {!isLoading && paginatedData.length === 0 && (
                                    <tr><td colSpan="9" className="text-center">No Records Found</td></tr>
                                )}

                                {!isLoading &&
                                    paginatedData?.map?.((row = {}, i) => (
                                        <tr key={i}>
                                            <td>{row?.id ?? ""}</td>
                                            <td>{row?.jobNo ?? ""}</td>
                                            <td>{row?.mblNo ?? ""}</td>
                                            <td>{row?.blType ?? ""}</td>
                                            <td>{row?.incoterms ?? row?.shipment ?? ""}</td>

                                            <td>
                                                <span className="badge bg-success">
                                                    {row?.status ?? "Open"}
                                                </span>
                                            </td>

                                            <td>{row?.shipperName ?? ""}</td>
                                            <td>{row?.consigneeName ?? ""}</td>

                                            <td>
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#seainCreateJobModal"
                                                    onClick={() => setEditData(row ?? {})}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        sessionStorage.setItem(
                                                            "masterAirwayData",
                                                            JSON.stringify(row ?? {})
                                                        );
                                                        navigate("/sea-inbound/masterreport");
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
                        <p className="m-0">
                            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(currentPage * entriesPerPage, filteredData?.length ?? 0)} of{" "}
                            {filteredData?.length ?? 0} entries
                        </p>

                        <Pagination
                            currentPage={currentPage ?? 1}
                            totalPages={totalPages ?? 1}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <JobCreationSeaInbound
                editData={editData ?? {}}
                setEditData={setEditData}
            />
        </>
    );
};

export default OceanInboundComp;
