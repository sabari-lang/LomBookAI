// /mnt/data/CreateProvisionalEntrySeaOut.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { FaSearch, FaMinus } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../../../../common/popup/CustomerSearch";
import { createOceanOutboundProvisional, updateOceanOutboundProvisional } from "../../../oceanOutboundApi";



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

const CreateProvisionalEntrySeaOut = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { state } = useLocation();
    const [open, setOpen] = useState(false);
    const isEditing = Boolean(state?.id);

    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");

    const jobNo = safeStr(storedMaster?.jobNo);
    const hblNo = safeStr(state?.hblNo) || safeStr(storedHouse?.hblNo) || safeStr(storedHouse?.hbl) || "";

    const initialValues = {
        partyName: "",
        state: "",
        country: "",
        isSez: "",
        provisionalDate: "",
        status: "Accounting Entry (Pending)",
        jobNo,
        hblNo,
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
        houseId: hblNo,
    };

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: initialValues,
    });

    /** ---------------------------
     *   EDIT MODE POPULATE
     * ----------------------------*/
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
                units: safeStr(it?.units),
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

    /** ---------------------------
     *   FIELD ARRAY
     * ----------------------------*/
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchedItems = useWatch({ control, name: "items" }) || [];

    // Only INPUT fields observed → avoids infinite loop
    const watchedInputs = useMemo(() => {
        return safeArr(watchedItems).map((it) => ({
            qty: safeNum(it?.qty),
            amount: safeNum(it?.amount),
            exRate: safeNum(it?.exRate),
            gstPer: safeNum(it?.gstPer),
            currency: safeStr(it?.currency),
        }));
    }, [watchedItems]);

    /** ---------------------------
     *   AUTO CALCULATION
     * ----------------------------*/
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

            setValue(`items.${idx}.amountInInr`, Number(amountInInr.toFixed(2)));
            setValue(`items.${idx}.cgst`, Number(cgst.toFixed(2)));
            setValue(`items.${idx}.sgst`, Number(sgst.toFixed(2)));
            setValue(`items.${idx}.igst`, Number(igst.toFixed(2)));
            setValue(`items.${idx}.total`, Number(total.toFixed(2)));
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(watchedInputs)]);

    /** ---------------------------
     *   CURRENCY HANDLER
     * ----------------------------*/
    const handleCurrencyChange = (index, newCurrency, fieldOnChange) => {
        const c = safeStr(newCurrency) || "INR";
        const rate = safeNum(exchangeRates[c] ?? 1);

        fieldOnChange(c);
        setValue(`items.${index}.exRate`, rate);

        // recalc immediately
        const item = watchedInputs[index] || {};
        const qty = safeNum(item.qty);
        const amount = safeNum(item.amount);
        const gst = safeNum(item.gstPer);

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

        setValue(`items.${index}.amountInInr`, Number(amountInInr.toFixed(2)));
        setValue(`items.${index}.cgst`, Number(cgst.toFixed(2)));
        setValue(`items.${index}.sgst`, Number(sgst.toFixed(2)));
        setValue(`items.${index}.igst`, Number(igst.toFixed(2)));
        setValue(`items.${index}.total`, Number(total.toFixed(2)));
    };

    /** ---------------------------
     *   ERROR HANDLER
     * ----------------------------*/
    const handleError = (error, action = "Operation") => {
        console.error(`${action} Error:`, error);
        let message = `${action} failed.`;

        if (error?.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (data?.message) message = data.message;
            else if (data?.error) message = data.error;
            else if (data?.errors) message = Object.values(data.errors).flat().join("\n");
            else {
                switch (status) {
                    case 400: message = "Bad Request (400)."; break;
                    case 401: message = "Unauthorized (401)."; break;
                    case 403: message = "Forbidden (403)."; break;
                    case 404: message = "Not Found (404)."; break;
                    case 500: message = "Server Error (500)."; break;
                    default: message = `Unexpected (${status}).`;
                }
            }
        } else if (error?.request) {
            message = "No response from server.";
        } else {
            message = error?.message || "Unknown error.";
        }

        alert(message);
    };

    /** ---------------------------
     *   MUTATIONS
     * ----------------------------*/
    const createMutation = useMutation({
        mutationFn: (payload) => createOceanOutboundProvisional(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanOutboundProvisionals", jobNo, hblNo]);
            alert("Provisional created successfully");
            navigate(-1);
        },
        onError: (err) => handleError(err, "Create"),
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updateOceanOutboundProvisional(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanOutboundProvisionals", jobNo, hblNo]);
            alert("Provisional updated successfully");
            navigate(-1);
        },
        onError: (err) => handleError(err, "Update"),
    });

    /** ---------------------------
     *   SUBMIT
     * ----------------------------*/
    const onSubmit = (form) => {
        const payload = {
            ...form,
            isSez: form?.isSez === "yes",
            provisionalDate: form?.provisionalDate ? safeStr(form?.provisionalDate) : null,
            exchangeRateDate: form?.exchangeRateDate ? safeStr(form?.exchangeRateDate) : null,
            jobNo: safeStr(form?.jobNo),
            hblNo: safeStr(form?.hblNo),
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

        isEditing ? updateMutation.mutate(payload) : createMutation.mutate(payload);
    };

    /** ---------------------------
     *   UI (UNCHANGED)
     * ----------------------------*/
    return (
        <div className="container-fluid tw-p-4">
            <h5 className="tw-bg-[#0aa7a7] tw-text-white tw-font-semibold tw-px-4 tw-py-2 tw-rounded">
                {isEditing ? "Update Provisional Entry" : "Create Provisional Entry"}
            </h5>

            <form onSubmit={handleSubmit(onSubmit)} className="tw-mt-4">
                {/* TOP ROW */}
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Party Name</label>
                        <div className="input-group">
                            <Controller name="partyName" control={control}
                                render={({ field }) => <input {...field} className="form-control" />} />
                            <span className="input-group-text" style={{ cursor: "pointer" }} onClick={() => setOpen(true)}><FaSearch /></span>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">State</label>
                        <Controller name="state" control={control}
                            render={({ field }) => <input {...field} className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Country</label>
                        <Controller name="country" control={control}
                            render={({ field }) => <input {...field} className="form-control" />} />
                    </div>
                </div>

                {/* SECOND ROW */}
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Is SEZ</label>
                        <Controller name="isSez" control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select">
                                    <option value="">Select</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            )} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Provisional Date</label>
                        <Controller name="provisionalDate" control={control}
                            render={({ field }) => <input {...field} type="date" className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Status</label>
                        <Controller name="status" control={control}
                            render={({ field }) => <input {...field} className="form-control" />} />
                    </div>
                </div>

                {/* THIRD ROW */}
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Exchange Rate Date</label>
                        <Controller name="exchangeRateDate" control={control}
                            render={({ field }) => <input {...field} type="date" className="form-control" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">HBL No</label>
                        <Controller name="hblNo" control={control}
                            render={({ field }) => <input {...field} readOnly className="form-control bg-light" />} />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">Job No</label>
                        <Controller name="jobNo" control={control}
                            render={({ field }) => <input {...field} readOnly className="form-control bg-light" />} />
                    </div>
                </div>

                {/* ADD ITEM */}
                <button type="button" className="btn btn-success btn-sm mt-3"
                    onClick={() => append({
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
                    })}>
                    + More items
                </button>

                {/* TABLE */}
                <div className="table-responsive mt-3">
                    <table className="table table-bordered table-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Description</th>
                                <th></th>
                                <th>Units</th>
                                <th>CUR</th>
                                <th>SAC</th>
                                <th>Qty</th>
                                <th>Amount</th>
                                <th>Ex.Rate</th>
                                <th>Amount(INR)</th>
                                <th>GST %</th>
                                <th>CGST</th>
                                <th>SGST</th>
                                <th>IGST</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {fields.map((item, index) => (
                                <tr key={item.id}>
                                    <td>
                                        <Controller name={`items.${index}.description`} control={control}
                                            render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                                    </td>

                                    <td className="text-center"><FaSearch /></td>

                                    <td>
                                        <Controller name={`items.${index}.units`} control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select form-select-sm">
                                                    <option>BL</option>
                                                    <option>NOS</option>
                                                </select>
                                            )} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.currency`} control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select form-select-sm"
                                                    onChange={(e) => handleCurrencyChange(index, e.target.value, field.onChange)}>
                                                    <option value="INR">INR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="KRW">KRW</option>
                                                    <option value="SGD">SGD</option>
                                                </select>
                                            )} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.sac`} control={control}
                                            render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.qty`} control={control}
                                            render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.amount`} control={control}
                                            render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.exRate`} control={control}
                                            render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.amountInInr`} control={control}
                                            render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.gstPer`} control={control}
                                            render={({ field }) => <input {...field} type="number" className="form-control form-control-sm" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.cgst`} control={control}
                                            render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.sgst`} control={control}
                                            render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.igst`} control={control}
                                            render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td>
                                        <Controller name={`items.${index}.total`} control={control}
                                            render={({ field }) => <input {...field} readOnly className="form-control form-control-sm bg-light" />} />
                                    </td>

                                    <td className="text-center">
                                        <button type="button" className="btn btn-danger btn-sm"
                                            onClick={() => remove(index)}>
                                            <FaMinus />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary mt-3 px-4"
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

export default CreateProvisionalEntrySeaOut;
