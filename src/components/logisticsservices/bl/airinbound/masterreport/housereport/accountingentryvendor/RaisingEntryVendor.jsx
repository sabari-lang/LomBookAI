import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaSearch } from "react-icons/fa";
import NewWindow from "react-new-window";
import VendorSearch from "../../../../../../common/popup/VendorSearch";
import moment from "moment";
import { useNavigate } from "react-router-dom";

import {
    createAirInboundVendorAccount,
    updateAirInboundVendorAccount,
} from "../../../Api";

import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";

// ----------------------------------
// Safe helpers (same exactly as Provisional)
// ----------------------------------
const safeNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
const safeStr = (v) => (v ?? "").toString();
const safeArr = (v) => (Array.isArray(v) ? v : []);

// ----------------------------------
// Exchange Rates (same as CreateProvisionalEntry)
// ----------------------------------
const exchangeRates = {
    INR: 1,
    USD: 88.5,
    EUR: 88.5,
    KRW: 0.065,
    SGD: 60,
};

// ----------------------------------
// Row generator (safe)
// ----------------------------------
const sampleRow = () => ({
    description: "",
    units: "BL",
    cur: "INR",
    sac: "",
    qty: 1,
    amount: 0,
    exRate: 1,
    amountInInr: 0,
    gstPer: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
});

const RaisingEntryVendor = ({ editData, setEditData }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);

    // ----------------------------------
    // SESSION SAFE FETCH (same pattern)
    // ----------------------------------
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");

    const jobNo = safeStr(storedMaster?.jobNo);
    const hawb =
        safeStr(storedHouse?.hawb) ||
        safeStr(storedHouse?.hawbNo) ||
        safeStr(storedHouse?.houseNumber);
    const mawb = safeStr(storedHouse?.mawb);

    const isEditing = Boolean(editData?.id || editData?._id);

    // ----------------------------------
    // DEFAULT VALUES (with safe fallback)
    // ----------------------------------
    const defaultValues = {
        voucherType: "",
        voucherNo: "",
        voucherDate: "",
        baseCurrency: "INR",
        partyName: "",
        partyAddress: "",
        isSez: false,
        state: "",
        country: "",
        gstin: "",
        tel: "",
        fax: "",
        refNo: "",
        refDate: "",
        mawbno: mawb,
        hawbno: hawb,
        status: "Accounting Entry (Approved)",
        jobNo,
        remark: "",
        items: [sampleRow()],
    };

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    // ----------------------------------
    // WATCH ITEMS (same system as Provisional)
    // ----------------------------------
    const watchedItems = useWatch({ control, name: "items" }) || [];

    const watchedInputs = useMemo(() => {
        return safeArr(watchedItems).map((it) => ({
            qty: safeNum(it.qty),
            amount: safeNum(it.amount),
            exRate: safeNum(it.exRate),
            gstPer: safeNum(it.gstPer),
            cur: safeStr(it.cur),
        }));
    }, [watchedItems]);

    // ----------------------------------
    // AUTO CALC LOGIC (same as Provisional)
    // ----------------------------------
    useEffect(() => {
        const arr = safeArr(watchedInputs);

        arr.forEach((row, index) => {
            const qty = safeNum(row.qty);
            const amount = safeNum(row.amount);
            const exRate = safeNum(row.exRate);
            const gst = safeNum(row.gstPer);
            const currency = safeStr(row.cur);

            const amountInInr = qty * amount * exRate;

            let cgst = 0,
                sgst = 0,
                igst = 0;

            if (gst > 0) {
                if (currency === "INR") {
                    cgst = (amountInInr * (gst / 2)) / 100;
                    sgst = (amountInInr * (gst / 2)) / 100;
                } else {
                    igst = (amountInInr * gst) / 100;
                }
            }

            const total = amountInInr + cgst + sgst + igst;

            setValue(`items.${index}.amountInInr`, Number(amountInInr.toFixed(2)));
            setValue(`items.${index}.cgst`, Number(cgst.toFixed(2)));
            setValue(`items.${index}.sgst`, Number(sgst.toFixed(2)));
            setValue(`items.${index}.igst`, Number(igst.toFixed(2)));
            setValue(`items.${index}.total`, Number(total.toFixed(2)));
        });
    }, [JSON.stringify(watchedInputs)]);

    // ----------------------------------
    // CURRENCY CHANGE (same as Provisional)
    // ----------------------------------
    const handleCurrencyChange = (index, newCurrency, fieldOnChange) => {
        const currency = safeStr(newCurrency);
        const rate = safeNum(exchangeRates[currency] ?? 1);

        fieldOnChange(currency);
        setValue(`items.${index}.exRate`, rate);

        const item = watchedInputs[index] || {};
        const qty = safeNum(item.qty);
        const amount = safeNum(item.amount);
        const gst = safeNum(item.gstPer);

        const amountInInr = qty * amount * rate;

        let cgst = 0,
            sgst = 0,
            igst = 0;

        if (gst > 0) {
            if (currency === "INR") {
                cgst = (amountInInr * (gst / 2)) / 100;
                sgst = (amountInInr * (gst / 2)) / 100;
            } else {
                igst = (amountInInr * gst) / 100;
            }
        }

        const total = amountInInr + cgst + sgst + igst;

        setValue(`items.${index}.amountInInr`, Number(amountInInr.toFixed(2)));
        setValue(`items.${index}.cgst`, Number(cgst.toFixed(2)));
        setValue(`items.${index}.sgst`, Number(sgst.toFixed(2)));
        setValue(`items.${index}.igst`, Number(igst.toFixed(2)));
        setValue(`items.${index}.total`, Number(total.toFixed(2)));
    };

    // ----------------------------------
    // EDIT MODE LOAD (safe fallback)
    // ----------------------------------
    useEffect(() => {
        if (!isEditing) return;

        const safeItems = safeArr(editData?.items)?.length
            ? editData.items.map((it) => ({
                description: safeStr(it.description),
                units: safeStr(it.units),
                cur: safeStr(it.cur),
                sac: safeStr(it.sac),
                qty: safeNum(it.qty),
                amount: safeNum(it.amount),
                exRate: safeNum(it.exRate),
                amountInInr: safeNum(it.amountInInr),
                gstPer: safeNum(it.gstPer),
                cgst: safeNum(it.cgst),
                sgst: safeNum(it.sgst),
                igst: safeNum(it.igst),
                total: safeNum(it.total),
            }))
            : [sampleRow()];

        reset({
            ...defaultValues,
            ...editData,
            voucherDate: editData?.voucherDate
                ? moment(editData?.voucherDate).format("YYYY-MM-DD")
                : "",
            refDate: editData?.refDate
                ? moment(editData?.exchangeRateDate).format("YYYY-MM-DD")
                : "",
            items: safeItems,
        });
    }, [isEditing]);

    // ----------------------------------
    // TOTALS
    // ----------------------------------
    const subtotal = watchedItems.reduce((sum, i) => sum + safeNum(i.amountInInr), 0).toFixed(2);
    const grandTotal = watchedItems.reduce((sum, i) => sum + safeNum(i.total), 0).toFixed(2);

    // ----------------------------------
    // ----------------------------------
    // CREATE MUTATION
    // ----------------------------------
    const createMutation = useMutation({
        mutationFn: ({ jobNo, hawbNo, payload }) =>
            createAirInboundVendorAccount(jobNo, hawbNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundVendorAccounts"]);

            alert("Vendor accounting entry created successfully");

            // RESET FORM
            reset(defaultValues);
            setEditData(null);

            // Close modal using working pattern from CreateHouse.jsx
            const modalElement = document.getElementById("raiseVendorModal");
            if (modalElement) {
                const bootstrap = window.bootstrap;
                if (bootstrap?.Modal) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    } else if (window.$) {
                        window.$(modalElement).modal("hide");
                    } else {
                        const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                        if (closeBtn) {
                            closeBtn.click();
                        }
                    }
                } else if (window.$) {
                    window.$(modalElement).modal("hide");
                } else {
                    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }
            
            // Wait a bit for modal to close, then navigate
            setTimeout(() => {
                navigate(-1);
            }, 300);
        },

        onError: (err) => handleProvisionalError(err, "Create Vendor Accounting Entry"),
    });


    // ----------------------------------
    // UPDATE MUTATION
    // ----------------------------------
    const updateMutation = useMutation({
        mutationFn: ({ jobNo, hawbNo, payload }) =>
            updateAirInboundVendorAccount(jobNo, hawbNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundVendorAccounts"]);

            alert("Vendor accounting entry updated successfully");

            // RESET FORM
            reset(defaultValues);
            setEditData(null);

            // Close modal using working pattern from CreateHouse.jsx
            const modalElement = document.getElementById("raiseVendorModal");
            if (modalElement) {
                const bootstrap = window.bootstrap;
                if (bootstrap?.Modal) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    } else if (window.$) {
                        window.$(modalElement).modal("hide");
                    } else {
                        const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                        if (closeBtn) {
                            closeBtn.click();
                        }
                    }
                } else if (window.$) {
                    window.$(modalElement).modal("hide");
                } else {
                    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }
            
            // Wait a bit for modal to close, then navigate
            setTimeout(() => {
                navigate(-1);
            }, 300);
        },

        onError: (err) => handleProvisionalError(err, "Update Vendor Accounting Entry"),
    });

    // ----------------------------------
    // SUBMIT (same normalization system)
    // ----------------------------------
    const onSubmit = (data) => {
        const payload = {
            ...data,
            isSez: !!data.isSez,
            voucherType: safeStr(data.voucherType),
            voucherNo: safeStr(data.voucherNo),
            voucherDate: data?.voucherDate ? safeStr(data.voucherDate) : null,
            refDate: data?.refDate ? safeStr(data.refDate) : null,
            items: safeArr(data.items).map((it) => ({
                description: safeStr(it.description),
                units: safeStr(it.units),
                cur: safeStr(it.cur),
                sac: safeStr(it.sac),
                qty: safeNum(it.qty),
                amount: safeNum(it.amount),
                exRate: safeNum(it.exRate),
                amountInInr: safeNum(it.amountInInr),
                gstPer: safeNum(it.gstPer),
                cgst: safeNum(it.cgst),
                sgst: safeNum(it.sgst),
                igst: safeNum(it.igst),
                total: safeNum(it.total),
            })),
        };

        if (isEditing) {
            updateMutation.mutate({
                jobNo: payload.jobNo,
                hawbNo: payload.hawbno,
                payload,
            });
        } else {
            createMutation.mutate({
                jobNo: payload.jobNo,
                hawbNo: payload.hawbno,
                payload,
            });
        }
    };

    // ----------------------------------
    // UI (UNTOUCHED)
    // ----------------------------------
    return (
        <div
            className="modal fade"
            id="raiseVendorModal"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h4 className="modal-title fw-bold">
                            {isEditing ? "Edit Vendor Accounting Entry" : "Vendor Accounting Entry"}
                        </h4>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={() => setEditData(null)}
                        />
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        <form onSubmit={handleSubmit(onSubmit)}>

                            {/* ------ TOP GRID UI UNCHANGED ------ */}
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Type</label>
                                    <Controller
                                        name="voucherType"
                                        control={control}
                                        render={({ field }) => (
                                            <select {...field} className="form-select">
                                                <option value="">--Select Type--</option>
                                                <option value="Purchase">Purchase</option>
                                                <option value="Journal">Journal</option>
                                                <option value="Credit Note">Credit Note</option>
                                                <option value="Debit Note">Debit Note</option>
                                                <option value="Rec_Advance">Rec_Advance</option>
                                                <option value="Pay_Advance">Pay_Advance</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher No</label>
                                    <Controller
                                        name="voucherNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Date</label>
                                    <Controller
                                        name="voucherDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Base Currency</label>
                                    <Controller
                                        name="baseCurrency"
                                        control={control}
                                        render={({ field }) => (
                                            <select {...field} className="form-select">
                                                <option value="">--select--</option>
                                                <option value="INR">INR</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="KRW">KRW</option>
                                                <option value="SGD">SGD</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                {/* PARTY NAME */}
                                <div className="col-md-6 mt-2">
                                    <label className="form-label fw-bold">Party Name</label>
                                    <div className="input-group">
                                        <Controller
                                            name="partyName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" />
                                            )}
                                        />
                                        <span
                                            className="input-group-text"
                                            onClick={() => {
                                                setSearchTarget('party');
                                                setOpen(true);
                                            }}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <FaSearch />
                                        </span>
                                    </div>
                                </div>
                                {open && (
                                    <NewWindow
                                        onUnload={() => {
                                            setOpen(false);
                                            setSearchTarget(null);
                                        }}
                                        title="Search Vendor"
                                        features="width=1100,height=700,scrollbars=yes,resizable=yes"
                                    >
                                        <VendorSearch
                                            onSelect={(vendor) => {
                                                const name = vendor?.displayName ?? vendor?.vendorName ?? vendor?.companyName ?? vendor?.name ?? "";
                                                const address = vendor?.address ?? (vendor?.billingAddress?.street1 ? `${vendor.billingAddress.street1}${vendor.billingAddress.city ? ', ' + vendor.billingAddress.city : ''}` : "");
                                                const state = vendor?.billingAddress?.state ?? "";
                                                const country = vendor?.billingAddress?.country ?? "";
                                                const gstin = vendor?.gstin ?? "";
                                                const tel = vendor?.phone ?? vendor?.workPhone ?? "";
                                                const fax = vendor?.fax ?? "";

                                                setValue("partyName", name);
                                                setValue("partyAddress", address);
                                                setValue("state", state);
                                                setValue("country", country);
                                                setValue("gstin", gstin);
                                                setValue("tel", tel);
                                                setValue("fax", fax);

                                                setOpen(false);
                                                setSearchTarget(null);
                                            }}
                                        />
                                    </NewWindow>
                                )}

                                {/* PARTY ADDRESS */}
                                <div className="col-md-6 mt-2">
                                    <label className="form-label fw-bold">Party Address</label>
                                    <Controller
                                        name="partyAddress"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                {/* SEZ / STATE / COUNTRY / GST */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Is SEZ</label>
                                    <Controller
                                        name="isSez"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                {...field}
                                                className="form-select"
                                                onChange={(e) => field.onChange(e.target.value === "true")}
                                            >
                                                <option value="false">No</option>
                                                <option value="true">Yes</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">State</label>
                                    <Controller
                                        name="state"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Country</label>
                                    <Controller
                                        name="country"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">GSTIN</label>
                                    <Controller
                                        name="gstin"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                {/* TEL / FAX */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">TEL</label>
                                    <Controller
                                        name="tel"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">FAX</label>
                                    <Controller
                                        name="fax"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                {/* REF NO / DATE */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Ref No</label>
                                    <Controller
                                        name="refNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Ref Date</label>
                                    <Controller
                                        name="refDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control" />
                                        )}
                                    />
                                </div>

                                {/* HAWB / MAWB / JOBNO */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Mawbno</label>
                                    <Controller
                                        name="mawbno"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Hawbno</label>
                                    <Controller
                                        name="hawbno"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Status</label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Job No</label>
                                    <Controller
                                        name="jobNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control" readOnly />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* REMARK */}
                            <div className="mt-3">
                                <label className="form-label fw-bold">Remark</label>
                                <Controller
                                    name="remark"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea {...field} rows={3} className="form-control" />
                                    )}
                                />
                            </div>

                            {/* ADD MORE ITEMS */}
                            <div className="mt-3 d-flex justify-content-start">
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => append(sampleRow())}
                                >
                                    + More items
                                </button>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="mt-3" style={{ overflowX: "auto" }}>
                                <table className="table table-bordered table-sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Description</th>
                                            <th>Units</th>
                                            <th>CUR</th>
                                            <th>SAC</th>
                                            <th>Qty</th>
                                            <th>Amount</th>
                                            <th>Ex.Rate</th>
                                            <th>Amount(INR)</th>
                                            <th>GST Per</th>
                                            <th>CGST</th>
                                            <th>SGST</th>
                                            <th>IGST</th>
                                            <th>Total</th>
                                            <th></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {fields.map((row, index) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <Controller
                                                        name={`items.${index}.description`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.units`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.cur`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <select
                                                                {...field}
                                                                className="form-select"
                                                                onChange={(e) =>
                                                                    handleCurrencyChange(
                                                                        index,
                                                                        e.target.value,
                                                                        field.onChange
                                                                    )
                                                                }
                                                            >
                                                                <option value="INR">INR</option>
                                                                <option value="USD">USD</option>
                                                                <option value="EUR">EUR</option>
                                                                <option value="KRW">KRW</option>
                                                                <option value="SGD">SGD</option>
                                                            </select>
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.sac`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.qty`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                type="number"
                                                                {...field}
                                                                className="form-control"
                                                            />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.amount`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.exRate`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.amountInInr`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                {...field}
                                                                className="form-control"
                                                                readOnly
                                                            />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.gstPer`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.cgst`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" readOnly />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.sgst`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" readOnly />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.igst`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" readOnly />
                                                        )}
                                                    />
                                                </td>

                                                <td>
                                                    <Controller
                                                        name={`items.${index}.total`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input {...field} className="form-control" readOnly />
                                                        )}
                                                    />
                                                </td>

                                                <td className="text-center align-middle">
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => remove(index)}
                                                    >
                                                        -
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* SUBTOTAL */}
                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="fw-bold text-end">Subtotal</td>
                                            <td colSpan={6} className="fw-bold text-end">
                                                {subtotal}
                                            </td>
                                        </tr>

                                        {/* TOTAL */}
                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="fw-bold text-end">Total</td>
                                            <td colSpan={6} className="fw-bold text-end">
                                                {grandTotal}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* FOOTER BUTTONS */}
                            <div className="mt-3 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        reset(defaultValues);   // reset form to defaults
                                        setEditData(null);      // clear edit state
                                    }}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="btn btn-primary px-4"
                                    disabled={createMutation.isLoading || updateMutation.isLoading}
                                >
                                    {(createMutation.isLoading || updateMutation.isLoading) ? (
                                        <>
                                            <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading
                                        </>
                                    ) : (
                                        isEditing ? "Update" : "Create"
                                    )}
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaisingEntryVendor;
