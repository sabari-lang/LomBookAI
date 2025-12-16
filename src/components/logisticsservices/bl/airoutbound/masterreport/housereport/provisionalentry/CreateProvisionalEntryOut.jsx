// /mnt/data/CreateProvisionalEntryOut.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { FaSearch, FaMinus } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../../../../common/popup/CustomerSearch";
import { createAirOutboundProvisional, updateAirOutboundProvisional } from "../../../airOutboundApi";



const safeNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
const safeStr = (v) => (v ?? "").toString();
const safeArr = (v) => (Array.isArray(v) ? v : []);

const exchangeRates = {
    INR: 1,
    USD: 88.5,
    EUR: 88.5,
    KRW: 0.065,
    SGD: 60,
};

const CreateProvisionalEntryOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { state } = useLocation();
    const isEditing = Boolean(state?.id);
    const [open, setOpen] = useState(false);

    // session safe
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");

    const jobNo = safeStr(storedMaster?.jobNo);
    const hawbNo = safeStr(state?.hawbNo) || safeStr(storedHouse?.hawb) || safeStr(storedHouse?.hawbNo) || "";

    const initialValues = {
        partyName: "",
        state: "",
        country: "",
        isSez: "",
        provisionalDate: "",
        status: "Accounting Entry (Pending)",
        jobNo,
        hawbNo,
        exchangeRateDate: "",
        items: [
            {
                description: "",
                units: "BL",
                currency: "INR",
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
            },
        ],
        customerId: jobNo,
        customerName: "N/A",
        currencyCode: "INR",
        houseId: hawbNo,
    };

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: initialValues,
    });

    // Edit mode: populate once with safe formatting
    useEffect(() => {
        if (!isEditing) return;

        reset({
            ...state,
            provisionalDate: state?.provisionalDate
                ? moment(state?.provisionalDate).format("YYYY-MM-DD")
                : "",
            exchangeRateDate: state?.exchangeRateDate
                ? moment(state?.exchangeRateDate).format("YYYY-MM-DD")
                : "",
            isSez: state?.isSez ? "yes" : "no",
            status: safeStr(state?.status),
            items: safeArr(state?.items).map((it) => ({
                description: safeStr(it?.description),
                units: safeStr(it?.units ?? "BL"),
                currency: safeStr(it?.currency ?? "INR"),
                sac: safeStr(it?.sac),
                qty: safeNum(it?.qty),
                amount: safeNum(it?.amount),
                exRate: safeNum(it?.exRate),
                amountInInr: safeNum(it?.amountInInr),
                gstPer: safeNum(it?.gstPer),
                cgst: safeNum(it?.cgst),
                sgst: safeNum(it?.sgst),
                igst: safeNum(it?.igst),
                total: safeNum(it?.total),
            })),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    // Watch full items but derive only input keys to avoid recursion
    const watchedItems = useWatch({ control, name: "items" }) || [];

    // create a compact inputs-only structure to use as dependency
    const watchedInputs = useMemo(() => {
        return (safeArr(watchedItems)).map((it) => ({
            qty: safeNum(it?.qty),
            amount: safeNum(it?.amount),
            exRate: safeNum(it?.exRate),
            gstPer: safeNum(it?.gstPer),
            currency: safeStr(it?.currency),
        }));
    }, [watchedItems]);

    // auto-calc derived fields: DEPENDS ONLY ON watchedInputs (not derived fields)
    useEffect(() => {
        const arr = safeArr(watchedInputs);
        arr.forEach((row, idx) => {
            const qty = safeNum(row?.qty);
            const amount = safeNum(row?.amount);
            const exRate = safeNum(row?.exRate);
            const gst = safeNum(row?.gstPer);
            const currency = safeStr(row?.currency);

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

            // update derived fields only (no reset)
            // do not include setValue in deps; it's stable from RHF
            setValue(`items.${idx}.amountInInr`, Number(amountInInr.toFixed(2)), { shouldDirty: true });
            setValue(`items.${idx}.cgst`, Number(cgst.toFixed(2)), { shouldDirty: true });
            setValue(`items.${idx}.sgst`, Number(sgst.toFixed(2)), { shouldDirty: true });
            setValue(`items.${idx}.igst`, Number(igst.toFixed(2)), { shouldDirty: true });
            setValue(`items.${idx}.total`, Number(total.toFixed(2)), { shouldDirty: true });
        });
        // Only depend on watchedInputs (inputs only) — prevents infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(watchedInputs)]);

    // immediate currency change handler to avoid stale exRate usage
    const handleCurrencyChange = (index, newCurrency, fieldOnChange) => {
        const c = safeStr(newCurrency) || "INR";
        const rate = safeNum(exchangeRates[c] ?? 1);

        // update currency & exRate
        fieldOnChange(c);
        setValue(`items.${index}.exRate`, rate, { shouldDirty: true });

        // recalc derived fields using new rate
        const current = safeArr(watchedInputs)[index] ?? {};
        const qty = safeNum(current?.qty);
        const amount = safeNum(current?.amount);
        const gst = safeNum(current?.gstPer);

        const amountInInr = qty * amount * rate;
        let cgst = 0, sgst = 0, igst = 0;
        if (gst > 0) {
            if (c === "INR") {
                cgst = (amountInInr * (gst / 2)) / 100;
                sgst = (amountInInr * (gst / 2)) / 100;
            } else {
                igst = (amountInInr * gst) / 100;
            }
        }
        const total = amountInInr + cgst + sgst + igst;

        setValue(`items.${index}.amountInInr`, Number(amountInInr.toFixed(2)), { shouldDirty: true });
        setValue(`items.${index}.cgst`, Number(cgst.toFixed(2)), { shouldDirty: true });
        setValue(`items.${index}.sgst`, Number(sgst.toFixed(2)), { shouldDirty: true });
        setValue(`items.${index}.igst`, Number(igst.toFixed(2)), { shouldDirty: true });
        setValue(`items.${index}.total`, Number(total.toFixed(2)), { shouldDirty: true });
    };

    // robust error handler used for both create & update
    const handleProvisionalError = (error, action = "Operation") => {
        console.error(`${action} Error:`, error);
        let message = `${action} failed. Please try again.`;

        if (error?.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (data?.message) {
                message = data.message;
            } else if (data?.error) {
                message = data.error;
            } else if (data?.errors) {
                message = Object.values(data.errors).flat().join("\n");
            } else {
                switch (status) {
                    case 400:
                        message = "Bad Request (400). Check input.";
                        break;
                    case 401:
                        message = "Unauthorized (401). Please login.";
                        break;
                    case 403:
                        message = "Forbidden (403). Access denied.";
                        break;
                    case 404:
                        message = "Not Found (404).";
                        break;
                    case 500:
                        message = "Server Error (500). Try later.";
                        break;
                    default:
                        message = `Unexpected error (${status}).`;
                }
            }
        } else if (error?.request) {
            message = "No response from server. Check network.";
        } else {
            message = error?.message || "Unknown error occurred.";
        }

        alert(message);
    };

    // create / update mutations
    const createMutation = useMutation({
        mutationFn: (payload) => createAirOutboundProvisional(jobNo, hawbNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundProvisionals", jobNo, hawbNo]);
            alert("Provisional created successfully");
            navigate(-1);
        },
        onError: (error) => handleProvisionalError(error, "Create"),
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updateAirOutboundProvisional(jobNo, hawbNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundProvisionals", jobNo, hawbNo]);
            alert("Provisional updated successfully");
            navigate(-1);
        },
        onError: (error) => handleProvisionalError(error, "Update"),
    });

    const onSubmit = (form) => {
        const payload = {
            ...form,
            isSez: form?.isSez === "yes",
            provisionalDate: form?.provisionalDate ? safeStr(form?.provisionalDate) : null,
            exchangeRateDate: form?.exchangeRateDate ? safeStr(form?.exchangeRateDate) : null,
            status: safeStr(form?.status),
            jobNo: safeStr(form?.jobNo),
            hawbNo: safeStr(form?.hawbNo),
            items: safeArr(form?.items).map((it) => ({
                description: safeStr(it?.description),
                units: safeStr(it?.units),
                currency: safeStr(it?.currency),
                sac: safeStr(it?.sac),
                qty: safeNum(it?.qty),
                amount: safeNum(it?.amount),
                exRate: safeNum(it?.exRate),
                amountInInr: safeNum(it?.amountInInr),
                gstPer: safeNum(it?.gstPer),
                cgst: safeNum(it?.cgst),
                sgst: safeNum(it?.sgst),
                igst: safeNum(it?.igst),
                total: safeNum(it?.total),
            })),
        };

        if (isEditing) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    return (
        <div className="container-fluid tw-p-4">
            <h5 className="tw-bg-[#0aa7a7] tw-text-white tw-font-semibold tw-px-4 tw-py-2 tw-rounded">
                {isEditing ? "Update Provisional Entry" : "Create Provisional Entry"}
            </h5>

            <form onSubmit={handleSubmit(onSubmit)} className="tw-mt-4">
                {/* Row 1 */}
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Party Name</label>
                        <div className="input-group">
                            <Controller name="partyName" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                            <span className="input-group-text" style={{ cursor: "pointer" }} onClick={() => setOpen(true)}><FaSearch /></span>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">State</label>
                        <Controller name="state" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Country</label>
                        <Controller name="country" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Is SEZ</label>
                        <Controller name="isSez" control={control} render={({ field }) => (
                            <select {...field} className="form-select">
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        )} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Provisional Date</label>
                        <Controller name="provisionalDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Status</label>
                        <Controller name="status" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                    </div>
                </div>

                {/* Row 3 */}
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Date of Exchange Rate for INR</label>
                        <Controller name="exchangeRateDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">HAWB No</label>
                        <Controller name="hawbNo" control={control} render={({ field }) => <input {...field} readOnly className="form-control bg-light" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Job No</label>
                        <Controller name="jobNo" control={control} render={({ field }) => <input {...field} readOnly className="form-control bg-light" />} />
                    </div>
                </div>

                {/* Add item */}
                <button type="button" className="btn btn-success btn-sm mt-3" onClick={() => append({
                    description: "",
                    units: "BL",
                    currency: "INR",
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
                })}>+ More items</button>

                {/* Items table */}
                <div className="table-responsive mt-3">
                    <table className="table table-bordered table-sm">
                        <thead className="table-light">
                            <tr>
                                <th style={{ minWidth: '200px' }}>Description</th>
                                <th style={{ minWidth: '40px' }}></th>
                                <th style={{ minWidth: '100px' }}>Units</th>
                                <th style={{ minWidth: '80px' }}>CUR</th>
                                <th style={{ minWidth: '100px' }}>SAC</th>
                                <th style={{ minWidth: '80px' }}>Qty</th>
                                <th style={{ minWidth: '100px' }}>Amount</th>
                                <th style={{ minWidth: '90px' }}>Ex.Rate</th>
                                <th style={{ minWidth: '120px' }}>Amount(INR)</th>
                                <th style={{ minWidth: '80px' }}>GST %</th>
                                <th style={{ minWidth: '100px' }}>CGST</th>
                                <th style={{ minWidth: '100px' }}>SGST</th>
                                <th style={{ minWidth: '100px' }}>IGST</th>
                                <th style={{ minWidth: '100px' }}>Total</th>
                                <th style={{ minWidth: '50px' }}></th>
                            </tr>
                        </thead>

                        <tbody>
                            {fields.map((item, index) => (
                                <tr key={item.id}>
                                    <td>
                                        <Controller name={`items.${index}.description`} control={control} render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                                    </td>

                                    <td className="text-center"><FaSearch /></td>

                                    <td>
                                        <Controller name={`items.${index}.units`} control={control} render={({ field }) => (
                                            <select {...field} className="form-select form-select-sm"><option>BL</option><option>NOS</option></select>
                                        )} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.currency`} control={control} render={({ field }) => (
                                            <select {...field} className="form-select form-select-sm" onChange={(e) => handleCurrencyChange(index, e.target.value, field.onChange)}>
                                                <option value="INR">INR</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="KRW">KRW</option>
                                                <option value="SGD">SGD</option>
                                            </select>
                                        )} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.sac`} control={control} render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.qty`} control={control} render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.amount`} control={control} render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.exRate`} control={control} render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.amountInInr`} control={control} render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.gstPer`} control={control} render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.cgst`} control={control} render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.sgst`} control={control} render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.igst`} control={control} render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.total`} control={control} render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td className="text-center">
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(index)}><FaMinus /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button type="submit" className="btn btn-primary mt-3 px-4">{isEditing ? "Update" : "Create"}</button>
            </form>

            {open && (
                <NewWindow
                    onUnload={() => setOpen(false)}
                    title="Search Customer"
                    features="width=1100,height=700,scrollbars=yes,resizable=yes"
                >
                    <CustomerSearch
                        onSelect={(cust) => {
                            const name = cust?.displayName ?? cust?.customerName ?? cust?.name ?? "";
                            const state = cust?.billingAddress?.state ?? "";
                            const country = cust?.billingAddress?.country ?? "";

                            setValue("partyName", name);
                            setValue("state", state);
                            setValue("country", country);

                            setOpen(false);
                        }}
                    />
                </NewWindow>
            )}
        </div>
    );
};

export default CreateProvisionalEntryOut;
