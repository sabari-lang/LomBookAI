import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faLock, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import AddUserComp from "./AddUserComp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, deleteUser } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { notifySuccess, notifyError, notifyInfo } from "../../utils/notifications";
import { confirm } from "../../utils/confirm";

const UserManagement = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState();

    const queryClient = useQueryClient();
    const { data: users = [], isLoading, isError, error } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
            notifySuccess("User Deleted!");
        },
        onError: (err) => handleProvisionalError(err, "Delete User"),
    });

    const onDelete = async (id) => {
        const confirmed = await confirm("Delete this user?");
    if (!confirmed) return;
        deleteMutation.mutate(id);
    };

    // SAFE FILTER
    const filteredData = users?.filter?.((row = {}) =>
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
            <div className="container-fluid mt-3">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center bg-primary text-white px-3 py-2 rounded-top">
                    <h5 className="m-0">User Management</h5>

                    {/* <button className="btn btn-success btn-sm">
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> Add User
                </button> */}
                    <button
                        className="btn btn-success btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#addUserModal"
                    >
                        + Add User
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
                                placeholder="Search users"
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
                            minHeight: "55vh",
                            overflowY: "auto",
                            overflowX: "auto",
                            position: "relative",
                        }}
                    >
                        <table className="table table-bordered table-striped table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>User Name</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Mobile Number</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Branch</th>
                                    <th>Active</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="10" className="text-center py-3">Loading users...</td></tr>
                                ) : isError ? (
                                    <tr><td colSpan="10" className="text-center text-danger py-3">{error?.message || "Failed to load users"}</td></tr>
                                ) : (paginatedData?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-3">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData?.map?.((row = {}, index) => (
                                        <tr key={row?.id ?? index}>
                                            <td>{row?.id ?? ""}</td>
                                            <td>{row?.userName ?? row?.username ?? ""}</td>
                                            <td>{row?.firstName ?? ""}</td>
                                            <td>{row?.lastName ?? ""}</td>
                                            <td>{row?.mobileNumber ?? row?.MobileNumber ?? row?.mobile ?? ""}</td>
                                            <td>{row?.email ?? ""}</td>
                                            <td>{row?.role ?? ""}</td>
                                            <td>{row?.branch ?? ""}</td>
                                            <td>
                                                <span className={row?.isActive === false ? "badge bg-secondary" : "badge bg-success"}>
                                                    {row?.isActive === false ? "Inactive" : "Active"}
                                                </span>
                                            </td>

                                            <td>
                                                <button className="btn btn-sm btn-success me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#addUserModal"
                                                    onClick={() => setEditData(row)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button className="btn btn-sm btn-danger" onClick={() => onDelete(row?.id)}>
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
                                        className={`page-item ${currentPage === idx + 1 ? "active" : ""
                                            }`}
                                        onClick={() => goToPage(idx + 1)}
                                    >
                                        <button className="page-link">{idx + 1}</button>
                                    </li>
                                ))}

                            <li className="page-item disabled">
                                <button className="page-link">...</button>
                            </li>

                            <li
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""
                                    }`}
                                onClick={() => goToPage(currentPage + 1)}
                            >
                                <button className="page-link">Next</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <AddUserComp editData={editData} setEditData={setEditData} />
        </>
    );
};

export default UserManagement;
