import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

import CommonSectionHeader from "../../bl/navbar/CommonSectionHeader";

import AddServiceCode from "./AddServiceCode";
import { notifySuccess } from "@/utils/notifications";
import { confirm } from "@/utils/confirm";
import { deleteServiceCode, getServiceCodes } from "../api";

const ServiceCode = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    const queryClient = useQueryClient();

    const { data: serviceList = [], isLoading, isError, error } = useQuery({
        queryKey: ["serviceCodes"],
        queryFn: getServiceCodes,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteServiceCode,
        onSuccess: () => {
            queryClient.invalidateQueries(["serviceCodes"]);
            notifySuccess("Service Code Deleted!");
        },
    });

    const onDelete = async (id) => {
        if (await confirm("Delete Service Code?")) {
            deleteMutation.mutate(id);
        }
    };

    const filtered = serviceList.filter((s) =>
        Object.values(s).join(" ").toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / entriesPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    return (
        <>
            <div className="container-fluid p-3">


                <CommonSectionHeader
                    title="Service Code"
                    buttonText="Add Service Code"
                    type="master"
                    openModalId="addServiceCodeModal"
                />

                <div className="p-3 border border-top-0 bg-white rounded-bottom">

                    {/* FILTER BAR */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Show</label>

                            <select
                                className="form-select form-select-sm"
                                style={{ width: "80px" }}
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((n) => (
                                    <option key={n}>{n}</option>
                                ))}
                            </select>

                            <label>entries</label>
                        </div>

                        <div className="col-md-6 d-flex justify-content-end">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Search..."
                                style={{ width: "220px" }}
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
                        style={{
                            minHeight: "60vh",
                            overflowY: "auto",
                            overflowX: "auto",
                            border: "1px solid #dee2e6",
                        }}
                    >
                        <table className="table table-bordered table-striped mb-0">
                            <thead
                                className="table-light"
                                style={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 5,
                                }}
                            >
                                <tr>
                                    <th>S.No</th>
                                    <th>Service Code</th>
                                    <th>Service Name</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-danger py-3">
                                            {error?.message}
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-3">
                                            No Records Found
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{(currentPage - 1) * entriesPerPage + index + 1}</td>
                                            <td>{row.serviceCode}</td>
                                            <td>{row.serviceName}</td>

                                            <td>
                                                <button
                                                    className="btn btn-success btn-sm me-2"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#addServiceCodeModal"
                                                    onClick={() => setEditData(row)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => onDelete(row.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="d-flex justify-content-between mt-2">
                        <p className="m-0">
                            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
                        </p>

                        <ul className="pagination mb-0">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <button className="page-link">Previous</button>
                            </li>

                            {Array.from({ length: totalPages }).map((_, i) => (
                                <li
                                    key={i}
                                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    <button className="page-link">{i + 1}</button>
                                </li>
                            ))}

                            <li
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                <button className="page-link">Next</button>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>


            {/* MODAL */}
            <AddServiceCode editData={editData} setEditData={setEditData} />
        </>
    );
};

export default ServiceCode;
