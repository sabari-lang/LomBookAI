import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getLedgerOutstanding, downloadCsv, viewReportUrl } from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";

const LedgerOutstanding = () => {
    const [partyName, setPartyName] = useState("");
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");

    const handleResult = async () => {
        if (!partyName || !fromDate || !toDate) {
            notifyError("Party Name, From Date, and To Date are required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await getLedgerOutstanding({
                partyName,
                fromDate,
                toDate,
            });
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
        if (!partyName || !fromDate || !toDate) {
            notifyError("Party Name, From Date, and To Date are required");
            return;
        }
        const url = viewReportUrl("/outstanding/ledger", { partyName, fromDate, toDate });
        window.open(url, "_blank");
    };

    const handleDownloadCsv = async () => {
        if (!partyName || !fromDate || !toDate) {
            notifyError("Party Name, From Date, and To Date are required");
            return;
        }
        try {
            const blob = await downloadCsv("/outstanding/ledger", { partyName, fromDate, toDate });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ledger-outstanding-${new Date().toISOString().split("T")[0]}.csv`;
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
                            <li className="breadcrumb-item active" aria-current="page">Ledger Outstanding Report</li>
                        </ol>
                    </nav>
                </div>

                {/* Blue Header Bar */}
                <div className="px-3 py-2 text-white fw-semibold bg-primary">
                    <h5 className="m-0">Ledger Outstanding Report</h5>
                </div>

                <div className="card-body">
                    {/* Filter Row */}
                    <div className="row g-3 px-3 pt-3">
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">Party Name</label>
                            <select
                                className="form-select"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                            >
                                <option value="">-Select Party-</option>
                                {/* TODO: Populate from API */}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-semibold">From</label>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="dd-mm-yyyy"
                                className="form-control"
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>

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
                            disabled={!partyName || !fromDate || !toDate}
                        >
                            View Report
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleDownloadCsv}
                            disabled={!partyName || !fromDate || !toDate}
                        >
                            Download Csv File
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-warning px-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive px-3 pb-3">
                        <table className="table table-bordered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Sl.No</th>
                                    <th>Voucher Date</th>
                                    <th>Voucher No</th>
                                    <th>Voucher Type</th>
                                    <th>Jobno</th>
                                    <th>Master No</th>
                                    <th>House No</th>
                                    <th>Bill Amount</th>
                                    <th>Received Amount</th>
                                    <th>Pending Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4">
                                            <div className="spinner-border text-primary"></div> Loading...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{row.voucherDate || "-"}</td>
                                            <td>{row.voucherNo || "-"}</td>
                                            <td>{row.voucherType || "-"}</td>
                                            <td>{row.jobno || "-"}</td>
                                            <td>{row.masterNo || "-"}</td>
                                            <td>{row.houseNo || "-"}</td>
                                            <td>{row.billAmount || "-"}</td>
                                            <td>{row.receivedAmount || "-"}</td>
                                            <td>{row.pendingAmount || "-"}</td>
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

export default LedgerOutstanding;
