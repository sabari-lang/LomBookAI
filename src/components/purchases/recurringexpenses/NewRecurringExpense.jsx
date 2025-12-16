import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecurringExpense, updateRecurringExpense } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";

const NewRecurringExpense = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const editId = state?.id;
  const isEditing = Boolean(editId);

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      profileName: "",
      repeatEvery: "Week",
      startOn: new Date().toISOString().split("T")[0],
      endsOn: "",
      neverExpires: true,

      expenseAccount: "",
      amount: "",
      paidThrough: "",
      expenseType: "Services",
      sac: "",
      vendor: "",
      gstTreatment: "",
      sourceOfSupply: "",
      destinationOfSupply: "",
      reverseCharge: false,
      tax: "",
      amountIs: "Tax Exclusive",
      invoice: "",
      notes: "",
      customerName: "",
      reportingTags: [],
      files: [],
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
      },
    },
  });

  const neverExpires = watch("neverExpires");

  useEffect(() => {
    if (state) {
      reset({ ...state });
      return;
    }
    reset({
      profileName: "",
      repeatEvery: "Week",
      startOn: new Date().toISOString().split("T")[0],
      endsOn: "",
      neverExpires: true,
      expenseAccount: "",
      amount: "",
      paidThrough: "",
      expenseType: "Services",
      sac: "",
      vendor: "",
      gstTreatment: "",
      sourceOfSupply: "",
      destinationOfSupply: "",
      reverseCharge: false,
      tax: "",
      amountIs: "Tax Exclusive",
      invoice: "",
      notes: "",
      customerName: "",
      reportingTags: [],
      files: [],
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
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const createMutation = useMutation({
    mutationFn: (payload) => createRecurringExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringExpenses"]);
      alert("Recurring expense created successfully");
      navigate("/recurringexpenses");
    },
    onError: (error) => handleProvisionalError(error, "Create Recurring Expense"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRecurringExpense(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringExpenses"]);
      alert("Recurring expense updated successfully");
      navigate("/recurringexpenses");
    },
    onError: (error) => handleProvisionalError(error, "Update Recurring Expense"),
  });

  const onSubmit = (data) => {
    // Build payload matching defaultValues structure exactly
    const payload = {
      profileName: data?.profileName || "",
      repeatEvery: data?.repeatEvery || "Week",
      startOn: data.startOn ? new Date(data.startOn).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      endsOn: data.endsOn ? new Date(data.endsOn).toISOString().split("T")[0] : "",
      neverExpires: Boolean(data?.neverExpires),
      expenseAccount: data?.expenseAccount || "",
      amount: data?.amount || "",
      paidThrough: data?.paidThrough || "",
      expenseType: data?.expenseType || "Services",
      sac: data?.sac || "",
      vendor: data?.vendor || "",
      gstTreatment: data?.gstTreatment || "",
      sourceOfSupply: data?.sourceOfSupply || "",
      destinationOfSupply: data?.destinationOfSupply || "",
      reverseCharge: Boolean(data?.reverseCharge),
      tax: data?.tax || "",
      amountIs: data?.amountIs || "Tax Exclusive",
      invoice: data?.invoice || "",
      notes: data?.notes || "",
      customerName: data?.customerName || "",
      reportingTags: Array.isArray(data?.reportingTags) ? data.reportingTags : [],
      files: Array.isArray(data?.files) ? data.files : [],
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
    };

    if (isEditing) {
      console.info('[RECURRING EXPENSE UPDATE]', {
        id: editId,
        profileName: payload.profileName,
        payload: payload
      });
      updateMutation.mutate({ id: editId, payload });
      return;
    }
    console.info('[RECURRING EXPENSE CREATE]', {
      profileName: payload.profileName,
      payload: payload
    });
    createMutation.mutate(payload);
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div
      className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0"
      style={{ borderRadius: "8px", fontSize: "14px" }}
    >
      {/* Header */}
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
          <i className="bi bi-receipt-cutoff me-1"></i>
          {isEditing ? "Edit Recurring Expense" : "New Recurring Expense"}
        </h5>

        <button
          className="btn btn-light btn-sm border"
          onClick={() => navigate("/recurringexpenses")}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* ------------------- BASIC SECTION ----------------------- */}

        {/* Profile Name */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Profile Name*
          </label>
          <div className="col-9">
            <Controller
              name="profileName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "330px" }}
                />
              )}
            />
          </div>
        </div>

        {/* Repeat Every */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Repeat Every*
          </label>
          <div className="col-9">
            <Controller
              name="repeatEvery"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Start Date */}
        <div className="row mb-1">
          <label className="col-3 col-form-label fw-semibold">Start Date</label>
          <div className="col-9">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "330px" }}
                />
              )}
            />
          </div>
        </div>

        <small
          className="text-muted d-block mb-3"
          style={{ marginLeft: "25%", fontSize: "12px" }}
        >
          The recurring expense will be created on 07/12/2025
        </small>

        {/* Ends On / Never Expires */}
        <div className="row mb-3 align-items-center">
          <label className="col-3 col-form-label fw-semibold">Ends On</label>
          <div className="col-9 d-flex align-items-center gap-3">
            <Controller
              name="endsOn"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "180px" }}
                  disabled={neverExpires}
                />
              )}
            />

            <div className="form-check">
              <Controller
                name="neverExpires"
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
              <label className="form-check-label small ms-1">
                Never Expires
              </label>
            </div>
          </div>
        </div>

        {/* Expense Account */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Expense Account*
          </label>
          <div className="col-9">
            <Controller
              name="expenseAccount"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option>Select an account</option>
                  <option>Office Supplies</option>
                  <option>Utilities</option>
                  <option>Travel Expense</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Amount*
          </label>
          <div className="col-9">
            <div
              className="input-group input-group-sm"
              style={{ maxWidth: "330px" }}
            >
              <span className="input-group-text bg-white">INR</span>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input {...field} type="number" className="form-control" />
                )}
              />
            </div>
          </div>
        </div>

        {/* Paid Through */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">Paid Through</label>
          <div className="col-9">
            <div
              className="input-group input-group-sm"
              style={{ maxWidth: "330px" }}
            >
              <Controller
                name="paidThrough"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select">
                    <option>Select an account</option>
                    <option>Cash</option>
                    <option>Bank Account</option>
                  </select>
                )}
              />
              <button className="btn btn-primary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Vendor */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">Vendor</label>
          <div className="col-9">
            <div
              className="input-group input-group-sm"
              style={{ maxWidth: "330px" }}
            >
              <Controller
                name="vendor"
                control={control}
                render={({ field }) => (
                  <input {...field} type="text" className="form-control" />
                )}
              />
              <button className="btn btn-primary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------- GST SECTION (New) ----------------------- */}

        {/* SAC */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">SAC</label>
          <div className="col-9">
            <Controller
              name="sac"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className="form-control form-control-sm"
                  style={{ maxWidth: "330px" }}
                />
              )}
            />
          </div>
        </div>

        {/* GST Treatment */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            GST Treatment*
          </label>
          <div className="col-9">
            <Controller
              name="gstTreatment"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option>Select</option>
                  <option>Registered Business</option>
                  <option>Unregistered Business</option>
                  <option>Consumer</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Source of Supply */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Source of Supply*
          </label>
          <div className="col-9">
            <Controller
              name="sourceOfSupply"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option>Select</option>
                  <option>TN - Tamil Nadu</option>
                  <option>KA - Karnataka</option>
                  <option>KL - Kerala</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Destination of Supply */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold text-danger">
            Destination of Supply*
          </label>
          <div className="col-9">
            <Controller
              name="destinationOfSupply"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option value="TN">TN - Tamil Nadu</option>
                  <option value="KA">KA - Karnataka</option>
                  <option value="KL">KL - Kerala</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Reverse Charge */}
        <div className="row mb-3 align-items-center">
          <label className="col-3 col-form-label fw-semibold">
            Reverse Charge
          </label>
          <div className="col-9">
            <div className="form-check">
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
              <label className="form-check-label ms-1 small">
                This transaction is applicable for reverse charge
              </label>
            </div>
          </div>
        </div>

        {/* Tax */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">Tax</label>
          <div className="col-9">
            <Controller
              name="tax"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="form-select form-select-sm"
                  style={{ maxWidth: "330px" }}
                >
                  <option>Select a Tax</option>
                  <option>GST 18%</option>
                  <option>GST 12%</option>
                  <option>GST 5%</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Amount Is */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">Amount Is</label>
          <div className="col-9 d-flex gap-4 align-items-center">
            <Controller
              name="amountIs"
              control={control}
              render={({ field }) => (
                <>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      value="inclusive"
                      checked={field.value === "inclusive"}
                      onChange={field.onChange}
                    />
                    <label className="form-check-label small">Tax Inclusive</label>
                  </div>

                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      value="exclusive"
                      checked={field.value === "exclusive"}
                      onChange={field.onChange}
                    />
                    <label className="form-check-label small">Tax Exclusive</label>
                  </div>
                </>
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">Notes</label>
          <div className="col-9">
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows="3"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "330px" }}
                  placeholder="Max. 500 characters"
                />
              )}
            />
          </div>
        </div>

        {/* Customer Name */}
        <div className="row mb-3">
          <label className="col-3 col-form-label fw-semibold">
            Customer Name
          </label>
          <div className="col-9">
            <div
              className="input-group input-group-sm"
              style={{ maxWidth: "330px" }}
            >
              <Controller
                name="customerName"
                control={control}
                render={({ field }) => (
                  <input {...field} className="form-control" />
                )}
              />
              <button className="btn btn-primary" type="button">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Reporting Tags */}
        <div className="row mb-4">
          <label className="col-3 col-form-label fw-semibold">
            Reporting Tags
          </label>
          <div className="col-9">
            <a
              href="#"
              className="text-primary small text-decoration-none"
              style={{ maxWidth: "330px" }}
            >
              <i className="bi bi-tag-fill me-1"></i>Associate Tags
            </a>
          </div>
        </div>

        {/* Buttons */}
        <div className="row">
          <div className="offset-3 col-9 d-flex gap-2">
            <button 
              type="submit" 
              className="btn btn-primary btn-sm px-4"
              disabled={isSaving}
            >
              {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/recurringexpenses")}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewRecurringExpense;
