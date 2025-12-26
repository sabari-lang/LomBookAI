import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import AddValueAddedService from "./AddValueAddedService";
import ViewValueAddedService from "./ViewValueAddedService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getValueAddedServices, deleteValueAddedService } from "./api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";
import { extractItems } from "../../../utils/extractItems";

const ValueAddedService = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);
    const [viewData, setViewData] = useState(null);

    const queryClient = useQueryClient();
    const { data: apiData, isLoading, isError, error } = useQuery({
        queryKey: ["valueAddedServices", currentPage, entriesPerPage, search],
        queryFn: () => getValueAddedServices({
            Page: currentPage,
            PageSize: entriesPerPage,
            Search: search,
        }),
        retry: 1,
        keepPreviousData: true,
    });

    const services = extractItems(apiData) || [];

    const deleteMutation = useMutation({
        mutationFn: deleteValueAddedService,
        onSuccess: () => {
            queryClient.invalidateQueries(["valueAddedServices"]);
            notifySuccess("Value Added Service Deleted!");
        },
        onError: (err) => handleProvisionalError(err, "Delete Value Added Service"),
    });

    const onDelete = async (id) => {
        const confirmed = await confirm("Delete this Value Added Service?");
        if (!confirmed) return;
        deleteMutation.mutate(id);
    };

    // SAFE FILTER
    const filteredData = services?.filter?.((row = {}) =>
        Object.values(row)
            ?.join(" ")
            ?.toLowerCase?.()
            ?.includes(search?.toLowerCase?.() ?? "")
    ) ?? [];

    const totalPages = Math.ceil((filteredData?.length ?? 0) / entriesPerPage);

    const paginatedData =
        filteredData?.slice?.(
            (currentPage - 1) * entriesPerPage,
            currentPage * entriesPerPage
        ) ?? [];

    const goToPage = (num) => {
        if (num < 1 || num > totalPages) return;
        setCurrentPage(num);
    };

    return (
        <>
            <div className="container-fluid p-4">
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center bg-primary text-white px-3 py-2 rounded-top">
                    <h5 className="m-0">Value Added Service</h5>
                    <button
                        className="btn btn-success btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#addValueAddedServiceModal"
                        onClick={() => setEditData(null)}
                    >
                        + Add Value Added Service
                    </button>
                </div>

                <div className="p-3 border border-top-0 rounded-bottom bg-white">
                    {/* FILTERS */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Show</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "80px" }}
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(parseInt(e?.target?.value ?? 10));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((num) => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                            <label>entries</label>
                        </div>

                        {/* SEARCH */}
                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "220px" }}
                                placeholder="Search..."
                                value={search ?? ""}
                                onChange={(e) => {
                                    setSearch(e?.target?.value ?? "");
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* TABLE */}
                    <div
                        className="table-responsive"
                        style={{
                            maxHeight: "60vh",
                            overflowY: "auto",
                            overflowX: "auto",
                            position: "relative",
                        }}
                    >
                        <table className="table table-bordered table-striped table-hover mb-0">
                            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                                <tr>
                                    <th>ID</th>
                                    <th>Job No</th>
                                    <th>Master No</th>
                                    <th>House No</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="7" className="text-center py-3">Loading...</td></tr>
                                ) : isError ? (
                                    <tr><td colSpan="7" className="text-center text-danger py-3">{error?.message || "Failed to load data"}</td></tr>
                                ) : (paginatedData?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-3">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData?.map?.((row = {}, index) => (
                                        <tr key={row?.id ?? index}>
                                            <td>{row?.id ?? ""}</td>
                                            <td>{row?.jobNo ?? ""}</td>
                                            <td>{row?.masterNo ?? ""}</td>
                                            <td>{row?.houseNo ?? ""}</td>
                                            <td>{row?.type ?? ""}</td>
                                            <td>
                                                <span className={`badge ${row?.status === "Open" ? "bg-success" : "bg-secondary"}`}>
                                                    {row?.status ?? "Open"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#addValueAddedServiceModal"
                                                    onClick={() => setEditData(row)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#viewValueAddedServiceModal"
                                                    onClick={() => setViewData(row)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <p className="m-0">
                            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(currentPage * entriesPerPage, filteredData?.length ?? 0)}{" "}
                            of {filteredData?.length ?? 0} entries
                        </p>

                        <ul className="pagination mb-0">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => goToPage(currentPage - 1)}
                            >
                                <button className="page-link">Previous</button>
                            </li>

                            {Array.from({ length: totalPages })
                                ?.slice?.(0, 5)
                                ?.map?.((_, idx) => (
                                    <li
                                        key={idx}
                                        className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}
                                        onClick={() => goToPage(idx + 1)}
                                    >
                                        <button className="page-link">{idx + 1}</button>
                                    </li>
                                ))}

                            {totalPages > 5 && (
                                <li className="page-item disabled">
                                    <button className="page-link">...</button>
                                </li>
                            )}

                            <li
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                                onClick={() => goToPage(currentPage + 1)}
                            >
                                <button className="page-link">Next</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <AddValueAddedService editData={editData} setEditData={setEditData} />
            <ViewValueAddedService viewData={viewData} setViewData={setViewData} />
        </>
    );
};

export default ValueAddedService;

