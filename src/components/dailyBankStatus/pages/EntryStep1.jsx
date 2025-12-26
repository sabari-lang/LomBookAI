import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { todayUi, toApiYYYYMMDD } from "../utils/dateFormat";
import { notifyError } from "../../../utils/notifications";

const EntryStep1 = () => {
    const navigate = useNavigate();
    const [type, setType] = useState("INR");
    const [date, setDate] = useState(new Date());

    const handleNext = () => {
        if (!type) {
            notifyError("Type is required");
            return;
        }
        if (!date) {
            notifyError("Date is required");
            return;
        }
        const apiDate = toApiYYYYMMDD(date);
        navigate(`/daily-bank-status/entry/accounts?type=${encodeURIComponent(type)}&date=${apiDate}`);
    };

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                <div className="bg-warning text-dark fw-semibold px-3 py-2">
                    <h5 className="m-0">Daily Bank Status Entry</h5>
                </div>

                <div className="card-body">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="d-flex flex-column gap-3 align-items-stretch text-start mt-2">
                                <div className="mb-2">
                                    <label className="form-label fw-semibold">Type</label>
                                    <select
                                        className="form-select"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                        <option value="ODEX">ODEX</option>
                                        <option value="FIXED DEPOSIT">FIXED DEPOSIT</option>
                                        <option value="FD TYPE">FD TYPE</option>
                                        <option value="OD TYPE">OD TYPE</option>
                                        <option value="RECEIVED">RECEIVED</option>
                                        <option value="PAID">PAID</option>
                                    </select>

                                </div>

                                <div className="mb-2">
                                    <label className="form-label fw-semibold">Date</label>
                                    <div className="input-group">
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
                                </div>

                                <div className="d-flex justify-content-center">
                                    <button className="btn btn-primary px-4" onClick={handleNext}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryStep1;

