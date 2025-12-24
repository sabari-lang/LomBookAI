// src/modules/currency/CurrencyMaster.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import CommonSectionHeader from "../../../../components/logisticsservices/bl/navbar/CommonSectionHeader";
import NewCurrency from "./NewCurrency";

import { notifySuccess } from "@/utils/notifications";
import { confirm } from "@/utils/confirm";
import { deleteCurrency, getCurrencies } from "../api";

const CurrencyMaster = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    const queryClient = useQueryClient();

    const { data: currencies = [], isLoading, isError, error } = useQuery({
        queryKey: ["currencies"],
        queryFn: getCurrencies,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCurrency,
        onSuccess: () => {
            queryClient.invalidateQueries(["currencies"]);
            notifySuccess("Currency Deleted!");
        },
    });

    const onDelete = async (id) => {
        const ok = await confirm("Delete this currency?");
        if (!ok) return;
        deleteMutation.mutate(id);
    };

    // FILTER
    const filteredData =
        currencies?.filter?.((c = {}) =>
            Object.values(c)
                ?.join(" ")
                ?.toLowerCase()
                ?.includes(search?.toLowerCase?.() ?? "")
        ) ?? [];

    // PAGINATION
    const totalPages = Math.ceil((filteredData.length ?? 0) / entriesPerPage);
    const paginatedData =
        filteredData.slice(
            (currentPage - 1) * entriesPerPage,
            currentPage * entriesPerPage
        );

    const goToPage = (n) => {
        if (n < 1 || n > totalPages) return;
        setCurrentPage(n);
    };

    return (
        <>

            <div className="container-fluid p-3">
                <CommonSectionHeader
                    title="Currency Master"
                    buttonText="New Currency"
                    openModalId="newCurrencyModal"
                    type="master"
                />

                {/* BODY CONTAINER */}
                <div className="p-3 border border-top-0 bg-white rounded-bottom">

                    {/* FILTER PANEL */}
                    <div className="row mb-3">
                        <div className="col-md-6 d-flex align-items-center gap-2">
                            <label>Show</label>

                            <select
                                className="form-select form-select-sm"
                                value={entriesPerPage}
                                style={{ width: "80px" }}
                                onChange={(e) => {
                                    setEntriesPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>

                            <label>entries</label>
                        </div>

                        <div className="col-md-6 d-flex justify-content-end align-items-center">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                className="form-control form-control-sm"
                                style={{ width: "220px" }}
                                value={search ?? ""}
                                placeholder="Search..."
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
                            minHeight: "55vh",
                            overflowY: "auto",
                            overflowX: "auto",
                        }}
                    >
                        <table className="table table-bordered table-striped mb-0">
                            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                                <tr>
                                    <th>S.No</th>
                                    <th>Currency Code</th>
                                    <th>Currency Name</th>
                                    <th>Country</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="5" className="text-danger text-center py-3">
                                            {error?.message}
                                        </td>
                                    </tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-3">
                                            No Records Found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row, index) => (
                                        <tr key={row?.id}>
                                            <td>{(currentPage - 1) * entriesPerPage + index + 1}</td>
                                            <td>{row?.currencyCode}</td>
                                            <td>{row?.currencyName}</td>
                                            <td>{row?.country}</td>

                                            <td>
                                                <button
                                                    className="btn btn-success btn-sm me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#newCurrencyModal"
                                                    onClick={() => setEditData(row)}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => onDelete(row?.id)}
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
                            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(currentPage * entriesPerPage, filteredData.length)} of{" "}
                            {filteredData.length} entries
                        </p>

                        <ul className="pagination mb-0">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => goToPage(currentPage - 1)}
                            >
                                <button className="page-link">Previous</button>
                            </li>

                            {Array.from({ length: totalPages })?.map((_, i) => (
                                <li
                                    key={i}
                                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                                    onClick={() => goToPage(i + 1)}
                                >
                                    <button className="page-link">{i + 1}</button>
                                </li>
                            ))}

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
            {/* HEADER */}

            {/* MODAL */}
            <NewCurrency editData={editData} setEditData={setEditData} />
        </>
    );
};

export default CurrencyMaster;
