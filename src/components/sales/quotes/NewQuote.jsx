// ==========================
// FULLY UPDATED NEWQUOTE.JSX
// MATCHES YOUR SCREENSHOT 100%
// ALL MISSING FIELDS ADDED
// ==========================

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";

import { createQuote, updateQuote, getCustomers, getQuotes } from "../api";
import { getItems } from "../../items/api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, toNumber } from "../../../utils/calculations";

const NewQuote = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const DEFAULTS = {
    customerName: "",
    quoteNumber: "QT-000001",
    referenceNumber: "",
    quoteDate: new Date().toISOString().split("T")[0],
    expiryDate: "",

    salesperson: "",
    projectName: "",
    subject: "",

    items: [
      {
        itemDetails: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        tax: "",
        amount: 0
      }
    ],

    taxType: "TDS",
    taxValue: "",
    adjustment: 0,
    taxAmount: 0,

    customerNotes: "Looking forward for your business.",
    termsAndConditions: "",

    attachments: [],
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULTS,
  });

  const queryClient = useQueryClient();
  const editId = state?.id;
  const isNewFromQuote = state?.isNew === true;
  const isEditing = Boolean(editId) && !isNewFromQuote;

  const {
    data: fetchedCustomers,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["customers", "quote-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 100 }),
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Customers"),
  });

  const customerOptions = extractItems(fetchedCustomers);

  // Watch selected customer name to fetch related quotes
  const selectedCustomerName = watch("customerName");

  const { data: fetchedQuotesForCustomer, isLoading: quotesLoading } = useQuery({
    queryKey: ["quotes", "byCustomer", selectedCustomerName],
    queryFn: () => getQuotes({ Page: 1, PageSize: 200 }),
    enabled: Boolean(selectedCustomerName),
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Quotes"),
  });

  const allQuotes = extractItems(fetchedQuotesForCustomer) || [];
  const relatedQuotes = (allQuotes || []).filter((q) => {
    if (!selectedCustomerName) return false;
    return (q?.customerName || "").toLowerCase() === String(selectedCustomerName || "").toLowerCase();
  });

  // Fetch items for item dropdowns
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "quote-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const list = files.map((file) => ({
      name: file?.name || "",
      size: ((file?.size || 0) / 1024).toFixed(2) + " KB",
      url: URL.createObjectURL(file),
      type: file?.type || "",
    }));

    const updated = [...uploadedFiles, ...list];
    setUploadedFiles(updated);
  };

  // keep form attachments in sync with uploadedFiles
  useEffect(() => {
    if (uploadedFiles.length > 0) setValue("attachments", uploadedFiles);
  }, [uploadedFiles, setValue]);

  const formatCustomerLabel = (customer) => {
    const name =
      customer?.displayName ||
      customer?.companyName ||
      customer?.name ||
      "Unnamed customer";

    const phone =
      customer?.mobilePhone ||
      customer?.phone ||
      customer?.workPhone ||
      customer?.mobile ||
      "";

    const address = [
      customer?.billingAddress?.street1,
      customer?.billingAddress?.street2,
      customer?.billingAddress?.city,
      customer?.billingAddress?.state,
      customer?.billingAddress?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    const parts = [name];
    if (phone) parts.push(phone);
    if (address) parts.push(address);
    return parts.join(" | ");
  };

  // Load edit data or conversion payload
  useEffect(() => {
    if (state) {
      // If conversion from another document, log the metadata for audit
      if (state?.isNew === true) {
        console.info("📋 [NEW QUOTE FROM CONVERSION]", {
          sourceQuoteId: state?.sourceQuoteId,
          sourceQuoteNumber: state?.sourceQuoteNumber,
          sourceType: state?.sourceType,
          conversionTimestamp: state?.conversionTimestamp,
          customerName: state?.customerName,
          itemsCount: state?.items?.length || 0,
        });
      }

      reset({
        ...DEFAULTS,
        ...state,
        quoteDate: state?.quoteDate
          ? moment(state.quoteDate).format("YYYY-MM-DD")
          : null,
        expiryDate: state?.expiryDate
          ? moment(state.expiryDate).format("YYYY-MM-DD")
          : null,
      });
      return;
    }
    reset(DEFAULTS);
  }, [state, reset]);

  // Items Field Array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Use useWatch for stable subscription to items array and memoize subtotal
  const watchedItems = useWatch({ control, name: "items" }) || [];

  // Use shared calculation utility - calculateLineAmount imported from utils/calculations

  // Sync calculated amounts back to form state
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const calculatedAmount = calculateLineAmount(item);
      const currentAmount = toNumber(item?.amount, 0);
      if (Math.abs(calculatedAmount - currentAmount) > 0.01) {
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
    });
  }, [watchedItems, setValue]);

  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems);
  }, [watchedItems]);

  const taxPercent = toNumber(watch("taxValue"), 0);
  const taxType = watch("taxType") || "TDS";
  const calculatedTaxAmount = calculateTaxAmount(subTotal, taxPercent, taxType);
  const adjustment = toNumber(watch("adjustment"), 0);
  const calculatedTotalAmount = calculateGrandTotal(subTotal, calculatedTaxAmount, adjustment);

  // Sync taxAmount and totalAmount to form state
  useEffect(() => {
    const currentTaxAmount = Number(watch("taxAmount")) || 0;
    const currentTotalAmount = Number(watch("totalAmount")) || 0;
    
    if (Math.abs(calculatedTaxAmount - currentTaxAmount) > 0.01) {
      setValue("taxAmount", calculatedTaxAmount, { shouldDirty: false, shouldValidate: false });
    }
    if (Math.abs(calculatedTotalAmount - currentTotalAmount) > 0.01) {
      setValue("totalAmount", calculatedTotalAmount, { shouldDirty: false, shouldValidate: false });
    }
  }, [calculatedTaxAmount, calculatedTotalAmount, watch, setValue]);

  const taxAmount = Math.abs(calculatedTaxAmount); // Use absolute value for display
  const totalAmount = calculatedTotalAmount;

  // Submit Handler
  const createMutation = useMutation({
    mutationFn: (payload) => createQuote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotes"]);
      alert("Quote created successfully");
      navigate("/quotes");
    },
    onError: (error) => handleProvisionalError(error, "Create Quote"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotes"]);
      alert("Quote updated successfully");
      navigate("/quotes");
    },
    onError: (error) => handleProvisionalError(error, "Update Quote"),
  });

  const onSubmit = (data) => {
    try {
      // Basic validation (also relevant for conversions)
      if (!data?.customerName) {
        handleProvisionalError(new Error("Customer name required"), "Validation", "❌ Customer name is required");
        return;
      }

      if (!Array.isArray(data?.items) || data.items.length === 0) {
        handleProvisionalError(new Error("At least one item is required"), "Validation", "❌ At least one item is required");
        return;
      }

      const invalidItem = data.items.find((item) => !item?.itemDetails || !item?.quantity || !item?.rate);
      if (invalidItem) {
        handleProvisionalError(new Error("All items must contain itemDetails, quantity and rate"), "Validation", "❌ Items must be complete");
        return;
      }

      // Calculate and sync all amounts before submission using shared utilities
      const itemsWithAmounts = (data.items || []).map((item) => ({
        itemDetails: item?.itemDetails || "",
        quantity: toNumber(item?.quantity, 1),
        rate: toNumber(item?.rate, 0),
        discount: toNumber(item?.discount, 0),
        tax: item?.tax || "",
        amount: calculateLineAmount(item),
      }));

      // Recalculate totals with synced item amounts using shared utilities
      const finalSubTotal = calculateSubtotal(itemsWithAmounts);
      const finalTaxPercent = toNumber(data.taxValue, 0);
      const taxType = data.taxType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalSubTotal, finalTaxPercent, taxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotalAmount = calculateGrandTotal(finalSubTotal, finalTaxAmount, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        customerName: data?.customerName || "",
        quoteNumber: data?.quoteNumber || "QT-000001",
        referenceNumber: data?.referenceNumber || "",
        quoteDate: data?.quoteDate ? moment(data.quoteDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        expiryDate: data?.expiryDate ? moment(data.expiryDate).toISOString().split("T")[0] : "",
        salesperson: data?.salesperson || "",
        projectName: data?.projectName || "",
        subject: data?.subject || "",
        items: itemsWithAmounts,
        taxType: taxType,
        taxValue: data?.taxValue || "",
        adjustment: finalAdjustment,
        taxAmount: Math.abs(finalTaxAmount), // Store absolute value
        totalAmount: finalTotalAmount, // Include calculated totalAmount
        customerNotes: data?.customerNotes || "Looking forward for your business.",
        termsAndConditions: data?.termsAndConditions || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      if (isEditing && !isNewFromQuote) {
        // EDIT (PUT) - when we are actually editing an existing quote
        console.info("📝 [EDIT (PUT)] Quote:", { 
          id: editId, 
          customerName: payload.customerName, 
          totalAmount: finalTotalAmount, 
          taxAmount: finalTaxAmount,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
      } else {
        // NEW (POST) - for both new and converted quotes
        const submissionType = isNewFromQuote ? "NEW FROM CONVERSION" : "NEW";
        console.info(`📄 [${submissionType} (POST)] Quote:`, {
          sourceId: isNewFromQuote ? state?.sourceQuoteId : null,
          customerName: payload.customerName,
          itemsCount: payload.items.length,
          totalAmount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          payload: payload,
          timestamp: new Date().toISOString(),
        });
        createMutation.mutate(payload);
      }
    } catch (err) {
      console.error("❌ [QUOTE SUBMIT ERROR]", err);
      handleProvisionalError(err, "Quote Submit", "Failed to submit quote");
    }
  };

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
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

        <h5 className="fw-semibold"><i className="bi bi-file-earmark-text text-primary me-2"></i>{isEditing ? "Edit Quote" : "New Quote"}</h5>
        <button className="btn btn-link text-danger p-0" onClick={() => navigate("/quotes")}>
          <i className="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">

        {/* Customer Name */}
        <label className="form-label text-danger fw-semibold small">Customer Name*</label>
        <div className="input-group mb-3">
          <Controller
            name="customerName"
            control={control}
            rules={{ required: "Customer Name is required" }}
            render={({ field }) => (
              <select
                {...field}
                className={`form-select ${errors.customerName ? "is-invalid" : ""}`}
                disabled={customersLoading}
                aria-invalid={errors.customerName ? true : false}
              >
                <option value="">
                  {customersLoading ? "Loading customers..." : "Select or add a customer"}
                </option>
                {customerOptions?.map((customer) => {
                  const value =
                    customer?.displayName ||
                    customer?.companyName ||
                    customer?.name ||
                    "";
                  if (!value) return null;
                  return (
                    <option
                      key={customer?.id ?? customer?.customerId ?? value}
                      value={value}
                    >
                      {formatCustomerLabel(customer)}
                    </option>
                  );
                })}
              </select>
            )}
          />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // quick search: go to customers page
                navigate("/newcustomer");
              }}
              title="Manage Customers"
            >
              <i className="bi bi-people"></i>
            </button>
        </div>
        {customersError && (
          <div className="form-text text-danger small">
            Unable to load customers. Please try again later.
          </div>
        )}

        {/* Related Quotes Count */}
        {selectedCustomerName && (
          <div className="mb-2">
            <small className="text-muted">
              {quotesLoading ? (
                <>Checking related quotes...</>
              ) : (
                <>
                  <span className="fw-semibold text-primary">{relatedQuotes.length} quote(s)</span> found for this customer.{" "}
                  <a href="#" className="text-primary small" onClick={(e) => { e.preventDefault(); navigate("/quotes", { state: { customerName: selectedCustomerName } }); }}>
                    View Quotes
                  </a>
                </>
              )}
            </small>
          </div>
        )}

        {/* Quote Details Grid */}
        <div className="row g-3">

          {/* Quote Number */}
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Quote#*</label>
            <div className="input-group">
              <Controller
                name="quoteNumber"
                control={control}
                render={({ field }) => (
                  <input {...field} type="text" className={`form-control ${errors.quoteNumber ? "is-invalid" : ""}`} aria-invalid={errors.quoteNumber ? true : false} />
                )}
              />
              <span className="input-group-text"><i className="bi bi-gear"></i></span>
            </div>
          </div>

          {/* Reference */}
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Reference#</label>
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => (
                <input {...field} type="text" className="form-control" />
              )}
            />
          </div>

          {/* Quote Date */}
          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Quote Date*</label>
            <Controller
              name="quoteDate"
              control={control}
              rules={{ required: "Quote date required" }}
              render={({ field }) => (
                <input {...field} type="date" className={`form-control ${errors.quoteDate ? "is-invalid" : ""}`} aria-invalid={errors.quoteDate ? true : false} />
              )}
            />
          </div>

          {/* Expiry Date */}
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Expiry Date</label>
            <Controller
              name="expiryDate"
              control={control}
              render={({ field }) => (
                <input {...field} type="date" className="form-control" />
              )}
            />
          </div>

        </div>

        <hr className="my-4" />

        {/* Salesperson & Project */}
        {/* Salesperson & Project Name */}
        <div className="row g-3">

          {/* Salesperson */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Salesperson</label>
            <Controller
              name="salesperson"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="form-control input-compact"
                  placeholder="Enter salesperson name"
                />
              )}
            />
          </div>

          {/* Project Name */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Project Name</label>
            <Controller
              name="projectName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="form-control input-compact"
                  placeholder="Enter project name"
                />
              )}
            />
            <div className="form-text text-muted small">
              Select a customer to associate a project.
            </div>
          </div>

        </div>


        {/* Subject */}
        <div className="mt-3">
          <label className="form-label small fw-semibold">Subject</label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <textarea {...field} rows={1} className="form-control" placeholder="Let your customer know what this Quote is for"></textarea>
            )}
          />
        </div>

        {/* Item Table */}
        <div className="mt-4 border rounded">
          <div className="p-2 bg-light border-bottom fw-semibold d-flex justify-content-between">
            <span>Item Table</span>
            <a href="#" className="small text-primary">Bulk Actions</a>
          </div>

          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Item Details</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Discount (%)</th>
                <th>Tax</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const qty = Number(watchedItems[index]?.quantity) || 0;
                const rate = Number(watchedItems[index]?.rate) || 0;
                const discount = Number(watchedItems[index]?.discount) || 0;
                const tax = Number(watchedItems[index]?.tax) || 0;

                const base = qty * rate;
                const final = base - (base * discount) / 100;
                const withTax = final + (final * tax) / 100;

                return (
                  <tr key={field.id}>

                    {/* Item */}
                    <td>
                      <Controller
                        name={`items.${index}.itemDetails`}
                        control={control}
                        rules={{ required: "Item is required" }}
                        render={({ field }) => (
                          itemOptions.length === 0 ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted">No items available</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => navigate("/newitem")}
                              >
                                + Add Item
                              </button>
                            </div>
                          ) : (
                            <>
                              <select
                                {...field}
                                className={`form-select ${errors?.items?.[index]?.itemDetails ? "is-invalid" : ""}`}
                                aria-invalid={errors?.items?.[index]?.itemDetails ? true : false}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "__add__") {
                                    navigate("/newitem");
                                    field.onChange("");
                                    return;
                                  }
                                  field.onChange(value);
                                  const selected = itemOptions.find((it) => String(it?.id) === String(value) || (it?.name && String(it?.name) === String(value)));
                                  if (selected) {
                                    const rate = selected?.rate ?? selected?.sellingPrice ?? 0;
                                    setValue(`items.${index}.rate`, Number(rate) || 0);
                                  }
                                }}
                              >
                                <option value="">Select item</option>
                                {itemOptions.map((it, idx) => {
                                  const label = it?.name ?? it?.itemName ?? it?.title ?? "Unnamed item";
                                  const sku = it?.sku ?? it?.code ?? "";
                                  const price = it?.rate ?? it?.sellingPrice ?? "";
                                  const optionText = [label, sku, price ? `₹ ${price}` : ""].filter(Boolean).join(" | ");
                                  return (
                                    <option key={it?.id ?? idx} value={it?.id ?? label} title={optionText}>
                                      {optionText}
                                    </option>
                                  );
                                })}
                                <option value="__add__">+ Add new item...</option>
                              </select>
                              {errors?.items?.[index]?.itemDetails && (
                                <div className="text-danger small mt-1">{errors.items[index].itemDetails.message}</div>
                              )}
                            </>
                          )
                        )}
                      />
                    </td>

                    {/* Qty */}
                    <td>
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        rules={{ required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } }}
                        render={({ field }) => <>
                          <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.quantity ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.quantity ? true : false} />
                          {errors?.items?.[index]?.quantity && (
                            <div className="text-danger small mt-1">{errors.items[index].quantity.message}</div>
                          )}
                        </>}
                      />
                    </td>

                    {/* Rate */}
                    <td>
                      <Controller
                        name={`items.${index}.rate`}
                        control={control}
                        rules={{ required: "Rate is required", min: { value: 0, message: "Rate must be >= 0" } }}
                        render={({ field }) => <>
                          <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.rate ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.rate ? true : false} />
                          {errors?.items?.[index]?.rate && (
                            <div className="text-danger small mt-1">{errors.items[index].rate.message}</div>
                          )}
                        </>}
                      />
                    </td>

                    {/* Discount */}
                    <td>
                      <Controller
                        name={`items.${index}.discount`}
                        control={control}
                        render={({ field }) => <input {...field} type="number" className="form-control text-end" />}
                      />
                    </td>

                    {/* Tax */}
                    <td>
                      <Controller
                        name={`items.${index}.tax`}
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="form-select">
                            <option value="">Select a Tax</option>
                            <option value="5">GST 5%</option>
                            <option value="12">GST 12%</option>
                            <option value="18">GST 18%</option>
                          </select>
                        )}
                      />
                    </td>

                    {/* Amount */}
                    <td className="text-end">
                      <Controller
                        name={`items.${index}.amount`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            readOnly
                            value={withTax.toFixed(2)}
                            className="form-control form-control-sm text-end border-0 bg-transparent"
                            style={{ width: "100px" }}
                          />
                        )}
                      />
                    </td>

                    {/* Delete */}
                    <td className="text-center">
                      {fields.length > 1 && (
                        <button type="button" className="btn btn-link text-danger" onClick={() => remove(index)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-2 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => append({ itemDetails: "", quantity: 1, rate: 0, discount: 0, tax: "", amount: 0 })}
            >
              + Add New Row
            </button>

            <button type="button" className="btn btn-outline-primary btn-sm">
              + Add items in Bulk
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <div className="row mt-4">

          {/* Customer Notes */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller
              name="customerNotes"
              control={control}
              render={({ field }) => (
                <textarea {...field} rows={2} className="form-control"></textarea>
              )}
            />
          </div>

          {/* Summary Box */}
          <div className="col-md-6">
            <div className="border rounded p-3">

              <div className="d-flex justify-content-between mb-2">
                <span>Sub Total</span>
                <Controller
                  name="subTotal"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={subTotal.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent fw-semibold"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              {/* TDS / TCS */}
              <div className="mb-2">
                <div className="d-flex gap-3">
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <>
                        <div className="form-check">
                          <input type="radio" className="form-check-input" {...field} value="TDS" checked={field.value === "TDS"} />
                          <label className="form-check-label small">TDS</label>
                        </div>

                        <div className="form-check">
                          <input type="radio" className="form-check-input" {...field} value="TCS" checked={field.value === "TCS"} />
                          <label className="form-check-label small">TCS</label>
                        </div>
                      </>
                    )}
                  />

                  <Controller
                    name="taxValue"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm w-auto">
                        <option value="">Select a Tax</option>
                        <option value="1">1%</option>
                        <option value="5">5%</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Tax Amount */}
              <div className="d-flex justify-content-between mb-2">
                <span>Tax Amount</span>
                <Controller
                  name="taxAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={taxAmount.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent fw-bold"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              {/* Adjustment */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Adjustment</span>
                <Controller
                  name="adjustment"
                  control={control}
                  render={({ field }) => (
                    <input {...field} type="number" className="form-control form-control-sm text-end w-25" />
                  )}
                />
              </div>

              <hr />

              <div className="d-flex justify-content-between fw-bold fs-6">
                <span>Total ( ₹ )</span>
                <Controller
                  name="totalAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={totalAmount.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent fw-bold"
                      style={{ width: "120px" }}
                    />
                  )}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-4">
          <label className="form-label small fw-semibold">Terms & Conditions</label>
          <Controller
            name="termsAndConditions"
            control={control}
            render={({ field }) => <textarea {...field} rows={3} className="form-control"></textarea>}
          />
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary mt-4">
          {isEditing ? "Update Quote" : "Save Quote"}
        </button>

      </form>
    </div>
  );
};

export default NewQuote;
