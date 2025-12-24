import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Pagination from "../../../../common/pagination/Pagination";
import { extractItems } from "../../../../../utils/extractItems";
import { confirm } from "../../../../../utils/confirm";
import { deletePEAirOutboundJob, getPEAirOutboundClosedJobs } from "../../../../../services/personal-effects/airOutboundService";

const PEAirOutboundClosedComp = () => {
    const navigate = useNavigate();
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingJobKey, setDeletingJobKey] = useState(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deletePEAirOutboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["peAirOutboundClosedJobs"] });
        },
        onSettled: () => setDeletingJobKey(null),
    });

    const handleDelete = async (row = {}) => {
        const jobNo = row.jobNo;
        if (!jobNo) return;
        const confirmed = await confirm(`Delete Personal Effects Air Outbound job ${jobNo}?`);
        if (!confirmed) return;
        setDeletingJobKey(jobNo);
        deleteMutation.mutate(jobNo);
    };

    const { data: apiData, isLoading, isError } = useQuery({
        queryKey: ["peAirOutboundClosedJobs"],
        queryFn: getPEAirOutboundClosedJobs,
        retry: 1,
        staleTime: 1000 * 60 * 5,
    });

    const allItems = extractItems(apiData);
    const filteredData = useMemo(() => {
        return (allItems ?? []).filter((row = {}) =>
            Object.values(row ?? {})
                .join(" ")
                .toLowerCase()
                .includes((search ?? "").toLowerCase())
        );
    }, [allItems, search]);

    const totalPages = Math.ceil((filteredData?.length ?? 0) / (entriesPerPage ?? 10));
    const paginatedData = filteredData?.slice?.(
        ((currentPage ?? 1) - 1) * (entriesPerPage ?? 10),
        (currentPage ?? 1) * (entriesPerPage ?? 10)
    ) ?? [];

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div className="container-fluid mt-3">
            <div className="d-flex justify-content-between align-items-center bg-secondary text-white px-3 py-2 rounded-top">
                <h5 className="m-0">Personal Effects - Air Outbound (Closed)</h5>
            </div>
            <div className="p-3 border border-top-0 rounded-bottom bg-white">
                <div className="row mb-3">
                    <div className="col-md-6 d-flex align-items-center gap-2">
                        <label>Show</label>
                        <select className="form-select form-select-sm" style={{ width: "80px" }} value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            {[10, 25, 50, 100].map((v) => (<option key={v} value={v}>{v}</option>))}
                        </select>
                        <label>entries</label>
                    </div>
                    <div className="col-md-6 d-flex justify-content-end align-items-center">
                        <label className="fw-bold me-2">Search:</label>
                        <input type="text" className="form-control form-control-sm" style={{ width: "200px" }} placeholder="Search Job No, MAWB" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>
                <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <table className="table table-bordered table-striped table-hover mb-0">
                        <thead className="table-light"><tr><th>ID</th><th>Job No</th><th>MAWB No</th><th>Status</th><th>Shipper</th><th>Consignee</th><th>Actions</th></tr></thead>
                        <tbody>
                            {isLoading && (<tr><td colSpan="7" className="text-center py-4"><div className="spinner-border me-2 text-primary"></div>Loading...</td></tr>)}
                            {isError && (<tr><td colSpan="7" className="text-center text-warning py-4">⚠ API Error — No Data</td></tr>)}
                            {!isLoading && !isError && paginatedData.length === 0 && (<tr><td colSpan="7" className="text-center py-4">No closed records found</td></tr>)}
                            {!isLoading && !isError && paginatedData?.map((row = {}) => (
                                <tr key={row.id ?? Math.random()}>
                                    <td>{row.id ?? "–"}</td>
                                    <td>{row.jobNo ?? "–"}</td>
                                    <td>{row.mawb ?? row.mawbNo ?? "–"}</td>
                                    <td><span className="badge bg-secondary">{row.status ?? "Closed"}</span></td>
                                    <td>{row.shipperName ?? row.shipper ?? "–"}</td>
                                    <td>{row.consigneeName ?? row.consignee ?? "–"}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={() => { sessionStorage.setItem("masterAirwayData", JSON.stringify(row)); navigate("/pe/air-outbound/masterreport"); }}>
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button className="btn btn-sm btn-danger ms-1" disabled={deletingJobKey === row.jobNo && deleteMutation.isLoading} onClick={() => handleDelete(row)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span>Showing {((currentPage ?? 1) - 1) * (entriesPerPage ?? 10) + 1} to {Math.min((currentPage ?? 1) * (entriesPerPage ?? 10), filteredData?.length ?? 0)} of {filteredData?.length ?? 0} entries</span>
                    <Pagination currentPage={currentPage ?? 1} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
            </div>
        </div>
    );
};

export default PEAirOutboundClosedComp;
