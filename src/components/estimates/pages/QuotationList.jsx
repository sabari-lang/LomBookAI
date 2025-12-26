import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { listQuotations } from "../api/quotationApi";

const QuotationList = ({ mode = "N" }) => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    const { data, isLoading, error } = useQuery({
        queryKey: ["quotations", mode, page, pageSize, search],
        queryFn: () => listQuotations({ mode, page, pageSize, search }),
        keepPreviousData: true,
    });

    const quotations = data?.data || data?.quotations || [];
    const total = data?.total || data?.totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const sortedQuotations = [...quotations].sort((a, b) => {
        if (!sortColumn) return 0;

        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (sortColumn === "date" || sortColumn === "expiryDate") {
            aVal = aVal ? new Date(aVal).getTime() : 0;
            bVal = bVal ? new Date(bVal).getTime() : 0;
        } else {
            aVal = String(aVal || "").toLowerCase();
            bVal = String(bVal || "").toLowerCase();
        }

        if (sortDirection === "asc") {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, total);

    const handleView = (qid) => {
        navigate(`/estimates/quotation-${mode.toLowerCase()}/${qid}`);
    };

    const handleEdit = (qid) => {
        navigate(`/estimates/quotation-${mode.toLowerCase()}/${qid}?edit=true`);
    };

    const titleText = mode === "N" ? "Quotation New" : "Quotation";
    const headerBgClass = mode === "N" ? "bg-info" : "bg-primary";

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">


                {/* Title Bar - Teal/Blue Background */}
                <div className={`${headerBgClass} text-white fw-semibold rounded-1 px-3 py-2 d-flex justify-content-between align-items-center`}>
                    <div className="fw-semibold">{titleText}</div>
                    <button
                        className="btn btn-success btn-sm"
                        onClick={() => navigate(`/estimates/quotation-${mode.toLowerCase()}/new`)}
                    >
                        + New Quotation
                    </button>
                </div>

                <div className="card-body">
                    {/* Filter/Search Row */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 my-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="small">Show</span>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: "auto" }}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="small">entries</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 small">Search:</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "200px" }}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search..."
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("quoteNo")}
                                    >
                                        Quote No {sortColumn === "quoteNo" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("date")}
                                    >
                                        Date {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("customerName")}
                                    >
                                        Customer Name {sortColumn === "customerName" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("salesPerson")}
                                    >
                                        Sales Person {sortColumn === "salesPerson" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("status")}
                                    >
                                        Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("bound")}
                                    >
                                        Bound {sortColumn === "bound" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSort("expiryDate")}
                                    >
                                        Expiry Date {sortColumn === "expiryDate" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th>View/Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            <div className="spinner-border text-primary"></div> Loading...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-danger">
                                            Error loading quotations
                                        </td>
                                    </tr>
                                ) : sortedQuotations.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    sortedQuotations.map((quotation) => (
                                        <tr key={quotation.id || quotation._id || quotation.qid}>
                                            <td>{quotation.quoteNo || quotation.quotationNo || "-"}</td>
                                            <td>
                                                {quotation.date || quotation.quotationDate
                                                    ? new Date(quotation.date || quotation.quotationDate).toISOString().split("T")[0]
                                                    : "-"}
                                            </td>
                                            <td>{quotation.customerName || "-"}</td>
                                            <td>{quotation.salesPerson || "-"}</td>
                                            <td>{quotation.status || "-"}</td>
                                            <td>{quotation.bound || "-"}</td>
                                            <td>
                                                {quotation.expiryDate
                                                    ? new Date(quotation.expiryDate).toISOString().split("T")[0]
                                                    : "-"}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-info btn-sm text-white"
                                                        onClick={() => handleView(quotation.id || quotation._id || quotation.qid)}
                                                        title="View"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleEdit(quotation.id || quotation._id || quotation.qid)}
                                                        title="Edit"
                                                    >
                                                        <FontAwesomeIcon icon={faPenToSquare} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Info */}
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                        <div className="small text-muted">
                            Showing {startIndex} to {endIndex} of {total} entries
                        </div>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, idx, arr) => (
                                        <React.Fragment key={p}>
                                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                <li className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            )}
                                            <li className={`page-item ${page === p ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setPage(p)}>
                                                    {p}
                                                </button>
                                            </li>
                                        </React.Fragment>
                                    ))}
                                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationList;
