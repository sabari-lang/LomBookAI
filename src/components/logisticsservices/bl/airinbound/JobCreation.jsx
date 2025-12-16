import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Search, X } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAirInboundJob, updateAirInboundJob } from "./Api";
import moment from "moment/moment";
import { handleProvisionalError } from "../../../../utils/handleProvisionalError";

import NewWindow from "react-new-window";
import CustomerSearch from "../../../common/popup/CustomerSearch";
import { useUnlockInputs } from "../../../../hooks/useUnlockInputs";



const initialValues = {
    jobNo: "",
    blType: "Master B/L",
    consol: "Consol",
    importType: "Import",
    mawbNo: "",
    shipment: "",
    status: "Open",
    branch: "HEAD OFFICE",

    shipperName: "",
    shipperAddress: "",
    airWayBill: "",
    agentAddress: "",
    consigneeName: "LOM LOGISTICS INDIA PVT LTD",
    consigneeAddress:
        "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA\nTEL: 044 66455913 FAX: 044 66455913",

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
    departureDate: "",
    arrivalDate: "",
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

    pieces: "",
    grossWeight: "",
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: "",
    rateCharge: "",
    arranged: false,
    totalCharge: "",

    natureGoods: "",

    weightPrepaid: "",
    weightCollect: "",
    valuationPrepaid: "",
    valuationCollect: "",
    taxPrepaid: "",
    taxCollect: "",
    agentPrepaid: "",
    agentCollect: "",
    carrierPrepaid: "",
    carrierCollect: "",
    totalPrepaid: "",
    totalCollect: "",

    executedDate: "",
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",
};


const JobCreation = ({ onClose, editData, setEditData }) => {
    // shipperName/shipperAddress are stored in react-hook-form via Controllers
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);

    const { register, handleSubmit, reset, control, watch, setValue } = useForm({
        defaultValues: initialValues,
    });
    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

    // ✅ Keyboard unlock hook for edit mode
    useUnlockInputs(isEditing);

    /* ------------------------------------------
    3️⃣ EDIT: MERGE DEFAULTS + API DATA
 ------------------------------------------- */
    useEffect(() => {
        if (!editData?.id) return;

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
    }, [editData?.id]);

    // Keep consignee defaulted when consol === 'Consol'
    const consolValue = watch("consol");
    useEffect(() => {
        if (consolValue === "Consol") {
            setValue("consigneeName", initialValues.consigneeName || "");
            setValue("consigneeAddress", initialValues.consigneeAddress || "");
        } else {
            // when not Consol, clear consignee fields to allow user input
            setValue("consigneeName", "");
            setValue("consigneeAddress", "");
        }
    }, [consolValue, setValue]);

    // POST API - CREATE
    const createMutation = useMutation({
        mutationFn: createAirInboundJob,

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundJobs"]);
            alert("Job Created Successfully");
            reset(initialValues);
            onClose();
        },

        onError: (error) => {
            handleProvisionalError(error, "Create Job");
        }
    });


    // PUT API - UPDATE
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateAirInboundJob(id, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["airInboundJobs"]);
            alert("Job Updated Successfully");
            onClose();
            reset(initialValues);
        },

        onError: (error) => {
            handleProvisionalError(error, "Update Job");
        }
    });

    // Form Submit
    const onSubmit = (data) => {
        // Convert consol string → boolean
        data.consol = data?.consol === "Consol";

        // Convert wtvalPP → number or null
        data.wtvalPP = data?.wtvalPP ? Number(data.wtvalPP) : null;

        // Convert coll1 → number or null
        data.coll1 = data?.coll1 ? Number(data.coll1) : null;

        // Convert otherPP → number or null
        data.otherPP = data?.otherPP ? Number(data.otherPP) : null;

        // Convert coll2 → number or null
        data.coll2 = data?.coll2 ? Number(data.coll2) : null;

        // Convert declaredCarriage → number or null
        data.declaredCarriage = data?.declaredCarriage
            ? Number(data.declaredCarriage)
            : null;

        // Convert declaredCustoms → number or null
        data.declaredCustoms = data?.declaredCustoms
            ? Number(data.declaredCustoms)
            : null;

        // Convert insurance → number or null
        data.insurance = data?.insurance ? Number(data.insurance) : null;

        // Convert arranged checkbox → 1 or 0
        data.arranged = data?.arranged ? 1 : 0;

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
        if (checked) {
            const consigneeName = watch("consigneeName");
            const consigneeAddress = watch("consigneeAddress");

            setValue("notifyName", consigneeName || "");
            setValue("notifyAddress", consigneeAddress || "");
        } else {
            setValue("notifyName", "");
            setValue("notifyAddress", "");
        }
    }




    return (
        <>

            <div
                className="modal fade show d-block"
                style={{ background: "rgba(0,0,0,0.45)" }}
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: "4px" }}>

                        {/* HEADER */}
                        <div className="modal-header d-flex justify-content-between">
                            {
                                editData?.id ? <>        <h4 className="fw-bold m-0">Edit Job Creation</h4></> : <>        <h4 className="fw-bold m-0">Job Creation</h4></>
                            }
                            <button className="btn" onClick={onClose}>
                                <X size={22} />
                            </button>
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
                                                    <input className="form-control" {...field} />
                                                    {error && <span className="text-danger small">{error.message}</span>}
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
                                                Notify Name & Address <Search size={15} onClick={() => { setSearchTarget('notify'); setOpen(true); }} style={{ cursor: 'pointer' }} />
                                            </label>

                                            {/* SAME AS CONSIGNEE */}
                                            <label className="fw-bold small mb-0 d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    className="me-2"
                                                    onChange={(e) => handleSameAsConsignee(e.target.checked)}
                                                />
                                                SAME AS CONSIGNEE
                                            </label>
                                        </div>

                                        {/* Notify Name */}
                                        <Controller
                                            name="notifyName"
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control mb-2" {...field} />
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
                                            Airport of Departure & Requested Routing <Search size={15} />
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
                                                    Airport of Destination <Search size={15} />
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
                                                    render={({ field }) => <input className="form-control" {...field} />}
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
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        onClose();
                                        reset();
                                        setEditData(null)
                                    }}>
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
