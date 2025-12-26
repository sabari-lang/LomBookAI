import React, { useState } from "react";
import { getInvoiceTracking } from "./outstandingAPI";
import { notifyError, notifySuccess } from "../../utils/notifications";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const InvoiceTracking = () => {
    const [invoiceNo, setInvoiceNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState([]);
    const [references, setReferences] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleResult = async () => {
        if (!invoiceNo.trim()) {
            notifyError("Invoice number is required");
            return;
        }

        setLoading(true);
        try {
            const result = await getInvoiceTracking(invoiceNo.trim());
            setInvoiceDetails(result.invoiceDetails || []);
            setReferences(result.references || []);

            if (
                (result.invoiceDetails && result.invoiceDetails.length > 0) ||
                (result.references && result.references.length > 0)
            ) {
                notifySuccess("Data loaded successfully");
            }
        } catch (err) {
            notifyError(err.message || "Failed to load data");
            setInvoiceDetails([]);
            setReferences([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4">

            {/* Header Using Your Common Component */}
            <CommonSectionHeader
                title="Invoice Tracking Report"
                type="master"               // Blue Color (Matches Your Screenshot)
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            {!isCollapsed && (
                <div className="card shadow-sm mx-0 mb-4">

                    <div className="card-body">

                        {/* Invoice Number Input Exact Alignment */}
                        <div className="px-3 pt-3">
                            <div className="row">
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

                            {/* Button placed EXACTLY like screenshot */}
                            <div className="mt-3">
                                <button
                                    className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-700"
                                    onClick={handleResult}
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Result"}
                                </button>
                            </div>
                        </div>

                        {/* TABLE 1 — Invoice Details */}
                        <div className="table-responsive px-3 pb-3 mt-3">
                            <table className="table table-bordered table-sm align-middle mb-0">
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
                                            <td colSpan="14" className="text-center py-3">
                                                <div className="spinner-border text-primary"></div>
                                            </td>
                                        </tr>
                                    ) : invoiceDetails.length === 0 ? (
                                        <tr>
                                            <td colSpan="14" className="text-center py-3">
                                                No data available
                                            </td>
                                        </tr>
                                    ) : (
                                        invoiceDetails.map((row, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
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

                        {/* TABLE 2 — References */}
                        <div className="table-responsive px-3 pb-4">
                            <table className="table table-bordered table-sm align-middle mb-0">
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
                                            <td colSpan="13" className="text-center py-3">
                                                <div className="spinner-border text-primary"></div>
                                            </td>
                                        </tr>
                                    ) : references.length === 0 ? (
                                        <tr>
                                            <td colSpan="13" className="text-center py-3">
                                                No data available
                                            </td>
                                        </tr>
                                    ) : (
                                        references.map((row, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
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
            )}
        </div>
    );
};

export default InvoiceTracking;
