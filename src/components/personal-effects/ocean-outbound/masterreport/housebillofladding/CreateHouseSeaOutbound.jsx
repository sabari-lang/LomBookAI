import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Search, Trash } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUbOceanOutboundHouse, updateUbOceanOutboundHouse } from "../../../../../services/personal-effects/oceanOutbound/peOceanOutboundApi";
import { CONTAINER_SIZE_LIST, UNIT_PKG_LIST } from "../../../../../utils/unitPkgList";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../../common/popup/CustomerSearch";
import { refreshKeyboard } from "../../../../../utils/refreshKeyboard";
import { SHIPMENT_CATEGORY } from "../../../../../constants/shipment";
import { DEFAULT_SHIPPER } from "../../../../../utils/defaultPartyInfo";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../utils/notifications";





const CreateHouseSeaOutbound = ({ editData, setEditData }) => {


    const storedRaw = sessionStorage.getItem("peUbMasterBillOfLaddingData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    const jobNo = storedData?.jobNo;  // ⭐ CORRECT PLACE
    // console.log("ed", editData)

    // Customer Search State
    const [open, setOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState(null);
    const lastAutoFillRef = useRef({ pkg: "", wgt: "" });

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

    // Auto-fill from sessionStorage (master/job data)
    // Map fields from storedData to initialValues
    const initialValues = {
        // TOP / header - Auto-filled from job/master
        jobNo: storedData?.jobNo ?? "",
        blType: "House B/L",
        consol: "Consol",
        mblNo: storedData?.mblNo ?? "",
        hblNo: storedData?.hblNo ?? "",
        shipment: storedData?.shipment ?? "",
        status: "Open",
        branch: storedData?.branch ?? "HEAD OFFICE",

        // LEFT stacked blocks - Auto-filled from job/master
        // shipperName: storedData?.shipperName ?? "",
        // shipperAddress: storedData?.shipperAddress ?? "",
        // consigneeName: storedData?.consigneeName ?? "",
        // consigneeAddress: storedData?.consigneeAddress ?? "",
        // notifyName: storedData?.notifyName ?? "",
        // notifyAddress: storedData?.notifyAddress ?? "",
        shipperName: "",
        shipperAddress: "",
        consigneeName: "",
        consigneeAddress: "",
        notifyName: "",
        notifyAddress: "",
        agentAddress: storedData?.agentAddress ?? "",

        // dates & terms (left) - Auto-filled from job/master
        onBoardDate: formatDateForInput(storedData?.onBoardDate) || null,
        arrivalDate: formatDateForInput(storedData?.arrivalDate) || null,
        precarriageBy: storedData?.precarriageBy ?? "N.A",
        portDischarge: storedData?.portDischarge ?? "",
        freightTerm: storedData?.freightTerm ?? "",
        shippingTerm: storedData?.shippingTerm ?? "",

        // RIGHT stacked blocks (B/L / for delivery / routing) - Auto-filled from job/master
        blNo: storedData?.blNo ?? "",
        blText: storedData?.blText ?? "",
        forDeliveryApplyTo: storedData?.forDeliveryApplyTo ?? "",
        forDeliveryApplyTo2: storedData?.forDeliveryApplyTo2 ?? "",

        placeReceipt: storedData?.placeReceipt ?? "",
        portLoading: storedData?.portLoading ?? "",
        placeDelivery: storedData?.placeDelivery ?? "",
        finalDestination: storedData?.finalDestination ?? "",
        vesselName: storedData?.vesselName ?? "",
        voy: storedData?.voy ?? "",
        callSign: storedData?.callSign ?? "",

        // package/weight/measurement - Auto-filled from job/master
        package: storedData?.package ?? null,
        unitPkg: storedData?.unitPkg ?? "BALES",
        grossWeight: storedData?.grossWeight ?? null,
        unitWeight: storedData?.unitWeight ?? "Kgs",
        measurement: storedData?.measurement ?? null,
        unitCbm: storedData?.unitCbm ?? "CBM",

        // HBL specific invoice fields
        shipperInvoiceNo: "",
        shipperInvoiceDate: null,
        shipperInvoiceAmount: null,

        // Containers dynamic - Auto-filled from job/master containers array
        containers: Array.isArray(storedData?.containers) && storedData.containers.length > 0
            ? storedData.containers.map(cont => ({
                containerNo: cont?.containerNo ?? "",
                size: cont?.size ?? "20 HC",
                term: cont?.term ?? "CFS/CFS",
                wgt: cont?.wgt ?? null,
                pkg: cont?.pkg ?? null,
                sealNo: cont?.sealNo ?? "",
            }))
            : [{
                containerNo: "",
                size: "20 HC",
                term: "CFS/CFS",
                wgt: null,
                pkg: null,
                sealNo: "",
            }],

        // Last section - Auto-filled from job/master
        markNumbers: storedData?.markNumbers ?? "",
        descShort: storedData?.descShort ?? '"SAID TO CONTAIN"',
        descLong: storedData?.descLong ?? "",
        freightPayable: storedData?.freightPayable ?? "",
        originalBL: storedData?.originalBL ?? null,
        place: storedData?.place ?? "",
        dateOfIssue: formatDateForInput(storedData?.dateOfIssue) || null,
        notes: storedData?.notes ?? "",
    }
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

    const { fields, append, remove } = useFieldArray({ control, name: "containers" });

    // Auto-fill Package and Gross Weight into first container row
    const packageValue = watch("package");
    const grossWeightValue = watch("grossWeight");
    useEffect(() => {
      const containers = getValues("containers");
      if (!containers || containers.length === 0) {
        // Initialize containers array if empty
        setValue("containers", [{ containerNo: "", size: "20 HC", term: "CFS/CFS", wgt: "", pkg: "", sealNo: "" }]);
        return;
      }

      const firstContainer = containers[0];
      if (!firstContainer) return;

      // Get current container values (handle null/undefined)
      const currentPkg = firstContainer.pkg ?? "";
      const currentWgt = firstContainer.wgt ?? "";
      
      // Convert package/grossWeight to strings for comparison
      const packageStr = packageValue != null ? String(packageValue) : "";
      const weightStr = grossWeightValue != null ? String(grossWeightValue) : "";

      // Auto-fill package if container is empty or matches last auto-filled value
      if (packageStr && (currentPkg === "" || currentPkg === lastAutoFillRef.current.pkg)) {
        setValue("containers.0.pkg", packageStr);
        lastAutoFillRef.current.pkg = packageStr;
      } else if (!packageStr && currentPkg === lastAutoFillRef.current.pkg) {
        // Clear if source is cleared and it matches last auto-fill
        setValue("containers.0.pkg", "");
        lastAutoFillRef.current.pkg = "";
      }

      // Auto-fill weight if container is empty or matches last auto-filled value
      if (weightStr && (currentWgt === "" || currentWgt === lastAutoFillRef.current.wgt)) {
        setValue("containers.0.wgt", weightStr);
        lastAutoFillRef.current.wgt = weightStr;
      } else if (!weightStr && currentWgt === lastAutoFillRef.current.wgt) {
        // Clear if source is cleared and it matches last auto-fill
        setValue("containers.0.wgt", "");
        lastAutoFillRef.current.wgt = "";
      }
    }, [packageValue, grossWeightValue, setValue, getValues]);

    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

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
            ...initialValues, // BASE DEFAULTS
            ...editData,        // OVERRIDE WITH API DATA
        });
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
    }, [editData?.id]);



    // Auto-update freightTerm based on shipment
    const shipment = watch("shipment");
    useEffect(() => {
        if (!shipment) {
            setValue("freightTerm", "");
            return;
        }

        const isPrepaid = SHIPMENT_CATEGORY.PREPAID.includes(shipment);
        const isCollect = SHIPMENT_CATEGORY.COLLECT.includes(shipment);

        if (isPrepaid) {
            setValue("freightTerm", "FREIGHT PREPAID");
        } else if (isCollect) {
            setValue("freightTerm", "FREIGHT COLLECT");
        } else {
            setValue("freightTerm", "");
        }
    }, [shipment, setValue]);

    const handleSameAsConsignee = (checked) => {
        if (checked) {
            setValue("notifyName", getValues("consigneeName") || "");
            setValue("notifyAddress", getValues("consigneeAddress") || "");
        } else {
            setValue("notifyName", "");
            setValue("notifyAddress", "");
        }
    };

    const addContainer = () =>
        append({ containerNo: "", size: "20 HC", term: "CFS/CFS", wgt: "", pkg: "", sealNo: "" });



    // Helper to close Bootstrap modal
    const closeModal = () => {
        reset(initialValues);
        setEditData(null);

        const modalElement = document.getElementById("seaoutboundCreateHouseModal");
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

    // POST API - UB Ocean Outbound
    const createOceanOutboundHouseMutation = useMutation({
        mutationFn: ({ jobNo, payload }) =>
            createUbOceanOutboundHouse(jobNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["peUbOceanOutboundHouses", jobNo]);
            notifySuccess("UB Ocean Outbound House Created Successfully");
            closeModal();
        },

        onError: (error) => {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong";
            notifyError(`Error: ${msg}`);
        }
    });


    // PUT API - UB Ocean Outbound
    const updateOceanOutboundHouseMutation = useMutation({
        mutationFn: ({ jobNo, hblNo, payload }) =>
            updateUbOceanOutboundHouse(jobNo, hblNo, payload),

        onSuccess: () => {
            queryClient.invalidateQueries(["peUbOceanOutboundHouses", jobNo]);
            notifySuccess("UB Ocean Outbound House Updated Successfully");
            closeModal();
        },

        onError: (error) => {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Something went wrong";
            notifyError(`Error: ${msg}`);
        }
    });



    const onSubmit = (form) => {
        const data = {
            ...form,
            consol: form?.consol === "Consol",

            // date fields -> null if empty
            onBoardDate: form.onBoardDate || null,
            arrivalDate: form.arrivalDate || null,
            dateOfIssue: form.dateOfIssue || null,
            shipperInvoiceDate: form.shipperInvoiceDate || null,

            // numeric fields
            package: form.package ? Number(form.package) : null,
            grossWeight: form.grossWeight ? Number(form.grossWeight) : null,
            measurement: form.measurement ? Number(form.measurement) : null,
            originalBL: form.originalBL ? Number(form.originalBL) : null,
            shipperInvoiceAmount: form.shipperInvoiceAmount ? Number(form.shipperInvoiceAmount) : null,

            // containers numeric fields
            containers: form.containers.map(c => ({
                ...c,
                wgt: c.wgt ? Number(c.wgt) : null,
                pkg: c.pkg ? Number(c.pkg) : null,
            })),
        };

        if (isEditing) {
            updateOceanOutboundHouseMutation.mutate({
                jobNo: editData?.jobNo,
                hblNo: editData?.hblNo, // HBL number
                payload: data,
            });
        } else {
            createOceanOutboundHouseMutation.mutate({
                jobNo,
                payload: data,
            });
        }
    };


    return (
        <>
            <div
                className="modal fade"
                id="seaoutboundCreateHouseModal"
                tabIndex={-1}
                aria-hidden="true"
                data-bs-backdrop="static"
            >
                <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
                    <div className="modal-content" style={{ borderRadius: 6 }}>
                        <div className="modal-header d-flex align-items-center justify-content-between">
                            <h4 className="fw-bold m-0">{editData ? "Edit House Creation" : "House Creation"}</h4>
                            <div className="d-flex gap-2 align-items-center">
                                <button type="button" className="btn btn-light btn-sm">Export</button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => {
                                        reset();
                                        setEditData?.(null);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="modal-body" style={{ maxHeight: "82vh", overflowY: "auto" }}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                {/* TOP: ONE ROW split into two col-6 sections */}
                                <div className="row g-3 mb-3">
                                    {/* LEFT: Job No, M.B/L No, H.B/L No */}
                                    <div className="col-md-6">
                                        <div className="row g-3">
                                            <div className="col-md-12">
                                                <label className="fw-bold">Job No/Ref No</label>
                                                <Controller name="jobNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-12">
                                                <label className="fw-bold">M.B/L No</label>
                                                <Controller name="mblNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>

                                            <div className="col-md-12">
                                                <label className="fw-bold">H.B/L No</label>
                                                <Controller name="hblNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: B/L Type, Consol, Type button, Shipment, Status, Branch */}
                                    <div className="col-md-6">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="fw-bold">B/L Type</label>
                                                <Controller
                                                    name="blType"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select className="form-select" {...field}>
                                                            <option>House B/L</option>
                                                            <option>Master B/L</option>
                                                        </select>
                                                    )}
                                                />
                                            </div>

                                            <div className="col-md-3">
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

                                            <div className="col-md-3">
                                                <label className="fw-bold">Type</label>
                                                <button type="button" className="btn btn-light form-control">Export</button>
                                            </div>

                                            <div className="col-md-6">
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

                                            <div className="col-md-3">
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
                                        </div>
                                    </div>
                                </div>

                                {/* MAIN single row with two big columns (left stacked, right stacked) */}
                                <div className="row g-3">
                                    {/* LEFT column (Shipper, Consignee, Notify, Dates & Terms, Shipper Invoice) */}
                                    <div className="col-md-6">
                                        {/* Shipper */}
                                        <div className="mb-3">
                                            <label className="fw-bold d-flex align-items-center gap-2">Shipper's/ Consignor (Name & Address) <Search size={14} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                            <Controller name="shipperName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                            <Controller name="shipperAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                        </div>

                                        {/* Consignee */}
                                        <div className="mb-3">
                                            <label className="fw-bold d-flex align-items-center gap-2">Consignee (Name & Address) <Search size={14} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                            <Controller name="consigneeName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                            <Controller name="consigneeAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                        </div>

                                        {/* Notify Party */}
                                        <div className="mb-3">
                                            <label className="fw-bold d-flex align-items-center gap-2">Notify Party (Name & Address) <Search size={14} onClick={() => { setSearchTarget('notify'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                            <div className="d-flex gap-3 small mb-2">
                                                <label><input type="checkbox" className="me-1" onChange={(e) => handleSameAsConsignee(e.target.checked)} /> SAME AS CONSIGNEE</label>

                                            </div>

                                            <Controller name="notifyName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                            <Controller name="notifyAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                        </div>

                                        {/* Dates & Terms */}
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
                                                    <label className="fw-bold d-flex align-items-center gap-2">Port of Discharge <Search size={14} onClick={() => { setSearchTarget('portDischarge'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                                    <Controller name="portDischarge" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="fw-bold">Freight Term</label>
                                                    <Controller name="freightTerm" control={control} render={({ field }) => <input className="form-control" {...field} readOnly />} />
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

                                            {/* Shipper Invoice fields */}
                                            <div className="row g-2 align-items-end mt-3">
                                                <div className="col-md-6">
                                                    <label className="fw-bold">Shipper Invoice No</label>
                                                    <Controller name="shipperInvoiceNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="fw-bold">Shipper Invoice Date</label>
                                                    <Controller name="shipperInvoiceDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="fw-bold">Shipper Invoice Amount</label>
                                                    <Controller name="shipperInvoiceAmount" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT column (Bill of Lading, For Delivery, Routing, Vessel, Package, Measurement) */}
                                    <div className="col-md-6">
                                        {/* Bill of Lading */}
                                        <div className="mb-3">
                                            <label className="fw-bold d-flex align-items-center gap-2">Not Negotiable <span className="fw-bold">Bill of Lading</span> <Search size={14} onClick={() => { setSearchTarget('blNo'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                            <Controller name="blNo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                            <Controller name="blText" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                        </div>

                                        {/* For Delivery */}
                                        <div className="mb-3">
                                            <label className="fw-bold d-flex align-items-center gap-2">For delivery of goods please apply to <Search size={14} onClick={() => { setSearchTarget('forDelivery'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                            <Controller name="forDeliveryApplyTo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                            <Controller name="forDeliveryApplyTo2" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                                        </div>

                                        {/* Routing */}
                                        <div className="mb-3">
                                            <div className="row g-2 mb-2">
                                                <div className="col-md-3">
                                                    <label className="fw-bold d-flex align-items-center gap-2">Place of Receipt <Search size={14} onClick={() => { setSearchTarget('placeReceipt'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                                    <Controller name="placeReceipt" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="fw-bold d-flex align-items-center gap-2">Port of Loading <Search size={14} onClick={() => { setSearchTarget('portLoading'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                                    <Controller name="portLoading" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="fw-bold d-flex align-items-center gap-2">Place of Delivery <Search size={14} onClick={() => { setSearchTarget('placeDelivery'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
                                                    <Controller name="placeDelivery" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="fw-bold d-flex align-items-center gap-2">Final Destination <Search size={14} onClick={() => { setSearchTarget('finalDestination'); setOpen(true); }} style={{ cursor: 'pointer' }} /></label>
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

                                        {/* Package / Unit / Weight / Measurement */}
                                        <div className="mb-3">
                                            <div className="row g-2 align-items-end">
                                                <div className="col-md-3">
                                                    <label className="fw-bold">Package</label>
                                                    <Controller name="package" control={control} render={({ field }) => <input className="form-control" {...field} value={field.value ?? ""} />} />
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
                                                    <Controller name="grossWeight" control={control} render={({ field }) => <input className="form-control" {...field} value={field.value ?? ""} />} />
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

                                {/* Containers section */}
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
                                                                <input className="form-control form-control-sm" {...field} value={field.value ?? ""} />
                                                            )}
                                                        />
                                                    </td>

                                                    {/* Package */}
                                                    <td>
                                                        <Controller
                                                            name={`containers.${i}.pkg`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input className="form-control form-control-sm" {...field} value={field.value ?? ""} />
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

                                    {/* Mark & Description (two col-6 blocks under one row) */}
                                    <div className="col-12">
                                        <div className="row g-3">
                                            {/* LEFT */}
                                            <div className="col-md-6">
                                                <label className="fw-bold">Mark & Numbers</label>
                                                <Controller name="markNumbers" control={control} render={({ field }) => <textarea className="form-control" rows={5} {...field} />} />

                                                <div className="row g-2 mt-3">
                                                    <div className="col-md-6">
                                                        <label className="fw-bold">Freight Payable</label>
                                                        <Controller name="freightPayable" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                    </div>

                                                    <div className="col-md-6">
                                                        <label className="fw-bold">No. of Original B/L</label>
                                                        <Controller name="originalBL" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                    </div>

                                                    <div className="col-md-6 mt-2">
                                                        <label className="fw-bold">Place</label>
                                                        <Controller name="place" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                                    </div>

                                                    <div className="col-md-6 mt-2">
                                                        <label className="fw-bold">Date of Issue</label>
                                                        <Controller name="dateOfIssue" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT */}
                                            <div className="col-md-6">
                                                <label className="fw-bold">Description</label>
                                                <Controller name="descShort" control={control} render={({ field }) => <textarea className="form-control mb-2" rows={2} {...field} />} />
                                                <Controller name="descLong" control={control} render={({ field }) => <textarea className="form-control" rows={8} {...field} />} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="modal-footer mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                        onClick={() => {
                                            reset(initialValues);
                                            setEditData?.(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                        disabled={createOceanOutboundHouseMutation.isLoading || updateOceanOutboundHouseMutation.isLoading}
                                    >
                                        {(createOceanOutboundHouseMutation.isLoading || updateOceanOutboundHouseMutation.isLoading) ? (
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
                            const address = cust?.address ?? (cust?.billingAddress?.street1 ? `${cust.billingAddress.street1}${cust.billingAddress.city ? ', ' + cust.billingAddress.city : ''}${cust.billingAddress.state ? ', ' + cust.billingAddress.state : ''}${cust.billingAddress.zip ? ' - ' + cust.billingAddress.zip : ''}` : "");

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
                            } else if (searchTarget === 'placeReceipt') {
                                setValue("placeReceipt", name);
                            } else if (searchTarget === 'portLoading') {
                                setValue("portLoading", name);
                            } else if (searchTarget === 'placeDelivery') {
                                setValue("placeDelivery", name);
                            } else if (searchTarget === 'finalDestination') {
                                setValue("finalDestination", name);
                            } else if (searchTarget === 'portDischarge') {
                                setValue("portDischarge", name);
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

export default CreateHouseSeaOutbound;
