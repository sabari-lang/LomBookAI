import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getOpeningBalances, downloadCsv, viewReportUrl } from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";

const OpeningBalances = () => {
    const [asOnDate, setAsOnDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState("");

    const handleResult = async () => {
        if (!asOnDate) {
            notifyError("As On Date is required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await getOpeningBalances({ asOnDate });
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
        if (!asOnDate) {
            notifyError("As On Date is required");
            return;
        }
        const url = viewReportUrl("/outstanding/opening-balances", { asOnDate });
        window.open(url, "_blank");
    };

    const handleDownloadCsv = async () => {
        if (!asOnDate) {
            notifyError("As On Date is required");
            return;
        }
        try {
            const blob = await downloadCsv("/outstanding/opening-balances", { asOnDate });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `opening-balances-${new Date().toISOString().split("T")[0]}.csv`;
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
                            <li className="breadcrumb-item active" aria-current="page">Opening Balances</li>
                        </ol>
                    </nav>
                </div>

                {/* Blue Header Bar */}
                <div className="px-3 py-2 text-white fw-semibold bg-primary">
                    <h5 className="m-0">Opening Balances</h5>
                </div>

                <div className="card-body">
                    {/* Filter Row */}
                    <div className="row g-3 px-3 pt-3">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">As On Date</label>
                            <DatePicker
                                selected={asOnDate}
                                onChange={(date) => setAsOnDate(date)}
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
                            disabled={!asOnDate}
                        >
                            View Report
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleDownloadCsv}
                            disabled={!asOnDate}
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
                                    <th>Party Name</th>
                                    <th>Opening Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4">
                                            <div className="spinner-border text-primary"></div> Loading...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{row.partyName || "-"}</td>
                                            <td>{row.openingBalance || "-"}</td>
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

export default OpeningBalances;
