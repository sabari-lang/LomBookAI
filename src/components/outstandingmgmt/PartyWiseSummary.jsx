import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { viewReportUrl } from "./outstandingAPI";
import { notifyError } from "../../utils/notifications";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const PartyWiseSummary = () => {
    const [fromMonth, setFromMonth] = useState(null);
    const [toMonth, setToMonth] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleViewReport = () => {
        if (!fromMonth || !toMonth) {
            notifyError("From Month and To Month are required");
            return;
        }

        const url = viewReportUrl("/outstanding/party-wise", {
            fromMonth,
            toMonth,
        });

        window.open(url, "_blank");
    };

    return (
        <div className="container-fluid p-4">

            {/* HEADER */}
            <CommonSectionHeader
                title="Summary Party Wise Report"
                type="accounting-detailed"  // YELLOW HEADER COLOR
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            {/* BODY */}
            {!isCollapsed && (
                <div className="card shadow-sm mx-0 mb-4">

                    <div className="card-body">

                        {/* FILTER ROW EXACT LIKE IMAGE */}
                        <div className="px-3 pt-3">

                            <div className="row">

                                {/* FROM */}
                                <div className="col-md-2">
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

                                {/* TO */}
                                <div className="col-md-2">
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

                            {/* BUTTON EXACT POSITION BELOW INPUTS LEFT SIDE */}
                            <div className="mt-3">
                                <button
                                    className="tw-bg-[#0b7285] tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium hover:tw-bg-[#095c6a]"
                                    onClick={handleViewReport}
                                    disabled={!fromMonth || !toMonth}
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

export default PartyWiseSummary;
