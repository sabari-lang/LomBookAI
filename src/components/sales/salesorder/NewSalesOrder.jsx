import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSalesOrder, updateSalesOrder, getCustomers, getQuotes } from "../api";
import { getItems } from "../../items/api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import moment from "moment/moment";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, toNumber } from "../../../utils/calculations";
import { refreshKeyboard } from "../../../utils/refreshKeyboard";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const NewSalesOrder = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------------------------
  // DEFAULT VALUES
  // ---------------------------
  const DEFAULTS = {
    customerName: "",
    salesOrderNumber: "SO-00001",
    referenceNumber: "",
    salesOrderDate: moment().format("YYYY-MM-DD"),
    expectedShipmentDate: "",
    paymentTerms: "Due on Receipt",
    deliveryMethod: "",
    salesperson: "",
    items: [
      {
        itemDetails: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        tax: "",
        amount: 0,
      },
    ],
    taxType: "TDS",
    taxSelect: "",
    adjustment: "",
    totalAmount: 0,
    customerNotes: "",
    terms: "",
    attachments: [],
  };

  const {
    control,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const editId = state?.id || null;
  const isNewFromQuote = state?.isNew === true; // 🔥 NEW: Flag from quote conversion
  const isEditing = Boolean(editId) && !isNewFromQuote; // 🔥 UPDATED: Don't edit if isNew flag is set

  const [uploadedFiles, setUploadedFiles] = useState([]);


  useEffect(() => {
    if (state) {
      // 🔥 NEW: Log conversion context
      if (isNewFromQuote) {
        console.info("[Sales Order Creation from Quote]", {
          sourceQuoteId: state?.sourceQuoteId,
          sourceQuoteNumber: state?.sourceQuoteNumber,
          conversionTimestamp: state?.conversionTimestamp,
          mode: "NEW (POST)",
        });
      }

      const formattedState = {
        ...state,
        salesOrderDate: state?.salesOrderDate
          ? moment(state.salesOrderDate).format("YYYY-MM-DD")
          : null,
        expectedShipmentDate: state?.expectedShipmentDate
          ? moment(state.expectedShipmentDate).format("YYYY-MM-DD")
          : null,
      };

      reset({ ...DEFAULTS, ...formattedState });

      setUploadedFiles(state?.attachments || []);
      setValue("attachments", state?.attachments || []);
      // Call refreshKeyboard after form values are populated
      refreshKeyboard();

      return;
    }

    // NEW MODE
    reset({
      ...DEFAULTS,
      salesOrderDate: moment().format("YYYY-MM-DD"),
    });

    setUploadedFiles([]);
    setValue("attachments", []);
  }, [state, reset, setValue, isNewFromQuote]);


  // ---------------------------
  // FETCH CUSTOMERS (for dynamic select)
  // ---------------------------
  const {
    data: fetchedCustomers,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["customers", "sales-order-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Customers"),
  });

  const customerOptions = extractItems(fetchedCustomers) || [];

  // ---------------------------
  // FETCH QUOTES FOR SELECTED CUSTOMER
  // ---------------------------
  const selectedCustomerName = watch("customerName");

  const {
    data: fetchedQuotesForCustomer,
    isLoading: quotesLoading,
  } = useQuery({
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

  // ---------------------------
  // FETCH ITEMS (for item dropdown)
  // ---------------------------
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "sales-order-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // ---------------------------
  // LIVE WATCH FOR ITEMS (useWatch for stable updates)
  // ---------------------------
  const watchedItems = useWatch({ control, name: "items" }) || [];

  // ---------------------------
  // SHARED FULL LINE CALCULATION (Auto Updates UI + Summary)
  // ---------------------------
  // Use shared calculation utility - calculateLineAmount imported from utils/calculations

  // Sync item amounts when items change
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const calculatedAmount = calculateLineAmount(item);
      const currentAmount = toNumber(item?.amount, 0);
      if (Math.abs(calculatedAmount - currentAmount) > 0.01) {
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
    });
  }, [watchedItems, setValue]);

  // ---------------------------
  // SUBTOTAL (LIVE) - Using shared utility
  // ---------------------------
  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems);
  }, [watchedItems]);

  // ---------------------------
  // SUMMARY TAX - Using shared utility
  // ---------------------------
  const taxRate = toNumber(watch("taxSelect"), 0);
  const taxType = watch("taxType") || "TDS";

  const taxAmount = useMemo(() => {
    return calculateTaxAmount(subTotal, taxRate, taxType);
  }, [subTotal, taxRate, taxType]);

  // ---------------------------
  // TOTAL - Using shared utility
  // ---------------------------
  const adjustment = toNumber(watch("adjustment"), 0);

  const finalTotal = useMemo(() => {
    return calculateGrandTotal(subTotal, taxAmount, adjustment);
  }, [subTotal, taxAmount, adjustment]);

  // Sync calculated values to form state
  useEffect(() => {
    setValue("totalAmount", finalTotal, { shouldDirty: false });
  }, [finalTotal, setValue]);

  // ---------------------------
  // FILE UPLOAD
  // ---------------------------
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
    setValue("attachments", updated);
  };

  const removeFile = (i) => {
    const updated = uploadedFiles.filter((_, index) => index !== i);
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  // ---------------------------
  // API HANDLING
  // ---------------------------
  const createMutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(["salesOrders"]);
      notifySuccess("Sales Order Created!");
      reset(DEFAULTS);
      refreshKeyboard();
      navigate("/salesorders");
    },
    onError: (error) => handleProvisionalError(error, "Create Sales Order"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSalesOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["salesOrders"]);
      notifySuccess("Sales Order Updated!");
      refreshKeyboard();
      navigate("/salesorders");
    },
    onError: (error) => handleProvisionalError(error, "Update Sales Order"),
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data) => {
    try {
      // Validate data
      if (!data || typeof data !== "object") {
        throw new Error("Invalid form data");
      }

      if (!data?.customerName || !data.customerName.trim()) {
        throw new Error("Customer name is required");
      }

      if (!Array.isArray(data?.items) || data.items.length === 0) {
        throw new Error("At least one item is required");
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
      const finalTaxRate = toNumber(data.taxSelect, 0);
      const finalTaxType = data.taxType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalSubTotal, finalTaxRate, finalTaxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotalAmount = calculateGrandTotal(finalSubTotal, finalTaxAmount, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        customerName: data?.customerName || "",
        salesOrderNumber: data?.salesOrderNumber || "SO-00001",
        referenceNumber: data?.referenceNumber || "",
        salesOrderDate: data?.salesOrderDate ? moment(data.salesOrderDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
        expectedShipmentDate: data?.expectedShipmentDate ? moment(data.expectedShipmentDate).toISOString().split("T")[0] : "",
        paymentTerms: data?.paymentTerms || "Due on Receipt",
        deliveryMethod: data?.deliveryMethod || "",
        salesperson: data?.salesperson || "",
        items: itemsWithAmounts,
        taxType: finalTaxType,
        taxSelect: data?.taxSelect || "",
        adjustment: String(finalAdjustment),
        totalAmount: finalTotalAmount,
        customerNotes: data?.customerNotes || "",
        terms: data?.terms || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      // 🔥 UPDATED: Always use POST if isNewFromQuote is true
      if (isEditing && !isNewFromQuote) {
        // Edit mode - use PUT
        console.info(`[Sales Order Update] Updating sales order ID: ${editId}`, {
          mode: "EDIT (PUT)",
          id: editId,
          customerName: payload.customerName,
          totalAmount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
      } else {
        // Create mode - use POST (includes isNewFromQuote case)
        console.info("[Sales Order Creation]", {
          mode: isNewFromQuote ? "NEW FROM QUOTE (POST)" : "NEW (POST)",
          sourceQuoteId: isNewFromQuote ? state?.sourceQuoteId : null,
          customerName: payload.customerName,
          itemCount: payload.items.length,
          totalAmount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          payload: payload
        });
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error("[Form Submit Error]", error);
      handleProvisionalError(error, "Save Sales Order", error?.message);
    }
  };

  // ---------------------------
  // UI STARTS (UNCHANGED!)
  // ---------------------------
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
        <h5>
          <i className="bi bi-cart3 me-2"></i>
          {isEditing ? "Edit Sales Order" : "New Sales Order"}
        </h5>
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent"
          style={{ fontSize: "22px", lineHeight: 1, color: "red" }}
          onClick={() => navigate("/items")}
        >
          ×
        </button>

      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">

        {/* CUSTOMER NAME - dynamic select from API */}
        <div className="rounded shadow-sm mb-3">
          <label className="form-label small fw-semibold text-danger">Customer Name <span >*</span></label>
          <div className="input-group">
            <Controller
              name="customerName"
              control={control}
              rules={{ required: "Customer Name is required" }}
              render={({ field }) => (
                <select {...field} className={`form-select ${errors.customerName ? "is-invalid" : ""}`} aria-invalid={errors?.customerName ? true : false}>
                  <option value="">Select or Add Customer</option>
                  {customerOptions.map((c, idx) => {
                    const label = c?.displayName ?? c?.companyName ?? c?.name ?? "Unnamed";
                    const phone = c?.mobilePhone ?? c?.phone ?? c?.workPhone ?? c?.mobile ?? "";
                    const address = [
                      c?.billingAddress?.street1,
                      c?.billingAddress?.street2,
                      c?.billingAddress?.city,
                      c?.billingAddress?.state,
                      c?.billingAddress?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ");

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
            {errors?.customerName && (
              <div className="text-danger small mt-1">{errors.customerName.message}</div>
            )}
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

          {/* Show related quotes if any for selected customer */}
          {selectedCustomerName && (
            <div className="mt-2 small">
              {quotesLoading ? (
                <span className="text-muted">Checking quotes...</span>
              ) : relatedQuotes.length > 0 ? (
                <>
                  <span className="text-success">{relatedQuotes.length} quote(s) found for this customer.</span>
                  <button
                    type="button"
                    className="btn btn-link btn-sm ms-2 p-0"
                    onClick={() => navigate("/quotes", { state: { customerName: selectedCustomerName } })}
                  >
                    View Quotes
                  </button>
                </>
              ) : (
                <span className="text-muted">No quotes found for this customer.</span>
              )}
            </div>
          )}
        </div>

        {/* ORDER DETAILS - UNCHANGED */}
        <div className="row g-3 mb-3">

          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Sales Order#*</label>
            <Controller
              name="salesOrderNumber"
              control={control}
              render={({ field }) => (
                <input {...field} className={`form-control ${errors.salesOrderNumber ? "is-invalid" : ""}`} aria-invalid={errors.salesOrderNumber ? true : false} />
              )}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Reference#</label>
            <Controller
              name="referenceNumber"
              control={control}
              render={({ field }) => <input {...field} className="form-control" />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Sales Order Date*</label>
            <Controller
              name="salesOrderDate"
              control={control}
              rules={{ required: "Sales Order Date is required" }}
              render={({ field }) => <input {...field} type="date" className={`form-control ${errors.salesOrderDate ? "is-invalid" : ""}`} aria-invalid={errors?.salesOrderDate ? true : false} />}
            />
            {errors?.salesOrderDate && (
              <div className="text-danger small mt-1">{errors.salesOrderDate.message}</div>
            )}
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Expected Shipment Date</label>
            <Controller
              name="expectedShipmentDate"
              control={control}
              render={({ field }) => <input {...field} type="date" className="form-control" />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Payment Terms</label>
            <Controller
              name="paymentTerms"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option>Due on Receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>   {/* Added */}
                  <option>Net 60</option>   {/* Added */}
                </select>
              )}
            />

          </div>
        </div>

        <hr />

        {/* DELIVERY / SALESPERSON - UNCHANGED */}
        <div className="row g-3 mb-3">

          <div className="col-md-4">
            <label className="form-label small fw-semibold">Delivery Method</label>
            <Controller
              name="deliveryMethod"
              control={control}
              render={({ field }) => (
                <input {...field} className="form-control" />
              )}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small fw-semibold">Salesperson</label>
            <Controller
              name="salesperson"
              control={control}
              render={({ field }) => (
                <input {...field} className="form-control" />
              )}
            />
          </div>
        </div>

        {/* ITEM TABLE - UI UNCHANGED */}
        <div className="border rounded shadow-sm mb-3">

          <div className="p-2 bg-light border-bottom">
            <strong>Item Table</strong>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Item Details <span className="text-danger">*</span></th>
                  <th>Qty <span className="text-danger">*</span></th>
                  <th>Rate <span className="text-danger">*</span></th>
                  <th>Discount (%)</th>
                  <th>Tax (%)</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {fields.map((row, index) => {
                  const amount = calculateLineAmount(watchedItems[index] || {});

                  return (
                    <tr key={row.id}>
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
                                    // If user selected the special add option, navigate to new item
                                    if (value === "__add__") {
                                      navigate("/newitem");
                                      // reset selection
                                      field.onChange("");
                                      return;
                                    }

                                    field.onChange(value);

                                    // find the selected item by id or by label
                                    const selected = itemOptions.find((it) => {
                                      const label = it?.name || it?.itemName || it?.title || "";
                                      return String(it?.id) === String(value) || String(label) === String(value);
                                    });

                                    if (selected) {
                                      const rate = selected?.rate ?? selected?.sellingPrice ?? 0;
                                      // set the rate for this row
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

                      <td>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          rules={{ required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } }}
                          render={({ field }) => (
                            <>
                              <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.quantity ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.quantity ? true : false} />
                              {errors?.items?.[index]?.quantity && (
                                <div className="text-danger small mt-1">{errors.items[index].quantity.message}</div>
                              )}
                            </>
                          )}
                        />
                      </td>

                      <td>
                        <Controller
                          name={`items.${index}.rate`}
                          control={control}
                          rules={{ required: "Rate is required", min: { value: 0, message: "Rate must be >= 0" } }}
                          render={({ field }) => (
                            <>
                              <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.rate ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.rate ? true : false} />
                              {errors?.items?.[index]?.rate && (
                                <div className="text-danger small mt-1">{errors.items[index].rate.message}</div>
                              )}
                            </>
                          )}
                        />
                      </td>

                      <td>
                        <Controller
                          name={`items.${index}.discount`}
                          control={control}
                          render={({ field }) => (
                            <div className="input-group">
                              <input {...field} type="number" className="form-control text-end" />
                              <span className="input-group-text">%</span>
                            </div>
                          )}
                        />
                      </td>

                      <td>
                        <Controller
                          name={`items.${index}.tax`}
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select">
                              <option value="">None</option>
                              <option value={1}>1%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                            </select>
                          )}
                        />
                      </td>

                      <td className="text-end">
                        <Controller
                          name={`items.${index}.amount`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              readOnly
                              value={(Number(amount) || 0).toFixed(2)}
                              className="form-control form-control-sm text-end border-0 bg-transparent"
                              style={{ width: "100px" }}
                            />
                          )}
                        />
                      </td>

                      <td className="text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0"
                            onClick={() => remove(index)}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() =>
                append({
                  itemDetails: "",
                  quantity: 1,
                  rate: 0,
                  discount: 0,
                  tax: "",
                })
              }
            >
              + Add New Row
            </button>
          </div>
        </div>

        {/* SUMMARY SECTION (UNCHANGED UI, FIXED LOGIC) */}
        <div className="row mb-4">

          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller
              name="customerNotes"
              control={control}
              render={({ field }) => (
                <textarea {...field} className="form-control" rows="2"></textarea>
              )}
            />
          </div>

          {/* SUMMARY */}
          <div className="col-md-6">
            <div className="border rounded p-3 shadow-sm">

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
                      value={(Number(subTotal) || 0).toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              <div className="d-flex align-items-center gap-3 mb-2">

                <Controller
                  name="taxType"
                  control={control}
                  render={({ field }) => (
                    <>
                      <div className="form-check">
                        <input
                          {...field}
                          type="radio"
                          value="TDS"
                          checked={field.value === "TDS"}
                          className="form-check-input"
                        />
                        <label className="form-check-label">TDS</label>
                      </div>

                      <div className="form-check">
                        <input
                          {...field}
                          type="radio"
                          value="TCS"
                          checked={field.value === "TCS"}
                          className="form-check-input"
                        />
                        <label className="form-check-label">TCS</label>
                      </div>
                    </>
                  )}
                />

                <Controller
                  name="taxSelect"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm w-auto">
                      <option value="">Select a Tax</option>
                      <option value={0.10}>0.10%</option>
                      <option value={0.75}>0.75%</option>
                      <option value={1}>1%</option>
                      <option value={1.5}>1.5%</option>
                      <option value={2}>2%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={3}>3%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  )}
                />
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Tax Amount ({taxRate}%)</span>
                <Controller
                  name="taxAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={Math.abs(taxAmount).toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

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

              <div className="d-flex justify-content-between fw-bold fs-5">
                <span>Total ( ₹ )</span>
                <Controller
                  name="totalAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={(Number(finalTotal) || 0).toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent fw-bold"
                      style={{ width: "120px", fontSize: "1.25rem" }}
                    />
                  )}
                />
              </div>

            </div>
          </div>
        </div>

        {/* TERMS + ATTACHMENTS - UNCHANGED */}
        <div className="row">

          <div className="col-md-8">
            <label className="form-label small fw-semibold">Terms & Conditions</label>
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <textarea {...field} className="form-control" rows="3"></textarea>
              )}
            />
          </div>

          {/* ...existing code... */}

        </div>

        <button type="submit" disabled={isSaving} className="btn btn-primary mt-3">
          {isSaving ? "Saving..." : isEditing ? "Update Sales Order" : "Save Sales Order"}
        </button>

      </form>
    </div>
  );
};

export default NewSalesOrder;
