import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import "bootstrap/dist/css/bootstrap.min.css";

import { createVendor, updateVendor } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const NewVendor = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const makeDefaults = () => ({
    /* BASIC / PRIMARY CONTACT */
    salutation: "",
    firstName: "",
    lastName: "",

    companyName: "",
    displayName: "",
    email: "",
    phoneWork: "",
    phoneMobile: "",
    vendorLanguage: "English",

    /* OTHER DETAILS */
    gstTreatment: "",
    sourceOfSupply: "",
    pan: "",
    isMsmeRegistered: false,
    currency: "INR - Indian Rupee",
    accountsPayable: "",
    openingBalance: "",
    paymentTerms: "Due on Receipt",
    tds: "",
    enablePortal: false,

    /* DOCUMENTS & SOCIAL */
    documents: [],
    websiteUrl: "",
    department: "",
    designation: "",
    xProfile: "",
    skype: "",
    facebook: "",

    /* ADDRESS */
    billingAddress: {
      attention: "",
      country: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pinCode: "",
      phone: "",
      fax: ""
    },
    shippingAddress: {
      attention: "",
      country: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pinCode: "",
      phone: "",
      fax: ""
    },

    /* CONTACT PERSONS (table) */
    contactPersons: [
      {
        salutation: "Salutation",
        firstName: "",
        lastName: "",
        email: "",
        workPhone: "",
        mobile: ""
      }
    ],

    /* BANK DETAILS (table) */
    bankDetails: [
      {
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        reenterAccountNumber: "",
        ifsc: ""
      }
    ],

    /* CUSTOM / TAGS / REMARKS */
    customFields: [],
    reportingTags: [],
    remarks: ""
  });

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: makeDefaults(),
    mode: "onChange",
  });

  const editId = state?.id;
  const isEditing = Boolean(editId);

  // Field arrays
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: "contactPersons" });

  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank,
  } = useFieldArray({ control, name: "bankDetails" });

  // Active tab (default to Other Details like your screenshots)
  const [activeTab, setActiveTab] = useState("other");

  // Countries & states (simple lists for selects; replace with real lists if needed)
  const countries = ["India", "United States", "Germany"];
  const states = ["Tamil Nadu", "Karnataka", "California"];

  // Initialize/reset on mount or when state changes (populate edit mode)
  useEffect(() => {
    if (state) {
      // merge defaults with state to avoid missing any fields
      reset({
        ...makeDefaults(),
        ...state,

        billingAddress: {
          ...makeDefaults().billingAddress,
          ...(state.billingAddress || {}),
        },

        shippingAddress: {
          ...makeDefaults().shippingAddress,
          ...(state.shippingAddress || {}),
        },

        contactPersons:
          state?.contactPersons && state.contactPersons.length > 0
            ? state.contactPersons
            : makeDefaults().contactPersons,

        bankDetails:
          state?.bankDetails && state.bankDetails.length > 0
            ? state.bankDetails
            : makeDefaults().bankDetails,
      });
      return;
    }

    reset(makeDefaults());
  }, [state, reset]);

  // Copy billing to shipping
  const copyBillingToShipping = () => {
    const billing = getValues("billingAddress");
    setValue("shippingAddress", { ...billing }, { shouldDirty: true });
  };

  // Files handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const meta = files.map((f) => ({ name: f.name, size: f.size, file: f }));
    setValue("documents", meta, { shouldDirty: true });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => createVendor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendors"]);
      alert("Vendor created successfully");
      reset(makeDefaults());
      navigate("/vendors");
    },
    onError: (error) => handleProvisionalError(error, "Create Vendor"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateVendor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendors"]);
      alert("Vendor updated successfully");
      navigate("/vendors");
    },
    onError: (error) => handleProvisionalError(error, "Update Vendor"),
  });

  const onSubmit = (data) => {
    // Normalize data before submission
    const payload = {
      ...data,
      // Ensure openingBalance is a number or empty string
      openingBalance: data?.openingBalance 
        ? (typeof data.openingBalance === 'number' ? data.openingBalance : Number(data.openingBalance) || 0)
        : "",
      // Ensure boolean values
      isMsmeRegistered: Boolean(data?.isMsmeRegistered),
      enablePortal: Boolean(data?.enablePortal),
    };

    // If backend should not receive File objects, map documents to metadata or upload separately.
    // For now we'll pass basic metadata (name, size). Adjust per your API.
    payload.documents = (payload.documents || []).map((d) => ({
      name: d.name || d.fileName || "",
      size: d.size || d.fileSize || 0,
    }));

    // Clean up empty string fields (except arrays that should be empty arrays)
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" && key !== 'openingBalance') {
        if (key !== 'documents' && key !== 'customFields' && key !== 'reportingTags' && 
            key !== 'contactPersons' && key !== 'bankDetails') {
          delete payload[key];
        }
      }
    });

    if (isEditing) {
      updateMutation.mutate({ id: editId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // watch some values if necessary
  const contactPersons = watch("contactPersons");

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.10)",
        }}
      >
        <h5 className="fw-semibold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-people"></i>
          {isEditing ? "Edit Vendor" : "New Vendor"}
        </h5>

        <button
          className="btn btn-light btn-sm border"
          type="button"
          onClick={() => navigate("/vendors")}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* ================= BASIC DETAILS (top row) ================= */}
        {/* ========================== PRIMARY CONTACT ========================== */}
        <div className="row mb-3 align-items-center">
          <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
            Primary Contact <i className="bi bi-info-circle text-muted"></i>
          </label>

          <div className="col-sm-10">
            <div className="row g-2">
              {/* Salutation */}
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

              {/* First Name */}
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

              {/* Last Name */}
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

        {/* ========================== COMPANY NAME ========================== */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label">Company Name</label>
          <div className="col-sm-4">
            <Controller
              name="companyName"
              control={control}
              render={({ field }) => (
                <input {...field} className="form-control form-control-sm" />
              )}
            />
          </div>
        </div>

        {/* ========================== DISPLAY NAME ========================== */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label text-danger d-flex gap-1 align-items-center">
            Display Name*
            <i className="bi bi-info-circle text-muted"></i>
          </label>
          <div className="col-sm-4">
            <Controller
              name="displayName"
              control={control}
              rules={{ required: "Display Name is required" }}
              render={({ field }) => (
                <input
                  type="text"
                  {...field}
                  className={`form-control form-control-sm ${errors.displayName ? "is-invalid" : ""}`}
                  placeholder="Enter display name"
                />
              )}
            />

            {errors.displayName && (
              <span className="text-danger small">{errors.displayName.message}</span>
            )}
          </div>

        </div>

        {/* ========================== EMAIL ADDRESS ========================== */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
            Email Address <i className="bi bi-info-circle text-muted"></i>
          </label>

          <div className="col-sm-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-envelope"></i>
              </span>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input {...field} type="email" className="form-control" />
                )}
              />
            </div>
          </div>
        </div>

        {/* ========================== PHONE ========================== */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
            Phone <i className="bi bi-info-circle text-muted"></i>
          </label>

          {/* Work phone */}
          <div className="col-sm-2 mb-2 mb-sm-0">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-telephone"></i>
              </span>
              <Controller
                name="phoneWork"
                control={control}
                render={({ field }) => (
                  <input {...field} placeholder="Work Phone" className="form-control" />
                )}
              />
            </div>
          </div>

          {/* Mobile phone */}
          <div className="col-sm-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-phone"></i>
              </span>
              <Controller
                name="phoneMobile"
                control={control}
                render={({ field }) => (
                  <input {...field} placeholder="Mobile" className="form-control" />
                )}
              />
            </div>
          </div>
        </div>

        {/* ========================== VENDOR LANGUAGE ========================== */}
        <div className="row mb-3">
          <label className="col-sm-2 col-form-label">Vendor Language</label>
          <div className="col-sm-3">
            <Controller
              name="vendorLanguage"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select form-select-sm">
                  <option>English</option>
                  <option>Tamil</option>
                  <option>Hindi</option>
                </select>
              )}
            />
          </div>
        </div>


        {/* ================= TABS ================= */}
        <ul className="nav nav-tabs mb-3" role="tablist">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "other" ? "active" : ""}`} onClick={() => setActiveTab("other")} type="button">Other Details</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "address" ? "active" : ""}`} onClick={() => setActiveTab("address")} type="button">Address</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "contact" ? "active" : ""}`} onClick={() => setActiveTab("contact")} type="button">Contact Persons</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "bank" ? "active" : ""}`} onClick={() => setActiveTab("bank")} type="button">Bank Details</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "custom" ? "active" : ""}`} onClick={() => setActiveTab("custom")} type="button">Custom Fields</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "reporting" ? "active" : ""}`} onClick={() => setActiveTab("reporting")} type="button">Reporting Tags</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "remarks" ? "active" : ""}`} onClick={() => setActiveTab("remarks")} type="button">Remarks</button>
          </li>
        </ul>

        <div className="tab-content">
          {/* ========== OTHER DETAILS ========== */}
          {activeTab === "other" && (
            <>
              {/* ========================= ZOHO OTHER DETAILS SECTION ========================= */}

              <div className="container-fluid px-0">

                {/* ========================= ZOHO EXACT OTHER DETAILS (VERTICAL LAYOUT) ========================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label text-danger d-flex align-items-center gap-1">
                    GST Treatment*
                  </label>
                  <div className="col-sm-4">
                    <Controller
                      name="gstTreatment"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="form-select form-select-sm">
                          <option value="">Select a GST treatment</option>
                          <option>Registered</option>
                          <option>Unregistered</option>
                          <option>Overseas</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label text-danger d-flex align-items-center gap-1">
                    Source of Supply*
                  </label>
                  <div className="col-sm-4">
                    <Controller
                      name="sourceOfSupply"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="form-select form-select-sm">
                          <option value="">Select</option>
                          {states.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
                    PAN <i className="bi bi-info-circle text-muted small"></i>
                  </label>
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
                  <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
                    MSME Registered?
                  </label>
                  <div className="col-sm-4">
                    <div className="form-check">
                      <Controller
                        name="isMsmeRegistered"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            {...field}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="form-check-input me-2"
                          />
                        )}
                      />
                      <label className="form-check-label">This vendor is MSME registered</label>
                    </div>
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
                          <option>INR- Indian Rupee</option>
                          <option>USD- US Dollar</option>
                          <option>EUR- Euro</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
                    Accounts Payable <i className="bi bi-info-circle text-muted small"></i>
                  </label>
                  <div className="col-sm-4">
                    <Controller
                      name="accountsPayable"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="form-select form-select-sm">
                          <option value="">Select an account</option>
                          <option>Accounts Payable 1</option>
                          <option>Accounts Payable 2</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label">Opening Balance</label>
                  <div className="col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">INR</span>
                      <Controller
                        name="openingBalance"
                        control={control}
                        render={({ field }) => (
                          <input {...field} type="number" className="form-control" />
                        )}
                      />
                    </div>
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
                  <label className="col-sm-2 col-form-label">TDS</label>
                  <div className="col-sm-4">
                    <Controller
                      name="tds"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className="form-select form-select-sm">
                          <option value="">Select a Tax</option>
                          <option>TDS 1</option>
                          <option>TDS 2</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-2 col-form-label d-flex align-items-center gap-1">
                    Enable Portal? <i className="bi bi-info-circle text-muted small"></i>
                  </label>
                  <div className="col-sm-4">
                    <div className="form-check">
                      <Controller
                        name="enablePortal"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            {...field}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="form-check-input me-2"
                          />
                        )}
                      />
                      <label className="form-check-label">Allow portal access for this vendor</label>
                    </div>
                  </div>
                </div>
                {/* ================= ENABLE PORTAL ================= */}


                {/* ================= DOCUMENT UPLOAD ================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label fw-semibold">Documents</label>

                  <div className="col-sm-6">
                    <div className="d-flex align-items-center gap-2">

                      <label className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" style={{ borderRadius: "6px" }}>
                        <i className="bi bi-upload"></i> Upload File
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2"
                        style={{ borderRadius: "6px" }}
                      >
                        <i className="bi bi-caret-down-fill small"></i>
                      </button>
                    </div>

                    <small className="text-muted">
                      You can upload a maximum of 10 files, 10MB each
                    </small>
                  </div>
                </div>

                {/* ================= WEBSITE URL ================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label fw-semibold">Website URL</label>
                  <div className="col-sm-4">
                    <Controller
                      name="websiteUrl"
                      control={control}
                      render={({ field }) => (
                        <>
                          <input
                            {...field}
                            placeholder="ex: www.zylker.com"
                            className="form-control form-control-sm"
                          />
                        </>
                      )}
                    />
                  </div>
                </div>

                {/* ================= DEPARTMENT ================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label fw-semibold">Department</label>
                  <div className="col-sm-4">
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <input {...field} className="form-control form-control-sm" />
                      )}
                    />
                  </div>
                </div>

                {/* ================= DESIGNATION ================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label fw-semibold">Designation</label>
                  <div className="col-sm-4">
                    <Controller
                      name="designation"
                      control={control}
                      render={({ field }) => (
                        <input {...field} className="form-control form-control-sm" />
                      )}
                    />
                  </div>
                </div>

                {/* ================= X (Twitter) ================= */}

                <div className="row mb-1">
                  <label className="col-sm-2 col-form-label fw-semibold">X</label>
                  <div className="col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-twitter-x"></i>
                      </span>
                      <Controller
                        name="xProfile"
                        control={control}
                        render={({ field }) => (
                          <input {...field} className="form-control" />
                        )}
                      />
                    </div>
                    <small className="text-muted">https://x.com/</small>
                  </div>
                </div>

                {/* ================= SKYPE ================= */}

                <div className="row mb-1">
                  <label className="col-sm-2 col-form-label fw-semibold">Skype Name/Number</label>
                  <div className="col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-skype text-primary"></i>
                      </span>
                      <Controller
                        name="skype"
                        control={control}
                        render={({ field }) => (
                          <input {...field} className="form-control" />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* ================= FACEBOOK ================= */}

                <div className="row mb-3">
                  <label className="col-sm-2 col-form-label fw-semibold">Facebook</label>
                  <div className="col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-facebook text-primary"></i>
                      </span>
                      <Controller
                        name="facebook"
                        control={control}
                        render={({ field }) => (
                          <input {...field} className="form-control" />
                        )}
                      />
                    </div>
                    <small className="text-muted">http://www.facebook.com/</small>
                  </div>
                </div>




              </div>

            </>
          )}

          {/* ========== ADDRESS TAB ========== */}
          {activeTab === "address" && (
            <div className="tab-pane show active">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Billing Address</h6>

                  {[
                    { key: "attention", label: "Attention" },
                    { key: "country", label: "Country/Region" },
                    { key: "addressLine1", label: "Address - Street 1", textarea: true },
                    { key: "addressLine2", label: "Address - Street 2", textarea: true },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                    { key: "pinCode", label: "Pin Code" },
                    { key: "phone", label: "Phone" },
                    { key: "fax", label: "Fax Number" },
                  ].map((f) => (
                    <div className="mb-2" key={f.key}>
                      <label className="form-label small">{f.label}</label>
                      <Controller
                        name={`billingAddress.${f.key}`}
                        control={control}
                        render={({ field }) =>
                          f.key === "country" || f.key === "state" ? (
                            <select {...field} className="form-select form-select-sm">
                              <option value="">Select</option>
                              {(f.key === "country" ? countries : states).map((val) => (
                                <option key={val}>{val}</option>
                              ))}
                            </select>
                          ) : f.textarea ? (
                            <textarea {...field} rows={1} className="form-control form-control-sm" placeholder={f.label} />
                          ) : (
                            <input {...field} className="form-control form-control-sm" />
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-3">Shipping Address</h6>
                    <button type="button" onClick={copyBillingToShipping} className="btn btn-link p-0 small text-primary">
                      <i className="bi bi-arrow-down-left"></i> Copy billing address
                    </button>
                  </div>

                  {[
                    { key: "attention", label: "Attention" },
                    { key: "country", label: "Country/Region" },
                    { key: "addressLine1", label: "Address - Street 1", textarea: true },
                    { key: "addressLine2", label: "Address - Street 2", textarea: true },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                    { key: "pinCode", label: "Pin Code" },
                    { key: "phone", label: "Phone" },
                    { key: "fax", label: "Fax Number" },
                  ].map((f) => (
                    <div className="mb-2" key={f.key}>
                      <label className="form-label small">{f.label}</label>
                      <Controller
                        name={`shippingAddress.${f.key}`}
                        control={control}
                        render={({ field }) =>
                          f.key === "country" || f.key === "state" ? (
                            <select {...field} className="form-select form-select-sm">
                              <option value="">Select</option>
                              {(f.key === "country" ? countries : states).map((val) => (
                                <option key={val}>{val}</option>
                              ))}
                            </select>
                          ) : f.textarea ? (
                            <textarea {...field} rows={1} className="form-control form-control-sm" placeholder={f.label} />
                          ) : (
                            <input {...field} className="form-control form-control-sm" />
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== CONTACT PERSONS ========== */}
          {activeTab === "contact" && (
            <div className="tab-pane show active">
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
                        <Controller name={`contactPersons.${idx}.salutation`} control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select form-select-sm">
                              <option>Salutation</option>
                              <option>Mr.</option>
                              <option>Ms.</option>
                              <option>Mrs.</option>
                              <option>Dr.</option>
                            </select>
                          )} />
                      </td>
                      <td>
                        <Controller name={`contactPersons.${idx}.firstName`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`contactPersons.${idx}.lastName`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`contactPersons.${idx}.email`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`contactPersons.${idx}.workPhone`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`contactPersons.${idx}.mobile`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeContact(idx)} disabled={contactFields.length === 1}>&times;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => appendContact({
                  salutation: "Salutation",
                  firstName: "",
                  lastName: "",
                  email: "",
                  workPhone: "",
                  mobile: ""
                })}>+ Add Contact Person</button>
              </div>
            </div>
          )}

          {/* ========== BANK DETAILS ========== */}
          {activeTab === "bank" && (
            <div className="tab-pane show active">
              <table className="table table-sm table-borderless">
                <thead>
                  <tr>
                    <th>Account Holder Name</th>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>Re-enter Account Number</th>
                    <th>IFSC</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bankFields.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <Controller name={`bankDetails.${idx}.accountHolderName`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`bankDetails.${idx}.bankName`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`bankDetails.${idx}.accountNumber`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`bankDetails.${idx}.reenterAccountNumber`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td>
                        <Controller name={`bankDetails.${idx}.ifsc`} control={control}
                          render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
                      </td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeBank(idx)} disabled={bankFields.length === 1}>&times;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => appendBank({
                  accountHolderName: "",
                  bankName: "",
                  accountNumber: "",
                  reenterAccountNumber: "",
                  ifsc: ""
                })}>+ Add New Bank</button>
              </div>
            </div>
          )}

          {/* ========== CUSTOM FIELDS ========== */}
          {activeTab === "custom" && (
            <div className="tab-pane show active">
              <Controller name="customFields" control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" placeholder="Custom fields JSON or values" />
                )} />
            </div>
          )}

          {/* ========== REPORTING TAGS ========== */}
          {activeTab === "reporting" && (
            <div className="tab-pane show active">
              <Controller name="reportingTags" control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" placeholder="Comma separated tags" />
                )} />
            </div>
          )}

          {/* ========== REMARKS ========== */}
          {activeTab === "remarks" && (
            <div className="tab-pane show active">
              <Controller name="remarks" control={control}
                render={({ field }) => (
                  <textarea {...field} rows={4} className="form-control" placeholder="Enter remarks (For internal use)" />
                )} />
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-4 text-end">
          <button type="submit" className="btn btn-primary btn-sm px-4" disabled={isSaving}>
            {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Vendor" : "Save Vendor")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewVendor;
