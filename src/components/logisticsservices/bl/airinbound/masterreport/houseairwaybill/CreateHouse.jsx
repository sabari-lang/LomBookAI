
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search } from "react-bootstrap-icons";
import { createAirInboundHouse, updateAirInboundHouse } from "../../Api";

import { useNavigate } from "react-router-dom";
import moment from "moment";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../../../common/popup/CustomerSearch";
import { useUnlockInputs } from "../../../../../../hooks/useUnlockInputs";





const CreateHouse = ({ editData, setEditData }) => {
    const storedRaw = sessionStorage.getItem("masterAirwayData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    const jobNo = storedData?.jobNo;  // ⭐ CORRECT PLACE

    // Customer Search State
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);


    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split('T')[0];
        } catch {
            return "";
        }
    };

    // 🔥 Single Source of Truth for Defaults - Auto-filled from job/master
    const initialValues = {
        // TOP / header - Auto-filled from job/master
        jobNo: storedData?.jobNo ?? "",
        blType: "House B/L",
        consol: "Consol",
        importField: "Import",
        mawb: storedData?.mawbNo ?? storedData?.mawb ?? "",
        hawb: "",
        shipment: storedData?.shipment ?? "",
        status: "Open",
        branch: storedData?.branch ?? "HEAD OFFICE",

        // Shipper - Auto-filled from job/master
        shipperName: storedData?.shipperName ?? "",
        shipperAddr: storedData?.shipperAddress ?? "",

        // Consignee - Auto-filled from job/master
        consigneeName: storedData?.consigneeName ?? "",
        consigneeAddr: storedData?.consigneeAddress ?? "",

        // Notify - Auto-filled from job/master
        notifyName: storedData?.notifyName ?? "",
        notifyAddr: storedData?.notifyAddress ?? "",
        sameAsConsignee: false,
        copyAsConsignee: false,

        // Agent/Issuing - Auto-filled from job/master
        agentName: storedData?.issuingAgent ?? "",
        iataCode: storedData?.iataCode ?? "",
        accountNo: storedData?.accountNo ?? "",
        accountingInfo: storedData?.accountingInfo ?? "",

        // Airport/Routing - Auto-filled from job/master
        airportDeparture: storedData?.airportDeparture ?? "",
        to1: storedData?.to1 ?? "",
        byFirstCarrier: storedData?.by1 ?? "",
        airportDest: storedData?.airportDestination ?? "",
        requestedFlight: storedData?.flightNo ?? "",
        declaredValueCarriage: storedData?.declaredCarriage ?? "",
        declaredValueCustoms: storedData?.declaredCustoms ?? "",
        departureDate: formatDateForInput(storedData?.departureDate),
        arrivalDate: formatDateForInput(storedData?.arrivalDate),
        insuranceAmount: storedData?.insurance ?? "",
        freightTerm: storedData?.freightTerm ?? "",

        // Currency/Accounting - Auto-filled from job/master
        cur: storedData?.currency ?? "",
        code: storedData?.code ?? "",
        wtValPp: storedData?.wtvalPP ?? "",
        coll1: storedData?.coll1 ?? "",
        otherPp: storedData?.otherPP ?? "",
        coll2: storedData?.coll2 ?? "",

        to2: storedData?.rto1 ?? "",
        by2: storedData?.rby1 ?? "",
        to3: storedData?.rto2 ?? "",
        by3: storedData?.rby2 ?? "",

        // Handling/Invoice
        handlingInfo: storedData?.handlingInfo ?? "",
        shipperInvoiceNo: "",
        shipperInvoiceDate: "",
        shipperInvoiceAmount: "",

        // Package/Weight - Auto-filled from job/master
        pieces: storedData?.pieces ?? "",
        grossWeight: storedData?.grossWeight ?? "",
        kgLb: storedData?.kgLb ?? "KG",
        rateClass: storedData?.rateClass ?? "",
        chargeableWeight: storedData?.chargeableWeight ?? "",
        rateCharge: storedData?.rateCharge ?? "",
        asArranged: storedData?.arranged ?? false,
        goodsNature: storedData?.natureGoods ?? "",

        // Charges - Auto-filled from job/master
        weightChargePrepaid: storedData?.weightPrepaid ?? "",
        weightChargeCollect: storedData?.weightCollect ?? "",
        valuationChargePrepaid: storedData?.valuationPrepaid ?? "",
        valuationChargeCollect: storedData?.valuationCollect ?? "",
        taxPrepaid: storedData?.taxPrepaid ?? "",
        taxCollect: storedData?.taxCollect ?? "",
        agentChargesPrepaid: storedData?.agentPrepaid ?? "",
        agentChargesCollect: storedData?.agentCollect ?? "",
        carrierChargesPrepaid: storedData?.carrierPrepaid ?? "",
        carrierChargesCollect: storedData?.carrierCollect ?? "",
        totalPrepaid: storedData?.totalPrepaid ?? "",
        totalCollect: storedData?.totalCollect ?? "",

        // Execution - Auto-filled from job/master
        executedDate: formatDateForInput(storedData?.executedDate),
        placeAt: storedData?.placeAt ?? "",
        signature: storedData?.signature ?? "",
    };
    const { control, handleSubmit, watch, setValue, reset } = useForm({
        defaultValues: initialValues,
    });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!editData;      // true if data is passed

    // ✅ Keyboard unlock hook for edit mode
    useUnlockInputs(isEditing);

    // ⭐ Auto-fill from sessionStorage on mount (only when NOT editing)
    useEffect(() => {
        // If editing, skip auto-fill (editData will populate the form)
        if (isEditing) return;

        // Check if storedData exists
        if (!storedData || !storedData.jobNo) {
            console.warn("No job/master data found in sessionStorage. Please select a job first.");
            return;
        }

        // Reset form with auto-filled values from job/master (use initialValues which is computed from storedData)
        reset(initialValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Edit Form Data - Override auto-fill when editing
    useEffect(() => {
        if (!editData?.id) return;

        reset({
            ...initialValues,   // base defaults
            ...editData,        // override with edit data
            arrivalDate: editData?.arrivalDate
                ? moment(editData.arrivalDate).format("YYYY-MM-DD")
                : "",

            departureDate: editData?.departureDate
                ? moment(editData.departureDate).format("YYYY-MM-DD")
                : "",
            executedDate: editData?.executedDate
                ? moment(editData.executedDate).format("YYYY-MM-DD")
                : "",
            shipperInvoiceDate: editData?.shipperInvoiceDate
                ? moment(editData.shipperInvoiceDate).format("YYYY-MM-DD")
                : "",
        });
    }, [editData?.id]);






    // Helper to close Bootstrap modal
    const closeModal = () => {
        reset(initialValues);
        setEditData(null);
        
        const modalElement = document.getElementById("airoinboundCreateHouseModal");
        if (modalElement) {
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                    return;
                }
            }
            if (window.$) {
                window.$(modalElement).modal("hide");
                return;
            }
            const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    };

    // Post APi 
    const createHouseMutation = useMutation({
        mutationFn: ({ jobNo, payload }) =>
            createAirInboundHouse(jobNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundHouseList", jobNo]);
            alert("House Created Successfully");
            closeModal();
        },

        onError: (error) => {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong";

            alert(`Error: ${msg}`);
        }
    });



    // Put Api
    const updateHouseMutation = useMutation({
        mutationFn: ({ jobNo, hawbId, payload }) =>
            updateAirInboundHouse(jobNo, hawbId, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundHouseList", jobNo]);
            alert("House Updated Successfully");
            closeModal();
        },

        onError: (error) => {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong";

            alert(`Error: ${msg}`);
        }
    });



    const onSubmit = (form) => {

        const data = {
            ...form,

            // dropdown -> boolean
            consol: form?.consol === "Consol",

            // numeric fields
            wtValPp: form.wtValPp ? Number(form.wtValPp) : null,
            coll1: form.coll1 ? Number(form.coll1) : null,
            otherPp: form.otherPp ? Number(form.otherPp) : null,
            coll2: form.coll2 ? Number(form.coll2) : null,

            declaredValueCarriage: form.declaredValueCarriage ? Number(form.declaredValueCarriage) : null,
            declaredValueCustoms: form.declaredValueCustoms ? Number(form.declaredValueCustoms) : null,
            insuranceAmount: form.insuranceAmount ? Number(form.insuranceAmount) : null,

            totalPrepaid: form.totalPrepaid ? Number(form.totalPrepaid) : null,

            // checkbox -> 1 or 0
            asArranged: form.asArranged ? 1 : 0,
        };

        if (isEditing) {
            // UPDATE HOUSE
            updateHouseMutation.mutate({
                jobNo: editData?.jobNo,
                hawbId: editData?.hawb,
                payload: data,
            });
        } else {
            // CREATE HOUSE
            createHouseMutation.mutate({
                jobNo,
                payload: data,
            });
        }
    };



    return (
        <>
        <div
            className="modal fade"
            id="airoinboundCreateHouseModal"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        {
                            editData?.id ? <>        <h4 className="fw-bold m-0">Edit  House Air Waybill</h4></> : <>        <h4 className="fw-bold m-0"> House Air Waybill</h4></>
                        }
                        <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => {
                            setEditData(null);
                            reset(initialValues);
                        }} />
                    </div>

                    {/* BODY START */}
                    <div className="modal-body p-3">
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="container-fluid"
                        >

                            {/* Row 1 */}
                            <div className="row g-2">
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Job No/Ref No</label>
                                    <Controller
                                        name="jobNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field}
                                                className="form-control form-control-sm"
                                                readOnly
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">B/L Type</label>
                                    <Controller
                                        name="blType"
                                        control={control}
                                        render={({ field }) => (
                                            <select {...field} className="form-select form-select-sm">
                                                <option>House B/L</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Console</label>
                                    <Controller
                                        name="consol"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option>Consol</option>
                                                <option>Single</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Import</label>
                                    <Controller
                                        name="importField"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field}
                                                className="form-control form-control-sm"
                                                readOnly
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* MAWB HAWB Status Branch */}
                            <div className="row g-2 mt-2">
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">MAWB No</label>
                                    <Controller
                                        name="mawb"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">HAWB No</label>
                                    <Controller
                                        name="hawb"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Shipment</label>
                                    <Controller
                                        name="shipment"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="">--Select--</option>
                                                <option value="CIF">CIF</option>
                                                <option value="C & F">C & F</option>
                                                <option value="CAF">CAF</option>
                                                <option value="CFR">CFR</option>
                                                <option value="CPT">CPT</option>
                                                <option value="DAP">DAP</option>
                                                <option value="DDP">DDP</option>
                                                <option value="DDU">DDU</option>
                                                <option value="EXW">EXW</option>
                                                <option value="FAS">FAS</option>
                                                <option value="FCA">FCA</option>
                                                <option value="FOB">FOB</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Status</label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="Open">Open</option>
                                                <option value="Not Arrived">Not Arrived</option>
                                                <option value="Today Planning">Today Planning</option>
                                                <option value="Awaiting for Duty">Awaiting for Duty</option>
                                                <option value="Queries from Customs">Queries from Customs</option>
                                                <option value="Awaiting CEPA">Awaiting CEPA</option>
                                                <option value="OOC Completed">OOC Completed</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Others">Others</option>
                                                <option value="Clearance Completed">Clearance Completed</option>
                                                <option value="Pending for Query">Pending for Query</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Branch</label>
                                    <Controller
                                        name="branch"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="HEAD OFFICE">HEAD OFFICE</option>
                                                <option value="ANATHAPUR">ANATHAPUR</option>
                                                <option value="BANGALORE">BANGALORE</option>
                                                <option value="MUMBAI">MUMBAI</option>
                                                <option value="NEW DELHI">NEW DELHI</option>
                                                <option value="BLR SALES">BLR SALES</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>

                            <hr className="mt-3" />
                            {/* SHIPPER + AIRWAYBILL */}
                            <div className="row g-2">
                                {/* SHIPPER LEFT */}
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold d-flex align-items-center gap-2">
                                        Shipper's Name & Address <Search size={15} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                    </label>

                                    <Controller
                                        name="shipperName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm mb-1"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="shipperAddr"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="form-control form-control-sm"
                                                rows={4}
                                            />
                                        )}
                                    />
                                </div>

                                {/* AIRWAYBILL RIGHT */}
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold d-flex align-items-center gap-2">
                                        Not Negotiable — Air Waybill <Search size={15} onClick={() => { setSearchTarget('agentName'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                    </label>

                                    <Controller
                                        name="agentName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm mb-1"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="shipperAddr"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="form-control form-control-sm"
                                                rows={4}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <hr className="mt-3" />

                            {/* CONSIGNEE / NOTIFY */}
                            <div className="row g-2">
                                {/* CONSIGNEE LEFT */}
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold d-flex align-items-center gap-2">
                                        Consignee Name & Address <Search size={15} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                    </label>

                                    <Controller
                                        name="consigneeName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm mb-1"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="consigneeAddr"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="form-control form-control-sm"
                                                rows={4}
                                            />
                                        )}
                                    />
                                </div>

                                {/* NOTIFY RIGHT */}
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold d-flex align-items-center gap-2">
                                        Notify Name & Address <Search size={15} onClick={() => { setSearchTarget('notify'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                    </label>

                                    <Controller
                                        name="notifyName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm mb-1"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="notifyAddr"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="form-control form-control-sm"
                                                rows={4}
                                            />
                                        )}
                                    />

                                    {/* SAME AS / COPY AS */}
                                    <div className="form-check form-check-inline mt-2">
                                        <Controller
                                            name="sameAsConsignee"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="sameAsConsignee"
                                                />
                                            )}
                                        />
                                        <label
                                            htmlFor="sameAsConsignee"
                                            className="form-check-label small fw-bold ms-1"
                                        >
                                            SAME AS CONSIGNEE
                                        </label>
                                    </div>

                                    <div className="form-check form-check-inline mt-2">
                                        <Controller
                                            name="copyAsConsignee"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="copyAsConsignee"
                                                />
                                            )}
                                        />
                                        <label
                                            htmlFor="copyAsConsignee"
                                            className="form-check-label small fw-bold ms-1"
                                        >
                                            COPY AS CONSIGNEE
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <hr className="mt-3" />

                            {/* ISSUING CARRIER + ACCOUNTING INFO */}
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        Issuing Carrier's Agent Name & City
                                    </label>
                                    <Controller
                                        name="agentName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Accounting Information</label>
                                    <Controller
                                        name="accountingInfo"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="form-control form-control-sm"
                                                rows={3}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="row g-2 mt-2">
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Agent's IATA Code</label>
                                    <Controller
                                        name="iataCode"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Account No</label>
                                    <Controller
                                        name="accountNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6" />
                            </div>

                            <hr className="mt-3" />

                            {/* ROUTING SECTION */}
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">
                                        Airport of Departure & Requested Routing
                                    </label>

                                    <Controller
                                        name="airportDeparture"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />

                                    <div className="row g-2 mt-2">
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold">To</label>
                                            <Controller
                                                name="to1"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        {...field}
                                                        className="form-control form-control-sm"
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-8">
                                            <label className="form-label small fw-bold">By First Carrier</label>
                                            <Controller
                                                name="byFirstCarrier"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        {...field}
                                                        className="form-control form-control-sm"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CUR + CODE + WT/VAL */}
                                <div className="col-md-6">
                                    <div className="row g-2">

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">CUR</label>
                                            <Controller
                                                name="cur"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">CODE</label>
                                            <Controller
                                                name="code"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">WT/VAL PP</label>
                                            <Controller
                                                name="wtValPp"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">COLL</label>
                                            <Controller
                                                name="coll1"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">Other PP</label>
                                            <Controller
                                                name="otherPp"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">COLL</label>
                                            <Controller
                                                name="coll2"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    {/* ROUTING — TO/BY rows */}
                                    <div className="row g-2 mt-2">

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">To</label>
                                            <Controller
                                                name="to2"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">By</label>
                                            <Controller
                                                name="by2"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">To</label>
                                            <Controller
                                                name="to3"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">By</label>
                                            <Controller
                                                name="by3"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control form-control-sm" />
                                                )}
                                            />
                                        </div>



                                    </div>
                                </div>
                            </div>

                            {/* DESTINATION + DECLARATIONS */}
                            <div className="row g-2 mt-3">

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Airport of Destination</label>
                                    <Controller
                                        name="airportDest"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Requested Flight</label>
                                    <Controller
                                        name="requestedFlight"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Declared Value for Carriage</label>
                                    <Controller
                                        name="declaredValueCarriage"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Declared Value for Customs</label>
                                    <Controller
                                        name="declaredValueCustoms"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                            </div>

                            <div className="row g-2 mt-2">

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Departure Date</label>
                                    <Controller
                                        name="departureDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Arrival Date</label>
                                    <Controller
                                        name="arrivalDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Amount of Insurance</label>
                                    <Controller
                                        name="insuranceAmount"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Freight Term</label>
                                    <Controller
                                        name="freightTerm"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                            </div>

                            <hr className="mt-3" />

                            {/* HANDLING / INVOICE SECTION */}
                            <div className="row g-2">

                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Handling Information</label>
                                    <Controller
                                        name="handlingInfo"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea {...field} className="form-control form-control-sm" rows={3} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Shipper Invoice No</label>
                                    <Controller
                                        name="shipperInvoiceNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />

                                    <label className="form-label small fw-bold mt-2">Shipper Invoice Amount</label>
                                    <Controller
                                        name="shipperInvoiceAmount"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Shipper Invoice Date</label>
                                    <Controller
                                        name="shipperInvoiceDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                            </div>

                            <hr className="mt-3" />

                            {/* ----------------- CARGO SECTION ------------------ */}
                            <div className="mt-3">

                                {/* HEADER */}
                                <div className="row fw-semibold small mb-2">
                                    <div className="col-md-2 fw-bold">No.of Pieces RCP</div>
                                    <div className="col-md-2 fw-bold">Gross Weight</div>
                                    <div className="col-md-1 fw-bold">kg / lb</div>
                                    <div className="col-md-2 fw-bold">Rate Class Commodity Item</div>
                                    <div className="col-md-2 fw-bold">Chargeable Weight</div>
                                    <div className="col-md-2 fw-bold">Rate / Charge ARRANGED</div>
                                    <div className="col-md-1 fw-bold">AS</div>
                                    <div className="col-md-1 fw-bold">Total</div>
                                </div>

                                {/* INPUT ROW */}
                                <div className="row g-3 mb-4">

                                    <div className="col-md-2">
                                        <Controller
                                            name="pieces"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <Controller
                                            name="grossWeight"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-1">
                                        <Controller
                                            name="kgLb"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <Controller
                                            name="rateClass"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <Controller
                                            name="chargeableWeight"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <Controller
                                            name="rateCharge"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-1 d-flex align-items-center">
                                        <Controller
                                            name="asArranged"
                                            control={control}
                                            render={({ field }) => (
                                                <input type="checkbox" {...field} className="form-check-input" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-1 d-flex align-items-center">
                                        <span className="small fw-bold">AS ARRANGED</span>
                                    </div>

                                </div>

                            </div>

                            <hr className="mt-3" />

                            {/* NATURE OF GOODS */}
                            <div className="mt-3">
                                <label className="form-label small fw-bold">
                                    Nature and Quality of Goods (incl. Dimensions / Volume)
                                </label>
                                <Controller
                                    name="goodsNature"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea {...field} className="form-control form-control-sm" rows={3} />
                                    )}
                                />
                            </div>

                            {/* ---------------- CHARGES SECTION ---------------- */}
                            <div className="row g-4 mt-3">

                                {/* LEFT COLUMN */}
                                <div className="col-md-6">

                                    {/* WEIGHT CHARGE */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">Weight Charge</div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <Controller
                                                    name="weightChargePrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="weightChargeCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">Tax</div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <Controller
                                                    name="taxPrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="taxCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TOTAL OTHER CHARGES DUE CARRIER */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">
                                            Total other Charges Due Carrier
                                        </div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">

                                            <div className="col-6">
                                                <Controller
                                                    name="carrierChargesPrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="carrierChargesCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="col-md-6">

                                    {/* VALUATION CHARGES */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">Valuation Charge</div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <Controller
                                                    name="valuationChargePrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="valuationChargeCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* AGENT CHARGES */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">
                                            Total other Charges Due Agent
                                        </div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <Controller
                                                    name="agentChargesPrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="agentChargesCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TOTAL */}
                                    <div className="mb-4">
                                        <div className="fw-bold small mb-1">Total</div>

                                        <div className="row small mb-1 fw-bold">
                                            <div className="col-6">Prepaid</div>
                                            <div className="col-6">Collect</div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-6">
                                                <Controller
                                                    name="totalPrepaid"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-6">
                                                <Controller
                                                    name="totalCollect"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input {...field} className="form-control form-control-sm" />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <hr className="mt-3" />
                            {/* SIGNATURE SECTION */}
                            <div className="row g-2 align-items-center">

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Executed Date</label>
                                    <Controller
                                        name="executedDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Place At</label>
                                    <Controller
                                        name="placeAt"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">
                                        Signature of Issuing Carrier
                                    </label>
                                    <Controller
                                        name="signature"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                            </div>

                            {/* BUTTONS */}
                            <div className="text-end mt-4">
                                <button
                                    type="button"
                                    className="btn btn-light border me-2"
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        setEditData(null);
                                        reset(initialValues);
                                    }}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="btn btn-primary px-4"
                                    disabled={createHouseMutation.isLoading || updateHouseMutation.isLoading}
                                >
                                    {(createHouseMutation.isLoading || updateHouseMutation.isLoading) ? (
                                        <>
                                            <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading

                                        </>
                                    ) : (
                                        "Save"
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
        {open && (
            <NewWindow
                onUnload={() => { setOpen(false); setSearchTarget(null); }}
                title="Search Customer"
                features="width=1100,height=700,scrollbars=yes,resizable=yes"
            >
                <CustomerSearch
                    onSelect={(cust) => {
                        const name = cust?.displayName ?? cust?.customerName ?? cust?.name ?? "";
                        const address = cust?.address ?? (cust?.billingAddress?.street1 ? `${cust.billingAddress.street1}${cust.billingAddress.city ? ', ' + cust.billingAddress.city : ''}${cust.billingAddress.state ? ', ' + cust.billingAddress.state : ''}${cust.billingAddress.zip ? ' - ' + cust.billingAddress.zip : ''}` : "");

                        if (searchTarget === 'shipper') {
                            setValue("shipperName", name);
                            setValue("shipperAddr", address);
                        } else if (searchTarget === 'consignee') {
                            setValue("consigneeName", name);
                            setValue("consigneeAddr", address);
                        } else if (searchTarget === 'notify') {
                            setValue("notifyName", name);
                            setValue("notifyAddr", address);
                        } else if (searchTarget === 'agentName') {
                            setValue("agentName", name);
                        }

                        setOpen(false);
                        setSearchTarget(null);
                    }}
                />
            </NewWindow>
        )}
    </>
    );
};

export default CreateHouse;
