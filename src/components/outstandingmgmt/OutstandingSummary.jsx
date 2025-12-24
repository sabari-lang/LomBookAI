import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getOutstandingSummary, downloadCsv, viewReportUrl } from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";

const OutstandingSummary = () => {
    const [toDate, setToDate] = useState(null);
    const [customerNature, setCustomerNature] = useState("All");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");

    const handleResult = async () => {
        if (!toDate) {
            notifyError("To Date is required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await getOutstandingSummary({ toDate, customerNature, category });
            setData(result.data || []);
            if (result.data && result.data.length > 0) {
                notifySuccess("Data loaded successfully");
            }
        } catch (err) {
            setError(err.message || "Failed to load data");
            notifyError(err.message || "Failed to load data");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = () => {
        if (!toDate) {
            notifyError("To Date is required");
            return;
        }
        const url = viewReportUrl("/outstanding/summary", { toDate, customerNature, category });
        window.open(url, "_blank");
    };

    const handleDownloadCsv = async () => {
        if (!toDate) {
            notifyError("To Date is required");
            return;
        }
        try {
            const blob = await downloadCsv("/outstanding/summary", { toDate, customerNature, category });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `outstanding-summary-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            notifySuccess("CSV downloaded successfully");
        } catch (err) {
            notifyError(err.message || "Failed to download CSV");
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                {/* Breadcrumb - Top Right */}
                <div className="d-flex justify-content-end px-3 pt-2 small text-muted">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="#/">Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Outstanding Summary</li>
                        </ol>
                    </nav>
                </div>

                {/* Yellow Header Bar */}
                <div className="px-3 py-2 fw-semibold bg-warning text-dark">
                    <h5 className="m-0">Outstanding Summary Report</h5>
                </div>

                <div className="card-body">
                    {/* Filter Row */}
                    <div className="row g-3 px-3 pt-3">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">To</label>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="dd-mm-yyyy"
                                className="form-control"
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Customer Nature</label>
                            <select
                                className="form-select"
                                value={customerNature}
                                onChange={(e) => setCustomerNature(e.target.value)}
                            >
                                <option value="All">All</option>
                                {/* TODO: Populate from API */}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Category</label>
                            <select
                                className="form-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="All">All</option>
                                {/* TODO: Populate from API */}
                            </select>
                        </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="d-flex gap-2 px-3 pt-2 pb-3">
                        <button
                            className="btn btn-primary"
                            onClick={handleResult}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Result"}
                        </button>
                        <button
                            className="btn btn-info text-white"
                            onClick={handleViewReport}
                            disabled={!toDate}
                        >
                            View Report
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleDownloadCsv}
                            disabled={!toDate}
                        >
                            Download Csv File
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-warning px-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Table with Grouped Headers */}
                    <div className="table-responsive px-3 pb-3">
                        <table className="table table-bordered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th rowSpan="2" className="align-middle">Sl.No</th>
                                    <th rowSpan="2" className="align-middle">Party Name</th>
                                    <th rowSpan="2" className="align-middle">Cur</th>
                                    <th colSpan="2" className="text-center">30 Days</th>
                                    <th colSpan="2" className="text-center">45 Days</th>
                                    <th colSpan="2" className="text-center">60 Days</th>
                                    <th colSpan="2" className="text-center">90 Days</th>
                                    <th colSpan="2" className="text-center">&gt; 90 Days</th>
                                    <th rowSpan="2" className="align-middle">Total</th>
                                </tr>
                                <tr>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="14" className="text-center py-4">
                                            <div className="spinner-border text-primary"></div> Loading...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="14" className="text-center py-4">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{row.partyName || "-"}</td>
                                            <td>{row.currency || "-"}</td>
                                            <td>{row.days30Debit || "-"}</td>
                                            <td>{row.days30Credit || "-"}</td>
                                            <td>{row.days45Debit || "-"}</td>
                                            <td>{row.days45Credit || "-"}</td>
                                            <td>{row.days60Debit || "-"}</td>
                                            <td>{row.days60Credit || "-"}</td>
                                            <td>{row.days90Debit || "-"}</td>
                                            <td>{row.days90Credit || "-"}</td>
                                            <td>{row.daysOver90Debit || "-"}</td>
                                            <td>{row.daysOver90Credit || "-"}</td>
                                            <td>{row.total || "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutstandingSummary;
