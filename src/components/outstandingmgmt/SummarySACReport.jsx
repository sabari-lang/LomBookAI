import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { viewReportUrl } from "./outstandingAPI";
import { notifyError } from "../../utils/notifications";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const SummarySACReport = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [fromMonth, setFromMonth] = useState(null);
  const [toMonth, setToMonth] = useState(null);

  const handleViewReport = () => {
    if (!fromMonth || !toMonth) {
      notifyError("From and To are required");
      return;
    }

    const url = viewReportUrl("/outstanding/sac-summary", {
      fromMonth,
      toMonth,
    });

    window.open(url, "_blank");
  };

  const disabled = !fromMonth || !toMonth;

  return (
    <div className="container-fluid p-4">

      {/* Yellow Header */}
      <CommonSectionHeader
        title="Summary SAC Report"
        type="accounting-detailed"   // YELLOW HEADER (exact as screenshot)
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((p) => !p)}
      />

      {!isCollapsed && (
        <div className="card shadow-sm mx-0 mb-4">
          <div className="card-body">

            {/* EXACT INPUT ALIGNMENT (From / To) */}
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

              {/* BUTTON — EXACT POSITION (Left, Below Inputs) */}
              <div className="mt-3">
                <button
                  type="button"
                  className="tw-bg-[#0b7285] hover:tw-bg-[#085866] tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium disabled:tw-opacity-60"
                  onClick={handleViewReport}
                  disabled={disabled}
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

export default SummarySACReport;
