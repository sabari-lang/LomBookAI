import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLscAirOutboundTracking, deleteLscAirOutboundTracking } from "../../../services/lsc/airOutbound/lscAirOutboundTrackingService";
import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";
import { confirm } from "../../../utils/confirm";
import { notifySuccess } from "../../../utils/notifications";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const JobList = ({ onEdit, onAdd }) => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);
    const queryClient = useQueryClient();

    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["lscAirOutboundTracking", currentPage, entriesPerPage, search],
        queryFn: () =>
            getLscAirOutboundTracking({
                page: currentPage,
                pageSize: entriesPerPage,
                search: search || undefined,
            }),
        keepPreviousData: true,
        retry: 1,
    });

    const allItems = extractItems(apiRaw) ?? [];
    const { totalPages: rawTotalPages, totalCount: rawTotalCount } = extractPagination(apiRaw);
    const totalPages = rawTotalPages ?? 1;
    const totalRows = rawTotalCount ?? allItems.length;

    const deleteMutation = useMutation({
        mutationFn: deleteLscAirOutboundTracking,
        onSuccess: () => {
            queryClient.invalidateQueries(["lscAirOutboundTracking"]);
            notifySuccess("Record deleted successfully!");
        },
        onError: (err) => handleProvisionalError(err, "Delete Air Outbound"),
        onSettled: () => {
            setDeletingId(null);
        },
    });

    const handleDelete = async (id) => {
        const confirmed = await confirm("Delete this Air Outbound record?");
        if (!confirmed) return;
        setDeletingId(id);
        deleteMutation.mutate(id);
    };

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
                <h5 className="m-0">Air Outbound</h5>
                <button 
                    className="btn btn-success btn-sm" 
                    data-bs-toggle="modal"
                    data-bs-target="#lscAirOutboundJobModal"
                    onClick={onAdd}
                >
                    <i className="fa fa-plus me-1"></i>
                     Add Air Outbound
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
                            placeholder="Search..."
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
                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                            <tr>
                                <th>ID</th>
                                <th>BL No</th>
                                <th>Shipper Invoice No</th>
                                <th>Flight Name</th>
                                <th>Status</th>
                                <th>Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border me-2 text-primary"></div>
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {isError && (
                                <tr>
                                    <td colSpan="6" className="text-center text-warning py-4">
                                        ⚠ Error loading data
                                    </td>
                                </tr>
                            )}
                            {!isLoading && !isError && rowsToRender.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        No records found
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                !isError &&
                                rowsToRender?.map((row = {}) => (
                                    <tr key={row.id ?? Math.random()}>
                                        <td>{row.id ?? "–"}</td>
                                        <td>{row.blNo ?? "–"}</td>
                                        <td>{row.shipperInvoiceNo ?? "–"}</td>
                                        <td>{row.flightName ?? "–"}</td>
                                        <td>
                                            <span className={`badge ${row.status === "Open" ? "bg-success" : "bg-secondary"}`}>
                                                {row.status ?? "–"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-success me-1"
                                                onClick={() => onEdit(row)}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(row.id)}
                                                disabled={deletingId === row.id}
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

export default JobList;

