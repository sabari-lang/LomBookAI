import React, { useState } from "react";
import { getInvoiceTracking } from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";

const InvoiceTracking = () => {
    const [invoiceNo, setInvoiceNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState([]);
    const [references, setReferences] = useState([]);
    const [error, setError] = useState("");

    const handleResult = async () => {
        if (!invoiceNo || !invoiceNo.trim()) {
            notifyError("Invoice number is required");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await getInvoiceTracking(invoiceNo.trim());
            setInvoiceDetails(result.invoiceDetails || []);
            setReferences(result.references || []);
            if ((result.invoiceDetails && result.invoiceDetails.length > 0) || 
                (result.references && result.references.length > 0)) {
                notifySuccess("Data loaded successfully");
            }
        } catch (err) {
            setError(err.message || "Failed to load data");
            notifyError(err.message || "Failed to load data");
            setInvoiceDetails([]);
            setReferences([]);
        } finally {
            setLoading(false);
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
                            <li className="breadcrumb-item active" aria-current="page">Invoice Tracking Report</li>
                        </ol>
                    </nav>
                </div>

                {/* Blue Header Bar */}
                <div className="px-3 py-2 text-white fw-semibold bg-primary">
                    <h5 className="m-0">Invoice Tracking Report</h5>
                </div>

                <div className="card-body">
                    {/* Filter Row */}
                    <div className="row g-3 px-3 pt-3">
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">Invoice Number</label>
                            <input
                                type="text"
                                className="form-control"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                placeholder="Enter invoice number"
                            />
                        </div>
                    </div>

                    {/* Buttons Row - Only Result button */}
                    <div className="d-flex gap-2 px-3 pt-2 pb-3">
                        <button
                            className="btn btn-primary"
                            onClick={handleResult}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Result"}
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-warning px-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Invoice Details Table - Always show */}
                    <div className="table-responsive px-3 pb-3 mb-4">
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
                                        <th>Currency</th>
                                        <th>Amount</th>
                                        <th>Ex.Rate</th>
                                        <th>Amount(INR)</th>
                                        <th>Total</th>
                                        <th>Createdby</th>
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="14" className="text-center py-4">
                                                <div className="spinner-border text-primary"></div> Loading...
                                            </td>
                                        </tr>
                                    ) : invoiceDetails.length === 0 ? (
                                        <tr>
                                            <td colSpan="14" className="text-center py-4">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        invoiceDetails.map((row, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{row.voucherDate || "-"}</td>
                                                <td>{row.voucherNo || "-"}</td>
                                                <td>{row.voucherType || "-"}</td>
                                                <td>{row.jobno || "-"}</td>
                                                <td>{row.masterNo || "-"}</td>
                                                <td>{row.houseNo || "-"}</td>
                                                <td>{row.currency || "-"}</td>
                                                <td>{row.amount || "-"}</td>
                                                <td>{row.exRate || "-"}</td>
                                                <td>{row.amountInr || "-"}</td>
                                                <td>{row.total || "-"}</td>
                                                <td>{row.createdby || "-"}</td>
                                                <td>{row.createdDate || "-"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                    </div>

                    {/* References Table - Always show */}
                    <div className="table-responsive px-3 pb-3">
                        <table className="table table-bordered align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sl.No</th>
                                        <th>Refno</th>
                                        <th>Ref Date</th>
                                        <th>Voucher Date</th>
                                        <th>Voucher No</th>
                                        <th>Voucher Type</th>
                                        <th>Jobno</th>
                                        <th>Master No</th>
                                        <th>House No</th>
                                        <th>Currency</th>
                                        <th>Amount</th>
                                        <th>Createdby</th>
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="13" className="text-center py-4">
                                                <div className="spinner-border text-primary"></div> Loading...
                                            </td>
                                        </tr>
                                    ) : references.length === 0 ? (
                                        <tr>
                                            <td colSpan="13" className="text-center py-4">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        references.map((row, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{row.refno || "-"}</td>
                                                <td>{row.refDate || "-"}</td>
                                                <td>{row.voucherDate || "-"}</td>
                                                <td>{row.voucherNo || "-"}</td>
                                                <td>{row.voucherType || "-"}</td>
                                                <td>{row.jobno || "-"}</td>
                                                <td>{row.masterNo || "-"}</td>
                                                <td>{row.houseNo || "-"}</td>
                                                <td>{row.currency || "-"}</td>
                                                <td>{row.amount || "-"}</td>
                                                <td>{row.createdby || "-"}</td>
                                                <td>{row.createdDate || "-"}</td>
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

export default InvoiceTracking;
