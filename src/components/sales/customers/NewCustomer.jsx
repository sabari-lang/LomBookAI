import React, { useEffect, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { createCustomer, updateCustomer } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { refreshKeyboard } from "../../../utils/refreshKeyboard";
import { notifySuccess } from "../../../utils/notifications";

const NewCustomer = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const initialValues = {
    customerType: "",
    salutation: "",
    firstName: "",
    lastName: "",
    companyName: "",
    displayName: "",
    email: "",
    workPhone: "",
    mobilePhone: "",
    customerLanguage: "",
    pan: "",
    gstTreatment: "",
    placeOfSupply: "",
    taxPreference: "",
    currency: "",
    accountsReceivable: "",
    openingBalance: 0,
    paymentTerms: "",
    allowPortal: false,
    portalLanguage: "",
    documents: [],
    websiteUrl: "",
    department: "",
    designation: "",
    xUrl: "",
    skype: "",
    facebook: "",
    billingAddress: {
      attention: "",
      country: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      fax: "",
    },
    shippingAddress: {
      attention: "",
      country: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      fax: "",
    },
    contactPersons: [
      {
        salutation: "",
        firstName: "",
        lastName: "",
        emailAddress: "",
        workPhone: "",
        mobile: "",
      },
    ],
    customFields: [],
    reportingTags: [],
    remarks: "",
  };

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: initialValues,
    mode: "onChange",
    shouldUnregister: false, // RHF best practice: keep fields registered to prevent remount issues
  });

  const editId = state?.id;
  const isEditing = Boolean(editId);

  // Ref for first text input field (customerType)
  const firstInputRef = useRef(null);

  // Time-based guard to prevent StrictMode immediate duplicates (250ms window)
  // But allows every edit entry (not session-based blocking)
  const lastResetRef = useRef({ editId: null, timestamp: 0 });

  // RHF best practice: useFieldArray hook must be called before useEffect that uses replace()
  const { fields: contactFields, append, remove, replace } = useFieldArray({
    control,
    name: "contactPersons",
    // RHF best practice: use replace() or reset({ contactPersons }) instead of repeated setValue
  });

  // Populate edit mode values using ONLY state + explicit first field focus
  useEffect(() => {
    if (!isEditing) {
      reset(initialValues);
      lastResetRef.current = { editId: null, timestamp: 0 };
      return;
    }

    // Time-based guard: only block immediate duplicates (StrictMode), not next edit
    const now = Date.now();
    const lastReset = lastResetRef.current;
    if (lastReset.editId === editId && (now - lastReset.timestamp) < 250) {
      return; // Immediate duplicate (StrictMode)
    }

    lastResetRef.current = { editId, timestamp: now };

    if (state) {
      // Batch form population: single reset() instead of multiple setValue calls
      // Include ALL nested objects/arrays in reset to prevent remount issues
      const contactPersons = state?.contactPersons?.length > 0
        ? state?.contactPersons
        : initialValues?.contactPersons;
      
      reset({
        ...initialValues,
        ...state,

        billingAddress: {
          ...initialValues?.billingAddress,
          ...(state?.billingAddress || {}),
        },

        shippingAddress: {
          ...initialValues.shippingAddress,
          ...(state?.shippingAddress || {}),
        },

        contactPersons: contactPersons, // Include in reset
        documents: state?.documents || initialValues?.documents || [], // Include in reset
        customFields: state?.customFields || initialValues?.customFields || [], // Include in reset
        reportingTags: state?.reportingTags || initialValues?.reportingTags || [], // Include in reset
      });
      
      // RHF best practice: use replace() for useFieldArray after reset() to ensure field array is properly updated
      // This prevents remount issues with useFieldArray
      if (contactPersons && contactPersons.length > 0) {
        requestAnimationFrame(() => {
          replace(contactPersons);
        });
      }

      // Explicit first field focus on every edit entry (session-based, not just first time)
      // Use requestAnimationFrame to ensure DOM is ready after reset()
      requestAnimationFrame(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              const enableLogging = localStorage.getItem('debug.keyboard') === 'true';
              if (enableLogging) {
                console.log('[Keyboard] First field focused', {
                  field: 'customerType',
                  editId,
                  hasFocus: document.hasFocus(),
                  visibilityState: document.visibilityState,
                  targetElement: {
                    tag: firstInputRef.current.tagName,
                    type: firstInputRef.current.type || 'N/A',
                    id: firstInputRef.current.id || 'N/A',
                    name: firstInputRef.current.name || 'N/A',
                  },
                });
              }
            } catch (e) {
              // Ignore logging errors
            }
          }
        }
      });

      // Call refreshKeyboard after form values are populated (ensures OS focus + soft recovery)
      refreshKeyboard();
    }
  }, [isEditing, editId, state, reset, replace]);

  const [activeTab, setActiveTab] = useState("other");

  const countries = ["India", "United States", "Germany"];
  const states = ["Tamil Nadu", "Karnataka", "California"];

  const copyBillingToShipping = () => {
    const billing = getValues("billingAddress");
    setValue("shippingAddress", { ...billing });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const meta = files.map((f) => ({ name: f.name, size: f.size, file: f }));
    setValue("documents", meta, { shouldDirty: true });
  };

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      notifySuccess("Customer created successfully");
      reset(initialValues);
      refreshKeyboard();
      navigate("/viewcustomer");
    },
    onError: (error) => handleProvisionalError(error, "Create Customer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      notifySuccess("Customer updated successfully");
      refreshKeyboard();
      navigate("/viewcustomer");
    },
    onError: (error) => handleProvisionalError(error, "Update Customer"),
  });

  const onSubmit = (data) => {
    // Normalize data before submission
    const payload = {
      ...data,
      // Ensure openingBalance is a number
      openingBalance: typeof data?.openingBalance === 'number' 
        ? data.openingBalance 
        : Number(data?.openingBalance) || 0,
      // Ensure boolean values
      allowPortal: Boolean(data?.allowPortal),
      // Clean up empty string fields
      ...(data?.email?.trim() ? { email: data.email.trim() } : {}),
      ...(data?.websiteUrl?.trim() ? { websiteUrl: data.websiteUrl.trim() } : {}),
      ...(data?.pan?.trim() ? { pan: data.pan.trim() } : {}),
    };

    // Remove empty string fields that should be null/undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || (Array.isArray(payload[key]) && payload[key].length === 0)) {
        if (key !== 'documents' && key !== 'customFields' && key !== 'reportingTags' && key !== 'contactPersons') {
          delete payload[key];
        }
      }
    });

    if (isEditing) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  const customerType = watch("customerType");
  const contactPersons = watch("contactPersons");

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4">
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0, 0, 0, 0.10)",
        }}
      >
        <h4 className="mb-0"><i className="fa fa-user me-2" aria-hidden="true"></i>{isEditing ? "Edit Customer" : "New Customer"}</h4>
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent"
          style={{ fontSize: "22px", lineHeight: 1, color: "red" }}
          onClick={() => navigate("/viewcustomer")}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* ========================== BASIC INFO ========================== */}
        <div className="row mb-3 align-items-center">
          <label className="col-sm-2 col-form-label text-danger">Customer Type*</label>
          <div className="col-sm-10 d-flex gap-4">
            <Controller
              name="customerType"
              control={control}
              rules={{ required: "Customer Type is required" }}
              render={({ field }) => (
                <input
                  {...field}
                  ref={(el) => {
                    firstInputRef.current = el;
                    field.ref(el);
                  }}
                  type="text"
                  className={`form-control ${errors.customerType ? "is-invalid" : ""}`}
                  placeholder="Enter Customer Type"
                />
              )}
            />
            {errors.customerType && (
              <span className="text-danger small d-block mt-1">
                {errors.customerType.message}
              </span>
            )}
          </div>
        </div>

        {/* Primary Contact */}
        <div className="row mb-3 align-items-center">
          <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
            Primary Contact <i className="bi bi-info-circle text-muted"></i>
          </label>
          <div className="col-sm-10">
            <div className="row g-2">
              <div className="col-sm-2">
                <Controller
                  name="salutation"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm">
                      <option>Salutation</option>
                      <option>Mr.</option>
                      <option>Ms.</option>
                      <option>Mrs.</option>
                      <option>Dr.</option>
                    </select>
                  )}
                />
              </div>
              <div className="col-sm-3">
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      placeholder="First Name"
                      className="form-control form-control-sm"
                    />
                  )}
                />
              </div>
              <div className="col-sm-3">
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      placeholder="Last Name"
                      className="form-control form-control-sm"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label text-danger">Company Name*</label>
          <div className="col-sm-4">
            <Controller
              name="companyName"
              control={control}
              rules={{ required: "Company Name is required" }}
              render={({ field }) => (
                <input
                  {...field}
                  className={`form-control form-control-sm ${errors.companyName ? "is-invalid" : ""}`}
                />
              )}
            />
            {errors.companyName && (
              <span className="text-danger small d-block mt-1">
                {errors.companyName.message}
              </span>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label text-danger">
            Display Name*
          </label>
          <div className="col-sm-4">
            <Controller
              name="displayName"
              control={control}
              rules={{
                required: "Display Name is required",
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`form-control form-control-sm ${errors.displayName ? "is-invalid" : ""}`}
                  placeholder="Enter display name"
                />
              )}
            />

            {errors.displayName && (
              <span className="text-danger small">
                {errors.displayName.message}
              </span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label text-danger">Email Address*</label>
          <div className="col-sm-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-envelope"></i>
              </span>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Enter email"
                  />
                )}
              />
            </div>
            {errors.email && (
              <span className="text-danger small d-block mt-1">
                {errors.email.message}
              </span>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label text-danger">Phone*</label>
          <div className="col-sm-2 mb-2 mb-sm-0">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-telephone"></i>
              </span>
              <Controller
                name="workPhone"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="Work Phone"
                    className="form-control"
                  />
                )}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <Controller
              name="mobilePhone"
              control={control}
              rules={{ required: "Mobile phone is required" }}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Mobile"
                  className={`form-control form-control-sm ${errors.mobilePhone ? "is-invalid" : ""}`}
                />
              )}
            />
            {errors.mobilePhone && (
              <span className="text-danger small d-block mt-1">
                {errors.mobilePhone.message}
              </span>
            )}
          </div>
        </div>

        {/* ========================== TABS ========================== */}
        <ul className="nav nav-tabs mt-4">
          {[
            { key: "other", label: "Other Details" },
            { key: "address", label: "Address" },
            { key: "contact", label: "Contact Persons" },
            { key: "custom", label: "Custom Fields" },
            { key: "reporting", label: "Reporting Tags" },
            { key: "remarks", label: "Remarks" },
          ].map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ========================== TAB CONTENT ========================== */}
        <div className="tab-content mt-4">
          {/* Other Details */}
          {activeTab === "other" && (
            <>
              <div className="row mb-3">
                <label className="col-sm-2 col-form-label text-danger">GST Treatment*</label>
                <div className="col-sm-4">
                  <Controller
                    name="gstTreatment"
                    control={control}
                    rules={{ required: "GST Treatment is required" }}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select form-select-sm ${errors.gstTreatment ? "is-invalid" : ""}`}
                      >
                        <option value="">Select a GST treatment</option>
                        <option value="regular">Regular</option>
                        <option value="composition">Composition</option>
                        <option value="unregistered">Unregistered</option>
                        <option value="consumer">Consumer</option>
                      </select>
                    )}
                  />
                  {errors.gstTreatment && (
                    <span className="text-danger small d-block mt-1">
                      {errors.gstTreatment.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Place of Supply</label>
                <div className="col-sm-4">
                  <Controller
                    name="placeOfSupply"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        <option value="">Select</option>
                        <option>India</option>
                        <option>United States</option>
                        <option>Germany</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">PAN</label>
                <div className="col-sm-4">
                  <Controller
                    name="pan"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="form-control form-control-sm" />
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3 align-items-center">
                <label className="col-sm-2 col-form-label">Tax Preference</label>
                <div className="col-sm-4 d-flex gap-3 align-items-center">
                  <Controller
                    name="taxPreference"
                    control={control}
                    render={({ field }) => (
                      <>
                        <div className="form-check form-check-inline">
                          <input
                            type="radio"
                            id="taxable"
                            className="form-check-input"
                            value="Taxable"
                            checked={field.value === "Taxable"}
                            onChange={() => field.onChange("Taxable")}
                          />
                          <label className="form-check-label" htmlFor="taxable">
                            Taxable
                          </label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            type="radio"
                            id="taxexempt"
                            className="form-check-input"
                            value="Tax Exempt"
                            checked={field.value === "Tax Exempt"}
                            onChange={() => field.onChange("Tax Exempt")}
                          />
                          <label className="form-check-label" htmlFor="taxexempt">
                            Tax Exempt
                          </label>
                        </div>
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Currency</label>
                <div className="col-sm-4">
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        <option>INR - Indian Rupee</option>
                        <option>USD - US Dollar</option>
                        <option>EUR - Euro</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">
                  Accounts Receivable
                </label>
                <div className="col-sm-4">
                  <Controller
                    name="account"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        <option value="">Select an account</option>
                        <option value="acc1">Accounts Receivable - 1</option>
                        <option value="acc2">Accounts Receivable - 2</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Opening Balance</label>
                <div className="col-sm-4 d-flex">
                  <span className="input-group-text bg-white border-end-0">
                    INR
                  </span>
                  <Controller
                    name="openingBalance"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        className="form-control form-control-sm"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Payment Terms</label>
                <div className="col-sm-4">
                  <Controller
                    name="paymentTerms"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        <option>Due on Receipt</option>
                        <option>Net 15</option>
                        <option>Net 30</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Enable Portal?</label>
                <div className="col-sm-4 d-flex align-items-center">
                  <Controller
                    name="allowPortal"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="form-check-input me-2"
                      />
                    )}
                  />
                  <label className="form-check-label">Allow portal access for this customer</label>
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Portal Language</label>
                <div className="col-sm-4">
                  <Controller
                    name="portalLanguage"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Tamil</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Documents, Website, Department, Designation, X, Skype, Facebook */}
              <div className="row mb-3 align-items-center">
                <label className="col-sm-2 col-form-label">Documents</label>
                <div className="col-sm-6">
                  <input
                    type="file"
                    multiple
                    accept="*"
                    className="form-control form-control-sm"
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">You can upload a maximum of 10 files, 10MB each</small>
                  <div className="mt-2">
                    <Controller
                      name="documents"
                      control={control}
                      render={({ field }) => (
                        <ul className="list-unstyled small mb-0">
                          {(field.value || []).map((d, idx) => (
                            <li key={idx}>{d.name} ({Math.round(d.size / 1024)} KB)</li>
                          ))}
                        </ul>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Website URL</label>
                <div className="col-sm-4">
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="ex: www.zylker.com" className="form-control form-control-sm" />
                    )}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Department</label>
                <div className="col-sm-4">
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Designation</label>
                <div className="col-sm-4">
                  <Controller
                    name="designation"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">X</label>
                <div className="col-sm-4">
                  <Controller
                    name="x_url"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control form-control-sm" placeholder="https://x.com/" />}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Skype Name/Number</label>
                <div className="col-sm-4">
                  <Controller
                    name="skype"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <label className="col-sm-2 col-form-label">Facebook</label>
                <div className="col-sm-4">
                  <Controller
                    name="facebook"
                    control={control}
                    render={({ field }) => <input {...field} className="form-control form-control-sm" placeholder="http://www.facebook.com/" />}
                  />
                </div>
              </div>
            </>
          )}

          {/* Address */}
          {activeTab === "address" && (
            <div>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Billing Address</h6>
                  {[
                    "attention",
                    "country",
                    "street1",
                    "street2",
                    "city",
                    "state",
                    "pincode",
                    "phone",
                  ].map((fieldKey) => (
                    <div className="mb-2" key={fieldKey}>
                      <Controller
                        name={`billingAddress.${fieldKey}`}
                        control={control}
                        render={({ field }) =>
                          fieldKey === "country" || fieldKey === "state" ? (
                            <select {...field} className="form-select form-select-sm">
                              <option value="">Select</option>
                              {(fieldKey === "country" ? countries : states).map((val) => (
                                <option key={val}>{val}</option>
                              ))}
                            </select>
                          ) : fieldKey === "street1" || fieldKey === "street2" ? (
                            <textarea
                              {...field}
                              rows={1}
                              className="form-control form-control-sm"
                              placeholder={fieldKey === "street1" ? "Street 1" : "Street 2"}
                            />
                          ) : (
                            <input
                              {...field}
                              placeholder={fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                              className="form-control form-control-sm"
                            />
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-3">Shipping Address</h6>
                    <button
                      type="button"
                      onClick={copyBillingToShipping}
                      className="btn btn-link p-0 small text-primary"
                    >
                      <i className="bi bi-arrow-down-left"></i> Copy billing address
                    </button>
                  </div>
                  {[
                    "attention",
                    "country",
                    "street1",
                    "street2",
                    "city",
                    "state",
                    "pincode",
                    "phone",
                  ].map((fieldKey) => (
                    <div className="mb-2" key={fieldKey}>
                      <Controller
                        name={`shippingAddress.${fieldKey}`}
                        control={control}
                        render={({ field }) =>
                          fieldKey === "country" || fieldKey === "state" ? (
                            <select {...field} className="form-select form-select-sm">
                              <option value="">Select</option>
                              {(fieldKey === "country" ? countries : states).map((val) => (
                                <option key={val}>{val}</option>
                              ))}
                            </select>
                          ) : fieldKey === "street1" || fieldKey === "street2" ? (
                            <textarea
                              {...field}
                              rows={1}
                              className="form-control form-control-sm"
                              placeholder={fieldKey === "street1" ? "Street 1" : "Street 2"}
                            />
                          ) : (
                            <input
                              {...field}
                              placeholder={fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                              className="form-control form-control-sm"
                            />
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Persons */}
          {activeTab === "contact" && (
            <div>
              <table className="table table-sm table-borderless">
                <thead>
                  <tr>
                    <th>Salutation</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email Address</th>
                    <th>Work Phone</th>
                    <th>Mobile</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contactFields.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ minWidth: 120 }}>
                        <Controller
                          name={`contactPersons.${idx}.salutation`}
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select form-select-sm">
                              <option>Salutation</option>
                              <option>Mr.</option>
                              <option>Ms.</option>
                              <option>Mrs.</option>
                              <option>Dr.</option>
                            </select>
                          )}
                        />
                      </td>
                      <td>
                        <Controller
                          name={`contactPersons.${idx}.firstName`}
                          control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                      </td>
                      <td>
                        <Controller
                          name={`contactPersons.${idx}.lastName`}
                          control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                      </td>
                      <td>
                        <Controller
                          name={`contactPersons.${idx}.email`}
                          control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                      </td>
                      <td>
                        <Controller
                          name={`contactPersons.${idx}.workPhone`}
                          control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                      </td>
                      <td>
                        <Controller
                          name={`contactPersons.${idx}.mobile`}
                          control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(idx)}
                          disabled={contactFields.length === 1}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    append({
                      salutation: "Salutation",
                      firstName: "",
                      lastName: "",
                      email: "",
                      workPhone: "",
                      mobile: "",
                    })
                  }
                >
                  + Add Contact Person
                </button>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {activeTab === "custom" && (
            <div>
              <Controller
                name="customFields"
                control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" placeholder="Custom fields JSON or values" />
                )}
              />
            </div>
          )}

          {/* Reporting Tags */}
          {activeTab === "reporting" && (
            <div>
              <Controller
                name="reportingTags"
                control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" placeholder="Comma separated tags" />
                )}
              />
            </div>
          )}

          {/* Remarks */}
          {activeTab === "remarks" && (
            <div>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    className="form-control"
                    placeholder="Enter remarks"
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-4">
          <button
            type="submit"
            className="btn btn-primary btn-sm px-4"
            disabled={isSaving}
          >
            {isSaving
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
                ? "Update Customer"
                : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewCustomer;
