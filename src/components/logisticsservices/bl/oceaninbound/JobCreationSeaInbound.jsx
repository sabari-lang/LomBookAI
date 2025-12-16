import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Search, Trash } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOceanInboundJob, updateOceanInboundJob } from "./oceanInboundApi";
import { CONTAINER_SIZE_LIST, UNIT_PKG_LIST } from "../../../../utils/unitPkgList";
import moment from "moment";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../common/popup/CustomerSearch";
import { useUnlockInputs } from "../../../../hooks/useUnlockInputs";

const initialValues = {
    // TOP SECTION
    jobNo: "",
    blType: "Master B/L",
    consol: "Consol",
    mblNo: "",
    shipment: "",
    status: "Open",
    branch: "HEAD OFFICE",

    // LEFT column (Shipper / Consignee / Notify)
    shipperName: "",
    shipperAddress: "",
    consigneeName: "LOM LOGISTICS INDIA PVT LTD",
    consigneeAddress:
        "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA\nTEL: 044 66455913 FAX: 044 66455913",

    notifyName: "",
    notifyAddress: "",

    // LEFT lower section
    onBoardDate: "",
    arrivalDate: "",
    precarriageBy: "N.A",
    portDischarge: "",
    freightTerm: "",
    shippingTerm: "",

    // RIGHT stacked blocks
    blNo: "",
    blText: "",
    forDeliveryApplyTo: "",
    forDeliveryApplyTo2: "",
    placeReceipt: "",
    portLoading: "",
    placeDelivery: "",
    finalDestination: "",
    vesselName: "",


    voy: "",
    callSign: "",
    package: "",
    unitPkg: "BALES",
    grossWeight: "",
    unitWeight: "Kgs",
    measurement: "",
    unitCbm: "CBM",

    // Containers dynamic
    containers: [
        {
            containerNo: "",
            size: "20 HC",
            term: "CFS/CFS",
            wgt: "",
            pkg: "",
            sealNo: "",
        },
    ],

    // LAST SECTION
    markNumbers: "",
    descShort: '"SAID TO CONTAIN"',
    descLong: "",

    freightPayable: "",
    originalBL: "",
    place: "",
    dateOfIssue: "",
}

const JobCreationSeaInbound = ({ editData, setEditData }) => {
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        formState: { isDirty },
    } = useForm({
        defaultValues: initialValues,
    });

    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);

    const { fields, append, remove } = useFieldArray({ control, name: "containers" });


    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

    // ✅ Keyboard unlock hook for edit mode
    useUnlockInputs(isEditing);

    console.log("edit data : ", editData)

    // Keep consignee defaulted when consol === 'Consol'
    const consolValue = watch("consol");
    useEffect(() => {
        // Skip if we're in edit mode to preserve existing data
        if (isEditing) return;
        
        if (consolValue === "Consol") {
            setValue("consigneeName", initialValues.consigneeName || "");
            setValue("consigneeAddress", initialValues.consigneeAddress || "");
        } else {
            // when not Consol, clear consignee fields to allow user input
            setValue("consigneeName", "");
            setValue("consigneeAddress", "");
        }
    }, [consolValue, setValue, isEditing]);

    // Edit Form Data
    useEffect(() => {
        if (!editData?.id) return;

        reset({
            ...initialValues, // BASE DEFAULTS
            ...editData,        // OVERRIDE WITH API DATA
            arrivalDate: editData?.arrivalDate
                ? moment(editData.arrivalDate).format("YYYY-MM-DD")
                : "",

            onBoardDate: editData?.onBoardDate
                ? moment(editData.onBoardDate).format("YYYY-MM-DD")
                : "",
            dateOfIssue: editData?.dateOfIssue
                ? moment(editData.dateOfIssue).format("YYYY-MM-DD")
                : "",
            shipperInvoiceDate: editData?.shipperInvoiceDate
                ? moment(editData.shipperInvoiceDate).format("YYYY-MM-DD")
                : "",
        });
    }, [editData?.id]);

    // Helper to close Bootstrap modal
    const closeModal = () => {
        reset(initialValues);
        setEditData?.(null);
        
        const modalElement = document.getElementById("seainCreateJobModal");
        if (modalElement) {
            // Try Bootstrap 5 API first
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                    return;
                }
            }
            // Fallback: use jQuery/bootstrap if available
            if (window.$) {
                window.$(modalElement).modal("hide");
                return;
            }
            // Last resort: trigger close button click
            const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    };

    // POST API 
    const createMutation = useMutation({
        mutationFn: createOceanInboundJob,
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanInboundJobs"]);
            alert("Job Created Successfully");
            closeModal();
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong while creating the job.";

            alert(`Create Failed: ${message}`);
        },
    });

    // PUT API
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateOceanInboundJob(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanInboundJobs"]);
            alert("Job Updated Successfully");
            closeModal();
        },
        onError: (error) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong while updating the job.";

            alert(`Update Failed: ${message}`);
        },
    });





    const addContainer = () =>
        append({ containerNo: "", size: "20 HC", term: "CFS/CFS", wgt: "", pkg: "", sealNo: "" });

    // Form Submit
    const onSubmit = (data) => {
        // Convert Consol => boolean
        data.consol = data?.consol === "Consol";

        // Convert numeric fields
        data.package = data.package ? Number(data.package) : null;

        data.originalBL = data.originalBL ? Number(data.originalBL) : null;
        data.grossWeight = data.grossWeight ? Number(data.grossWeight) : null;
        data.measurement = data.measurement ? Number(data.measurement) : null;

        // Convert containers numeric fields
        data.containers = data.containers.map(c => ({
            ...c,
            wgt: c.wgt ? Number(c.wgt) : null,
            pkg: c.pkg ? Number(c.pkg) : null
        }));

        // Submit WITHOUT dto wrapper
        if (isEditing) {
            updateMutation.mutate({
                id: editData?.jobNo,
                payload: data
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
    };
    return (
        <>
        <div className="modal fade" id="seainCreateJobModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
                <div className="modal-content" style={{ borderRadius: 6 }}>
                    {/* header */}
                    <div className="modal-header">
                        <h4 className="fw-bold m-0">{editData?.id ? "Edit Job Creation" : "Job Creation"}</h4>
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

                    <div className="modal-body" style={{ maxHeight: "82vh", overflowY: "auto" }}>
                        <form onSubmit={handleSubmit(onSubmit)} >
                            {/* TOP TWO SECTIONS UNDER ONE ROW */}
                            <div className="row g-3 mb-3">

                                {/* LEFT SECTION */}
                                <div className="col-md-6">
                                    <div className="row g-3">

                                        {/* Job No / Ref No */}
                                        <div className="col-12">
                                            <label className="fw-bold">Job No/Ref No</label>
                                            <Controller
                                                name="jobNo"
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* M.B/L No */}
                                        <div className="col-12">
                                            <label className="fw-bold">M.B/L No</label>
                                            <Controller
                                                name="mblNo"
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* RIGHT SECTION */}
                                <div className="col-md-6">
                                    <div className="row g-3">

                                        {/* B/L Type */}
                                        <div className="col-md-4">
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

                                        {/* Consol */}
                                        <div className="col-md-4">
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

                                        {/* Import Button */}
                                        <div className="col-md-4">
                                            <label className="fw-bold"> </label> {/* Spacer label for alignment */}
                                            <button type="button" className="btn btn-light w-100">
                                                Import
                                            </button>
                                        </div>

                                        {/* Shipment */}
                                        <div className="col-md-4">
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

                                        {/* Status */}
                                        <div className="col-md-4">
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

                                        {/* Branch */}
                                        <div className="col-md-4">
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

                                    </div>
                                </div>

                            </div>


                            {/* MAIN single row with two big columns (left col-6 : multiple stacked blocks, right col-6 : stacked blocks) */}
                            <div className="row g-3">
                                {/* LEFT column (Shipper, Consignee, Notify, Dates/Terms) */}
                                <div className="col-md-6">
                                    {/* Shipper block */}
                                    <div className="mb-3">
                                        <label className="fw-bold d-flex align-items-center gap-2">Shipper's/ Consignor (Name & Address) <Search size={14} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                        <Controller name="shipperName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                        <Controller name="shipperAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                    </div>

                                    {/* Consignee block */}
                                    <div className="mb-3">
                                        <label className="fw-bold d-flex align-items-center gap-2">Consignee (Name & Address) <Search size={14} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                        <Controller name="consigneeName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                        <Controller name="consigneeAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                    </div>

                                    {/* Notify Party block */}
                                    <div className="mb-3">
                                        <label className="fw-bold d-flex align-items-center gap-2">Notify Party (Name & Address) <Search size={14} onClick={() => { setSearchTarget('notify'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                        <div className="d-flex gap-3 small mb-2">
                                            <label><input type="checkbox" className="me-1" onChange={(e) => handleSameAsConsignee(e.target.checked)} /> SAME AS CONSIGNEE</label>
                 
                                        </div>
                                        
                                        <Controller name="notifyName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                        <Controller name="notifyAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                    </div>

                                    {/* Dates & Terms block (grouped compactly) */}
                                    <div className="mb-3 border-top pt-2">
                                        <div className="row g-2 mb-2 align-items-end">
                                            <div className="col-md-4">
                                                <label className="fw-bold">On Board Date</label>
                                                <Controller name="onBoardDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="fw-bold">Arrival Date</label>
                                                <Controller name="arrivalDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="fw-bold">Precarriage by</label>
                                                <Controller name="precarriageBy" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>
                                        </div>

                                        <div className="row g-2 align-items-end mt-1">
                                            <div className="col-md-4">
                                                <label className="fw-bold">Port of Discharge</label>
                                                <Controller name="portDischarge" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="fw-bold">Freight Term</label>
                                                <Controller name="freightTerm" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="fw-bold">Shipping Term</label>
                                                <Controller
                                                    name="shippingTerm"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select className="form-select" {...field}>
                                                            <option value="">--Select--</option>
                                                            <option value="LCL/LCL">LCL/LCL</option>
                                                            <option value="FCL/FCL">FCL/FCL</option>
                                                            <option value="FCL/LCL">FCL/LCL</option>
                                                        </select>
                                                    )}
                                                />

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT column (B/L, For Delivery, Routing, Measurement/Package) */}
                                <div className="col-md-6">
                                    {/* Bill of Lading block */}
                                    <div className="mb-3">
                                        <label className="fw-bold d-flex align-items-center gap-2">Not Negotiable <span className="fw-bold">Bill of Lading</span> <Search size={14} onClick={() => { setSearchTarget('blNo'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                        <Controller name="blNo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                        <Controller name="blText" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                    </div>

                                    {/* For Delivery block */}
                                    <div className="mb-3">
                                        <label className="fw-bold d-flex align-items-center gap-2">For delivery of goods please apply to <Search size={14} onClick={() => { setSearchTarget('forDelivery'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                        <Controller name="forDeliveryApplyTo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                        <Controller name="forDeliveryApplyTo2" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                    </div>

                                    {/* Routing block (two sub-rows: 4 cols then 3 cols) */}
                                    <div className="mb-3">
                                        <div className="row g-2 mb-2">
                                            <div className="col-md-3">
                                                <label className="fw-bold">Place of Receipt</label>
                                                <Controller name="placeReceipt" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Port of Loading</label>
                                                <Controller name="portLoading" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Place of Delivery</label>
                                                <Controller name="placeDelivery" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Final Destination</label>
                                                <Controller name="finalDestination" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>
                                        </div>

                                        <div className="row g-2 align-items-end mt-1">
                                            <div className="col-md-4">
                                                <label className="fw-bold">Vessel Name</label>
                                                <Controller name="vesselName" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="fw-bold">Voy</label>
                                                <Controller name="voy" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="fw-bold">Call & Sign</label>
                                                <Controller name="callSign" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Package / Unit / Weight / Measurement block */}
                                    <div className="mb-3">
                                        <div className="row g-2 align-items-end">
                                            <div className="col-md-3">
                                                <label className="fw-bold">Package</label>
                                                <Controller name="package" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Unit</label>
                                                <Controller
                                                    name="unitPkg"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select className="form-select" {...field}>
                                                            <option value="">-- Select Unit --</option>
                                                            {UNIT_PKG_LIST?.map((item) => (
                                                                <option key={item} value={item}>
                                                                    {item}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                />

                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Gross Weight</label>
                                                <Controller name="grossWeight" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="fw-bold">Unit</label>
                                                <Controller name="unitWeight" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3 mt-2">
                                                <label className="fw-bold">Measurement</label>
                                                <Controller name="measurement" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-3 mt-2">
                                                <label className="fw-bold">Unit</label>
                                                <Controller name="unitCbm" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Containers header row + dynamic container rows */}
                            <div className="row g-2 mb-3 border-top pt-2">
                                <div className="col-12 d-flex justify-content-between align-items-center mb-2">
                                    <div className="fw-bold">Container Details</div>
                                    <button type="button" className="btn btn-success btn-sm" onClick={addContainer}>+ Container No</button>
                                </div>

                                <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: "20%" }}>Container No</th>
                                            <th style={{ width: "12%" }}>Size</th>
                                            <th style={{ width: "12%" }}>Term</th>
                                            <th style={{ width: "10%" }}>Wgt</th>
                                            <th style={{ width: "15%" }}>Pkg</th>
                                            <th style={{ width: "15%" }}>Seal No</th>
                                            <th style={{ width: "8%" }}>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {fields?.map((f, i) => (
                                            <tr key={f.id}>
                                                {/* Container No */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.containerNo`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control form-control-sm" {...field} />
                                                        )}
                                                    />
                                                </td>

                                                {/* Size */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.size`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <select className="form-select form-select-sm" {...field}>
                                                                <option value="">--Select--</option>
                                                                {CONTAINER_SIZE_LIST?.map((size) => (
                                                                    <option key={size} value={size}>{size}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    />

                                                </td>

                                                {/* Term */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.term`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <select className="form-select form-select-sm" {...field}>
                                                                <option value="">--Select--</option>
                                                                <option value="CFS/CFS">CFS/CFS</option>
                                                                <option value="CY/CY">CY/CY</option>
                                                                <option value="FCL/LCL">FCL/LCL</option>
                                                                <option value="LCL/FCL">LCL/FCL</option>
                                                            </select>
                                                        )}
                                                    />

                                                </td>

                                                {/* Weight */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.wgt`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control form-control-sm" {...field} />
                                                        )}
                                                    />
                                                </td>

                                                {/* Package */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.pkg`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control form-control-sm" {...field} />
                                                        )}
                                                    />
                                                </td>

                                                {/* Seal No */}
                                                <td>
                                                    <Controller
                                                        name={`containers.${i}.sealNo`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input className="form-control form-control-sm" {...field} />
                                                        )}
                                                    />
                                                </td>

                                                {/* Action */}
                                                <td className="text-center">
                                                    {i !== 0 ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => remove(i)}
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>



                            </div>
                            {/* LAST SECTION – TWO SEPARATE BLOCKS IN ONE ROW */}
                            <div className="row g-3 mb-4">

                                {/* LEFT SIDE (col-6) */}
                                <div className="col-md-6">
                                    <div className="row g-3">

                                        {/* Mark & Numbers */}
                                        <div className="col-md-12">
                                            <label className="fw-bold">Mark & Numbers</label>
                                            <Controller
                                                name="markNumbers"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea className="form-control" rows={5} {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* Freight Payable */}
                                        <div className="col-md-6">
                                            <label className="fw-bold">Freight Payable</label>
                                            <Controller
                                                name="freightPayable"
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* No. of Original B/L */}
                                        <div className="col-md-6">
                                            <label className="fw-bold">No. of Original B/L</label>
                                            <Controller
                                                name="originalBL"
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* Place */}
                                        <div className="col-md-6">
                                            <label className="fw-bold">Place</label>
                                            <Controller
                                                name="place"
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* Date of Issue */}
                                        <div className="col-md-6">
                                            <label className="fw-bold">Date of Issue</label>
                                            <Controller
                                                name="dateOfIssue"
                                                control={control}
                                                render={({ field }) => (
                                                    <input type="date" className="form-control" {...field} />
                                                )}
                                            />
                                        </div>

                                    </div>
                                </div>

                                {/* RIGHT SIDE (col-6) */}
                                <div className="col-md-6">
                                    <div className="row g-3">

                                        {/* Small Description */}
                                        <div className="col-md-12">
                                            <label className="fw-bold">Description</label>
                                            <Controller
                                                name="descShort"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea className="form-control" rows={2} {...field} />
                                                )}
                                            />
                                        </div>

                                        {/* Large Description */}
                                        <div className="col-md-12">
                                            <Controller
                                                name="descLong"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea className="form-control" rows={8} {...field} />
                                                )}
                                            />
                                        </div>

                                    </div>
                                </div>

                            </div>


                            <div className="modal-footer mt-3">
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
                            } else if (searchTarget === 'blNo') {
                                setValue("blNo", name);
                                setValue("blText", address);
                            } else if (searchTarget === 'forDelivery') {
                                setValue("forDeliveryApplyTo", name);
                                setValue("forDeliveryApplyTo2", address);
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

export default JobCreationSeaInbound;
