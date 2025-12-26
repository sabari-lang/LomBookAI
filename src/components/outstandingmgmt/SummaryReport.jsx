import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { notifyError } from "../../utils/notifications";
import { viewReportUrl } from "./outstandingAPI";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const SummaryReport = () => {
    const [fromMonth, setFromMonth] = useState(null);
    const [toMonth, setToMonth] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleViewReport = () => {
        if (!fromMonth || !toMonth) {
            notifyError("From and To are required");
            return;
        }

        const url = viewReportUrl("/outstanding/summary-report", {
            fromMonth,
            toMonth,
        });

        window.open(url, "_blank");
    };

    const disabled = !fromMonth || !toMonth;

    return (
        <div className="container-fluid p-4">

            {/* === COMMON HEADER SECTION (same pattern as previous pages) === */}
            <CommonSectionHeader
                title="Summary Report"
                type="accounting-detailed"  // Yellow Header (same as screenshot)
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            {!isCollapsed && (
                <div className="card shadow-sm mx-0 mb-4">
                    <div className="card-body">

                        {/* === FILTER ROW (From / To) EXACT LIKE SCREENSHOT === */}
                        <div className="px-3 pt-3">
                            <div className="row g-3">

                                {/* FROM MONTH */}
                                <div className="col-md-3 d-flex flex-column">
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

                                {/* TO MONTH */}
                                <div className="col-md-3 d-flex flex-column">
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

                            {/* === BUTTON EXACT POSITION (Left, below inputs) === */}
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={handleViewReport}
                                    disabled={disabled}
                                    className="
                                        tw-bg-[#0b7285]
                                        hover:tw-bg-[#095c6a]
                                        tw-text-white
                                        tw-px-4 tw-py-2
                                        tw-rounded
                                        tw-font-medium
                                        disabled:tw-opacity-60
                                    "
                                >
                                    View Report
                                </button>
                            </div>
                        </div>

                      

                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryReport;
