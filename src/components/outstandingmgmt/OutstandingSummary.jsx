import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    getOutstandingSummary,
    downloadCsv,
    viewReportUrl,
} from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const OutstandingSummary = () => {
    const [toDate, setToDate] = useState(null);
    const [customerNature, setCustomerNature] = useState("All");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleResult = async () => {
        if (!toDate) {
            notifyError("To Date is required");
            return;
        }

        setLoading(true);
        try {
            const result = await getOutstandingSummary({
                toDate,
                customerNature,
                category,
            });

            setData(result?.data || []);

            if (result?.data?.length > 0) notifySuccess("Data loaded successfully");
            else notifySuccess("No data found");
        } catch (err) {
            notifyError(err?.message || "Failed to load data");
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

        const url = viewReportUrl("/outstanding/summary", {
            toDate,
            customerNature,
            category,
        });

        window.open(url, "_blank");
    };

    const handleDownloadCsv = async () => {
        if (!toDate) {
            notifyError("To Date is required");
            return;
        }

        try {
            const blob = await downloadCsv("/outstanding/summary", {
                toDate,
                customerNature,
                category,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `outstanding-summary-${new Date()
                .toISOString()
                .split("T")[0]}.csv`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            notifySuccess("CSV downloaded successfully");
        } catch (err) {
            notifyError(err?.message || "Failed to download CSV");
        }
    };

    return (
        <div className="container-fluid p-4">

            {/* YELLOW HEADER */}
            <CommonSectionHeader
                title="Outstanding Summary Report"
                type="accounting-detailed"   // Yellow Header Color
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            {!isCollapsed && (
                <div className="card shadow-sm mx-0 mb-4">
                    <div className="card-body">

                        {/* FILTER ROW – EXACT LIKE SCREENSHOT */}
                        <div className="px-3 pt-3">
                            <div className="row g-4">

                                {/* TO DATE */}
                                <div className="col-md-3 d-flex flex-column">
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

                                {/* CUSTOMER NATURE */}
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Customer Nature
                                    </label>
                                    <select
                                        className="form-select"
                                        value={customerNature}
                                        onChange={(e) => setCustomerNature(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        <option value="Sundry Debtors India">Sundry Debtors India</option>
                                        <option value="Sundry Creditors India">Sundry Creditors India</option>
                                        <option value="Sundry Debtors Overseas">Sundry Debtors Overseas</option>
                                        <option value="Sundry Creditors Overseas">Sundry Creditors Overseas</option>
                                    </select>
                                </div>

                                {/* CATEGORY */}
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Category</label>
                                    <select
                                        className="form-select"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="All">All</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Personal Effects">Personal Effects</option>
                                        <option value="Value Added">Value Added</option>
                                    </select>
                                </div>

                            </div>

                            {/* BUTTON ROW – EXACT LIKE SCREENSHOT */}
                            <div className="d-flex gap-2 mt-4">

                                {/* Bootstrap Button */}
                                <button
                                    className="btn btn-primary"
                                    onClick={handleResult}
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Result"}
                                </button>

                                {/* Tailwind Button */}
                                <button
                                    className="tw-bg-[#0b7285] tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-[#095c6a]"
                                    onClick={handleViewReport}
                                    disabled={!toDate}
                                >
                                    View Report
                                </button>

                                {/* Bootstrap Button */}
                                <button
                                    className="btn btn-primary"
                                    onClick={handleDownloadCsv}
                                    disabled={!toDate}
                                >
                                    Download Csv File
                                </button>
                            </div>
                        </div>

                        {/* TABLE SECTION */}
                        <div className="table-responsive mt-4 px-3 pb-4">
                            <table className="table table-bordered align-middle mb-0">
                                <thead style={{ background: "#f8f9fa" }}>
                                    {/* GROUP HEADER */}
                                    <tr>
                                        <th rowSpan="2" className="text-center align-middle">SL.No</th>
                                        <th rowSpan="2" className="text-center align-middle">Party Name</th>
                                        <th rowSpan="2" className="text-center align-middle">Cur</th>

                                        <th colSpan="2" className="text-center fw-semibold">30 Days</th>
                                        <th colSpan="2" className="text-center fw-semibold">45 Days</th>
                                        <th colSpan="2" className="text-center fw-semibold">60 Days</th>
                                        <th colSpan="2" className="text-center fw-semibold">90 Days</th>
                                        <th colSpan="2" className="text-center fw-semibold">&gt; 90 Days</th>

                                        <th rowSpan="2" className="text-center align-middle">Total</th>
                                    </tr>

                                    {/* SUBHEADER */}
                                    <tr>
                                        <th className="text-center">Debit</th>
                                        <th className="text-center">Credit</th>

                                        <th className="text-center">Debit</th>
                                        <th className="text-center">Credit</th>

                                        <th className="text-center">Debit</th>
                                        <th className="text-center">Credit</th>

                                        <th className="text-center">Debit</th>
                                        <th className="text-center">Credit</th>

                                        <th className="text-center">Debit</th>
                                        <th className="text-center">Credit</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="14" className="text-center py-4">
                                                <span className="spinner-border spinner-border-sm text-primary me-2" />
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan="14" className="text-center py-4 text-muted">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row, index) => (
                                            <tr key={index}>
                                                <td className="text-center">{index + 1}</td>
                                                <td>{row.partyName}</td>
                                                <td className="text-center">{row.currency}</td>

                                                <td className="text-end">{row.days30Debit}</td>
                                                <td className="text-end">{row.days30Credit}</td>

                                                <td className="text-end">{row.days45Debit}</td>
                                                <td className="text-end">{row.days45Credit}</td>

                                                <td className="text-end">{row.days60Debit}</td>
                                                <td className="text-end">{row.days60Credit}</td>

                                                <td className="text-end">{row.days90Debit}</td>
                                                <td className="text-end">{row.days90Credit}</td>

                                                <td className="text-end">{row.daysOver90Debit}</td>
                                                <td className="text-end">{row.daysOver90Credit}</td>

                                                <td className="text-end fw-semibold">{row.total}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default OutstandingSummary;
