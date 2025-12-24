import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAirInboundJob, updateAirInboundJob } from "../../../services/personal-effects/airInbound/peAirInboundApi";
import moment from "moment/moment";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { closeModal as closeModalUtil, cleanupModalBackdrop } from "../../../utils/closeModal";
import { applyShipmentTermPaymentLogic } from "../../../utils/jobDefaults";
import NewWindow from "react-new-window";
import CustomerSearch from "../../common/popup/CustomerSearch";
import { refreshKeyboard } from "../../../utils/refreshKeyboard";
import { SHIPMENT_CATEGORY } from "../../../constants/shipment";
import { INCOTERMS_CONFIG, INCOTERMS_DEFAULTS } from "../../../constants/incotermsConfig";
import { DEFAULT_CONSIGNEE } from "../../../utils/defaultPartyInfo";



const initialValues = {
    jobNo: "",
    masterDate: moment().toDate(),

    blType: "Master B/L",
    consol: "Consol",
    importType: "Import",

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
    agentAddress: "",

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

    // --- Accounting (numbers in API -> default null) ---
    wtvalPP: null,
    coll1: null,
    otherPP: null,
    coll2: null,

    rto1: "",
    rby1: "",
    rto2: "",
    rby2: "",

    // --- Declared values (numbers in API -> default null) ---
    declaredCarriage: null,
    declaredCustoms: null,
    insurance: null,

    freightTerm: "",

    pieces: null,
    grossWeight: null,
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: null,
    rateCharge: null,
    arranged: null,
    totalCharge: null,

    natureGoods: "",

    weightPrepaid: null,
    valuationPrepaid: null,
    taxPrepaid: null,
    agentPrepaid: null,
    carrierPrepaid: null,
    totalPrepaid: null,

    weightCollect: null,
    valuationCollect: null,
    taxCollect: null,
    agentCollect: null,
    carrierCollect: null,
    totalCollect: null,

    executedDate: null,
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",

    notes: "",
};


const JobCreation = ({ editData, setEditData }) => {
    // shipperName/shipperAddress are stored in react-hook-form via Controllers
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const { register, handleSubmit, reset, control, watch, setValue, setError, clearErrors, getValues } = useForm({
        defaultValues: initialValues,
        shouldUnregister: false, // RHF best practice: keep fields registered to prevent remount issues
    });
    const [sameAsConsignee, setSameAsConsignee] = useState(false);
    const [copyAsConsignee, setCopyAsConsignee] = useState(false);
    const prevConsolRef = useRef(null);

    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

    // Ref for first text input field (jobNo)
    const firstInputRef = useRef(null);

    // Time-based guard to prevent StrictMode immediate duplicates (250ms window)
    const lastResetRef = useRef({ editId: null, timestamp: 0 });

    /* ------------------------------------------
    EDIT: MERGE DEFAULTS + API DATA
    with isLoadingEdit to prevent side-effects from overwriting
 ------------------------------------------- */
    useEffect(() => {
        if (!editData?.id) {
            setIsLoadingEdit(false);
            lastResetRef.current = { editId: null, timestamp: 0 };
            return;
        }

        // Time-based guard: only block immediate duplicates (StrictMode), not next edit
        const now = Date.now();
        const lastReset = lastResetRef.current;
        if (lastReset.editId === editData.id && (now - lastReset.timestamp) < 250) {
            return; // Immediate duplicate (StrictMode)
        }

        lastResetRef.current = { editId: editData.id, timestamp: now };

        setIsLoadingEdit(true);

        // Batch form population: single reset() instead of multiple setValue calls
        reset({
            ...initialValues, // BASE DEFAULTS
            ...editData,        // OVERRIDE WITH API DATA
            arrivalDate: editData?.arrivalDate
                ? moment(editData.arrivalDate).format("YYYY-MM-DD")
                : "",

            departureDate: editData?.departureDate
                ? moment(editData.departureDate).format("YYYY-MM-DD")
                : "",
            executedDate: editData?.executedDate
                ? moment(editData.executedDate).format("YYYY-MM-DD")
                : "",
        });

        // Reset checkbox states based on loaded data
        const notifyName = editData?.notifyName || "";
        setSameAsConsignee(notifyName === "SAME AS CONSIGNEE");
        setCopyAsConsignee(false); // Reset copy checkbox on edit load

        // Explicit first field focus on every edit entry
        requestAnimationFrame(() => {
            if (firstInputRef.current) {
                firstInputRef.current.focus();
                if (typeof window !== 'undefined' && window.localStorage) {
                    try {
                        const enableLogging = localStorage.getItem('debug.keyboard') === 'true';
                        if (enableLogging) {
                            console.log('[Keyboard] First field focused', {
                                field: 'jobNo',
                                editId: editData.id,
                                hasFocus: document.hasFocus(),
                                visibilityState: document.visibilityState,
                                targetElement: firstInputRef.current ? {
                                    tag: firstInputRef.current.tagName,
                                    type: firstInputRef.current.type || 'N/A',
                                    id: firstInputRef.current.id || 'N/A',
                                    name: firstInputRef.current.name || 'N/A',
                                } : null,
                            });
                        }
                    } catch (e) {
                        // Ignore logging errors
                    }
                }
            }
        });

        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
        // Allow form to settle after reset, then disable edit loading flag
        const timer = setTimeout(() => setIsLoadingEdit(false), 100);
        return () => clearTimeout(timer);
    }, [editData?.id, reset]);

    // Auto-fill consignee when consol === 'Consol' (Inbound)
    const consolValue = watch("consol");
    useEffect(() => {
        // Skip if we're in the process of loading edit data
        if (isLoadingEdit) return;
        // Skip consol-based auto-fill when editing - preserve existing data
        if (isEditing) return;

        const isConsol = consolValue === "Consol" || consolValue === "CONSOL";

        if (isConsol) {
            // Only auto-fill if fields are empty (don't overwrite user input)
            const currentName = watch("consigneeName");
            const currentAddress = watch("consigneeAddress");

            if (!currentName && !currentAddress) {
                setValue("consigneeName", DEFAULT_CONSIGNEE.consigneeName);
                setValue("consigneeAddress", DEFAULT_CONSIGNEE.consigneeAddress);
            }
        } else {
            // When Single is selected, clear defaults (only if they match default values)
            const currentName = watch("consigneeName");
            const currentAddress = watch("consigneeAddress");

            if (currentName === DEFAULT_CONSIGNEE.consigneeName &&
                currentAddress === DEFAULT_CONSIGNEE.consigneeAddress) {
                setValue("consigneeName", "");
                setValue("consigneeAddress", "");
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

    // Helper to close Bootstrap modal using shared utility
    const handleCloseModal = () => {
        reset(initialValues);
        setEditData?.(null);
        closeModalUtil("peAirInCreateJobModal");
        cleanupModalBackdrop();
    };

    // POST API - CREATE
    const createMutation = useMutation({
        mutationFn: createAirInboundJob,

        onSuccess: () => {
            queryClient.invalidateQueries(["pe-ub-air-inbound-master"]);
            notifySuccess("Job Created Successfully");
            refreshKeyboard();
            handleCloseModal();
        },

        onError: (error) => {
            handleProvisionalError(error, "Create Job");
        }
    });


    // PUT API - UPDATE
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateAirInboundJob(id, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["pe-ub-air-inbound-master"]);
            notifySuccess("Job Updated Successfully");
            refreshKeyboard();
            handleCloseModal();
        },

        onError: (error) => {
            handleProvisionalError(error, "Update Job");
        }
    });

    // Form Submit
    const onSubmit = (data) => {

        const toNumberOrNull = (v) => {
            if (v === "" || v === null || v === undefined) return null;
            const n = typeof v === "string" ? Number(v.trim()) : Number(v);
            return Number.isFinite(n) ? n : null;
        };

        // Convert consol string → boolean
        data.consol = data?.consol === "Consol";

        // Keep wtvalPP, coll1, otherPP, coll2 as strings (P or C)
        data.wtvalPP = toNumberOrNull(data?.wtvalPP) || null;
        data.coll1 = toNumberOrNull(data?.coll1) || null;
        data.otherPP = toNumberOrNull(data?.otherPP) || null;
        data.coll2 = toNumberOrNull(data?.coll2) || null;

        // Keep declaredCarriage, declaredCustoms, insurance as strings
        data.declaredCarriage = toNumberOrNull(data?.declaredCarriage) || null;
        data.declaredCustoms = toNumberOrNull(data?.declaredCustoms) || null;
        data.insurance = toNumberOrNull(data?.insurance) ||null;

        // Convert arranged checkbox → 1 or 0
        data.arranged = data?.arranged ? 1 : 0;

        // Convert empty date strings to null
        data.departureDate = data?.departureDate || null;
        data.arrivalDate = data?.arrivalDate || null;
        data.executedDate = data?.executedDate || null;


        // Convert empty master/flight dates to null
        data.masterDate = data?.masterDate || moment().toDate();
        data.flightDate = data?.flightDate || null;
        // Convert pieces to number or null
        data.pieces = toNumberOrNull(data?.pieces);

        // Convert grossWeight to number or null
        data.grossWeight = toNumberOrNull(data?.grossWeight);

        // Convert chargeableWeight to number or null
        data.chargeableWeight = toNumberOrNull(data?.chargeableWeight);

        // Convert rateCharge to number or null
        data.rateCharge = toNumberOrNull(data?.rateCharge);

        // Convert totalCharge to number or null
        data.totalCharge = toNumberOrNull(data?.totalCharge);

        // Convert prepaid/collect fields to number or null
        data.weightPrepaid = toNumberOrNull(data?.weightPrepaid);
        data.weightCollect = toNumberOrNull(data?.weightCollect);
        data.valuationPrepaid = toNumberOrNull(data?.valuationPrepaid);
        data.valuationCollect = toNumberOrNull(data?.valuationCollect);
        data.taxPrepaid = toNumberOrNull(data?.taxPrepaid);
        data.taxCollect = toNumberOrNull(data?.taxCollect);
        data.agentPrepaid = toNumberOrNull(data?.agentPrepaid);
        data.agentCollect = toNumberOrNull(data?.agentCollect);
        data.carrierPrepaid = toNumberOrNull(data?.carrierPrepaid);
        data.carrierCollect = toNumberOrNull(data?.carrierCollect);
        data.totalPrepaid = toNumberOrNull(data?.totalPrepaid);
        data.totalCollect = toNumberOrNull(data?.totalCollect);

        if (isEditing) {
            updateMutation.mutate({
                id: editData?.jobNo,   // or editData?.id
                payload: data,
            });
        } else {
            createMutation.mutate(data);
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




    // Cleanup on modal close
    useEffect(() => {
        const modalElement = document.getElementById("peAirInCreateJobModal");
        if (!modalElement) return;

        const handleHidden = () => {
            reset(initialValues);
            setEditData?.(null);
            cleanupModalBackdrop();
        };

        modalElement.addEventListener("hidden.bs.modal", handleHidden);
        return () => {
            modalElement.removeEventListener("hidden.bs.modal", handleHidden);
        };
    }, []);

    return (
        <>
            <div
                className="modal fade"
                id="peAirInCreateJobModal"
                tabIndex="-1"
                aria-hidden="true"
                data-bs-backdrop="static"
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: "4px" }}>

                        {/* HEADER */}
                        <div className="modal-header">
                            {
                                editData?.id ? <h4 className="fw-bold m-0">Edit Job Creation</h4> : <h4 className="fw-bold m-0">Job Creation</h4>
                            }
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => {
                                    reset(initialValues);
                                    setEditData?.(null);
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
                                            rules={{ required: "Job No is required" }}   // <-- Required rule
                                            render={({ field, fieldState: { error } }) => (
                                                <>
                                                    <input
                                                        className={`form-control ${error ? "is-invalid" : ""}`}
                                                        {...field}
                                                        ref={(el) => {
                                                            firstInputRef.current = el;
                                                            field.ref(el);
                                                        }}
                                                    />
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
                                        <label className="fw-bold">Import</label>
                                        <button className="btn btn-light w-100" type="button">Import</button>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">MAWB No</label>
                                        <Controller
                                            name="mawbNo"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
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
                                        <label className="fw-bold d-flex align-items-center gap-2">
                                            Shipper's Name & Address <Search size={15} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} style={{ cursor: "pointer" }} />
                                        </label>

                                        <Controller
                                            name="shipperName"
                                            control={control}
                                            render={({ field }) => <input className="form-control mb-2" {...field} />}
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
                                        <label className="fw-bold d-flex align-items-center gap-2">
                                            Not Negotiable Air Waybill <Search size={15} onClick={() => { setSearchTarget('airWayBill'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                        </label>

                                        <Controller
                                            name="airWayBill"
                                            control={control}
                                            render={({ field }) => <input className="form-control mb-2" {...field} />}
                                        />



                                        <Controller
                                            name="agentAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    {...field}
                                                ></textarea>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ================= BLOCK 2 — CONSIGNEE + NOTIFY ================= */}
                                <div className="row g-3 mb-4">

                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">
                                            Consignee Name & Address <Search size={15} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                        </label>

                                        <Controller
                                            name="consigneeName"
                                            control={control}
                                            render={({ field }) => <input className="form-control mb-2" {...field} />}
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

                                        {/* Notify Name */}
                                        <Controller
                                            name="notifyName"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} disabled={sameAsConsignee} />
                                            )}
                                        />

                                        {/* Notify Address */}
                                        <Controller
                                            name="notifyAddress"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    {...field}
                                                    disabled={sameAsConsignee}
                                                ></textarea>
                                            )}
                                        />
                                    </div>

                                </div>

                                {/* ================= BLOCK 3 — AGENT + ACCOUNTING ================= */}
                                <div className="row g-4">

                                    {/* LEFT COLUMN */}
                                    <div className="col-md-6">
                                        <label className="fw-bold d-flex align-items-center gap-2">
                                            Issuing Carrier's Agent Name & City <Search size={15} onClick={() => { setSearchTarget('issuingAgent'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                        </label>

                                        <Controller
                                            name="issuingAgent"
                                            control={control}
                                            render={({ field }) => <input className="form-control mb-3" {...field} />}
                                        />

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Agent's IATA Code</label>
                                                <Controller
                                                    name="iataCode"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Account No</label>
                                                <Controller
                                                    name="accountNo"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>

                                        <label className="fw-bold mt-3 d-flex align-items-center gap-2">
                                            Airport of Departure & Requested Routing
                                            <Search size={15} onClick={() => { setSearchTarget("airportDeparture"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                        </label>

                                        <Controller
                                            name="airportDeparture"
                                            control={control}
                                            render={({ field }) => <input className="form-control mb-3" {...field} />}
                                        />

                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <label className="fw-bold small">To</label>
                                                <Controller
                                                    name="to1"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>

                                            <div className="col-md-8">
                                                <label className="fw-bold small">By First Carrier</label>
                                                <Controller
                                                    name="by1"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
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
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Flight No</label>
                                                <Controller
                                                    name="flightNo"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
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
                                                        render={({ field }) => <input className="form-control" {...field} />}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="row g-2 mt-2">
                                            {[
                                                { name: "rto1", label: "To" },
                                                { name: "rby1", label: "By" },
                                                { name: "rto2", label: "To" },
                                                { name: "rby2", label: "By" },
                                            ].map((f, i) => (
                                                <div className="col-md-3" key={i}>
                                                    <label className="fw-bold small">{f.label}</label>
                                                    <Controller
                                                        name={f.name}
                                                        control={control}
                                                        render={({ field }) => <input className="form-control" {...field} />}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Declared Value for Carriage</label>
                                                <Controller
                                                    name="declaredCarriage"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Declared Value for Customs</label>
                                                <Controller
                                                    name="declaredCustoms"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">Amount of Insurance</label>
                                                <Controller
                                                    name="insurance"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="fw-bold">Freight Term</label>
                                                <Controller
                                                    name="freightTerm"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} readOnly />}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ================= BLOCK 4 — PIECES / GOODS ================= */}
                                <div className="row g-3 mt-4 border-top">

                                    <div className="col-md-2">
                                        <label className="fw-bold small">No.of Pieces RCP</label>
                                        <Controller
                                            name="pieces"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Gross Weight</label>
                                        <Controller
                                            name="grossWeight"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-1">
                                        <label className="fw-bold small">Kg/lb</label>
                                        <Controller
                                            name="kgLb"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Rate class</label>
                                        <Controller
                                            name="rateClass"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Chargeable Weight</label>
                                        <Controller
                                            name="chargeableWeight"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Rate / Charge</label>
                                        <Controller
                                            name="rateCharge"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-1 d-flex align-items-center">
                                        <Controller
                                            name="arranged"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="checkbox"
                                                    className="me-2"
                                                    checked={field.value || false}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                        AS
                                    </div>

                                    <div className="col-md-2">
                                        <label className="fw-bold small">Total</label>
                                        <Controller
                                            name="totalCharge"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 border-top">
                                    <label className="fw-bold">
                                        Nature and Quality of Goods (incl. Dimensions or Volume)
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

                                    <div className="col-md-6">
                                        <label className="fw-bold">Weight Charge</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="weightPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="weightCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="fw-bold">Valuation Charge</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="valuationPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="valuationCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="fw-bold">Tax</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="taxPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="taxCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="fw-bold">Total other Charges Due Agent</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="agentPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="agentCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="fw-bold">Total other Charges Due Carrier</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="carrierPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="carrierCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="fw-bold">Total</label>
                                        <div className="row g-2">
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Prepaid</label>
                                                <Controller
                                                    name="totalPrepaid"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small fw-bold">Collect</label>
                                                <Controller
                                                    name="totalCollect"
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </div>
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
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Signature of issuing Carrier</label>
                                        <Controller
                                            name="signature"
                                            control={control}
                                            render={({ field }) => <input className="form-control" {...field} />}
                                        />
                                    </div>
                                </div>

                                {/* BUTTONS */}
                                <div className="modal-footer mt-4">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"
                                        onClick={() => {
                                            reset(initialValues);
                                            setEditData(null);
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
                                // optionally set city into another field if needed
                            } else if (searchTarget === 'airWayBill') {
                                // For AWB we set the AWB number/name field from selected customer name
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
