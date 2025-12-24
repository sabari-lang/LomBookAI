import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { updateDeposit } from "../api/dailyBankStatusApi";
import { notifyError, notifySuccess } from "../../../utils/notifications";
import { toApiYYYYMMDD } from "../utils/dateFormat";
import { closeModal, safeCleanupBackdrop } from "../../../utils/closeModal";

const BANK_OPTIONS = [
    { label: "WOORI BANK", accountNumber: "150957000094" },
    { label: "UNION BANK", accountNumber: "510341000000571" },
    { label: "KEB BANK", accountNumber: "8201000890" },
    { label: "RBL BANK", accountNumber: "1133455" },
    { label: "STANDARD CHARTERED", accountNumber: "4260520720" },
    { label: "SHINHAN BANK", accountNumber: "759000004939" },
];

const MODE_OPTIONS = ["Cheque", "DD", "NEFT", "RTGS", "Cash"];

const emptyForm = {
    jobNo: "",
    consigneeName: "",
    linerName: "",
    modeOfPay: "",
    refNumber: "",
    payNumber: "",
    amount: "",
    bankDetails: "",
    accNo: "",
    issueDate: null,
    receivedDate: null,
    bankCreditDate: null,
    remarks: "",
};

const EditDepositModal = ({ modalId = "editDepositModal", deposit, onUpdated }) => {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!deposit) {
            setForm(emptyForm);
            return;
        }
        setForm({
            ...emptyForm,
            ...deposit,
            amount: deposit.amount ?? "",
            bankDetails: deposit.bankDetails || deposit.bank || "",
            modeOfPay: deposit.modeOfPay || deposit.mode || "",
            accNo: deposit.accNo || "",
            issueDate: deposit.issueDate ? new Date(deposit.issueDate) : null,
            receivedDate: deposit.receivedDate || deposit.receiveDate ? new Date(deposit.receivedDate || deposit.receiveDate) : null,
            bankCreditDate: deposit.bankCreditDate ? new Date(deposit.bankCreditDate) : null,
        });
    }, [deposit]);

    useEffect(() => {
        return () => safeCleanupBackdrop();
    }, []);

    const payload = useMemo(() => {
        return {
            ...form,
            amount: form.amount ? Number(form.amount) : 0,
            issueDate: form.issueDate ? toApiYYYYMMDD(form.issueDate) : null,
            receivedDate: form.receivedDate ? toApiYYYYMMDD(form.receivedDate) : null,
            bankCreditDate: form.bankCreditDate ? toApiYYYYMMDD(form.bankCreditDate) : null,
        };
    }, [form]);

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleBankChange = (value) => {
        const selected = BANK_OPTIONS.find((b) => b.label === value);
        updateField("bankDetails", value);
        updateField("accNo", selected?.accountNumber || "");
    };

    const handleUpdate = async () => {
        if (!deposit?.id && !deposit?._id) {
            notifyError("No deposit selected");
            return;
        }
        if (!form.jobNo) return notifyError("Job No is required");
        if (!form.modeOfPay) return notifyError("Mode of Pay is required");
        if (!form.amount || Number(form.amount) <= 0) return notifyError("Amount is required");

        try {
            setLoading(true);
            await updateDeposit(deposit.id || deposit._id, payload);
            notifySuccess("Deposit updated");
            onUpdated?.();
            closeModal(modalId);
        } catch (err) {
            notifyError(err?.message || "Failed to update deposit");
        } finally {
            setLoading(false);
            safeCleanupBackdrop();
        }
    };

    return (
        <div className="modal fade" id={modalId} tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Deposit</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div className="modal-body">
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Job No</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.jobNo}
                                        onChange={(e) => updateField("jobNo", e.target.value)}
                                        placeholder="Enter job number"
                                    />
                                    <span className="input-group-text bg-transparent">
                                        <i className="fa fa-search text-primary"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Liner Name</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.linerName}
                                        onChange={(e) => updateField("linerName", e.target.value)}
                                        placeholder="Enter liner name"
                                    />
                                    <span className="input-group-text bg-transparent">
                                        <i className="fa fa-search text-primary"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Consignee Name</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.consigneeName}
                                        onChange={(e) => updateField("consigneeName", e.target.value)}
                                        placeholder="Enter consignee name"
                                    />
                                    <span className="input-group-text bg-transparent">
                                        <i className="fa fa-search text-primary"></i>
                                    </span>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Mode of Pay</label>
                                <select
                                    className="form-select"
                                    value={form.modeOfPay}
                                    onChange={(e) => updateField("modeOfPay", e.target.value)}
                                >
                                    <option value="">--select mode--</option>
                                    {MODE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Ref Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.refNumber}
                                    onChange={(e) => updateField("refNumber", e.target.value)}
                                    placeholder="Enter reference number"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Pay Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.payNumber}
                                    onChange={(e) => updateField("payNumber", e.target.value)}
                                    placeholder="Enter pay number"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={form.amount}
                                    onChange={(e) => updateField("amount", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Bank Details</label>
                                <select
                                    className="form-select"
                                    value={form.bankDetails}
                                    onChange={(e) => handleBankChange(e.target.value)}
                                >
                                    <option value="">-Select Bank details-</option>
                                    {BANK_OPTIONS.map((b) => (
                                        <option key={b.label} value={b.label}>{b.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold">Acc No</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.accNo}
                                    readOnly
                                    disabled
                                />
                            </div>

                            <div className="col-12 col-md-4">
                                <label className="form-label fw-semibold">Issue Date</label>
                                <div className="input-group">
                                    <DatePicker
                                        selected={form.issueDate}
                                        onChange={(d) => updateField("issueDate", d)}
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

                            <div className="col-12 col-md-4">
                                <label className="form-label fw-semibold">Received Date</label>
                                <div className="input-group">
                                    <DatePicker
                                        selected={form.receivedDate}
                                        onChange={(d) => updateField("receivedDate", d)}
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

                            <div className="col-12 col-md-4">
                                <label className="form-label fw-semibold">Bank Credit Date</label>
                                <div className="input-group">
                                    <DatePicker
                                        selected={form.bankCreditDate}
                                        onChange={(d) => updateField("bankCreditDate", d)}
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

                            <div className="col-12">
                                <label className="form-label fw-semibold">Remarks</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={form.remarks}
                                    onChange={(e) => updateField("remarks", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer d-flex justify-content-between">
                        <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
                            {loading ? "Updating..." : "Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDepositModal;

