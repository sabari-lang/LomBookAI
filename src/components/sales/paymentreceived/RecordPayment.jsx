// RecordPayment.jsx
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getCustomers } from "../api";
import { extractItems } from "../../../utils/extractItems";
import { useQuery } from "@tanstack/react-query";

import { createPaymentReceived, updatePaymentReceived } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";

// Default values including all fields requested
const DEFAULTS = {
  // Common fields
  customerName: "",
  pan: "",
  gstTreatment: "",
  gstin: "",
  placeOfSupply: "",
  descriptionOfSupply: "",

  // Payment details
  amountReceived: "",
  bankCharges: "",
  tax: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentNo: "",
  paymentMode: "",
  depositTo: "",
  referenceNo: "",
  taxDeducted: "no",
  notes: "",
  emailReceipt: false,
  emailId: "",
  attachments: [],

  // UI helpers
  isCustomerAdvance: false,
};

const RecordPayment = () => {
  const { state } = useLocation(); // if editing, the state may contain existing record
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const editId = state?.id;
  const isEditing = Boolean(editId);

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  const [activeTab, setActiveTab] = useState("invoice"); // "invoice" | "advance"
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: DEFAULTS,
  });

  const watched = watch();
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Dynamic customer list using React Query
  const {
    data: fetchedCustomers,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ["customers", "payment-received-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Customers"),
  });

  // Use extractItems utility for customerOptions
  const customerOptions = extractItems(fetchedCustomers) || [];
  const paymentModes = ["Cash", "Bank Transfer", "UPI", "Card", "Cheque"];
  const depositOptions = ["Petty Cash", "Bank Account"];
  const gstTreatments = [
    "Registered Business - Regular",
    "Composition Dealer",
    "Unregistered",
    "Consumer",
  ];
  const placesOfSupply = [
    "[TN] - Tamil Nadu",
    "[KA] - Karnataka",
    "[MH] - Maharashtra",
    "[DL] - Delhi",
  ];
  const taxOptions = ["No Tax", "TDS", "GST 5%", "GST 12%"];

  useEffect(() => {
    // If editing / loaded state from router, merge into form
    if (state) {
      if (state.isCustomerAdvance) setActiveTab("advance");
      const merged = { ...DEFAULTS, ...state };
      if (merged.paymentDate && merged.paymentDate.includes("T")) {
        merged.paymentDate = merged.paymentDate.split("T")[0];
      }
      reset(merged);
      if (merged.attachments) {
        setUploadedFiles(merged.attachments);
        setValue("attachments", merged.attachments);
      }
      return;
    }

    // fresh form
    reset(DEFAULTS);
    setUploadedFiles([]);
    setValue("attachments", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      url: URL.createObjectURL(file),
      type: file.type,
      raw: file,
    }));
    setUploadedFiles((prev) => {
      const updated = [...prev, ...newFiles].slice(0, 5); // limit to 5
      setValue("attachments", updated);
      return updated;
    });
    event.target.value = null;
  };

  const removeFile = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  // CREATE / UPDATE mutations
  const createMutation = useMutation({
    mutationFn: (payload) => createPaymentReceived(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["paymentsReceived"]);
      alert("Payment recorded successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/payments");
    },
    onError: (error) => handleProvisionalError(error, "Record Payment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePaymentReceived(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["paymentsReceived"]);
      alert("Payment updated successfully");
      navigate("/payments");
    },
    onError: (error) => handleProvisionalError(error, "Update Payment"),
  });

  const onSubmit = (data) => {
    // Build payload matching DEFAULTS structure exactly
    const payload = {
      customerName: data?.customerName || "",
      pan: data?.pan || "",
      gstTreatment: data?.gstTreatment || "",
      gstin: data?.gstin || "",
      placeOfSupply: data?.placeOfSupply || "",
      descriptionOfSupply: data?.descriptionOfSupply || "",
      amountReceived: data?.amountReceived || "",
      bankCharges: data?.bankCharges || "",
      tax: data?.tax || "",
      paymentDate: data?.paymentDate ? new Date(data.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      paymentNo: data?.paymentNo || "",
      paymentMode: data?.paymentMode || "",
      depositTo: data?.depositTo || "",
      referenceNo: data?.referenceNo || "",
      taxDeducted: data?.taxDeducted || "no",
      notes: data?.notes || "",
      emailReceipt: Boolean(data?.emailReceipt),
      emailId: data?.emailId || "",
      attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      isCustomerAdvance: activeTab === "advance",
    };

    if (isEditing) {
      console.info('[PAYMENT RECEIVED UPDATE]', {
        id: editId,
        customerName: payload.customerName,
        amountReceived: payload.amountReceived,
        payload: payload
      });
      updateMutation.mutate({ id: editId, payload });
      return;
    }

    console.info('[PAYMENT RECEIVED CREATE]', {
      customerName: payload.customerName,
      amountReceived: payload.amountReceived,
      payload: payload
    });
    createMutation.mutate(payload);
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="container-fluid bg-white p-3 rounded shadow-sm mt-3 small">
      {/* Header with tabs */}
      <div
        className="d-flex justify-content-between align-items-center p-3"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <h6 className="fw-bold mb-0">
          <i className="bi bi-cash-stack me-2"></i>
          <span style={{ textTransform: "none" }}>
            {activeTab === "invoice" ? "Invoice Payment" : "Customer Advance"}
          </span>
        </h6>

        <div className="btn-group btn-group-sm" role="group" aria-label="tabs">
          <button
            type="button"
            className={`btn ${activeTab === "invoice" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setActiveTab("invoice")}
          >
            Invoice Payment
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "advance" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setActiveTab("advance")}
          >
            Customer Advance
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-3">
        {/* Fixed-width centered wrapper — Zoho-like */}
        <div style={{ maxWidth: "860px", margin: "" }}>
          {/* -------------------- INVOICE PAYMENT TAB -------------------- */}
          {activeTab === "invoice" && (
            <>
              {/* Customer Name */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small mb-1">Customer Name*</label>
                <Controller
                  name="customerName"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm" disabled={customerLoading}>
                      <option value="">{customerLoading ? "Loading..." : "Select customer"}</option>
                      {customerOptions.map((c, idx) => {
                        const label = c?.displayName ?? c?.companyName ?? c?.name ?? "Unnamed";
                        const phone = c?.mobilePhone ?? c?.phone ?? c?.workPhone ?? c?.mobile ?? "";
                        const address = [
                          c?.billingAddress?.street1,
                          c?.billingAddress?.street2,
                          c?.billingAddress?.city,
                          c?.billingAddress?.state,
                          c?.billingAddress?.pincode,
                        ].filter(Boolean).join(", ");
                        const optionText = [label, phone, address].filter(Boolean).join(" | ");
                        return (
                          <option key={c?.id ?? idx} value={label ?? ""} title={optionText}>
                            {optionText}
                          </option>
                        );
                      })}
                    </select>
                  )}
                />
                {customerError && <div className="text-danger small mt-1">{String(customerError)}</div>}
                {/* PAN link removed, now direct input above */}
                {/* GST Treatment and Place of Supply inline (small) */}
                <div className="row g-2 mt-2">
                  <div className="col-md-6">
                    <div className="small">GST Treatment:
                      <Controller
                        name="gstTreatment"
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="form-select form-select-sm mt-1">
                            <option value="">Select GST Treatment</option>
                            {gstTreatments.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="small">Place of Supply:
                      <Controller
                        name="placeOfSupply"
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="form-select form-select-sm mt-1">
                            <option value="">Select Place of Supply</option>
                            {placesOfSupply.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Received + Bank Charges */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Amount Received*</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">INR</span>
                    <Controller
                      name="amountReceived"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="number" step="0.01" className="form-control form-control-sm" placeholder="0.00" />
                      )}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Bank Charges (if any)</label>
                  <Controller
                    name="bankCharges"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="number" className="form-control form-control-sm" placeholder="0.00" />
                    )}
                  />
                </div>
              </div>

              {/* Payment Date / Payment # / (empty for alignment) */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Payment Date*</label>
                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="date" className="form-control form-control-sm" />
                    )}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Payment #*</label>
                  <div className="input-group input-group-sm">
                    <Controller
                      name="paymentNo"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="text" className="form-control form-control-sm" />
                      )}
                    />
                    <button type="button" className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-gear small"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Mode / Deposit To */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Payment Mode</label>
                  <Controller
                    name="paymentMode"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    )}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Deposit To*</label>
                  <Controller
                    name="depositTo"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        {depositOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Reference + Tax Deducted radio */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Reference#</label>
                <Controller
                  name="referenceNo"
                  control={control}
                  render={({ field }) => (
                    <input {...field} type="text" className="form-control form-control-sm" placeholder="Enter Reference No" />
                  )}
                />

                <div className="mt-2 small">
                  <span className="fw-semibold me-2">Tax deducted?</span>
                  <Controller
                    name="taxDeducted"
                    control={control}
                    render={({ field }) => (
                      <>
                        <div className="form-check form-check-inline">
                          <input
                            {...field}
                            className="form-check-input"
                            type="radio"
                            value="no"
                            checked={field.value === "no"}
                            onChange={() => field.onChange("no")}
                            id="taxNo"
                          />
                          <label className="form-check-label small" htmlFor="taxNo">No Tax deducted</label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            {...field}
                            className="form-check-input"
                            type="radio"
                            value="yes"
                            checked={field.value === "yes"}
                            onChange={() => field.onChange("yes")}
                            id="taxYes"
                          />
                          <label className="form-check-label small" htmlFor="taxYes">Yes, TDS (Income Tax)</label>
                        </div>
                      </>
                    )}
                  />
                </div>
              </div>

              {/* PAN Field (always visible) */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">PAN</label>
                <Controller
                  name="pan"
                  control={control}
                  render={({ field }) => (
                    <input {...field} type="text" className="form-control form-control-sm" placeholder="Enter PAN" />
                  )}
                />
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Notes (Internal use. Not visible to customer)</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea {...field} rows="3" className="form-control form-control-sm" placeholder="Enter any internal notes..." />
                  )}
                />
              </div>

              {/* ...existing code... */}
            </>
          )}

          {/* -------------------- CUSTOMER ADVANCE TAB -------------------- */}
          {activeTab === "advance" && (
            <>
              {/* Customer Name (full width with PAN/GST info inline) */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small mb-1">Customer Name*</label>
                <Controller
                  name="customerName"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm">
                      <option value="">Select customer</option>
                      {customerOptions.map((c, idx) => {
                        const label = c?.displayName ?? c?.companyName ?? c?.name ?? "Unnamed";
                        return (
                          <option key={c?.id ?? idx} value={label}>{label}</option>
                        );
                      })}
                    </select>
                  )}
                />
                <div className="small text-muted mt-1">PAN: <a href="#" className="text-primary">{watched.pan || "Add PAN"}</a></div>
                <div className="small mt-1">GST Treatment: <span className="text-secondary">{watched.gstTreatment || "-"}</span></div>
                <div className="small">GSTIN: {watched.gstin || "-"}</div>
              </div>

              {/* Place of Supply (full width) */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Place of Supply*</label>
                <Controller
                  name="placeOfSupply"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm">
                      <option value="">Select Place of Supply</option>
                      {placesOfSupply.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                />
              </div>

              {/* Description of Supply (full width) */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Description of Supply</label>
                <Controller
                  name="descriptionOfSupply"
                  control={control}
                  render={({ field }) => (
                    <textarea {...field} rows="3" className="form-control form-control-sm" placeholder="Will be displayed on the Payment Receipt" />
                  )}
                />
              </div>

              {/* Amount Received + Bank Charges (two columns) */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Amount Received*</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">INR</span>
                    <Controller
                      name="amountReceived"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="number" step="0.01" className="form-control form-control-sm" placeholder="0.00" />
                      )}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Bank Charges (if any)</label>
                  <Controller
                    name="bankCharges"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="number" className="form-control form-control-sm" placeholder="0.00" />
                    )}
                  />
                </div>
              </div>

              {/* Tax (full width) */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Tax</label>
                <Controller
                  name="tax"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm">
                      <option value="">Select a Tax</option>
                      {taxOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                />
              </div>

              {/* Payment Date + Payment # */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Payment Date*</label>
                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="date" className="form-control form-control-sm" />
                    )}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Payment #*</label>
                  <Controller
                    name="paymentNo"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="form-control form-control-sm" placeholder="Enter Payment Number" />
                    )}
                  />
                </div>
              </div>

              {/* Payment Mode + Deposit To */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Payment Mode</label>
                  <Controller
                    name="paymentMode"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        {paymentModes.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    )}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-danger fw-semibold small mb-1">Deposit To*</label>
                  <Controller
                    name="depositTo"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        {depositOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Reference#</label>
                <Controller
                  name="referenceNo"
                  control={control}
                  render={({ field }) => (
                    <input {...field} className="form-control form-control-sm" placeholder="Enter Reference No" />
                  )}
                />
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Notes (Internal use. Not visible to customer)</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea {...field} rows="3" className="form-control form-control-sm" />
                  )}
                />
              </div>

              {/* Attachments */}
              <div className="mb-3">
                <label className="form-label fw-semibold small mb-1">Attachments</label>
                <input type="file" multiple className="form-control form-control-sm" onChange={handleFileUpload} />
                <small className="text-muted">You can upload a maximum of 5 files, 5MB each</small>

                {uploadedFiles.length > 0 && (
                  <ul className="list-group mt-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{file.name} ({file.size})</span>
                        <div>
                          <a href={file.url} target="_blank" rel="noreferrer" className="me-3 small">View</a>
                          <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFile(index)}>Remove</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Footer buttons (common) */}
          <div className="d-flex justify-content-start align-items-center mt-3 mb-5">


            <button type="submit" className="btn btn-primary btn-sm px-3 me-2" disabled={isSaving}>
              {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update as Paid" : "Save as Paid")}
            </button>

            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => navigate("/payments")}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecordPayment;
