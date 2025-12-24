import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Search, Trash } from "react-bootstrap-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOceanOutboundJob, updateOceanOutboundJob } from "./oceanOutboundApi";
import { CONTAINER_SIZE_LIST, UNIT_PKG_LIST } from "../../../../utils/unitPkgList";
import moment from "moment";

import React, { useEffect, useState, useRef } from "react";
import NewWindow from "react-new-window";
import CustomerSearch from "../../../common/popup/CustomerSearch";
import { refreshKeyboard } from "../../../../utils/refreshKeyboard";
import { closeModal as closeModalUtil, cleanupModalBackdrop } from "../../../../utils/closeModal";
import { SHIPMENT_CATEGORY } from "../../../../constants/shipment";
import { DEFAULT_SHIPPER } from "../../../../utils/defaultPartyInfo";
import { notifySuccess, notifyError, notifyInfo } from "../../../../utils/notifications";
import { applyJobDefaults, applyShipmentTermPaymentLogic, normalizeJobDates } from "../../../../utils/jobDefaults";

const baseInitialValues = {
  // TOP SECTION
  jobNo: "",
  mblNo: "",
  blType: "Master B/L",
  consol: "Consol",
  exportType: "Export",
  shipment: "",
  status: "Open",
  branch: "HEAD OFFICE",
  // LEFT SECTION (Shipper / Consignee / Notify)
  shipperName: "",
  shipperAddress: "",
  consigneeName: "",
  consigneeAddress: "",

  notifyName: "",
  notifyAddress: "",
  agentAddress: "",

  // LEFT LOWER SECTION (Notify + Dates + Terms)
  onBoardDate: null,
  arrivalDate: null,
  precarriageBy: "N.A",
  portDischarge: "",
  freightTerm: "",
  shippingTerm: "",

  // RIGHT SECTION (B/L, Delivery, Ports)
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
  package: null,
  unitPkg: "BALES",
  grossWeight: null,
  unitWeight: "Kgs",
  measurement: null,
  unitCbm: "CBM",

  // CONTAINERS (DYNAMIC ARRAY)
  containers: [
    {
      containerNo: "",
      size: "20 HC",
      term: "CFS/CFS",
      wgt: null,
      pkg: null,
      sealNo: ""
    }
  ],

  // LAST SECTION (Mark & Numbers + Description + Payment)
  markNumbers: "",
  descShort: '"SAID TO CONTAIN"',
  descLong: "",

  freightPayable: "",
  originalBL: null,
  place: "",
  dateOfIssue: null,
  notes: "",
}
const initialValues = applyJobDefaults(baseInitialValues);

const JobCreationSeaOutbound = ({ editData, setEditData }) => {
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
  const shippingTerm = watch("shippingTerm");
  const hideSize = shippingTerm === "LCL/LCL";
  const [open, setOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const lastAutoFillRef = useRef({ pkg: "", wgt: "" });

  const isEditing = Boolean(editData?.id);
  const queryClient = useQueryClient();

  // Edit Form Data - with isLoadingEdit to prevent side-effects from overwriting
  useEffect(() => {
    if (!editData?.id) {
      setIsLoadingEdit(false);
      return;
    }

    setIsLoadingEdit(true);
    const merged = applyShipmentTermPaymentLogic(
      applyJobDefaults({
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
      })
    );
    reset(merged);
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
        onBoardDate: editData?.onBoardDate ? moment(editData.onBoardDate).format("YYYY-MM-DD") : "",
        dateOfIssue: editData?.dateOfIssue ? moment(editData.dateOfIssue).format("YYYY-MM-DD") : "",
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

  // Auto-fill Package and Gross Weight into first container row
  const packageValue = watch("package");
  const grossWeightValue = watch("grossWeight");
  useEffect(() => {
    if (isLoadingEdit) return;

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
  }, [packageValue, grossWeightValue, setValue, getValues, isLoadingEdit]);

  // Helper to close Bootstrap modal using shared utility
  const handleCloseModal = () => {
    reset(initialValues);
    setEditData?.(null);
    closeModalUtil("seaoutCreateJobModal");
    cleanupModalBackdrop();
  };

  // POST API 
  const createMutation = useMutation({
    mutationFn: createOceanOutboundJob,
    onSuccess: () => {
      queryClient.invalidateQueries(["oceanOutboundJobs"]);
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
    mutationFn: ({ id, payload }) => updateOceanOutboundJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["oceanOutboundJobs"]);
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

  const handleSameAsConsignee = (checked) => {
    if (checked) {
      setValue("notifyName", getValues("consigneeName") || "");
      setValue("notifyAddress", getValues("consigneeAddress") || "");
    } else {
      setValue("notifyName", "");
      setValue("notifyAddress", "");
    }
  };

  const handleCopyAs = (checked) => {
    if (checked) {
      setValue("consigneeName", getValues("notifyName") || "");
      setValue("consigneeAddress", getValues("notifyAddress") || "");
    }
  };

  const addContainer = () =>
    append({ containerNo: "", size: "20 HC", term: "CFS/CFS", wgt: "", pkg: "", sealNo: "" });

  // Auto-update freightTerm based on shipment
  const shipment = watch("shipment");
  useEffect(() => {
    if (!shipment) {
      setValue("freightTerm", "");
      applyTermPayments(shipment);
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
    applyTermPayments(shipment);
  }, [shipment, setValue]);

  // Form Submit

  const onSubmit = (formValues) => {
    let payload = applyJobDefaults(formValues);
    payload = applyShipmentTermPaymentLogic(payload);
    // Convert Consol => boolean
    payload.consol = payload?.consol === "Consol";

    // Convert date fields to null if empty
    payload.onBoardDate = payload?.onBoardDate || null;
    payload.arrivalDate = payload?.arrivalDate || null;
    payload.dateOfIssue = payload?.dateOfIssue || null;

    // Convert numeric fields
    payload.package = payload.package ? Number(payload.package) : null;
    payload.grossWeight = payload.grossWeight ? Number(payload.grossWeight) : null;
    payload.originalBL = payload.originalBL ? Number(payload.originalBL) : null;
    payload.measurement = payload.measurement ? Number(payload.measurement) : null;

    // Convert containers numeric fields
    payload.containers = payload.containers.map(c => ({
      ...c,
      wgt: c.wgt ? Number(c.wgt) : null,
      pkg: c.pkg ? Number(c.pkg) : null
    }));

    payload = normalizeJobDates(payload);

    // Submit WITHOUT dto wrapper
    if (isEditing) {
      updateMutation.mutate({
        id: editData?.jobNo,
        payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };


  return (
    <>
      <div className="modal fade" id="seaoutCreateJobModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
          <div className="modal-content" style={{ borderRadius: 6 }}>
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h4 className="fw-bold m-0">{editData?.id ? "Edit Job Creation" : "Job Creation"}</h4>
              <div className="d-flex gap-2 align-items-center">
                <button type="button" className="btn btn-light btn-sm">Export</button>
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
            </div>

            <div className="modal-body" style={{ maxHeight: "82vh", overflowY: "auto" }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* TOP TWO SECTIONS UNDER ONE ROW */}
                {/* TOP TWO SECTIONS UNDER ONE ROW */}
                <div className="row g-3 mb-3">

                  {/* LEFT SECTION */}
                  <div className="col-md-6">
                    <div className="row g-3">

                      {/* Job No */}
                      <div className="col-12">
                        <label className="fw-bold">Job No/Ref No</label>
                        <Controller
                          name="jobNo"
                          control={control}
                          render={({ field }) => <input className="form-control" {...field} />}
                        />
                      </div>

                      {/* M.B/L No */}
                      <div className="col-12">
                        <label className="fw-bold">M.B/L No</label>
                        <Controller
                          name="mblNo"
                          control={control}
                          render={({ field }) => <input className="form-control" {...field} />}
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

                      {/* Export button */}
                      <div className="col-md-4">
                        <label className="fw-bold">Type</label>
                        <button type="button" className="btn btn-light w-100">
                          Export
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


                {/* MAIN single row with two big columns */}
                <div className="row g-3">
                  {/* LEFT column: Shipper, Consignee, Notify, Dates/Terms */}
                  <div className="col-md-6">
                    {/* Shipper */}
                    <div className="mb-3">
                      <label className="fw-bold d-flex align-items-center gap-2">Shipper's/ Consignor (Name & Address) <Search size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchTarget('shipper'); setOpen(true); }} /></label>
                      <Controller name="shipperName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                      <Controller name="shipperAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                    </div>

                    {/* Consignee */}
                    <div className="mb-3">
                      <label className="fw-bold d-flex align-items-center gap-2">Consignee (Name & Address) <Search size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchTarget('consignee'); setOpen(true); }} /></label>
                      <Controller name="consigneeName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                      <Controller name="consigneeAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                    </div>

                    {/* Notify */}
                    <div className="mb-3">
                      <label className="fw-bold d-flex align-items-center gap-2">Notify Party (Name & Address) <Search size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchTarget('notify'); setOpen(true); }} /></label>
                      <div className="d-flex gap-3 small mb-2">
                        <label><input type="checkbox" className="me-1" onChange={(e) => handleSameAsConsignee(e.target.checked)} /> SAME AS CONSIGNEE</label>

                      </div>

                      <Controller name="notifyName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                      <Controller name="notifyAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                    </div>

                    {/* Dates & Terms */}
                    <div className="mb-3 border-top pt-2">
                      <div className="row g-2 mb-2">
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
                          <label className="fw-bold d-flex align-items-center gap-2">
                            Port of Discharge
                            <Search size={14} onClick={() => { setSearchTarget("portDischarge"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                          </label>
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
                    </div>
                  </div>

                  {/* RIGHT column: B/L, For Delivery, Routing, Package/Weight */}
                  <div className="col-md-6">
                    {/* Bill of Lading */}
                    <div className="mb-3">
                      <label className="fw-bold d-flex align-items-center gap-2">Not Negotiable <span className="fw-bold">Bill of Lading</span> <Search size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchTarget('blNo'); setOpen(true); }} /></label>
                      <Controller name="blNo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                      <Controller name="blText" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                    </div>

                    {/* For Delivery */}
                    <div className="mb-3">
                      <label className="fw-bold d-flex align-items-center gap-2">For delivery of goods please apply to <Search size={14} style={{ cursor: 'pointer' }} onClick={() => { setSearchTarget('forDelivery'); setOpen(true); }} /></label>
                      <Controller name="forDeliveryApplyTo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                      <Controller name="forDeliveryApplyTo2" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                    </div>

                    {/* Routing */}
                    <div className="mb-3">
                      <div className="row g-2 mb-2">
                        <div className="col-md-3">
                          <label className="fw-bold d-flex align-items-center gap-2">
                            Place of Receipt
                            <Search size={14} onClick={() => { setSearchTarget("placeReceipt"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                          </label>
                          <Controller name="placeReceipt" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                        </div>

                        <div className="col-md-3">
                          <label className="fw-bold d-flex align-items-center gap-2">
                            Port of Loading
                            <Search size={14} onClick={() => { setSearchTarget("portLoading"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                          </label>
                          <Controller name="portLoading" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                        </div>

                        <div className="col-md-3">
                          <label className="fw-bold d-flex align-items-center gap-2">
                            Place of Delivery
                            <Search size={14} onClick={() => { setSearchTarget("placeDelivery"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                          </label>
                          <Controller name="placeDelivery" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                        </div>

                        <div className="col-md-3">
                          <label className="fw-bold d-flex align-items-center gap-2">
                            Final Destination
                            <Search size={14} onClick={() => { setSearchTarget("finalDestination"); setOpen(true); }} style={{ cursor: 'pointer' }} />
                          </label>
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
                        {!hideSize && <th style={{ width: "12%" }}>Size</th>}
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
                          {!hideSize && (
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
                          )}
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


                </div>

                {/* LAST SECTION */}
                <div className="row g-3 mt-4">

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
                          render={({ field }) => <input className="form-control" {...field} />}
                        />
                      </div>

                      {/* No. of Original B/L */}
                      <div className="col-md-6">
                        <label className="fw-bold">No. of Original B/L</label>
                        <Controller
                          name="originalBL"
                          control={control}
                          render={({ field }) => <input className="form-control" {...field} />}
                        />
                      </div>

                      {/* Place */}
                      <div className="col-md-6">
                        <label className="fw-bold">Place</label>
                        <Controller
                          name="place"
                          control={control}
                          render={({ field }) => <input className="form-control" {...field} />}
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
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => { reset(initialValues); setEditData?.(null); }}>
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

export default JobCreationSeaOutbound;
