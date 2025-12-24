import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDeposits, deleteDeposit } from "../api/dailyBankStatusApi";
import { notifyError, notifySuccess } from "../../../utils/notifications";
import NewDepositModal from "./NewDepositModal";
import EditDepositModal from "./EditDepositModal";
import { confirm } from "../../../utils/confirm";
import { openModal, cleanupBackdrops } from "../../../utils/modalManager";
import { toUiDDMMYYYY } from "../utils/dateFormat";

const DepositsList = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [selectedDeposit, setSelectedDeposit] = useState(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["dbs-deposits", page, pageSize, search],
        queryFn: () => listDeposits({ page, pageSize, search }),
        keepPreviousData: true,
    });

    useEffect(() => {
        return () => cleanupBackdrops();
    }, []);

    const deposits = data?.data || data?.deposits || [];
    const total = data?.total || data?.totalCount || deposits.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, total);

    const formatDate = (value) => {
        const formatted = toUiDDMMYYYY(value);
        return formatted || "-";
    };

    const openNewModal = () => openModal("newDepositModal");

    const openEditModal = (deposit) => {
        setSelectedDeposit(deposit);
        openModal("editDepositModal");
    };

    const handleDelete = async (deposit) => {
        const confirmed = await confirm("Delete this deposit?", "Delete Deposit");
        if (!confirmed) return;
        try {
            await deleteDeposit(deposit.id || deposit._id);
            notifySuccess("Deleted");
            queryClient.invalidateQueries(["dbs-deposits"]);
        } catch (err) {
            notifyError(err?.message || "Failed to delete");
        } finally {
            cleanupBackdrops();
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">


                <div className="bg-warning text-dark fw-semibold px-3 py-2 d-flex justify-content-between align-items-center">
                    <div className="fw-semibold">Deposit/Refund</div>
                    <button className="btn btn-success btn-sm" onClick={openNewModal}>
                        + New Deposit
                    </button>
                </div>

                <div className="card-body">
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

                    <div className="table-responsive view-table-minh">
                        <table className="table table-bordered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Id</th>
                                    <th>Job No</th>
                                    <th>Consignee Name</th>
                                    <th>Liner</th>
                                    <th>Amount</th>
                                    <th>Mode</th>
                                    <th>Pay Number</th>
                                    <th>Bank Details</th>
                                    <th>Issue Date</th>
                                    <th>Receive Date</th>
                                    <th>Bank credit Date</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4">
                                            <div className="spinner-border text-primary"></div> Loading...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4 text-danger">Error loading data</td>
                                    </tr>
                                ) : deposits.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4">No data available in table</td>
                                    </tr>
                                ) : (
                                    deposits.map((d, idx) => (
                                        <tr key={d.id || d._id || idx}>
                                            <td>{startIndex + idx}</td>
                                            <td>{d.jobNo || "-"}</td>
                                            <td>{d.consigneeName || "-"}</td>
                                            <td>{d.linerName || "-"}</td>
                                            <td className="text-end">
                                                {d.amount ? Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td>{d.modeOfPay || d.mode || "-"}</td>
                                            <td>{d.payNumber || d.refNumber || "-"}</td>
                                            <td>{d.bankDetails || d.bank || "-"}</td>
                                            <td>{formatDate(d.issueDate)}</td>
                                            <td>{formatDate(d.receivedDate || d.receiveDate)}</td>
                                            <td>{formatDate(d.bankCreditDate)}</td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-outline-success btn-sm"
                                                    onClick={() => openEditModal(d)}
                                                    title="Edit"
                                                >
                                                    <i className="fa fa-pen"></i>
                                                </button>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDelete(d)}
                                                    title="Delete"
                                                >
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                        <div className="small text-muted">
                            Showing {startIndex} to {endIndex} of {total} entries
                        </div>
                        <nav>
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
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
                                                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
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

            <NewDepositModal modalId="newDepositModal" onSaved={() => queryClient.invalidateQueries(["dbs-deposits"])} />
            <EditDepositModal
                modalId="editDepositModal"
                deposit={selectedDeposit}
                onUpdated={() => queryClient.invalidateQueries(["dbs-deposits"])}
            />
        </div>
    );
};

export default DepositsList;

