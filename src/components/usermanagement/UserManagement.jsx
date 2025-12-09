import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faLock, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import AddUserComp from "./AddUserComp";

const UserManagement = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [editData, setEditData] = useState();

    useEffect(() => {
        const temp = [
            { id: 1, username: "admin", mobile: "9876541230", email: "deva.rosewin@gmail.com", city: "Chennai", status: "Active", role: "Account MGR" },
            { id: 6, username: "SHATHISH", mobile: "9361234416", email: "sathishpriya@gmail.com", city: "Chennai", status: "Active", role: "Customer Service Access" },
            { id: 7, username: "UDHAYA KUMAR", mobile: "7338980484", email: "terryjohn646@gmail.com", city: "Chennai", status: "Active", role: "Customer Service Access" },
            { id: 8, username: "P. BARATH KUMAR", mobile: "8939834511", email: "barathbenny93@gmail.com", city: "Chennai", status: "Active", role: "Customer Service Access" },
            { id: 9, username: "M DINESHWARAN", mobile: "9566061515", email: "dine190499@gmail.com", city: "Chennai", status: "Active", role: "Despatch and Data Entry" },
            { id: 10, username: "HEMA0509", mobile: "7299641728", email: "hemakumarbba@gmail.com", city: "Chennai", status: "Active", role: "Account MGR" },
            { id: 12, username: "P NIRMAL KUMAR", mobile: "8778561201", email: "Nirmalkumar@gmail.com", city: "Chennai", status: "Active", role: "Customer Service Access" },
            { id: 13, username: "M SURESH", mobile: "9384026222", email: "seaexp3@lom-logistics.com", city: "Chennai", status: "Active", role: "Account MGR" },
            { id: 15, username: "HOUSEHOLDS1", mobile: "9840181131", email: "households@gmail.com", city: "Chennai", status: "Active", role: "Customer Service Access" },
            { id: 16, username: "MALI", mobile: "9543451775", email: "households@lom-logistics.com", city: "Chennai", status: "Active", role: "Account MGR" },
        ];
        setData(temp);
    }, []);

    // SAFE FILTER
    const filteredData = data?.filter?.((row = {}) =>
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
                            maxHeight: "60vh",
                            overflowY: "auto",
                            overflowX: "auto",
                            position: "relative",
                        }}
                    >
                        <table className="table table-bordered table-striped table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>User ID</th>
                                    <th>UserName</th>
                                    <th>Mobile No</th>
                                    <th>Email ID</th>
                                    <th>City</th>
                                    <th>Status</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {(paginatedData?.length ?? 0) === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-3">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData?.map?.((row = {}, index) => (
                                        <tr key={index}>
                                            <td>{row?.id ?? ""}</td>
                                            <td>{row?.username ?? ""}</td>
                                            <td>{row?.mobile ?? ""}</td>
                                            <td>{row?.email ?? ""}</td>
                                            <td>{row?.city ?? ""}</td>
                                            <td>
                                                <span className="badge bg-success">
                                                    {row?.status ?? ""}
                                                </span>
                                            </td>
                                            <td>{row?.role ?? ""}</td>

                                            <td>
                                                <button className="btn btn-sm btn-success me-1"

                                                    data-bs-toggle="modal"
                                                    data-bs-target="#addUserModal"
                                                    onClick={() => {
                                                        setEditData(row)
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                {/* <button className="btn btn-sm btn-warning me-1">
                                                    <FontAwesomeIcon icon={faLock} />
                                                </button> */}

                                                <button className="btn btn-sm btn-danger">
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
            <AddUserComp />
        </>
    );
};

export default UserManagement;
