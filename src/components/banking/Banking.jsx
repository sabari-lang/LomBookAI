import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { getBankingTransactions, deleteBankingTransaction } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { extractItems } from "../../utils/extractItems";
import { extractPagination } from "../../utils/extractPagination";
import EmptyStateMessage from "../common/emptytable/EmptyStateMessage";

const Banking = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selectedRows, setSelectedRows] = useState([]);

    // Fetch banking transactions
    const { data: apiRaw, isLoading } = useQuery({
        queryKey: ["banking-transactions", currentPage, pageSize],
        queryFn: () => getBankingTransactions({ page: currentPage, pageSize }),
        keepPreviousData: true,
        retry: 1,
        onError: (error) => handleProvisionalError(error, "Fetch Banking Transactions"),
    });

    const bankAccounts = extractItems(apiRaw) ?? [];
    const { totalCount } = extractPagination(apiRaw);
    const totalRows = Number.isFinite(totalCount) ? totalCount : bankAccounts.length;

    // Filter state
    const [filterText, setFilterText] = useState("");

    // Mini-dashboard counts
    const totalAccounts = bankAccounts.length;
    const primaryAccounts = bankAccounts.filter((acc) => acc?.primary).length;
    const nonPrimaryAccounts = totalAccounts - primaryAccounts;

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteBankingTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["banking-transactions"]);
            setSelectedRows([]);
        },
        onError: (error) => handleProvisionalError(error, "Delete Bank Account"),
    });

    // Handle delete
    const handleDelete = async () => {
        if (selectedRows.length === 0) {
            alert("Please select bank accounts to delete.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete selected bank accounts?")) return;

        const idsToDelete = selectedRows.map((r) => r?.id || r?._id).filter(Boolean);
        if (idsToDelete.length === 0) return;

        try {
            await Promise.all(idsToDelete.map((id) => deleteMutation.mutateAsync(id)));
        } catch (error) {
            console.error("Failed to delete bank accounts", error);
        }
    };

    // Handle row click for edit
    const handleRowClick = (row) => {
        navigate("/addbank", { state: row });
    };

    // Filter logic
    const filteredBankAccounts = bankAccounts.filter((acc) => {
        const text = filterText.trim().toLowerCase();
        if (!text) return true;
        return (
            (acc?.accountName || "").toLowerCase().includes(text) ||
            (acc?.bankName || "").toLowerCase().includes(text) ||
            (acc?.accountNumber || "").toLowerCase().includes(text) ||
            (acc?.accountType || "").toLowerCase().includes(text)
        );
    });

    // Table columns
    const columns = [
        {
            name: "ACCOUNT NAME",
            selector: (row) => row?.accountName || "—",
            sortable: true,
        },
        {
            name: "BANK NAME",
            selector: (row) => row?.bankName || "—",
            sortable: true,
        },
        {
            name: "ACCOUNT NUMBER",
            selector: (row) => row?.accountNumber || "—",
            sortable: true,
        },
        {
            name: "ACCOUNT TYPE",
            selector: (row) => row?.accountType || "—",
            sortable: true,
        },
        {
            name: "CURRENCY",
            selector: (row) => row?.currency || "—",
            sortable: true,
        },
        {
            name: "PRIMARY",
            selector: (row) => row?.primary ? "Yes" : "No",
            sortable: true,
        },
    ];

    return (
        <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4">
            {/* Hero Section - Keep EXACTLY as is */}
            <div className="bg-white d-flex flex-column justify-content-center align-items-center text-center py-5 my-3 rounded-3 shadow-sm border">
                <div className="p-4" style={{ maxWidth: "500px" }}>
                    {/* Title */}
                    <h4 className="fw-bold mb-3">Stay on top of your money</h4>

                    {/* Description */}
                    <p className="text-muted small mb-4">
                        Connect your bank and credit cards to fetch all your transactions.
                        Create, categorize and match these transactions to those you have in
                        lom Books.
                    </p>

                    {/* Buttons */}
                    <div className="d-flex justify-content-center gap-3 mb-3">
                        <button className="btn btn-primary btn-sm px-3">
                            Connect Bank / Credit Card
                        </button>
                        <button className="btn btn-outline-secondary btn-sm px-3" type="button" onClick={() => {
                            navigate("/addbank")
                        }}>
                            Add Manually
                        </button>
                    </div>

                    {/* Skip link */}
                    {/* <p className="small text-muted mb-4">
                        Don't use banking for your business?{" "}
                        <a href="#" className="text-decoration-none fw-semibold text-warning">
                            Skip
                        </a>
                    </p> */}

                    <hr className="mb-3" />

                    {/* Watch Section */}
                    {/* <div className="d-flex justify-content-center align-items-center">
                        <i className="bi bi-play-circle text-primary me-2"></i>
                        <a
                            href="#"
                            className="text-decoration-none text-primary small fw-semibold"
                        >
                            Watch how to connect your bank account to lom Books
                        </a>
                    </div> */}
                </div>
            </div>

            {/* Bank Accounts List Section - Following Items.jsx pattern */}
            <div
                className="d-flex justify-content-between align-items-center pt-3 pb-2"
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    background: "#f8f9fa",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.10)",
                }}
            >
                <h5 className="fw-semibold mb-0"><i className="bi bi-bank me-2"></i>Bank Accounts</h5>

                <div className="d-flex gap-2">
                    <button
                        className="btn btn-danger btn-sm"
                        disabled={selectedRows.length === 0 || deleteMutation.isLoading}
                        onClick={handleDelete}
                    >
                        <i className="bi bi-trash"></i> Delete
                    </button>

                    {/* Excel Export */}
                    <button
                        className="btn btn-success btn-sm"
                        onClick={() => {}}
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    {/* PDF Export */}
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {}}
                    >
                        <i className="bi bi-printer"></i>
                    </button>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate("/addbank")}
                    >
                        + Add Bank
                    </button>
                </div>
            </div>

            {/* Filter Bar + Mini Dashboard */}
            <div className="bg-white rounded-3 shadow-sm border p-3 my-2">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label text-secondary small fw-semibold">
                            Search Bank Account
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search by account name, bank name, account number, or type"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>

                    <div className="col-md-4">
                        <div className="bg-light border rounded-3 p-3 h-100 shadow-sm">
                            <h6 className="text-muted small fw-semibold mb-1">Total Accounts</h6>
                            <h4 className="fw-bold text-dark mb-1">{totalAccounts}</h4>
                            <div className="small text-muted">
                                Primary: <span className="fw-semibold text-dark">{primaryAccounts}</span> | Others:{" "}
                                <span className="fw-semibold text-dark">{nonPrimaryAccounts}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table - Following Items.jsx pattern */}
            <div
                className="bg-white rounded-3 shadow-sm border overflow-hidden p-3 my-2"
                style={{ minHeight: "60vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredBankAccounts}
                    selectableRows
                    selectableRowsHighlight
                    onSelectedRowsChange={(state) =>
                        setSelectedRows(state.selectedRows)
                    }
                    onRowClicked={handleRowClick}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={pageSize}
                    paginationRowsPerPageOptions={[25, 50, 100]}
                    paginationDefaultPage={currentPage}
                    onChangePage={(newPage) => setCurrentPage(newPage)}
                    onChangeRowsPerPage={(newPerPage) => {
                        setPageSize(newPerPage);
                        setCurrentPage(1);
                    }}
                    fixedHeader
                    fixedHeaderScrollHeight="60vh"
                    highlightOnHover
                    pointerOnHover
                    responsive
                    striped
                    dense
                    persistTableHead
                    progressPending={isLoading}
                    customStyles={{
                        headCells: {
                            style: {
                                fontWeight: "bold",
                                padding: "12px",
                                verticalAlign: "middle",
                            },
                        },
                        cells: {
                            style: {
                                padding: "12px",
                            },
                        },
                        tableWrapper: {
                            style: {
                                minHeight: "60vh",
                            },
                        },
                    }}
                    noDataComponent={<EmptyStateMessage title="Bank Accounts" />}
                />
            </div>
        </div>
    );
};

export default Banking;
