import React, { useEffect, useState, useRef, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, updateExpense, getVendors } from "../api";
import { getCustomers } from "../../sales/api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";

const makeExpenseDefaults = () => ({
  date: new Date().toISOString().split("T")[0],
  expenseAccount: "",
  itemize: false,
  amount: "",
  currency: "INR",
  paidThrough: "",
  expenseType: "Services",
  sac: "",
  vendor: "",
  vendorId: null,
  gstTreatment: "",
  sourceOfSupply: "",
  destinationOfSupply: "",
  reverseCharge: false,
  tax: "",
  amountIs: "Tax Exclusive",
  invoice: "",
  notes: "",
  customerName: "",
  customerId: null,
  reportingTags: [],
  files: [],
  associateEmployees: "", // Text field for employee names/IDs
  mileage: {
    associateEmployees: false,
    category: "Fuel/Mileage Expense",
    unit: "Km",
    rates: [
      {
        startDate: "",
        currency: "INR",
        rate: ""
      }
    ]
  }
});

const GST_TREATMENT_OPTIONS = [
  "Registered Business - Regular",
  "Registered Business - Composition",
  "Unregistered Business",
  "Consumer",
  "Overseas",
  "SEZ",
  "Deemed Export",
];

const STATE_OPTIONS = [
  "State/Province",
  "[TN] - Tamil Nadu",
  "[KA] - Karnataka",
  "[KL] - Kerala",
  "[MH] - Maharashtra",
];

const TAX_OPTIONS = [
  { label: "Select a Tax", value: 0 },
  { label: "No Tax", value: 0 },
  { label: "GST 5%", value: 5 },
  { label: "GST 12%", value: 12 },
  { label: "GST 18%", value: 18 },
  { label: "GST 28%", value: 28 },
];

const MILEAGE_CATEGORY_OPTIONS = [
  "Fuel/Mileage Expense",
  "Vehicle Travel",
];

const NewExpenses = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("recordExpense");
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const editId = state?.id;
  const isNewFromSource = state?.isNew === true; // conversion flag from source
  const isEditing = Boolean(editId) && !isNewFromSource;

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  const { control, handleSubmit, watch, reset, register, setValue, formState: { errors } } = useForm({
    defaultValues: makeExpenseDefaults(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const expenseType = watch("expenseType");
  const notes = watch("notes") || "";

  // Fetch vendors
  const { data: fetchedVendorsRaw } = useQuery({
    queryKey: ["vendors", "expense-form"],
    queryFn: () => getVendors({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
  });
  const vendorOptions = extractItems(fetchedVendorsRaw) || [];

  // Fetch customers
  const { data: fetchedCustomersRaw } = useQuery({
    queryKey: ["customers", "expense-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
  });
  const customerOptions = extractItems(fetchedCustomersRaw) || [];

  // Initialize form data (following NewBill pattern)
  useEffect(() => {
    if (state) {
      if (isNewFromSource) {
        console.info("📌 [EXPENSE FROM CONVERSION]", {
          source: state?.sourceType ?? null,
          srcId: state?.sourceId ?? null
        });
      }

      // Normalize state data to form state
      const normalized = {
        ...makeExpenseDefaults(),
        ...state,
        date: state.date ? (typeof state.date === 'string' && state.date.includes('T')
          ? new Date(state.date).toISOString().split("T")[0]
          : state.date) : null,
        // Ensure numeric fields are numbers
        amount: parseFloat(state.amount) || 0,
        tax: parseFloat(state.tax) || 0,
        mileage: state.mileage ? {
          ...state.mileage,
          rates: state.mileage.rates?.map((rate) => ({
            ...rate,
            rate: parseFloat(rate.rate) || 0,
          })) || [],
        } : makeExpenseDefaults().mileage,
        files: state.files || state.attachments || [],
        reportingTags: state.reportingTags || [],
      };

      reset(normalized);
      if (normalized.files && normalized.files.length > 0) {
        setUploadedFiles(normalized.files);
        setValue("files", normalized.files);
      }
      return;
    }

    reset(makeExpenseDefaults());
    setUploadedFiles([]);
    setValue("files", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // File upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024); // 10MB limit
    if (validFiles.length < files.length) {
      alert("Some files exceed 10MB limit and were not added.");
    }
    const fileObjects = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Keep file object for potential upload
    }));
    const updated = [...uploadedFiles, ...fileObjects];
    setUploadedFiles(updated);
    setValue("files", updated);
    if (e.target) e.target.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files || []);
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Some files exceed 10MB limit and were not added.");
    }
    const fileObjects = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    const updated = [...uploadedFiles, ...fileObjects];
    setUploadedFiles(updated);
    setValue("files", updated);
  }, [uploadedFiles, setValue]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    setValue("files", updated);
  };

  // Mileage field array
  const { fields: mileageRateFields, append: appendMileageRate, remove: removeMileageRate } = useFieldArray({
    control,
    name: "mileage.rates",
  });

  // Mileage modal handlers
  const handleMileageSave = () => {
    // Mileage state is already in form, just close modal
    setShowMileageModal(false);
  };

  // Create mutation (following NewBill pattern)
  const createMutation = useMutation({
    mutationFn: (payload) => createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      alert("Expense created successfully");
      reset(makeExpenseDefaults());
      setUploadedFiles([]);
      setValue("files", []);
      navigate("/expenses");
    },
    onError: (error) => handleProvisionalError(error, "Create Expense"),
  });

  // Update mutation (following NewBill pattern)
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateExpense(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      alert("Expense updated successfully");
      navigate("/expenses");
    },
    onError: (error) => handleProvisionalError(error, "Update Expense"),
  });

  const onSubmit = (data) => {
    try {
      // Validation
      if (!data.date) {
        handleProvisionalError(new Error("Date is required"), "VALIDATION", "❌ Date is required");
        return;
      }
      if (!data.expenseAccount) {
        handleProvisionalError(new Error("Expense Account is required"), "VALIDATION", "❌ Expense Account is required");
        return;
      }
      if (!data.amount) {
        handleProvisionalError(new Error("Amount is required"), "VALIDATION", "❌ Amount is required");
        return;
      }
      if (!data.expenseType) {
        handleProvisionalError(new Error("Expense Type is required"), "VALIDATION", "❌ Expense Type is required");
        return;
      }
      if (!data.sourceOfSupply) {
        handleProvisionalError(new Error("Source of Supply is required"), "VALIDATION", "❌ Source of Supply is required");
        return;
      }
      if (!data.destinationOfSupply) {
        handleProvisionalError(new Error("Destination of Supply is required"), "VALIDATION", "❌ Destination of Supply is required");
        return;
      }
      if (!data.invoice) {
        handleProvisionalError(new Error("Invoice# is required"), "VALIDATION", "❌ Invoice# is required");
        return;
      }
      if (data.notes && data.notes.length > 500) {
        handleProvisionalError(new Error("Notes cannot exceed 500 characters"), "VALIDATION", "❌ Notes cannot exceed 500 characters");
        return;
      }

      // Build payload matching defaultValues structure exactly
      const payload = {
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        expenseAccount: data?.expenseAccount || "",
        itemize: Boolean(data?.itemize),
        amount: data?.amount ? String(data.amount) : "",
        currency: data?.currency || "INR",
        paidThrough: data?.paidThrough || "",
        expenseType: data?.expenseType || "Services",
        sac: data?.sac || "",
        vendor: data?.vendor || "",
        vendorId: data?.vendorId || null,
        gstTreatment: data?.gstTreatment || "",
        sourceOfSupply: data?.sourceOfSupply || "",
        destinationOfSupply: data?.destinationOfSupply || "",
        reverseCharge: Boolean(data?.reverseCharge),
        tax: data?.tax || "",
        amountIs: data?.amountIs || "Tax Exclusive",
        invoice: data?.invoice || "",
        notes: data?.notes || "",
        customerName: data?.customerName || "",
        customerId: data?.customerId || null,
        reportingTags: Array.isArray(data?.reportingTags) ? data.reportingTags : [],
        files: uploadedFiles.length > 0 ? uploadedFiles : (data?.files || []),
        associateEmployees: data?.associateEmployees || "",
        mileage: data.mileage ? {
          associateEmployees: Boolean(data.mileage.associateEmployees),
          category: data.mileage.category || "Fuel/Mileage Expense",
          unit: data.mileage.unit || "Km",
          rates: (data.mileage.rates || []).map((rate) => ({
            startDate: rate?.startDate || "",
            currency: rate?.currency || "INR",
            rate: rate?.rate || "",
          })),
        } : {
          associateEmployees: false,
          category: "Fuel/Mileage Expense",
          unit: "Km",
          rates: [{ startDate: "", currency: "INR", rate: "" }],
        },
        // Keep backward compatibility
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.files || []),
      };

      if (isEditing && !isNewFromSource) {
        console.info("📝 [EDIT (PUT)] Expense:", { 
          id: editId,
          expenseAccount: payload.expenseAccount,
          amount: payload.amount,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
        return;
      }

      // NEW (POST) - includes conversion from source
      const submissionType = isNewFromSource ? "NEW FROM SOURCE" : "NEW";
      console.info(`📄 [${submissionType} (POST)] Expense`, {
        sourceType: isNewFromSource ? state?.sourceType : null,
        sourceId: isNewFromSource ? state?.sourceId : null,
        expenseAccount: payload.expenseAccount,
        amount: payload.amount,
        payload: payload
      });
      createMutation.mutate(payload);
    } catch (err) {
      console.error("❌ [EXPENSE SUBMIT ERROR]", err);
      handleProvisionalError(err, "Expense Submit", "Failed to submit expense");
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="container-fluid px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center py-3 mb-3">
        <h5 className="fw-semibold m-0">
          {isEditing ? "Edit Expense" : "New Expense"}
        </h5>
        <button
          className="btn btn-light btn-sm border"
          type="button"
          onClick={() => navigate("/expenses")}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "recordExpense" ? "active" : ""}`}
            onClick={() => setActiveTab("recordExpense")}
          >
            Record Expense
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "recordMileage" ? "active" : ""}`}
            onClick={() => setActiveTab("recordMileage")}
          >
            Record Mileage
          </button>
        </li>
      </ul>

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* RECORD EXPENSE TAB */}
        {activeTab === "recordExpense" && (
          <div className="row justify-content-between">
            {/* LEFT SIDE */}
            <div className="col-12 col-md-12 col-lg-6">
              {/* DATE */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">Date*</label>
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: "Date is required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className={`form-control ${errors.date ? "is-invalid" : ""}`}
                    />
                  )}
                />
                {errors.date && <div className="text-danger small">{errors.date.message}</div>}
              </div>

              {/* EXPENSE ACCOUNT */}
              <div className="mb-1">
                <label className="form-label text-danger fw-semibold small">Expense Account*</label>
                <Controller
                  name="expenseAccount"
                  control={control}
                  rules={{ required: "Expense Account is required" }}
                  render={({ field }) => (
                    <select {...field} className={`form-select ${errors.expenseAccount ? "is-invalid" : ""}`}>
                      <option value="">Select an account</option>
                      <option>Office Supplies</option>
                      <option>Utilities</option>
                      <option>Travel Expense</option>
                      <option>Repairs & Maintenance</option>
                    </select>
                  )}
                />
                {errors.expenseAccount && <div className="text-danger small">{errors.expenseAccount.message}</div>}
              </div>

              {/* AMOUNT */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">Amount*</label>
                <div className="input-group">
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select flex-grow-0" style={{ maxWidth: "90px" }}>
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    )}
                  />
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ required: "Amount is required" }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                        placeholder="0.00"
                      />
                    )}
                  />
                </div>
                {errors.amount && <div className="text-danger small">{errors.amount.message}</div>}
              </div>

              {/* PAID THROUGH */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">Paid Through*</label>
                <Controller
                  name="paidThrough"
                  control={control}
                  rules={{ required: "Paid Through is required" }}
                  render={({ field }) => (
                    <select {...field} className={`form-select ${errors.paidThrough ? "is-invalid" : ""}`}>
                      <option value="">Select an account</option>
                      <option>Cash</option>
                      <option>Bank</option>
                      <option>Petty Cash</option>
                    </select>
                  )}
                />
                {errors.paidThrough && <div className="text-danger small">{errors.paidThrough.message}</div>}
              </div>

              {/* EXPENSE TYPE */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">Expense Type*</label>
                <div className="d-flex gap-3">
                  <label className="small">
                    <input
                      type="radio"
                      {...register("expenseType", { required: "Expense Type is required" })}
                      value="Goods"
                      checked={expenseType === "Goods"}
                    />
                    &nbsp;Goods
                  </label>
                  <label className="small">
                    <input
                      type="radio"
                      {...register("expenseType")}
                      value="Services"
                      checked={expenseType === "Services"}
                    />
                    &nbsp;Services
                  </label>
                </div>
                {errors.expenseType && <div className="text-danger small">{errors.expenseType.message}</div>}
              </div>

              {/* SAC */}
              {expenseType === "Services" && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold">SAC</label>
                  <Controller
                    name="sac"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control" />}
                  />
                </div>
              )}

              {/* VENDOR */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Vendor</label>
                <div className="input-group">
                  <Controller
                    name="vendor"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select">
                        <option value="">Select a vendor</option>
                        {vendorOptions.map((v) => (
                          <option key={v.id} value={v.displayName || v.vendorName || v.name}>
                            {v.displayName || v.vendorName || v.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button type="button" className="btn btn-primary">
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>

              {/* GST TREATMENT */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">GST Treatment*</label>
                <Controller
                  name="gstTreatment"
                  control={control}
                  rules={{ required: "GST Treatment is required" }}
                  render={({ field }) => (
                    <select {...field} className={`form-select ${errors.gstTreatment ? "is-invalid" : ""}`}>
                      <option value="">Select GST Treatment</option>
                      {GST_TREATMENT_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.gstTreatment && <div className="text-danger small">{errors.gstTreatment.message}</div>}
              </div>

              {/* SOURCE / DESTINATION OF SUPPLY */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-danger fw-semibold small">Source of Supply*</label>
                  <Controller
                    name="sourceOfSupply"
                    control={control}
                    rules={{ required: "Source of Supply is required" }}
                    render={({ field }) => (
                      <select {...field} className={`form-select ${errors.sourceOfSupply ? "is-invalid" : ""}`}>
                        {STATE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.sourceOfSupply && <div className="text-danger small">{errors.sourceOfSupply.message}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-danger fw-semibold small">Destination of Supply*</label>
                  <Controller
                    name="destinationOfSupply"
                    control={control}
                    rules={{ required: "Destination of Supply is required" }}
                    render={({ field }) => (
                      <select {...field} className={`form-select ${errors.destinationOfSupply ? "is-invalid" : ""}`}>
                        {STATE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.destinationOfSupply && <div className="text-danger small">{errors.destinationOfSupply.message}</div>}
                </div>
              </div>

              {/* REVERSE CHARGE */}
              <div className="form-check mb-3">
                <Controller
                  name="reverseCharge"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label ms-2 small">
                  This transaction is applicable for reverse charge
                </label>
              </div>

              {/* TAX */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Tax</label>
                <Controller
                  name="tax"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="form-select"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    >
                      {TAX_OPTIONS?.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* AMOUNT IS */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Amount Is</label>
                <div className="d-flex gap-3">
                  <label className="small">
                    <input
                      type="radio"
                      {...register("amountIs")}
                      value="Tax Inclusive"
                      checked={watch("amountIs") === "Tax Inclusive"}
                    />
                    &nbsp;Tax Inclusive
                  </label>
                  <label className="small">
                    <input
                      type="radio"
                      {...register("amountIs")}
                      value="Tax Exclusive"
                      checked={watch("amountIs") === "Tax Exclusive"}
                    />
                    &nbsp;Tax Exclusive
                  </label>
                </div>
              </div>

              {/* INVOICE# */}
              <div className="mb-3">
                <label className="form-label text-danger fw-semibold small">Invoice#*</label>
                <Controller
                  name="invoice"
                  control={control}
                  rules={{ required: "Invoice# is required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className={`form-control ${errors.invoice ? "is-invalid" : ""}`}
                    />
                  )}
                />
                {errors.invoice && <div className="text-danger small">{errors.invoice.message}</div>}
              </div>

              {/* NOTES */}
              <div className="mb-4">
                <label className="form-label small fw-semibold">Notes</label>
                <Controller
                  name="notes"
                  control={control}
                  rules={{ maxLength: { value: 500, message: "Notes cannot exceed 500 characters" } }}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className={`form-control ${errors.notes ? "is-invalid" : ""}`}
                      rows="2"
                      placeholder="Max. 500 characters"
                      maxLength={500}
                    />
                  )}
                />
                <div className="d-flex justify-content-between">
                  {errors.notes && <div className="text-danger small">{errors.notes.message}</div>}
                  <div className="text-muted small ms-auto">{notes.length}/500</div>
                </div>
              </div>

              <hr />

              {/* CUSTOMER NAME */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Customer Name</label>
                <div className="input-group">
                  <Controller
                    name="customerName"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select">
                        <option value="">Select or add a customer</option>
                        {customerOptions.map((c) => (
                          <option key={c.id} value={c.customerName || c.name || c.displayName}>
                            {c.customerName || c.name || c.displayName}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button className="btn btn-primary" type="button">
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>

              {/* ASSOCIATE EMPLOYEES */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Associate Employees</label>
                <Controller
                  name="associateEmployees"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="form-control"
                      placeholder="Enter employee names or IDs (comma-separated)"
                    />
                  )}
                />
                <small className="text-muted">Enter employee names or IDs separated by commas</small>
              </div>

              {/* REPORTING TAGS */}
              <div className="mb-4">
                <label className="form-label small fw-semibold">Reporting Tags</label>
                <div>
                  <a className="small text-primary" style={{ cursor: "pointer" }}>
                    <i className="bi bi-tag"></i> Associate Tags
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE UPLOAD BOX - COMMENTED OUT */}
            {/* <div className="col-12 col-md-12 col-lg-4 mt-4 mt-lg-0 d-flex justify-content-center">
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border border-2 rounded text-center p-4 w-100"
                style={{
                  borderStyle: "dashed",
                  minHeight: "260px",
                  cursor: "pointer"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <i className="bi bi-image fs-1 text-primary"></i>
                <p className="fw-semibold mt-2">Drag or Drop your Receipts</p>
                <p className="text-muted small">Maximum file size allowed is 10MB</p>

                <button
                  type="button"
                  className="btn btn-light border px-4 mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <i className="bi bi-upload"></i> Upload your Files
                </button>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Uploaded files:</small>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="text-truncate" style={{ maxWidth: "200px" }}>{file.name}</span>
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div> */}
          </div>
        )}

        {/* RECORD MILEAGE TAB */}
        {activeTab === "recordMileage" && (
          <div className="row">
            <div className="col-12 col-md-8 col-lg-6 mx-auto">
              <div className="card p-4 shadow-sm">
                <button
                  type="button"
                  className="btn btn-primary btn-sm mb-3"
                  onClick={() => setShowMileageModal(true)}
                >
                  Set your mileage preferences
                </button>
                <p className="text-muted small">
                  Configure your mileage preferences to automatically calculate mileage expenses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MILEAGE PREFERENCES MODAL */}
        {showMileageModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              background: "rgba(0,0,0,0.5)",
              zIndex: 1050,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowMileageModal(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Set your mileage preferences</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMileageModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="form-check mb-4">
                    <Controller
                      name="mileage.associateEmployees"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="checkbox"
                          className="form-check-input"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                    <label className="form-check-label ms-2">
                      Associate employees to expenses
                    </label>
                  </div>

                  <h6 className="fw-bold">Mileage Preference</h6>

                  {/* Default Category */}
                  <div className="mt-3 mb-3">
                    <label className="form-label small fw-semibold">Default Mileage Category</label>
                    <Controller
                      name="mileage.category"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="form-select">
                          {MILEAGE_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  {/* Default Unit */}
                  <label className="form-label small fw-semibold">Default Unit</label>
                  <div className="d-flex gap-3 mb-4">
                    <label className="small">
                      <input
                        type="radio"
                        {...register("mileage.unit")}
                        value="Km"
                        checked={watch("mileage.unit") === "Km"}
                      />
                      &nbsp;Km
                    </label>
                    <label className="small">
                      <input
                        type="radio"
                        {...register("mileage.unit")}
                        value="Mile"
                        checked={watch("mileage.unit") === "Mile"}
                      />
                      &nbsp;Mile
                    </label>
                  </div>

                  <h6 className="fw-bold mt-3">MILEAGE RATES</h6>

                  <p className="text-muted small">
                    Any mileage expense recorded on or after the start date will have the corresponding mileage rate. You can create a default rate (created without specifying a date), which will be applicable for mileage expenses recorded before the initial start date.
                  </p>

                  <table className="table table-borderless align-middle">
                    <thead>
                      <tr>
                        <th className="small text-muted">START DATE</th>
                        <th className="small text-muted">MILEAGE RATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mileageRateFields.map((field, idx) => (
                        <tr key={field.id}>
                          <td style={{ width: "40%" }}>
                            <Controller
                              name={`mileage.rates.${idx}.startDate`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="date"
                                  placeholder="dd/MM/yyyy"
                                  className="form-control form-control-sm"
                                />
                              )}
                            />
                          </td>
                          <td className="d-flex gap-2">
                            <Controller
                              name={`mileage.rates.${idx}.currency`}
                              control={control}
                              render={({ field }) => (
                                <select {...field} className="form-select form-select-sm" style={{ maxWidth: 100 }}>
                                  <option>INR</option>
                                  <option>USD</option>
                                </select>
                              )}
                            />
                            <Controller
                              name={`mileage.rates.${idx}.rate`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  className="form-control form-control-sm"
                                  placeholder="Rate"
                                />
                              )}
                            />
                          </td>
                          <td>
                            {mileageRateFields.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeMileageRate(idx)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <a
                    className="text-primary small d-inline-block mb-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => appendMileageRate({ startDate: "", currency: "INR", rate: "" })}
                  >
                    + Add Mileage Rate
                  </a>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleMileageSave}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMileageModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAVE BUTTONS (only for Record Expense tab) */}
        {activeTab === "recordExpense" && (
          <div className="mt-4 mb-5">
            <button
              type="submit"
              className="btn btn-primary btn-sm me-2"
              disabled={isSaving}
            >
              {isSaving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update Expense"
                  : "Save Expense"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/expenses")}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewExpenses;
