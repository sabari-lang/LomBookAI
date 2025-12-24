import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateStatusReport } from "../api/dailyBankStatusApi";
import { notifyError, notifySuccess } from "../../../utils/notifications";

const StatusReport = () => {
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    const handleResult = async () => {
        if (!date) {
            notifyError("Date is required");
            return;
        }
        try {
            setLoading(true);
            await generateStatusReport({ date });
            notifySuccess("Report generated");
        } catch (err) {
            notifyError(err?.message || "Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                <div className="bg-primary text-white fw-semibold px-3 py-2">
                    <h5 className="m-0">Status Report</h5>
                </div>

                <div className="card-body">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-8 col-lg-5 text-center">
                            <label className="form-label fw-semibold d-block">Date</label>
                            <div className="input-group mb-3 justify-content-center">
                                <DatePicker
                                    selected={date}
                                    onChange={(d) => setDate(d)}
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="dd-mm-yyyy"
                                    className="form-control"
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                                <span className="input-group-text">
                                    <i className="fa fa-calendar"></i>
                                </span>
                            </div>

                            <div className="d-flex justify-content-center">
                                <button
                                    className="btn btn-info text-white px-4"
                                    onClick={handleResult}
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Result"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusReport;

