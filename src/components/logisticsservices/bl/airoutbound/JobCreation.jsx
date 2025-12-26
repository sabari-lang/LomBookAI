import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search, X } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAirOutboundJob, updateAirOutboundJob } from "./airOutboundApi";
import moment from "moment/moment";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../common/popup/CustomerSearch";
import { refreshKeyboard } from "../../../../utils/refreshKeyboard";
import { closeModal, cleanupModalBackdrop } from "../../../../utils/closeModal";
import { SHIPMENT_CATEGORY } from "../../../../constants/shipment";
import { INCOTERMS_CONFIG, INCOTERMS_DEFAULTS } from "../../../../constants/incotermsConfig";
import { DEFAULT_SHIPPER } from "../../../../utils/defaultPartyInfo";
import { notifySuccess, notifyError, notifyInfo } from "../../../../utils/notifications";
import { applyJobDefaults, applyShipmentTermPaymentLogic, normalizeJobDates } from "../../../../utils/jobDefaults";



const baseInitialValues = {
    jobNo: "",
    masterDate: moment().toDate(),
    blType: "Master B/L",
    consol: "Consol",
    exportType: "Export",
    mawbNo: "",
    shipment: "",
    status: "Open",
    branch: "HEAD OFFICE",


    airline: "",
    flightNumber: "",
    flightDate: null,
    origin: "",
    destination: "",

    shipperName: "",
    shipperAddress: "",
    airWayBill: "",
    airWayBillAddress: "",

    consigneeName: "",
    consigneeAddress: "",

    notifyName: "",
    notifyAddress: "",

    issuingAgent: "",
    iataCode: "",
    accountNo: "",
    airportDeparture: "",
    to1: "",
    by1: "",

    airportDestination: "",
    flightNo: "",
    departureDate: null,
    arrivalDate: null,
    handlingInfo: "",

    accountingInfo: "",
    currency: "",
    code: "",
    wtvalPP: "",
    coll1: "",
    otherPP: "",
    coll2: "",
    rto1: "",
    rby1: "",
    rto2: "",
    rby2: "",

    declaredCarriage: "N.V.D",
    declaredCustoms: "NVC",
    insurance: "NIL",
    freightTerm: "",

    pieces: null,
    grossWeight: null,
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: null,
    rateCharge: null,
    arranged: 0,
    totalCharge: null,

    natureGoods: "",

    weightPrepaid: null,
    weightCollect: null,
    valuationPrepaid: null,
    valuationCollect: null,
    taxPrepaid: null,
    taxCollect: null,
    agentPrepaid: null,
    agentCollect: null,
    carrierPrepaid: null,
    carrierCollect: null,
    totalPrepaid: null,
    totalCollect: null,

    executedDate: null,
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",
    notes: "",
}
const initialValues = applyJobDefaults(baseInitialValues);

const JobCreation = ({ editData, setEditData }) => {
    const { register, handleSubmit, control, reset, watch, setValue, setError, clearErrors, getValues } = useForm({
        defaultValues: initialValues
    });

    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [sameAsConsignee, setSameAsConsignee] = useState(false);
    const [copyAsConsignee, setCopyAsConsignee] = useState(false);
    const prevConsolRef = useRef(null);

    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

    // Edit Form Data
    useEffect(() => {
        if (!editData?.id) {
            setIsLoadingEdit(false);
            return;
        }

        setIsLoadingEdit(true);
        
        // Normalize backend keys to form keys
        const normalizedEditData = {
            ...editData,
            // Map backend keys to form keys (preserve if already present)
            consigneeName: editData.consigneeName || editData.consignee || "",
            consigneeAddress: editData.consigneeAddress || editData.consigneeAddr || "",
            shipperName: editData.shipperName || editData.shipper || "",
            shipperAddress: editData.shipperAddress || editData.shipperAddr || "",
        };
        
        const merged = applyShipmentTermPaymentLogic(
            applyJobDefaults({
                ...initialValues, // BASE DEFAULTS
                ...normalizedEditData,        // OVERRIDE WITH API DATA
                arrivalDate: editData?.arrivalDate
                    ? moment(editData.arrivalDate).format("YYYY-MM-DD")
                    : "",
                departureDate: editData?.departureDate
                    ? moment(editData.departureDate).format("YYYY-MM-DD")
                    : "",
                executedDate: editData?.executedDate
                    ? moment(editData.executedDate).format("YYYY-MM-DD")
                    : "",

            })
        );
        reset(merged);

        // Initialize prevConsolRef to prevent consol-change useEffect from clearing consignee
        prevConsolRef.current = merged?.consol || null;

        // Reset checkbox states based on loaded data
        const notifyName = editData?.notifyName || "";
        setSameAsConsignee(notifyName === "SAME AS CONSIGNEE");
        setCopyAsConsignee(false); // Reset copy checkbox on edit load
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
        // Allow form to settle after reset, then disable edit loading flag
        const timer = setTimeout(() => setIsLoadingEdit(false), 100);
        return () => clearTimeout(timer);
    }, [editData?.id]);

    // OCR create-mode prefill (when editData exists but has no id)
    useEffect(() => {
        if (!editData || editData?.id) return;
        const merged = applyShipmentTermPaymentLogic(
            applyJobDefaults({
                ...initialValues,
                ...editData,
                arrivalDate: editData?.arrivalDate ? moment(editData.arrivalDate).format("YYYY-MM-DD") : "",
                departureDate: editData?.departureDate ? moment(editData.departureDate).format("YYYY-MM-DD") : "",
                executedDate: editData?.executedDate ? moment(editData.executedDate).format("YYYY-MM-DD") : "",
            })
        );
        reset(merged);
    }, [editData, reset]);

    // Auto-fill shipper when consol === 'Consol' (Outbound)
    const consolValue = watch("consol");
    useEffect(() => {
        // Skip if we're in the process of loading edit data
        if (isLoadingEdit) return;
        // Skip consol-based auto-fill when editing - preserve existing data
        if (isEditing) return;

        const isConsol = consolValue === "Consol" || consolValue === "CONSOL";

        if (isConsol) {
            // Only auto-fill if fields are empty (don't overwrite user input)
            const currentName = watch("shipperName");
            const currentAddress = watch("shipperAddress");

            if (!currentName && !currentAddress) {
                setValue("shipperName", DEFAULT_SHIPPER.shipperName);
                setValue("shipperAddress", DEFAULT_SHIPPER.shipperAddress);
            }
        } else {
            // When Single is selected, clear defaults (only if they match default values)
            const currentName = watch("shipperName");
            const currentAddress = watch("shipperAddress");

            if (currentName === DEFAULT_SHIPPER.shipperName &&
                currentAddress === DEFAULT_SHIPPER.shipperAddress) {
                setValue("shipperName", "");
                setValue("shipperAddress", "");
            }
        }
    }, [consolValue, setValue, isEditing, isLoadingEdit]);

    // Consol/Single change handler - always clear consignee + notify on change
    useEffect(() => {
        if (isLoadingEdit) return;

        // Only clear if consol actually changed (not on initial mount)
        if (prevConsolRef.current !== null && prevConsolRef.current !== consolValue) {
            // Always clear consignee and notify when consol changes
            setValue("consigneeName", "");
            setValue("consigneeAddress", "");
            setValue("notifyName", "");
            setValue("notifyAddress", "");
            setSameAsConsignee(false);
            setCopyAsConsignee(false);
        }

        prevConsolRef.current = consolValue;
    }, [consolValue, setValue, isLoadingEdit]);


    // Helper to close Bootstrap modal using shared utility
    const handleCloseModal = () => {
        reset(initialValues);
        setEditData?.(null);
        closeModal("createOutboundJobcreationModal");
        cleanupModalBackdrop();
    };

    const applyTermPayments = (termValue) => {
        const updated = applyShipmentTermPaymentLogic({
            ...getValues(),
            shipment: termValue,
        });
        if (updated.wtvalPP !== undefined) setValue("wtvalPP", updated.wtvalPP);
        if (updated.otherPP !== undefined) setValue("otherPP", updated.otherPP);
        if (updated.coll1 !== undefined) setValue("coll1", updated.coll1);
        if (updated.coll2 !== undefined) setValue("coll2", updated.coll2);
    };

    // POST API 
    const createMutation = useMutation({
        mutationFn: createAirOutboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundJobs"]);
            notifySuccess("Job Created Successfully");
            handleCloseModal();
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong while creating the job.";

            notifyError(`Create Failed: ${message}`);
        },
    });

    // PUT API
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateAirOutboundJob(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["airOutboundJobs"]);
            notifySuccess("Job Updated Successfully");
            handleCloseModal();
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong while updating the job.";

            notifyError(`Update Failed: ${message}`);
        },
    });

    // Auto-update all incoterm fields based on shipment
    const shipment = watch("shipment");
    useEffect(() => {
        // Skip auto-population during edit mode load
        if (isLoadingEdit) return;

        // Clear prior mandatory field errors
        clearErrors(["airportDeparture", "airportDestination", "arrivalDate"]);

        if (!shipment || shipment === "--Select--") {
            // Clear incoterm-dependent fields
            setValue("freightTerm", "");
            setValue("wtvalPP", "");
            setValue("otherPP", "");
            setValue("coll1", "");
            setValue("coll2", "");
            // Keep global defaults as-is
            return;
        }

        const config = INCOTERMS_CONFIG[shipment];
        if (!config) {
            setValue("freightTerm", "");
            setValue("wtvalPP", "");
            setValue("otherPP", "");
            setValue("coll1", "");
            setValue("coll2", "");
            applyTermPayments(shipment);
            return;
        }

        // Only auto-populate if not in edit mode OR if fields are empty
        // In edit mode, only populate if user actively changes shipment
        if (!isEditing || !watch("freightTerm")) {
            setValue("freightTerm", config.freightTerm);
        }
        applyTermPayments(shipment);

        // Ensure global defaults are set (if empty)
        const currentDeclaredCarriage = watch("declaredCarriage");
        const currentDeclaredCustoms = watch("declaredCustoms");
        const currentInsurance = watch("insurance");
        const currentPlaceAt = watch("placeAt");
        const currentSignature = watch("signature");

        if (!currentDeclaredCarriage) setValue("declaredCarriage", INCOTERMS_DEFAULTS.declaredCarriage);
        if (!currentDeclaredCustoms) setValue("declaredCustoms", INCOTERMS_DEFAULTS.declaredCustoms);
        if (!currentInsurance) setValue("insurance", INCOTERMS_DEFAULTS.insurance);
        if (!currentPlaceAt) setValue("placeAt", INCOTERMS_DEFAULTS.placeAt);
        if (!currentSignature) setValue("signature", INCOTERMS_DEFAULTS.signature);
    }, [shipment, setValue, isEditing, isLoadingEdit, clearErrors]);





    // Form Submit
    const onSubmit = (formValues) => {

        const toNumberOrNull = (v) => {
            if (v === "" || v === null || v === undefined) return null;
            const n = typeof v === "string" ? Number(v.trim()) : Number(v);
            return Number.isFinite(n) ? n : null;
        };

        // Convert consol string → boolean
        let payload = applyJobDefaults(formValues);
        payload = applyShipmentTermPaymentLogic(payload);
        payload.consol = payload?.consol === "Consol";


        // Map UI airWayBillAddress to API agentAddress
        payload.agentAddress = payload?.agentAddress || payload?.airWayBillAddress || "";
        // Keep wtvalPP, coll1, otherPP, coll2 as strings (P or C)
        payload.wtvalPP = toNumberOrNull(payload?.wtvalPP) || null;
        payload.coll1 = toNumberOrNull(payload?.coll1) || null;
        payload.otherPP = toNumberOrNull(payload?.otherPP) || null;
        payload.coll2 = toNumberOrNull(payload?.coll2) || null;

        // Keep declaredCarriage, declaredCustoms, insurance as strings
        payload.declaredCarriage =toNumberOrNull(payload?.declaredCarriage) || null;
        payload.declaredCustoms =toNumberOrNull(payload?.declaredCustoms) || null;
        payload.insurance =toNumberOrNull(payload?.insurance) || null;

        // Convert arranged checkbox → 1 or 0
        payload.arranged = payload?.arranged ? 1 : 0;

        // Convert empty date strings to null
        payload.departureDate = payload?.departureDate || null;
        payload.arrivalDate = payload?.arrivalDate || null;
        payload.executedDate = payload?.executedDate || null;


        // Convert empty master/flight dates to null
        payload.masterDate = payload?.masterDate || null;
        payload.flightDate = payload?.flightDate || null;
        // Convert numeric fields to number or null
        payload.pieces = toNumberOrNull(payload?.pieces);
        payload.grossWeight = toNumberOrNull(payload?.grossWeight);
        payload.chargeableWeight = toNumberOrNull(payload?.chargeableWeight);
        payload.rateCharge = toNumberOrNull(payload?.rateCharge);
        payload.totalCharge = toNumberOrNull(payload?.totalCharge);

        // Convert prepaid/collect fields to number or null
        payload.weightPrepaid = toNumberOrNull(payload?.weightPrepaid);
        payload.weightCollect = toNumberOrNull(payload?.weightCollect);
        payload.valuationPrepaid = toNumberOrNull(payload?.valuationPrepaid);
        payload.valuationCollect = toNumberOrNull(payload?.valuationCollect);
        payload.taxPrepaid = toNumberOrNull(payload?.taxPrepaid);
        payload.taxCollect = toNumberOrNull(payload?.taxCollect);
        payload.agentPrepaid = toNumberOrNull(payload?.agentPrepaid);
        payload.agentCollect = toNumberOrNull(payload?.agentCollect);
        payload.carrierPrepaid = toNumberOrNull(payload?.carrierPrepaid);
        payload.carrierCollect = toNumberOrNull(payload?.carrierCollect);
        payload.totalPrepaid = toNumberOrNull(payload?.totalPrepaid);
        payload.totalCollect = toNumberOrNull(payload?.totalCollect);

        payload = normalizeJobDates(payload);

        if (isEditing) {
            updateMutation.mutate({
                id: editData?.jobNo,   // or editData?.id
                payload,
            });
        } else {
            createMutation.mutate(payload);
        }
    };




    const handleSameAsConsignee = (checked) => {
        setSameAsConsignee(checked);
        if (checked) {
            setValue("notifyName", "SAME AS CONSIGNEE");
            setValue("notifyAddress", "");
            setCopyAsConsignee(false);
        } else {
            // Clear notify fields when unchecked
            setValue("notifyName", "");
            setValue("notifyAddress", "");
        }
    };

    const handleCopyAsConsignee = (checked) => {
        setCopyAsConsignee(checked);
        if (checked) {
            const consigneeName = watch("consigneeName");
            const consigneeAddress = watch("consigneeAddress");
            setValue("notifyName", consigneeName || "");
            setValue("notifyAddress", consigneeAddress || "");
            setSameAsConsignee(false);
        }
        // When unchecked, leave notify fields as user edited (don't force clear)
    };



    return (
        <>
            <div
                className="modal fade"
                id="createOutboundJobcreationModal"
                tabIndex={-1}
                aria-hidden="true"
                data-bs-backdrop="static"
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: "4px" }}>


                        <div className="modal-header">
                            {
                                editData?.id ? <h5 className="modal-title fw-bold">Edit Job Creation</h5> : <h5 className="modal-title fw-bold">Job Creation</h5>
                            }

                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => {
                                    setEditData(null)
                                    reset(initialValues)
                                }}
                            />
                        </div>

                        {/* BODY */}
                        <div className="modal-body" style={{ overflowY: "auto" }}>
                            <form onSubmit={handleSubmit(onSubmit)}>

                                {/* ================= BLOCK 1 — JOB DETAILS ================= */}
                                <div className="row g-3 mb-4">

                                    <div className="col-md-4">
                                        <label className="fw-bold">Job No/Ref No</label>
                                        <Controller
                                            name="jobNo"
                                            control={control}
                                            rules={{ required: "Job No is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <>
                                                    <input className={`form-control ${error ? "is-invalid" : ""}`} {...field} />
                                                    {error && <div className="invalid-feedback d-block">{error.message}</div>}
                                                </>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">B/L Type</label>
                                        <Controller
                                            name="blType"
                                            control={control}
                                            render={({ field }) => (
                                                <select className="form-select" {...field}>
                                                    <option>Master B/L</option>

                                                </select>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold">Consol</label>
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
                                        <label className="fw-bold">Export</label>
                                        <button className="btn btn-light w-100" type="button">
                                            Export
                                        </button>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">MAWB No</label>
                                        <Controller
                                            name="mawbNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Shipment</label>
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
                                        <label className="fw-bold">Status</label>
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

                                    <div className="col-md-3">
                                        <label className="fw-bold">Branch</label>
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

                                    {/* Shipper */}
                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">Shipper's Name & Address <Search size={15} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>

                                        <Controller
                                            name="shipperName"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} />
                                            )}
                                        />

                                        <Controller
                                            name="shipperAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control" rows={4} {...field}></textarea>
                                            )}
                                        />
                                    </div>

                                    {/* Air Waybill */}
                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">Not Negotiable Air Waybill <Search size={15} onClick={() => { setSearchTarget('airWayBill'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>

                                        <Controller
                                            name="airWayBill"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} />
                                            )}
                                        />

                                        <Controller
                                            name="airWayBillAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control" rows={4} {...field}></textarea>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ================= BLOCK 2 — CONSIGNEE + NOTIFY ================= */}
                                <div className="row g-3 mb-4">

                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">Consignee Name & Address <Search size={15} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>

                                        <Controller
                                            name="consigneeName"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} />
                                            )}
                                        />

                                        <Controller
                                            name="consigneeAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control" rows={4} {...field}></textarea>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        {/* LABEL + CHECKBOXES IN SAME ROW */}
                                        <div className="d-flex align-items-center gap-3 mb-1">
                                            <label className="fw-bold d-flex align-items-center gap-2 mb-0">
                                                Notify Name & Address <Search size={15} onClick={() => { if (!sameAsConsignee) { setSearchTarget('notify'); setOpen(true); } }} style={{ cursor: sameAsConsignee ? 'not-allowed' : 'pointer', opacity: sameAsConsignee ? 0.5 : 1 }} />
                                            </label>

                                            {/* SAME AS CONSIGNEE */}
                                            <label className="fw-bold small mb-0 d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    className="me-2"
                                                    checked={sameAsConsignee}
                                                    onChange={(e) => handleSameAsConsignee(e.target.checked)}
                                                />
                                                SAME AS CONSIGNEE
                                            </label>

                                            {/* COPY AS CONSIGNEE */}
                                            <label className="fw-bold small mb-0 d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    className="me-2"
                                                    checked={copyAsConsignee}
                                                    onChange={(e) => handleCopyAsConsignee(e.target.checked)}
                                                />
                                                COPY AS CONSIGNEE
                                            </label>
                                        </div>


                                        <Controller
                                            name="notifyName"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} disabled={sameAsConsignee} />
                                            )}
                                        />

                                        <Controller
                                            name="notifyAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control" rows={4} {...field} disabled={sameAsConsignee}></textarea>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ================= BLOCK 3 — AGENT + ACCOUNTING ================= */}
                                <div className="row g-4">

                                    {/* LEFT COLUMN */}
                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">Issuing Carrier's Agent Name & City <Search size={15} onClick={() => { setSearchTarget('issuingAgent'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>

                                        <Controller
                                            name="issuingAgent"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-3" {...field} />
                                            )}
                                        />

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Agent's IATA Code</label>
                                                <Controller
                                                    name="iataCode"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Account No</label>
                                                <Controller
                                                    name="accountNo"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <label className="fw-bold mt-3 d-flex align-items-center gap-2">
                                            Airport of Departure
                                            <Search size={15} onClick={() => { setSearchTarget("airportDeparture"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                        </label>
                                        <Controller
                                            name="airportDeparture"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-3" {...field} />
                                            )}
                                        />

                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <label className="fw-bold small">To</label>
                                                <Controller
                                                    name="to1"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-8">
                                                <label className="fw-bold small">By First Carrier</label>
                                                <Controller
                                                    name="by1"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold d-flex align-items-center gap-2">
                                                    Airport of Destination
                                                    <Search size={15} onClick={() => { setSearchTarget("airportDestination"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                                </label>
                                                <Controller
                                                    name="airportDestination"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Flight No</label>
                                                <Controller
                                                    name="flightNo"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Departure Date</label>
                                                <Controller
                                                    name="departureDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type="date" className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Arrival Date</label>
                                                <Controller
                                                    name="arrivalDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type="date" className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <label className="fw-bold mt-3">Handling Information</label>
                                        <Controller
                                            name="handlingInfo"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control" rows={3} {...field}></textarea>
                                            )}
                                        />
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Accounting Information</label>
                                        <Controller
                                            name="accountingInfo"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea className="form-control mb-3" rows={4} {...field}></textarea>
                                            )}
                                        />

                                        <div className="row g-2">
                                            {[
                                                { name: "currency", label: "Currency" },
                                                { name: "code", label: "Code" },
                                                { name: "wtvalPP", label: "WT/VAL PP" },
                                                { name: "coll1", label: "COLL" },
                                                { name: "otherPP", label: "Other PP" },
                                                { name: "coll2", label: "COLL" },
                                            ].map((f, i) => (
                                                <div className="col-md-2" key={i}>
                                                    <label className="fw-bold small">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="row g-2 mt-2">

                                            <div className="col-md-3">
                                                <label className="fw-bold small">To</label>
                                                <Controller
                                                    name="rto1"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold small">By</label>
                                                <Controller
                                                    name="rby1"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold small">To</label>
                                                <Controller
                                                    name="rto2"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold small">By</label>
                                                <Controller
                                                    name="rby2"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                        </div>


                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Declared Value for Carriage</label>
                                                <Controller
                                                    name="declaredCarriage"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Declared Value for Customs</label>
                                                <Controller
                                                    name="declaredCustoms"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Amount of Insurance</label>
                                                <Controller
                                                    name="insurance"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} />
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Freight Term</label>
                                                <Controller
                                                    name="freightTerm"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input className="form-control" {...field} readOnly />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ================= BLOCK 4 — PIECES / GOODS ================= */}
                                <div className="row g-3 mt-4 border-top">

                                    {[
                                        { name: "pieces", label: "No.of Pieces RCP", col: "2" },
                                        { name: "grossWeight", label: "Gross Weight", col: "2" },
                                        { name: "kgLb", label: "Kg/lb", col: "1" },
                                        { name: "rateClass", label: "Rate class", col: "2" },
                                        { name: "chargeableWeight", label: "Chargeable Weight", col: "2" },
                                        { name: "rateCharge", label: "Rate / Charge", col: "2" },
                                    ].map((f, i) => (
                                        <div className={`col-md-${f.col}`} key={i}>
                                            <label className="fw-bold small">{f.label}</label>
                                            <Controller
                                                name={f.name}
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>
                                    ))}

                                    <div className="col-md-1 d-flex align-items-center">
                                        <Controller
                                            name="arranged"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <input
                                                        type="checkbox"
                                                        className="me-2"
                                                        checked={field.value || false}
                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                    />
                                                    AS
                                                </>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Total</label>
                                        <Controller
                                            name="totalCharge"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 border-top">
                                    <label className="fw-bold">
                                        Nature and Quality of Goods
                                    </label>
                                    <Controller
                                        name="natureGoods"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea className="form-control" rows={3} {...field}></textarea>
                                        )}
                                    />
                                </div>

                                {/* ================= BLOCK 5 — CHARGES ================= */}
                                <div className="row g-4 mt-4">

                                    {/* Weight Charge */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Weight Charge</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "weightPrepaid", label: "Prepaid" },
                                                { name: "weightCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small ">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Valuation Charge */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Valuation Charge</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "valuationPrepaid", label: "Prepaid" },
                                                { name: "valuationCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small ">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tax */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Tax</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "taxPrepaid", label: "Prepaid" },
                                                { name: "taxCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small ">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Charges Due Agent */}
                                    <div className="col-md-6">
                                        <label className="">Total other Charges Due Agent</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "agentPrepaid", label: "Prepaid" },
                                                { name: "agentCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small ">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Charges Due Carrier */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Total other Charges Due Carrier</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "carrierPrepaid", label: "Prepaid" },
                                                { name: "carrierCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="col-md-6">
                                        <label className="fw-bold">Total</label>
                                        <div className="row g-2">
                                            {[
                                                { name: "totalPrepaid", label: "Prepaid" },
                                                { name: "totalCollect", label: "Collect" },
                                            ].map((f, i) => (
                                                <div className="col-md-6" key={i}>
                                                    <label className="small">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control" {...field} />
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ================= FOOTER ================= */}
                                <div className="row g-3 mt-4">
                                    <div className="col-md-4">
                                        <label className="fw-bold">Executed date</label>
                                        <Controller
                                            name="executedDate"
                                            control={control}
                                            render={({ field }) => (
                                                <input type="date" className="form-control" {...field} />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Place at</label>
                                        <Controller
                                            name="placeAt"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Signature of issuing Carrier</label>
                                        <Controller
                                            name="signature"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                        onClick={() => {
                                            reset(initialValues);
                                            setEditData(null)
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
                                                <i class="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading

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
                            const address = cust?.address ?? (cust?.billingAddress?.street1 ? `${cust.billingAddress.street1}${cust.billingAddress.city ? ', ' + cust.billingAddress.city : ''}` : "");

                            if (searchTarget === 'shipper') {
                                setValue("shipperName", name);
                                setValue("shipperAddress", address);
                            } else if (searchTarget === 'consignee') {
                                setValue("consigneeName", name);
                                setValue("consigneeAddress", address);
                            } else if (searchTarget === 'notify') {
                                setValue("notifyName", name);
                                setValue("notifyAddress", address);
                            } else if (searchTarget === 'issuingAgent') {
                                setValue("issuingAgent", name);
                            } else if (searchTarget === 'airWayBill') {
                                setValue("airWayBill", name);
                            } else if (searchTarget === 'airportDeparture') {
                                setValue("airportDeparture", name);
                            } else if (searchTarget === 'airportDestination') {
                                setValue("airportDestination", name);
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

export default JobCreation;
