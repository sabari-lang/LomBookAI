import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createVendorCredit, updateVendorCredit, getVendors } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { calculateLineAmount, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, toNumber, parseTaxPercentage } from "../../../utils/calculations";

const DEFAULTS = {
  vendorName: "",
  vendorId: null,
  creditNote: "",
  orderNumber: "",
  vendorCreditDate: new Date().toISOString().split("T")[0],
  subject: "",
  accountsPayable: "Accounts Payable",
  reverseCharge: false,
  items: [
    {
      itemDetails: "",
      account: "",
      quantity: 1.0,
      rate: 0.0,
      discount: 0,
      tax: "",
      amount: 0,
    },
  ],
  discountOverall: 0,
  taxType: "TDS",
  tax: "",
  adjustment: 0,
  totalAmount: 0,
  notes: "",
  attachments: [],
};

const NewVendorCredit = () => {
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
        console.info("📄 [VENDOR CREDIT FROM CONVERSION]", {
          sourceId: state?.sourceId ?? null,
          sourceType: state?.sourceType ?? null,
        });
      }

      reset({ ...DEFAULTS, ...state });
      if (state.attachments) {
        setUploadedFiles(state.attachments);
        setValue("attachments", state.attachments);
      }
      return;
    }

    reset(DEFAULTS);
    setUploadedFiles([]);
    setValue("attachments", []);
  }, [state, reset, setValue, isNewFromSource]);

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
    mutationFn: (payload) => createVendorCredit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorCredits"]);
      alert("Vendor credit created successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/vendorcredits");
    },
    onError: (error) => handleProvisionalError(error, "Create Vendor Credit"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateVendorCredit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["vendorCredits"]);
      alert("Vendor credit updated successfully");
      navigate("/vendorcredits");
    },
    onError: (error) => handleProvisionalError(error, "Update Vendor Credit"),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = useWatch({ control, name: "items" }) || [];
  const watchDiscountOverall = parseFloat(watch("discountOverall") || 0) || 0;
  const watchAdjustment = parseFloat(watch("adjustment") || 0) || 0;

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
    queryKey: ["items", "vendorcredit-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // Fetch vendors
  const { data: fetchedVendorsRaw } = useQuery({
    queryKey: ["vendors", "vendorcredit-form"],
    queryFn: () => getVendors({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Vendors"),
  });

  const vendorOptions = extractItems(fetchedVendorsRaw) || [];

  useEffect(() => {
    if (state?.vendorId && vendorOptions && vendorOptions.length > 0) {
      const found = vendorOptions.find((v) => String(v?.id) === String(state.vendorId));
      if (found) {
        setSelectedVendor(found);
        setValue("vendorName", (found.displayName ?? found.companyName ?? found.name ?? "").trim());
        setValue("vendorId", found.id);
      }
    }
  }, [vendorOptions, state, setValue]);

  // Calculate totals using shared utilities
  const discountAmount = calculateDiscountAmount(subtotal, watchDiscountOverall);
  const taxableAmount = subtotal - discountAmount;

  // parse tax percent from selected tax option
  const taxField = watch("tax") || "";
  const parsedTax = parseFloat(String(taxField).match(/(\d+(?:\.\d+)?)/)?.[0] || 0) || 0;
  const taxType = watch("taxType") || "TDS";
  const taxAmount = calculateTaxAmount(taxableAmount, parsedTax, taxType);

  // TDS reduces total, TCS increases total using shared utility
  const total = calculateGrandTotal(taxableAmount, taxAmount, toNumber(watchAdjustment, 0));
  
  // Sync calculated values to form state
  useEffect(() => {
    setValue("subTotal", subtotal, { shouldDirty: false });
    setValue("discountValue", discountAmount, { shouldDirty: false });
    setValue("taxAmount", Math.abs(taxAmount), { shouldDirty: false });
    setValue("totalAmount", total, { shouldDirty: false });
  }, [subtotal, discountAmount, taxAmount, total, setValue]);
  
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
      const finalDiscountOverall = toNumber(data.discountOverall, 0);
      const finalDiscountAmount = calculateDiscountAmount(finalSubtotal, finalDiscountOverall);
      const finalTaxableAmount = finalSubtotal - finalDiscountAmount;
      const parsedTax = parseTaxPercentage(data.tax);
      const finalTaxType = data.taxType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalTaxableAmount, parsedTax, finalTaxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotalAmount = calculateGrandTotal(finalTaxableAmount, finalTaxAmount, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        vendorName: data?.vendorName || "",
        vendorId: data?.vendorId || selectedVendor?.id || null,
        creditNote: data?.creditNote || "",
        orderNumber: data?.orderNumber || "",
        vendorCreditDate: data?.vendorCreditDate ? new Date(data.vendorCreditDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        subject: data?.subject || "",
        accountsPayable: data?.accountsPayable || "Accounts Payable",
        reverseCharge: Boolean(data?.reverseCharge),
        items: itemsWithAmounts,
        discountOverall: finalDiscountOverall,
        taxType: finalTaxType,
        tax: parsedTax, // Send as number, not string
        adjustment: finalAdjustment,
        totalAmount: finalTotalAmount,
        notes: data?.notes || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      if (isEditing && !isNewFromSource) {
        console.info("📝 [EDIT (PUT)] Vendor Credit:", { 
          id: editId, 
          vendorName: payload.vendorName,
          totalAmount: finalTotalAmount,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
        return;
      }

      // NEW (POST) - includes conversion from source
      const submissionType = isNewFromSource ? "NEW FROM SOURCE" : "NEW";
      console.info(`📄 [${submissionType} (POST)] Vendor Credit`, {
        sourceType: isNewFromSource ? state?.sourceType : null,
        sourceId: isNewFromSource ? state?.sourceId : null,
        vendorName: payload.vendorName,
        itemsCount: payload.items.length,
        totalAmount: finalTotalAmount,
        payload: payload
      });
      createMutation.mutate(payload);
    } catch (err) {
      console.error("❌ [VENDOR CREDIT SUBMIT ERROR]", err);
      handleProvisionalError(err, "Vendor Credit Submit", "Failed to submit vendor credit");
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
          <i className="bi bi-receipt me-1"></i>
          {isEditing ? "Edit Vendor Credit" : "New Vendor Credits"}
        </h5>

        <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate("/vendorcredits")}>
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

        {/* Credit Details */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label text-danger fw-semibold">
                Credit Note#*
              </label>
              <div className="input-group input-group-sm">
                <Controller
                  name="creditNote"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="form-control form-control-sm"
                    />
                  )}
                />
                <span className="input-group-text">
                  <i className="bi bi-gear"></i>
                </span>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Order Number</label>
              <Controller
                name="orderNumber"
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
              <label className="form-label fw-semibold">
                Vendor Credit Date
              </label>
              <Controller
                name="vendorCreditDate"
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
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Subject <i className="bi bi-info-circle text-muted"></i>
          </label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                type="text"
                placeholder="Enter a subject within 250 characters"
                className="form-control form-control-sm"
                style={{ maxWidth: "500px" }}
                rows="2"
              />
            )}
          />
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
                <th>Discount</th>
                <th>Tax</th>
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
                  <td style={{ width: "100px" }}>
                    <Controller
                      name={`items.${index}.discount`}
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
                          {...field}
                          className="form-select form-select-sm"
                        >
                          <option value="">Select a Tax</option>
                          <option value="5">GST 5%</option>
                          <option value="12">GST 12%</option>
                          <option value="18">GST 18%</option>
                          <option value="28">GST 28%</option>
                        </select>
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
                    quantity: 1.0,
                    rate: 0.0,
                    discount: 0,
                    tax: "",
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
                  name="discountOverall"
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

            {/* TDS / TCS */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <Controller
                  name="taxType"
                  control={control}
                  render={({ field }) => (
                    <>
                      <div className="form-check form-check-inline">
                        <input
                          {...field}
                          className="form-check-input"
                          type="radio"
                          value="TDS"
                          checked={field.value === "TDS"}
                        />
                        <label className="form-check-label">TDS</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          {...field}
                          className="form-check-input"
                          type="radio"
                          value="TCS"
                          checked={field.value === "TCS"}
                        />
                        <label className="form-check-label">TCS</label>
                      </div>
                    </>
                  )}
                />
                <Controller
                  name="tax"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="form-select form-select-sm"
                      style={{ width: "120px" }}
                    >
                      <option value="">Select a Tax</option>
                      <option value="5">GST 5%</option>
                      <option value="12">GST 12%</option>
                      <option value="18">GST 18%</option>
                      <option value="28">GST 28%</option>
                    </select>
                  )}
                />
              </div>
              <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                {Math.abs(taxAmount).toFixed(2)}
              </span>
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
                Attach File(s) to Vendor Credits
              </label>
              <div className="d-flex align-items-center mb-1">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn btn-outline-secondary btn-sm mb-0">
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
                ? "Update Vendor Credit"
                : "Save Vendor Credit"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-4"
            onClick={() => navigate("/vendorcredits")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewVendorCredit;
