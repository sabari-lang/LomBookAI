import React, { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const LedgerOutstanding = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [partyName, setPartyName] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const partyOptions = useMemo(() => [], []);
  const isActionDisabled = !partyName || !fromDate || !toDate || loading;

  return (
    <div className="container-fluid p-4">
      <div className="card shadow-sm mt-3">
        <CommonSectionHeader
          title="Ledger Outstanding Report"
          type="master"
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((p) => !p)}
        />

        {!isCollapsed && (
          <div className="card-body">
            {/* Filters */}
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Party Name</label>
                <select
                  className="form-select"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                >
                  <option value="">-Select Party-</option>
                  {partyOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">From</label>
                <DatePicker
                  selected={fromDate}
                  onChange={(d) => setFromDate(d)}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                  className="form-control"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">To</label>
                <DatePicker
                  selected={toDate}
                  onChange={(d) => setToDate(d)}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-yyyy"
                  className="form-control"
                />
              </div>
            </div>

            {/* Buttons (NO Bootstrap btn class) */}
            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium disabled:tw-opacity-50"
                disabled={loading}
                onClick={() => {
                  // TODO: connect Result API
                }}
              >
                {loading ? "Loading..." : "Result"}
              </button>

              <button
                type="button"
                className="tw-bg-teal-600 hover:tw-bg-teal-700 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium disabled:tw-opacity-50"
                disabled={isActionDisabled}
                onClick={() => {
                  // TODO: connect View Report
                }}
              >
                View Report
              </button>

              <button
                type="button"
                className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium disabled:tw-opacity-50"
                disabled={isActionDisabled}
                onClick={() => {
                  // TODO: connect Download CSV
                }}
              >
                Download Csv File
              </button>
            </div>

            {/* Table */}
            <div className="table-responsive mt-4">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 70 }}>Sl.No</th>
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
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Loading...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4 text-muted">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{row?.voucherDate || "-"}</td>
                        <td>{row?.voucherNo || "-"}</td>
                        <td>{row?.voucherType || "-"}</td>
                        <td>{row?.jobno || "-"}</td>
                        <td>{row?.masterNo || "-"}</td>
                        <td>{row?.houseNo || "-"}</td>
                        <td>{row?.billAmount || "-"}</td>
                        <td>{row?.receivedAmount || "-"}</td>
                        <td>{row?.pendingAmount || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerOutstanding;
