import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSACSummary, viewReportUrl } from "./outstandingAPI";
import { notifyError } from "../../utils/notifications";

const SummarySACReport = () => {
    const [fromMonth, setFromMonth] = useState(null);
    const [toMonth, setToMonth] = useState(null);
    const [error, setError] = useState("");

    const handleViewReport = () => {
        if (!fromMonth || !toMonth) {
            notifyError("From Month and To Month are required");
            return;
        }
        const url = viewReportUrl("/outstanding/sac-summary", { fromMonth, toMonth });
        window.open(url, "_blank");
    };

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                {/* Breadcrumb - Top Right */}
                <div className="d-flex justify-content-end px-3 pt-2 small text-muted">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="#/">Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Summary SAC Report</li>
                        </ol>
                    </nav>
                </div>

                {/* Yellow Header Bar */}
                <div className="px-3 py-2 fw-semibold bg-warning text-dark">
                    <h5 className="m-0">Summary SAC Report</h5>
                </div>

                <div className="card-body">
                    {/* Filter Row */}
                    <div className="row g-3 px-3 pt-3">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">From</label>
                            <DatePicker
                                selected={fromMonth}
                                onChange={(date) => setFromMonth(date)}
                                dateFormat="MMMM, yyyy"
                                showMonthYearPicker
                                placeholderText="December, 2025"
                                className="form-control"
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label fw-semibold">To</label>
                            <DatePicker
                                selected={toMonth}
                                onChange={(date) => setToMonth(date)}
                                dateFormat="MMMM, yyyy"
                                showMonthYearPicker
                                placeholderText="December, 2025"
                                className="form-control"
                            />
                        </div>
                    </div>

                    {/* Buttons Row - Only View Report */}
                    <div className="d-flex gap-2 px-3 pt-2 pb-3">
                        <button
                            className="btn btn-info text-white"
                            onClick={handleViewReport}
                            disabled={!fromMonth || !toMonth}
                        >
                            View Report
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-warning px-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Empty Report Area */}
                    <div className="px-3 pb-4">
                        <div className="border rounded bg-white" style={{ minHeight: "300px" }}>
                            {/* Report content will appear here when View Report is clicked */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummarySACReport;
