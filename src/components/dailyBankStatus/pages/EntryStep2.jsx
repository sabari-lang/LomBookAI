import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBankAccounts, getDailyBankStatus, saveDailyBankStatus } from "../api/dailyBankStatusApi";
import { toApiYYYYMMDD, toUiDDMMYYYY } from "../utils/dateFormat";
import { notifyError, notifySuccess } from "../../../utils/notifications";

const BANK_LIST = [
    { name: "WOORI BANK", accountNumber: "150957000094" },
    { name: "UNION BANK", accountNumber: "510341000000571" },
    { name: "KEB BANK", accountNumber: "8201000890" },
    { name: "RBL BANK -1", accountNumber: "1133455" },
    { name: "RBL BANK -2", accountNumber: "409000898460" },
    { name: "RBL BANK -3", accountNumber: "409000365908" },
    { name: "STANDARD CHARTERED", accountNumber: "4260520720" },
    { name: "SHINHAN BANK", accountNumber: "759000004939" },
];

const EntryStep2 = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get("type") || "INR";
    const dateParam = queryParams.get("date") || toApiYYYYMMDD(new Date());
    const [items, setItems] = useState(BANK_LIST.map((b) => ({ ...b, amount: "" })));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Prefill from backend if available
                const statusResp = await getDailyBankStatus({ type, date: dateParam });
                if (statusResp?.items?.length) {
                    setItems((prev) =>
                        prev.map((p) => {
                            const found = statusResp.items.find(
                                (i) => i.accountNumber === p.accountNumber || i.name === p.name
                            );
                            return found ? { ...p, amount: found.amount || "" } : p;
                        })
                    );
                }
            } catch (err) {
                console.warn("Unable to prefill daily bank status", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [type, dateParam]);

    const handleAmountChange = (idx, value) => {
        setItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], amount: value };
            return next;
        });
    };

    const handleBack = () => {
        navigate(`/daily-bank-status/entry?type=${encodeURIComponent(type)}&date=${dateParam}`);
    };

    const handleSave = async () => {
        for (const item of items) {
            if (!item.amount || Number(item.amount) < 0) {
                notifyError("Amount is required and must be positive");
                return;
            }
        }
        try {
            setLoading(true);
            await saveDailyBankStatus({ type, date: dateParam, items });
            notifySuccess("Daily bank status saved");
        } catch (err) {
            notifyError(err?.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const uiDate = useMemo(() => toUiDDMMYYYY(dateParam), [dateParam]);

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                <div className="d-flex justify-content-end px-3 pt-2 small text-muted">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="#/">Home</a></li>
                            <li className="breadcrumb-item active" aria-current="page">Daily Bank Status Entry</li>
                        </ol>
                    </nav>
                </div>

                <div className="bg-warning text-dark fw-semibold px-3 py-2">
                    <h5 className="m-0">Daily Bank Status Entry</h5>
                </div>

                <div className="card-body">
                    <div className="px-3 pb-2 text-muted small">
                        <div>Type: <strong>{type}</strong></div>
                        <div>Date: <strong>{uiDate}</strong></div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <div className="row fw-semibold text-dark mb-2">
                                <div className="col-12 col-md-4 col-lg-3">Bank/Account Name</div>
                                <div className="col-12 col-md-4 col-lg-4">Account Number</div>
                                <div className="col-12 col-md-4 col-lg-5">Amount</div>
                            </div>

                            {items.map((item, idx) => (
                                <div className="row g-3 align-items-center mb-2" key={item.accountNumber}>
                                    <div className="col-12 col-md-4 col-lg-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.name}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <div className="col-12 col-md-4 col-lg-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.accountNumber}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <div className="col-12 col-md-4 col-lg-5">
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-control"
                                            placeholder="Enter amount..."
                                            value={item.amount}
                                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex justify-content-between px-1 pb-3 pt-3">
                        <button className="btn btn-secondary" onClick={handleBack} disabled={loading}>
                            Back
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryStep2;

