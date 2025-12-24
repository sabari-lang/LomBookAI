import React, { useEffect, useMemo, useState } from "react";
import {
    useForm,
    Controller,
    useFieldArray,
    useWatch
} from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { FaSearch } from "react-icons/fa";
import NewWindow from "react-new-window";
import VendorSearch from "../../../../../common/popup/VendorSearch";

import { createUbAirOutboundVendorAccount, updateUbAirOutboundVendorAccount } from "../../../../../../services/personal-effects/airOutbound/peAirOutboundApi";
import { handleProvisionalError } from "../../../../../../utils/handleProvisionalError";
import { refreshKeyboard } from "../../../../../../utils/refreshKeyboard";
import { useAppBack } from "../../../../../../hooks/useAppBack";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../utils/notifications";

// --------------------------
// Safe helpers (same as previous)
// --------------------------
const safeNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
const safeStr = (v) => (v ?? "").toString();
const safeArr = (v) => (Array.isArray(v) ? v : []);

// --------------------------
// Exchange Rates (same mapping)
// --------------------------
const exchangeRates = {
    INR: 1,
    USD: 88.5,
    EUR: 88.5,
    KRW: 0.065,
    SGD: 60
};

// --------------------------
// Sample Row
// --------------------------
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
    total: 0
});

const RaisingEntryVendorOut = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id || editData?._id);
    
    const { goBack } = useAppBack();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);

    // --------------------------
    // Safe session fetch
    // --------------------------
    const storedMaster = JSON.parse(sessionStorage.getItem("peUbMasterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("peUbHouseAirwayData") || "{}");

    const jobNo = safeStr(storedMaster?.jobNo);
    const hawbNo =
        safeStr(storedHouse?.hawb) ||
        safeStr(storedHouse?.hawbNo) ||
        safeStr(storedHouse?.houseNumber);
    const mawbNo = safeStr(storedHouse?.mawb);

    // --------------------------
    // Default Values
    // --------------------------
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
        mawbno: mawbNo,
        hawbno: hawbNo,
        status: "Accounting Entry (Approved)",
        jobNo: jobNo,
        remark: "",
        items: [sampleRow()]
    };

    const {
        control,
        handleSubmit,
        reset,
        setValue
    } = useForm({
        defaultValues
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });
    
    // --------------------------
    // Auto calculation watch inputs
    // --------------------------
    const watchedItems = useWatch({ control, name: "items" });

    const watchedInputs = useMemo(() => {
        return safeArr(watchedItems).map((it) => ({
            qty: safeNum(it.qty),
            amount: safeNum(it.amount),
            exRate: safeNum(it.exRate),
            gstPer: safeNum(it.gstPer),
            cur: safeStr(it.cur)
        }));
    }, [watchedItems]);

    // --------------------------
    // Auto Calculation
    // --------------------------
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

    // --------------------------
    // Currency Change Handler
    // --------------------------
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

    // --------------------------
    // EDIT MODE LOAD (safe fallback)
    // --------------------------
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
                total: safeNum(it.total)
            }))
            : [sampleRow()];

        reset({
            ...defaultValues,
            ...editData,

            voucherDate: editData?.voucherDate
                ? moment(editData?.voucherDate).format("YYYY-MM-DD")
                : "",

            refDate: editData?.refDate
                ? moment(editData?.refDate).format("YYYY-MM-DD")
                : "",

            items: safeItems
        });
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
    }, [isEditing]);

    // --------------------------
    // Totals
    // --------------------------
    const subtotal = watchedItems.reduce(
        (sum, item) => sum + safeNum(item.amountInInr),
        0
    ).toFixed(2);

    const grandTotal = watchedItems.reduce(
        (sum, item) => sum + safeNum(item.total),
        0
    ).toFixed(2);

    // --------------------------
    // CREATE MUTATION
    // --------------------------
    const createMutation = useMutation({
        mutationFn: ({ jobNo, hawbNo, payload }) =>
            createAirOutboundVendorAccount(jobNo, hawbNo, payload),

        onError: (err) =>
            handleProvisionalError(err, "Create UB Air Outbound Vendor"),

        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundVendor"]);
            notifySuccess("Vendor Accounting Entry Created Successfully");

            // RESET FORM
            reset(defaultValues);
            setEditData(null);

            // Close modal using working pattern from CreateHouse.jsx
            const modalElement = document.getElementById("raiseVendorModalOut");
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

            // NAVIGATE BACK
            goBack();
        }
    });

    // --------------------------
    // UPDATE MUTATION
    // --------------------------
    const updateMutation = useMutation({
        mutationFn: ({ jobNo, hawbNo, payload }) =>
            updateAirOutboundVendorAccount(jobNo, hawbNo, payload),

        onError: (err) =>
            handleProvisionalError(err, "Update UB Air Outbound Vendor"),

        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundVendor"]);
            notifySuccess("Vendor Accounting Entry Updated Successfully");

            reset(defaultValues);
            setEditData(null);

            // Close modal using working pattern from CreateHouse.jsx
            const modalElement = document.getElementById("raiseVendorModalOut");
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

            goBack();
        }
    });

    // --------------------------
    // SUBMIT HANDLER
    // --------------------------
    const onSubmit = (data) => {
        const payload = {
            ...data,
            isSez: !!data.isSez,
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
                total: safeNum(it.total)
            }))
        };

        if (isEditing) {
            updateMutation.mutate({ jobNo, hawbNo, payload });
        } else {
            createMutation.mutate({ jobNo, hawbNo, payload });
        }
    };
    // --------------------------
    // Helper to safely close bootstrap modal by id (works even if bootstrap isn't imported)
    // --------------------------
    const closeModalById = (id) => {
        try {
            const el = document.getElementById(id);
            if (!el) return;
            const bs = window.bootstrap;
            if (bs && bs.Modal) {
                const inst = bs.Modal.getInstance(el) || new bs.Modal(el);
                inst.hide();
            } else {
                // fallback: remove show class and backdrop (best-effort)
                el.classList.remove("show");
                el.style.display = "none";
                const backdrop = document.querySelector(".modal-backdrop");
                if (backdrop) backdrop.remove();
            }
        } catch (e) {
            console.warn("closeModalById failed", e);
        }
    };

    // --------------------------
    // UI RETURN (UNCHANGED STRUCTURE)
    // --------------------------
    return (
        <div
            className="modal fade"
            id="raiseVendorModalOut"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    {/* Modal Header */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Vendor Accounting Entry</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => {
                                reset(defaultValues);
                                setEditData(null);
                                closeModalById("raiseVendorModalOut");
                            }}
                        ></button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body vendor-accounting-entry">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* TOP GRID */}
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Type</label>
                                    <Controller
                                        name="voucherType"
                                        control={control}
                                        rules={{ required: "Voucher Type is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <select
                                                    {...field}
                                                    className={`form-select ${fieldState?.error ? "is-invalid" : ""}`}
                                                >
                                                    <option value="">--Select Type--</option>
                                                    <option value="Purchase">Purchase</option>
                                                    <option value="Journal">Journal</option>
                                                    <option value="Credit Note">Credit Note</option>
                                                    <option value="Debit Note">Debit Note</option>
                                                    <option value="Rec_Advance">Rec_Advance</option>
                                                    <option value="Pay_Advance">Pay_Advance</option>
                                                </select>

                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher No</label>
                                    <Controller name="voucherNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Date</label>
                                    <Controller name="voucherDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
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

                                {/* Party Name / Address */}
                                <div className="col-md-6 mt-2">
                                    <label className="form-label fw-bold">Party Name</label>
                                    <div className="input-group">
                                        <Controller name="partyName" control={control} render={({ field }) => <input {...field} className="form-control" />} />
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

                                <div className="col-md-6 mt-2">
                                    <label className="form-label fw-bold">Party Address</label>
                                    <Controller name="partyAddress" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                {/* SEZ / State / Country / GSTIN */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Is SEZ</label>
                                    <Controller name="isSez" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">State</label>
                                    <Controller name="state" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Country</label>
                                    <Controller name="country" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">GSTIN</label>
                                    <Controller name="gstin" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                {/* TEL / FAX / Ref No / Ref Date */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">TEL</label>
                                    <Controller name="tel" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">FAX</label>
                                    <Controller name="fax" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Ref No</label>
                                    <Controller name="refNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Ref Date</label>
                                    <Controller name="refDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                {/* Mawbno / Hawbno / Status / JobNo (all readonly) */}
                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Mawbno</label>
                                    <Controller name="mawbno" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Hawbno</label>
                                    <Controller name="hawbno" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Status</label>
                                    <Controller name="status" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>

                                <div className="col-md-3 mt-2">
                                    <label className="form-label fw-bold">Job No</label>
                                    <Controller name="jobNo" control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                </div>
                            </div>

                            {/* Remark */}
                            <div className="mt-3">
                                <label className="form-label fw-bold">Remark</label>
                                <Controller name="remark" control={control} render={({ field }) => <textarea {...field} rows={3} className="form-control" style={{ minHeight: 80 }} />} />
                            </div>

                            {/* Add More Items button */}
                            <div className="mt-3 d-flex justify-content-start">
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => append(sampleRow())}
                                >
                                    + More items
                                </button>
                            </div>

                            {/* Items Table */}
                            <div className="mt-3" style={{ overflowX: "auto" }}>
                                <table className="table table-bordered table-sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ minWidth: 220 }}>Description</th>
                                            <th style={{ minWidth: 100 }}>Units</th>
                                            <th style={{ minWidth: 100 }}>CUR</th>
                                            <th style={{ minWidth: 130 }}>SAC</th>
                                            <th style={{ minWidth: 130 }}>Qty</th>
                                            <th style={{ minWidth: 130 }}>Amount</th>
                                            <th style={{ minWidth: 120 }}>Ex.Rate</th>
                                            <th style={{ minWidth: 160 }}>Amount(INR)</th>
                                            <th style={{ minWidth: 120 }}>GST Per</th>
                                            <th style={{ minWidth: 120 }}>CGST</th>
                                            <th style={{ minWidth: 120 }}>SGST</th>
                                            <th style={{ minWidth: 120 }}>IGST</th>
                                            <th style={{ minWidth: 140 }}>Total</th>
                                            <th style={{ width: 36 }}></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {fields.map((field, index) => (
                                            <tr key={field.id}>
                                                <td style={{ minWidth: 220 }}>
                                                    <Controller name={`items.${index}.description`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 100 }}>
                                                    <Controller name={`items.${index}.units`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 100 }}>
                                                    <Controller
                                                        name={`items.${index}.cur`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <select
                                                                {...field}
                                                                className="form-select"
                                                                onChange={(e) => handleCurrencyChange(index, e.target.value, field.onChange)}
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

                                                <td style={{ minWidth: 130 }}>
                                                    <Controller name={`items.${index}.sac`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 130 }}>
                                                    <Controller name={`items.${index}.qty`} control={control} render={({ field }) => <input {...field} type="number" min="1" className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 130 }}>
                                                    <Controller name={`items.${index}.amount`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 120 }}>
                                                    <Controller name={`items.${index}.exRate`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 160 }}>
                                                    <Controller name={`items.${index}.amountInInr`} control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                                </td>

                                                <td style={{ minWidth: 120 }}>
                                                    <Controller name={`items.${index}.gstPer`} control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                                </td>

                                                <td style={{ minWidth: 120 }}>
                                                    <Controller name={`items.${index}.cgst`} control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                                </td>

                                                <td style={{ minWidth: 120 }}>
                                                    <Controller name={`items.${index}.sgst`} control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                                </td>

                                                <td style={{ minWidth: 120 }}>
                                                    <Controller name={`items.${index}.igst`} control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                                </td>

                                                <td style={{ minWidth: 140 }}>
                                                    <Controller name={`items.${index}.total`} control={control} render={({ field }) => <input {...field} className="form-control" readOnly />} />
                                                </td>

                                                <td className="text-center align-middle">
                                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(index)}>-</button>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* subtotal */}
                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="text-end fw-bold">Subtotal</td>
                                            <td colSpan={6} className="fw-bold text-end">{subtotal}</td>
                                        </tr>

                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="text-end fw-bold">Total</td>
                                            <td colSpan={6} className="fw-bold text-end">{grandTotal}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer buttons */}
                            <div className="mt-3 d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        reset(defaultValues);
                                        setEditData(null);
                                        closeModalById("raiseVendorModalOut");
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
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

export default RaisingEntryVendorOut;
