import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createRecurringBill, updateRecurringBill, getVendors } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { getCustomers } from "../../sales/api";
import { calculateLineAmount, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, toNumber, parseTaxPercentage } from "../../../utils/calculations";
// Removed refreshKeyboard import - auto-refresh disabled by default
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const DEFAULTS = {
  vendorName: "",
  vendorId: null,
  profileName: "",
  repeatEvery: "Week",
  startOn: new Date().toISOString().split("T")[0],
  endsOn: "",
  neverExpires: true,
  accountsPayable: "Accounts Payable",
  paymentTerms: "Due on Receipt",
  reverseCharge: false,
  items: [
    {
      itemDetails: "",
      account: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      tax: "",
      customerDetails: "",
      amount: 0,
    },
  ],
  discountPercent: 0,
  tds: "",
  adjustment: 0,
  notes: "",
  attachments: [],
};

const NewRecurringBills = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const queryClient = useQueryClient();

  const editId = state?.id;
  const isNewFromSource = state?.isNew === true;
  const isEditing = Boolean(editId) && !isNewFromSource;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
  } = useForm({
    defaultValues: DEFAULTS,
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    if (state) {
      if (isNewFromSource) {
        console.info("📄 [RECURRING BILL FROM CONVERSION]", {
          sourceId: state?.sourceId ?? null,
          sourceType: state?.sourceType ?? null,
        });
      }

      reset({ ...DEFAULTS, ...state });
      if (state.attachments) {
        setUploadedFiles(state.attachments);
        setValue("attachments", state.attachments);
      }
      // Removed refreshKeyboard() - auto-refresh disabled by default to prevent blinking
      // Use manual "Fix keyboard input" button in Settings if needed
      return;
    }

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
    }));
    setUploadedFiles((prev) => {
      const updated = [...prev, ...newFiles];
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

  const createMutation = useMutation({
    mutationFn: (payload) => createRecurringBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringBills"]);
      notifySuccess("Recurring bill created successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/recurringbills");
    },
    onError: (error) => handleProvisionalError(error, "Create Recurring Bill"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRecurringBill(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringBills"]);
      notifySuccess("Recurring bill updated successfully");
      navigate("/recurringbills");
    },
    onError: (error) => handleProvisionalError(error, "Update Recurring Bill"),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = useWatch({ control, name: "items" }) || [];
  const watchDiscount = toNumber(watch("discountPercent"), 0);
  const watchAdjustment = toNumber(watch("adjustment"), 0);

  // Sync per-item amount back into the form using shared calculation utility
  const itemsWithAmount = useMemo(() => {
    return (watchItems || []).map((item, index) => {
      const calculatedAmount = calculateLineAmount(item);
      const prev = toNumber(item?.amount, 0);
      if (Math.abs(calculatedAmount - prev) > 0.01) {
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
      return { ...item, amount: calculatedAmount };
    });
  }, [watchItems, setValue]);

  // Subtotal based on synced item amounts using shared utility
  const subtotal = calculateSubtotal(itemsWithAmount);

  // Fetch items for dropdown
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "recurringbill-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // Fetch vendors
  const { data: fetchedVendorsRaw } = useQuery({
    queryKey: ["vendors", "recurringbill-form"],
    queryFn: () => getVendors({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Vendors"),
  });

  const vendorOptions = extractItems(fetchedVendorsRaw) || [];

  // Fetch customers for customerDetails dropdown
  const { data: fetchedCustomersRaw } = useQuery({
    queryKey: ["customers", "recurringbill-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Customers"),
  });

  const customerOptions = extractItems(fetchedCustomersRaw) || [];

  useEffect(() => {
    if (state?.vendorId && vendorOptions && vendorOptions.length > 0) {
      const found = vendorOptions.find((v) => String(v?.id) === String(state.vendorId));
      if (found) {
        setSelectedVendor(found);
        setValue("vendorName", (found.displayName ?? found.companyName ?? found.name ?? "").trim());
        setValue("vendorId", found.id);
        if (found.paymentTerms) setValue("paymentTerms", found.paymentTerms);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorOptions, state?.vendorId]);

  // Calculate totals using shared utilities
  const discountAmount = calculateDiscountAmount(subtotal, watchDiscount);
  const taxableAmount = subtotal - discountAmount;

  // parse TDS - handle both number and string formats
  const tdsField = watch("tds") || 0;
  let parsedTds = 0;
  if (typeof tdsField === "number") {
    parsedTds = tdsField;
  } else if (tdsField !== "" && tdsField !== null && tdsField !== undefined) {
    const tdsMatch = String(tdsField).match(/(\d+(?:\.\d+)?)/);
    parsedTds = tdsMatch ? parseFloat(tdsMatch[1]) : 0;
  }
  const tdsAmount = calculateTaxAmount(taxableAmount, parsedTds, "TDS");

  // TDS reduces total using shared utility
  const total = calculateGrandTotal(taxableAmount, tdsAmount, toNumber(watchAdjustment, 0));
  
  // Sync calculated values to form state
  useEffect(() => {
    setValue("subTotal", subtotal, { shouldDirty: false });
    setValue("discountValue", discountAmount, { shouldDirty: false });
    setValue("tdsAmount", Math.abs(tdsAmount), { shouldDirty: false });
    setValue("totalAmount", total, { shouldDirty: false });
  }, [subtotal, discountAmount, tdsAmount, total, setValue]);
  
  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data) => {
    try {
      // validation for conversions
      if (isNewFromSource) {
        if (!data?.vendorName) {
          handleProvisionalError(new Error("Vendor is required"), "VALIDATION", "❌ Vendor is required");
          return;
        }
        if (!Array.isArray(data?.items) || data.items.length === 0) {
          handleProvisionalError(new Error("At least one item is required"), "VALIDATION", "❌ At least one item is required");
          return;
        }
        const invalidItem = data.items.find((item) => !item?.itemDetails || !item?.quantity || !item?.rate);
        if (invalidItem) {
          handleProvisionalError(new Error("Items must have details/quantity/rate"), "VALIDATION", "❌ Items incomplete");
          return;
        }
      }

      // Calculate and sync all amounts before submission using shared utilities
      const itemsWithAmounts = (data.items || []).map((item) => ({
        itemDetails: item?.itemDetails || "",
        account: item?.account || "",
        quantity: toNumber(item?.quantity, 1),
        rate: toNumber(item?.rate, 0),
        discount: toNumber(item?.discount, 0),
        tax: parseTaxPercentage(item?.tax), // Send as number, not string
        customerDetails: item?.customerDetails || "",
        amount: (() => {
          const itemForCalc = {
            quantity: toNumber(item?.quantity, 1),
            rate: toNumber(item?.rate, 0),
            discount: toNumber(item?.discount, 0),
            tax: parseTaxPercentage(item?.tax),
          };
          return calculateLineAmount(itemForCalc);
        })(),
      }));

      // Recalculate totals using shared utilities
      const finalSubtotal = calculateSubtotal(itemsWithAmounts);
      const finalDiscountPercent = toNumber(data.discountPercent, 0);
      const finalDiscountAmount = calculateDiscountAmount(finalSubtotal, finalDiscountPercent);
      const finalTaxableAmount = finalSubtotal - finalDiscountAmount;
      
      // Parse TDS using shared utility
      const parsedTds = parseTaxPercentage(data.tds);
      const finalTdsAmount = calculateTaxAmount(finalTaxableAmount, parsedTds, "TDS");
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotal = calculateGrandTotal(finalTaxableAmount, finalTdsAmount, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        vendorName: data?.vendorName || "",
        vendorId: data?.vendorId || selectedVendor?.id || null,
        profileName: data?.profileName || "",
        repeatEvery: data?.repeatEvery || "Week",
        startOn: data.startOn ? new Date(data.startOn).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        endsOn: data.endsOn ? new Date(data.endsOn).toISOString().split("T")[0] : "",
        neverExpires: Boolean(data?.neverExpires),
        accountsPayable: data?.accountsPayable || "Accounts Payable",
        paymentTerms: data?.paymentTerms || "Due on Receipt",
        reverseCharge: Boolean(data?.reverseCharge),
        items: itemsWithAmounts,
        discountPercent: finalDiscountPercent,
        tds: parsedTds, // Send as number, not string
        adjustment: finalAdjustment,
        notes: data?.notes || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      // Normalize tax fields - convert strings to numbers for backend
      // Backend expects tax and tds as decimal numbers, not strings
      const normalizedData = {
        ...payload,
        items: payload.items.map((item) => {
          // Extract numeric value from tax string (e.g., "5%" -> 5)
          let taxValue = 0;
          if (item.tax && item.tax !== "" && item.tax !== null && item.tax !== undefined) {
            if (typeof item.tax === "number") {
              taxValue = item.tax;
            } else {
              const taxMatch = String(item.tax).match(/(\d+(?:\.\d+)?)/);
              taxValue = taxMatch ? parseFloat(taxMatch[1]) : 0;
            }
          }
          
          return {
            ...item,
            tax: taxValue,
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
          };
        }),
        discountPercent: finalDiscountPercent,
        adjustment: finalAdjustment,
        // Extract numeric value from tds string (e.g., "5%" -> 5)
        tds: (() => {
          if (payload.tds === "" || payload.tds === null || payload.tds === undefined) {
            return 0;
          }
          if (typeof payload.tds === "number") {
            return payload.tds;
          }
          const tdsMatch = String(payload.tds).match(/(\d+(?:\.\d+)?)/);
          return tdsMatch ? parseFloat(tdsMatch[1]) : 0;
        })(),
      };

      const finalPayload = { ...normalizedData, attachments: payload.attachments };
      if (isEditing && !isNewFromSource) {
        console.info("📝 [EDIT (PUT)] Recurring Bill:", { 
          id: editId, 
          vendorName: finalPayload.vendorName,
          total: finalTotal,
          itemsCount: finalPayload.items.length,
          payload: finalPayload
        });
        updateMutation.mutate({ id: editId, payload: finalPayload });
        return;
      }

      // NEW (POST) - includes conversion from source
      const submissionType = isNewFromSource ? "NEW FROM SOURCE" : "NEW";
      console.info(`📄 [${submissionType} (POST)] Recurring Bill`, {
        sourceType: isNewFromSource ? state?.sourceType : null,
        sourceId: isNewFromSource ? state?.sourceId : null,
        vendorName: finalPayload.vendorName,
        itemsCount: finalPayload.items.length,
        total: finalTotal,
        payload: finalPayload
      });
      createMutation.mutate(finalPayload);
    } catch (err) {
      console.error("❌ [RECURRING BILL SUBMIT ERROR]", err);
      handleProvisionalError(err, "Recurring Bill Submit", "Failed to submit recurring bill");
    }
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0" style={{ maxWidth: "1150px", fontSize: "14px" }}>
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
          <i className="bi bi-calendar2-check me-1"></i>
          {isEditing ? "Edit Recurring Bill" : "New Recurring Bill"}
        </h5>

        <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate("/recurringbills")}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* Vendor Section */}
        <div
          className="p-3 mb-4"
          style={{ backgroundColor: "#f9fafc", borderRadius: "4px" }}
        >
          <div className="row align-items-center">
            <label className="col-sm-2 col-form-label fw-semibold text-danger">
              Vendor Name*
            </label>
            <div className="col-sm-10">
              <div className="input-group input-group-sm" style={{ maxWidth: "480px" }}>
                <Controller
                  name="vendorName"
                  control={control}
                  rules={{ required: "Vendor is required" }}
                  render={({ field }) => (
                    <div className="d-flex w-100">
                      <select
                        {...field}
                        className={`form-select form-select-sm ${false ? "is-invalid" : ""}`}
                        onChange={(e) => {
                          const label = e.target.value;
                          const found = (vendorOptions || []).find((v) => {
                            const lbl = (v?.displayName ?? v?.companyName ?? `${v?.firstName ?? ""} ${v?.lastName ?? ""}`).trim();
                            return lbl === label;
                          });
                          if (found) {
                            field.onChange(label);
                            setValue("vendorId", found.id);
                            setSelectedVendor(found);
                            if (found.paymentTerms) setValue("paymentTerms", found.paymentTerms);
                          } else {
                            field.onChange("");
                            setValue("vendorId", null);
                            setSelectedVendor(null);
                          }
                        }}
                      >
                        <option value="">Select a Vendor</option>
                        {vendorOptions.map((v) => {
                          const label = (v?.displayName ?? v?.companyName ?? v?.name ?? "Unnamed").trim();
                          const phone = v?.mobilePhone ?? v?.phone ?? v?.workPhone ?? v?.mobile ?? "";
                          const address = [
                            v?.billingAddress?.street1,
                            v?.billingAddress?.street2,
                            v?.billingAddress?.city,
                            v?.billingAddress?.state,
                            v?.billingAddress?.pinCode,
                          ].filter(Boolean).join(", ");
                          const optionText = [label, phone, address].filter(Boolean).join(" | ");
                          return (
                            <option key={v?.id ?? optionText} value={label} title={optionText}>
                              {optionText}
                            </option>
                          );
                        })}
                      </select>

                      <button type="button" className="btn btn-primary ms-2" onClick={() => navigate("/vendors")} title="Search Vendors">
                        <i className="bi bi-search" />
                      </button>
                    </div>
                  )}
                />
                <div className="small mt-2">
                  {selectedVendor ? (
                    <>
                      <div className="fw-semibold">{selectedVendor.displayName || `${selectedVendor.firstName ?? ""} ${selectedVendor.lastName ?? ""}`}</div>
                      <div>{selectedVendor.billingAddress?.street1 ?? ""} {selectedVendor.billingAddress?.city ?? ""}</div>
                      <div>{selectedVendor.billingAddress?.state ?? ""} {selectedVendor.billingAddress?.pinCode ?? ""}</div>
                      <div className="text-muted">{selectedVendor.mobilePhone ?? selectedVendor.phone ?? selectedVendor.workPhone ?? ""}</div>
                    </>
                  ) : (
                    <div className="text-muted">No vendor selected</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Bill Details */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label text-danger fw-semibold">
                Profile Name*
              </label>
              <Controller
                name="profileName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="form-control form-control-sm"
                  />
                )}
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-danger fw-semibold">
                Repeat Every*
              </label>
              <Controller
                name="repeatEvery"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option>Week</option>
                    <option>Month</option>
                    <option>Year</option>
                  </select>
                )}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Start On
              </label>
              <Controller
                name="startOn"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="form-control form-control-sm"
                  />
                )}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Ends On</label>
              <Controller
                name="endsOn"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="form-control form-control-sm"
                  />
                )}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold">Payment Terms</label>
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

            <div className="mb-3">
              <label className="form-label fw-semibold">Accounts Payable</label>
              <Controller
                name="accountsPayable"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option>Accounts Payable</option>
                    <option>Trade Payable</option>
                  </select>
                )}
              />
            </div>
            <div className="mb-3 d-flex align-items-center">
              <Controller
                name="neverExpires"
                control={control}
                render={({ field }) => (
                  <div className="form-check">
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <label className="form-check-label ms-2">Never Expires</label>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Reverse Charge */}
        <div className="form-check mb-4">
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
          <label className="form-check-label ms-2">
            This transaction is applicable for reverse charge
          </label>
        </div>

        <div className="border rounded mb-4">
          <div
            className="d-flex justify-content-between align-items-center p-2 border-bottom"
            style={{ backgroundColor: "#f9fafc" }}
          >
            <h6 className="mb-0 fw-semibold">Item Table</h6>
            <a href="#" className="text-primary small text-decoration-none">
              Bulk Actions
            </a>
          </div>

          <table className="table table-bordered align-middle mb-0">
            <thead style={{ backgroundColor: "#fafafa", fontSize: "13px" }}>
              <tr>
                <th>Item Details</th>
                <th>Account</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Tax</th>
                <th>Customer Details</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <Controller
                      name={`items.${index}.itemDetails`}
                      control={control}
                      render={({ field }) => (
                        itemOptions.length === 0 ? (
                          <input {...field} className="form-control form-control-sm" />
                        ) : (
                          <select
                            {...field}
                            className="form-select form-select-sm"
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "__add__") {
                                navigate("/newitem");
                                field.onChange("");
                                return;
                              }
                              field.onChange(value);

                              const selected = itemOptions.find((it) => {
                                const label = it?.name ?? it?.itemName ?? it?.title ?? "";
                                return String(it?.id) === String(value) || String(label) === String(value);
                              });

                              if (selected) {
                                const rate = selected?.costPrice ?? selected?.purchasePrice ?? selected?.rate ?? 0;
                                setValue(`items.${index}.rate`, Number(rate) || 0);
                              }
                            }}
                          >
                            <option value="">Select item</option>
                            {itemOptions.map((it, idx) => {
                              const label = it?.name ?? it?.itemName ?? it?.title ?? "Unnamed item";
                              const sku = it?.sku ?? it?.code ?? "";
                              const price = it?.costPrice ?? it?.purchasePrice ?? it?.rate ?? "";
                              const optionText = [label, sku, price ? `₹ ${price}` : ""].filter(Boolean).join(" | ");
                              return (
                                <option key={it?.id ?? idx} value={it?.id ?? label} title={optionText}>
                                  {optionText}
                                </option>
                              );
                            })}
                            <option value="__add__">+ Add new item...</option>
                          </select>
                        )
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`items.${index}.account`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="form-select form-select-sm"
                        >
                          <option>Select an account</option>
                          <option>Office Supplies</option>
                          <option>Maintenance</option>
                        </select>
                      )}
                    />
                  </td>
                  <td style={{ width: "80px" }}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="form-control form-control-sm"
                        />
                      )}
                    />
                  </td>
                  <td style={{ width: "120px" }}>
                    <Controller
                      name={`items.${index}.rate`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          className="form-control form-control-sm"
                        />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`items.${index}.tax`}
                      control={control}
                      render={({ field }) => (
                        <select
                          className="form-select form-select-sm"
                          value={field.value === 0 ? "" : (typeof field.value === "number" ? `${field.value}%` : field.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Convert "5%" to number 5, empty to 0
                            if (value === "" || value === null || value === undefined) {
                              field.onChange(0);
                            } else {
                              const taxMatch = String(value).match(/(\d+(?:\.\d+)?)/);
                              field.onChange(taxMatch ? parseFloat(taxMatch[1]) : 0);
                            }
                          }}
                        >
                          <option value="">Select a Tax</option>
                          <option value="5%">GST 5%</option>
                          <option value="12%">GST 12%</option>
                          <option value="18%">GST 18%</option>
                          <option value="28%">GST 28%</option>
                        </select>
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`items.${index}.customerDetails`}
                      control={control}
                      render={({ field }) => (
                        customerOptions.length === 0 ? (
                          <select {...field} className="form-select form-select-sm">
                            <option>Select Customer</option>
                          </select>
                        ) : (
                          <select
                            {...field}
                            className="form-select form-select-sm"
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                            }}
                          >
                            <option value="">Select Customer</option>
                            {customerOptions.map((c, idx) => {
                              const label = (c?.displayName ?? c?.companyName ?? c?.name ?? "Unnamed").trim();
                              const phone = c?.mobilePhone ?? c?.phone ?? c?.workPhone ?? "";
                              const address = [
                                c?.billingAddress?.street1,
                                c?.billingAddress?.street2,
                                c?.billingAddress?.city,
                                c?.billingAddress?.state,
                                c?.billingAddress?.pinCode,
                              ].filter(Boolean).join(", ");
                              const optionText = [label, phone, address].filter(Boolean).join(" | ");
                              return (
                                <option key={c?.id ?? idx} value={label} title={optionText}>
                                  {optionText}
                                </option>
                              );
                            })}
                          </select>
                        )
                      )}
                    />
                  </td>
                  <td className="text-end pe-3">
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          readOnly
                          value={`₹${(Number(itemsWithAmount[index]?.amount) || 0).toFixed(2)}`}
                          className="form-control form-control-sm text-end border-0 bg-transparent"
                          style={{ width: "120px" }}
                        />
                      )}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm text-danger"
                      onClick={() => remove(index)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-2">
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() =>
                  append({
                    itemDetails: "",
                    account: "",
                    quantity: 1,
                    rate: 0,
                    tax: 0,
                    customerDetails: "",
                    amount: 0,
                  })
                }
              >
                <i className="bi bi-plus-circle me-1"></i> Add New Row <i className="bi bi-caret-down-fill ms-1"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="d-flex justify-content-end mb-4">
          <div
            className="p-3 rounded"
            style={{
              backgroundColor: "#fafbff",
              width: "380px",
              fontSize: "14px",
            }}
          >
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-semibold">Sub Total</span>
              <Controller
                name="subTotal"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    readOnly
                    value={subtotal.toFixed(2)}
                    className="form-control form-control-sm text-end border-0 bg-transparent fw-semibold"
                    style={{ width: "100px" }}
                  />
                )}
              />
            </div>

            {/* Discount */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Discount</span>
              <div className="d-flex align-items-center gap-2">
                <Controller
                  name="discountPercent"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="form-control form-control-sm text-end"
                      style={{ width: "60px" }}
                    />
                  )}
                />
                <span>%</span>
                <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                  {discountAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* TDS */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>TDS</span>
              <div className="d-flex align-items-center gap-2">
                <Controller
                  name="tds"
                  control={control}
                  render={({ field }) => (
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "120px" }}
                      value={field.value === 0 ? "" : (typeof field.value === "number" ? `${field.value}%` : field.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Convert "5%" to number 5, empty to 0
                        if (value === "" || value === null || value === undefined) {
                          field.onChange(0);
                        } else {
                          const tdsMatch = String(value).match(/(\d+(?:\.\d+)?)/);
                          field.onChange(tdsMatch ? parseFloat(tdsMatch[1]) : 0);
                        }
                      }}
                    >
                      <option value="">Select a Tax</option>
                      <option value="5%">GST 5%</option>
                      <option value="12%">GST 12%</option>
                      <option value="18%">GST 18%</option>
                      <option value="28%">GST 28%</option>
                    </select>
                  )}
                />
                <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                  {Math.abs(tdsAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <hr />

            {/* Adjustment */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Adjustment</span>
              <div className="d-flex align-items-center gap-2">
                <Controller
                  name="adjustment"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="form-control form-control-sm text-end"
                      style={{ width: "80px" }}
                    />
                  )}
                />
                <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                  {toNumber(watchAdjustment, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <hr />

            <div className="d-flex justify-content-between fw-bold">
              <span>Total</span>
              <Controller
                name="totalAmount"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    readOnly
                    value={total.toFixed(2)}
                    className="form-control form-control-sm text-end border-0 bg-transparent fw-bold"
                    style={{ width: "100px" }}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Notes + Attachments */}
        <div className="border-top pt-3">
          <div className="row">
            <div className="col-md-8">
              <label className="form-label fw-semibold">Notes</label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="form-control form-control-sm"
                    rows="3"
                  />
                )}
              />
              <small className="text-muted">It will not be shown in PDF</small>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Attach File(s) to Recurring Bill
              </label>
              <div className="d-flex align-items-center mb-1">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="file-upload-recurring"
                />
                <label htmlFor="file-upload-recurring" className="btn btn-outline-secondary btn-sm mb-0">
                  <i className="bi bi-upload me-1"></i> Upload File
                </label>
              </div>
              <small className="text-muted">
                You can upload a maximum of 5 files, 10MB each
              </small>
              {uploadedFiles.length > 0 && (
                <div className="mt-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-1 small">
                      <span className="text-truncate" style={{ maxWidth: "200px" }}>{file.name}</span>
                      <button
                        type="button"
                        className="btn btn-sm p-0 text-danger"
                        onClick={() => removeFile(idx)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="mt-4 d-flex gap-2">
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
                ? "Update Recurring Bill"
                : "Save Recurring Bill"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-4"
            onClick={() => navigate("/recurringbills")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRecurringBills;
