import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


import NewExchangeRate from "./NewExchangeRate";

import { notifySuccess } from "@/utils/notifications";
import { confirm } from "@/utils/confirm";
import { deleteExchangeRate, getExchangeRates } from "../api";
import CommonSectionHeader from "../../bl/navbar/CommonSectionHeader";

const ExchangeRate = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editData, setEditData] = useState(null);

    const queryClient = useQueryClient();

    const { data: exchangeRates = [], isLoading, isError, error } = useQuery({
        queryKey: ["exchangeRates"],
        queryFn: getExchangeRates,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteExchangeRate,
        onSuccess: () => {
            queryClient.invalidateQueries(["exchangeRates"]);
            notifySuccess("Exchange Rate Deleted!");
        },
    });

    const onDelete = async (id) => {
        const ok = await confirm("Delete this exchange rate?");
        if (!ok) return;
        deleteMutation.mutate(id);
    };

    const filteredData =
        exchangeRates?.filter((r) =>
            Object.values(r)
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase())
        ) ?? [];

    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const paginated = filteredData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    return (
        <>
            <div className="container-fluid p-3">
                <CommonSectionHeader
                    title="Daily Exchange Rate"
                    buttonText="New Exchange Rate"
                    openModalId="newExchangeRateModal"
                    type="master"
                />

                <div className="p-3 border border-top-0 bg-white rounded-bottom">

                    {/* FILTER BAR */}
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
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>

                            <label>entries</label>
                        </div>

                        <div className="col-md-6 d-flex justify-content-end">
                            <label className="fw-bold me-2">Search:</label>
                            <input
                                className="form-control form-control-sm"
                                style={{ width: "220px" }}
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* TABLE WITH FIXED HEIGHT */}
                    <div
                    className="table-responsive"
                        style={{
                            minHeight: "55vh",
                            // height: "60vh",
                            overflowY: "auto",
                            overflowX: "auto",
                            border: "1px solid #dee2e6",
                        }}
                    >
                        <table className="table table-bordered table-striped mb-0">
                            <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                                <tr>
                                    <th>S.No</th>
                                    <th>Date</th>
                                    <th>Currency Code</th>
                                    <th>Exchange Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="py-3 text-center">Loading...</td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan="5" className="py-3 text-danger text-center">
                                            {error?.message}
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-3 text-center">No Records Found</td>
                                    </tr>
                                ) : (
                                    paginated.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{(currentPage - 1) * entriesPerPage + index + 1}</td>
                                            <td>{row.date}</td>
                                            <td>{row.currencyCode}</td>
                                            <td>{row.exchangeAmount}</td>

                                            <td>
                                                <button
                                                    className="btn btn-success btn-sm me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#newExchangeRateModal"
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
                            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                            {Math.min(currentPage * entriesPerPage, filteredData.length)} of{" "}
                            {filteredData.length} entries
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
            <NewExchangeRate editData={editData} setEditData={setEditData} />
        </>
    );
};

export default ExchangeRate;
