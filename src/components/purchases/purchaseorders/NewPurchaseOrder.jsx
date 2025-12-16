import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createPurchaseOrder, updatePurchaseOrder, getVendors } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { calculateLineAmount, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, toNumber, parseTaxPercentage } from "../../../utils/calculations";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";

/**
 * NOTE: This file was updated to follow the NewSalesOrder pattern but for Purchase Orders.
 * Uses costPrice for purchase rates and layout B: Item | Account | Qty | Rate | Tax | Amount
 */

// Note: vendor list is fetched dynamically via `getVendors` API; no local stub.

const DEFAULTS = {
  vendorName: "",
  vendorId: null,
  deliveryType: "Organization",
  purchaseOrderNo: "PO-00001",
  reference: "",
  date: new Date().toISOString().split("T")[0],
  deliveryDate: "",
  paymentTerms: "Due on Receipt",
  shipmentPreference: "",
  reverseCharge: false,
  items: [
    {
      itemDetails: "",
      account: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      tax: "",
      amount: 0
    }
  ],
  discountPercent: 0,
  taxType: "TDS",
  taxRate: "",
  adjustment: 0,
  notes: "",
  terms: "",
  attachments: []
};

const NewPurchaseOrder = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const queryClient = useQueryClient();
  const editId = state?.id;
  const isNewFromSource = state?.isNew === true; // when creating PO from another doc
  const isEditing = Boolean(editId) && !isNewFromSource;

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    getValues,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: DEFAULTS,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (state) {
      if (isNewFromSource) {
        console.info("📦 [PO FROM CONVERSION]", {
          sourceId: state?.sourcePurchaseOrderId ?? state?.sourceQuoteId ?? null,
          sourceNumber: state?.sourcePurchaseOrderNumber ?? state?.sourceQuoteNumber ?? null,
          sourceType: state?.sourceType ?? null,
          ts: state?.conversionTimestamp,
        });
      }
      reset({ ...DEFAULTS, ...state });
      if (state.attachments) {
        setUploadedFiles(state.attachments);
        setValue("attachments", state.attachments);
      }
      // vendor will be synced once vendorOptions are loaded (see effect below)
      return;
    }

    reset(DEFAULTS);
    setUploadedFiles([]);
    setValue("attachments", []);
    setSelectedVendor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Fetch items for dropdown (getItems API)
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "purchase-order-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items")
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // Fetch vendors (dynamic vendor list similar to NewSalesOrder)
  const { data: fetchedVendorsRaw } = useQuery({
    queryKey: ["vendors", "purchase-order-form"],
    queryFn: () => getVendors({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (error) => handleProvisionalError(error, "Fetch Vendors"),
  });

  const vendorOptions = extractItems(fetchedVendorsRaw) || [];
  // DEBUG: inspect vendor objects returned by API to verify phone/address fields
  // Remove this log after verification if you prefer no console noise.
  console.log("vendorOptions (NewPurchaseOrder):", vendorOptions);

  // Watch items and totals - debounced to prevent lag
  const rawWatchItems = useWatch({ control, name: "items" }) || [];
  const watchItems = useDebouncedValue(rawWatchItems, 120);
  const discountPercent = useWatch({ control, name: "discountPercent" }) || 0;
  const taxRate = parseFloat(useWatch({ control, name: "taxRate" }) || 0) || 0;
  const adjustment = parseFloat(useWatch({ control, name: "adjustment" }) || 0) || 0;

  // Sync per-item amount using shared calculation utility - guarded to prevent unnecessary setValue
  useEffect(() => {
    watchItems.forEach((item, index) => {
      const calculatedAmount = calculateLineAmount(item);
      const currentAmount = getValues(`items.${index}.amount`);
      const prev = toNumber(currentAmount, 0);
      const nearlyEqual = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.01;
      if (!nearlyEqual(calculatedAmount, prev)) {
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
    });
  }, [watchItems, setValue, getValues]);

  // Memoize items with calculated amounts for display/calculation
  const itemsWithAmount = useMemo(() => {
    return watchItems.map((item) => {
      const calculatedAmount = calculateLineAmount(item);
      return { ...item, amount: calculatedAmount };
    });
  }, [watchItems]);

  // Subtotal based on item amounts using shared utility
  const subTotal = calculateSubtotal(itemsWithAmount);

  // Discount (global) using shared utility
  const discountValue = calculateDiscountAmount(subTotal, discountPercent);
  const taxableAmount = subTotal - discountValue;

  // Global tax (applied on taxableAmount) using shared utility
  const taxType = watch("taxType") || "TDS";
  const taxValue = calculateTaxAmount(taxableAmount, taxRate, taxType);

  // Total using shared utility
  const total = calculateGrandTotal(taxableAmount, taxValue, toNumber(adjustment, 0));

  // File upload handlers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
      url: URL.createObjectURL(file)
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

  // Create / update
  const createMutation = useMutation({
    mutationFn: (payload) => createPurchaseOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchaseOrders"]);
      alert("Purchase order created successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/purchaseorders");
    },
    onError: (error) => handleProvisionalError(error, "Create Purchase Order")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePurchaseOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchaseOrders"]);
      alert("Purchase order updated successfully");
      navigate("/purchaseorders");
    },
    onError: (error) => handleProvisionalError(error, "Update Purchase Order")
  });

  const onSubmit = (data) => {
    try {
      // If this PO is created via conversion (isNew), validate necessary fields
      if (isNewFromSource) {
        if (!data?.vendorName) {
          handleProvisionalError(new Error("Vendor name is required"), "Validation", "❌ Vendor name is required");
          return;
        }
        if (!Array.isArray(data?.items) || data.items.length === 0) {
          handleProvisionalError(new Error("Items are required"), "Validation", "❌ At least one item is required");
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
      const finalSubTotal = calculateSubtotal(itemsWithAmounts);
      const finalDiscountPercent = toNumber(data.discountPercent, 0);
      const finalDiscountValue = calculateDiscountAmount(finalSubTotal, finalDiscountPercent);
      const finalTaxableAmount = finalSubTotal - finalDiscountValue;
      const finalTaxRate = toNumber(data.taxRate, 0);
      const finalTaxType = data.taxType || "TDS";
      const finalTaxValue = calculateTaxAmount(finalTaxableAmount, finalTaxRate, finalTaxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotal = calculateGrandTotal(finalTaxableAmount, finalTaxValue, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        vendorName: data?.vendorName || "",
        vendorId: data.vendorId || selectedVendor?.id || null,
        deliveryType: data?.deliveryType || "Organization",
        purchaseOrderNo: data?.purchaseOrderNo || "PO-00001",
        reference: data?.reference || "",
        date: data?.date ? new Date(data.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        deliveryDate: data?.deliveryDate ? new Date(data.deliveryDate).toISOString().split("T")[0] : "",
        paymentTerms: data?.paymentTerms || "Due on Receipt",
        shipmentPreference: data?.shipmentPreference || "",
        reverseCharge: Boolean(data?.reverseCharge),
        items: itemsWithAmounts,
        discountPercent: finalDiscountPercent,
        taxType: data?.taxType || "TDS",
        taxRate: data?.taxRate || "",
        adjustment: finalAdjustment,
        notes: data?.notes || "",
        terms: data?.terms || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      if (isEditing && !isNewFromSource) {
        console.info("📝 [EDIT (PUT)] PurchaseOrder", { 
          id: editId,
          vendorName: payload.vendorName,
          total: finalTotal,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
        return;
      }

      console.info(isNewFromSource ? "📄 [NEW FROM CONVERSION] PO -> POST" : "📄 [NEW PO] POST", {
        vendorName: payload.vendorName,
        total: finalTotal,
        itemsCount: payload.items.length,
        payload: payload
      });
      createMutation.mutate(payload);
    } catch (err) {
      console.error("[PO SUBMIT ERROR]", err);
      handleProvisionalError(err, "Purchase Order Submit", err?.message || "Failed to submit purchase order");
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // Keep `selectedVendor` and form fields in sync when vendors are loaded or editing
  useEffect(() => {
    if (state?.vendorId && vendorOptions && vendorOptions.length > 0) {
      const found = vendorOptions.find((v) => String(v?.id) === String(state.vendorId));
      if (found) {
        setSelectedVendor(found);
        setValue("vendorName", found.displayName ?? found.companyName ?? "");
        setValue("vendorId", found.id);
        if (found.paymentTerms) setValue("paymentTerms", found.paymentTerms);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorOptions, state?.vendorId]);

  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.10)"
        }}
      >
        <h5 className="fw-semibold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-box-seam"></i> New Purchase Order
        </h5>

        <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate("/purchaseorders")}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* Vendor Name (typeahead) */}
        <div className="mb-3">
          <label className="form-label fw-semibold text-danger">Vendor Name*</label>
          <div className="d-flex align-items-center">
            <Controller
              name="vendorName"
              control={control}
              rules={{ required: "Vendor is required" }}
              render={({ field }) => (
                <div className="input-group">
                  <select
                    {...field}
                    className={`form-select ${errors.vendorName ? "is-invalid" : ""}`}
                    aria-invalid={errors?.vendorName ? true : false}
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
                    <option value="">Select Vendor</option>
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
                  <button type="button" className="btn btn-primary" onClick={() => navigate("/newvendor")} title="Manage Vendors">
                    <i className="bi bi-people"></i>
                  </button>
                </div>
              )}
            />
          </div>

          {errors.vendorName && <span className="text-danger small">{errors.vendorName.message}</span>}
        </div>

        {/* Delivery Address */}
        <div className="mb-3">
          <label className="form-label fw-semibold text-danger">Delivery Address*</label>

          <div className="d-flex gap-3 mb-2">
            <Controller
              name="deliveryType"
              control={control}
              render={({ field }) => (
                <>
                  <div className="form-check">
                    <input {...field} className="form-check-input" type="radio" id="org" value="Organization" checked={field.value === "Organization"} />
                    <label htmlFor="org" className="form-check-label">Organization</label>
                  </div>
                  <div className="form-check">
                    <input {...field} className="form-check-input" type="radio" id="cust" value="Customer" checked={field.value === "Customer"} />
                    <label htmlFor="cust" className="form-check-label">Customer</label>
                  </div>
                </>
              )}
            />
          </div>

          <div className="small">
            {selectedVendor ? (
              <>
                <div className="fw-semibold">{selectedVendor.displayName || `${selectedVendor.firstName} ${selectedVendor.lastName}`}</div>
                <div>{selectedVendor.shippingAddress?.city ?? ""}</div>
                <div>{selectedVendor.shippingAddress?.state ?? ""}, {selectedVendor.shippingAddress?.country ?? ""}</div>
                <div>{selectedVendor.shippingAddress?.phone ?? selectedVendor.phoneWork}</div>
                <button type="button" className="btn btn-link p-0 small" onClick={() => setValue("deliveryType", getValues("deliveryType") === "Organization" ? "Customer" : "Organization")}>
                  Change destination to deliver
                </button>
              </>
            ) : (
              <div className="text-muted">No vendor selected</div>
            )}
          </div>
        </div>

        {/* Order Info (use stable 4-column rows for Zoho layout) */}
        <div className="border-0 mb-3 pb-2 pt-1">
          <div className="row align-items-center mb-3">
            <div className="col-md-3"><label className="fw-semibold">Purchase Order# <span className="text-danger">*</span></label></div>
            <div className="col-md-3">
              <Controller name="purchaseOrderNo" control={control} render={({ field }) => (
                <div className="input-group input-group-sm">
                  <input {...field} className="form-control"  />
                  <span className="input-group-text bg-white"><i className="bi bi-gear"></i></span>
                </div>
              )} />
            </div>

            <div className="col-md-3"><label className="fw-semibold">Reference#</label></div>
            <div className="col-md-3">
              <Controller name="reference" control={control} render={({ field }) => <input {...field} className="form-control form-control-sm" />} />
            </div>
          </div>

          <div className="row align-items-center mb-3">
            <div className="col-md-3"><label className="fw-semibold">Date</label></div>
            <div className="col-md-3">
              <Controller name="date" control={control} render={({ field }) => <input {...field} type="date" className="form-control form-control-sm" />} />
            </div>

            <div className="col-md-3"><label className="fw-semibold">Delivery Date</label></div>
            <div className="col-md-3">
              <Controller name="deliveryDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control form-control-sm" placeholder="dd/MM/yyyy" />} />
            </div>
          </div>

          <div className="row align-items-center mb-3">
            <div className="col-md-3"><label className="fw-semibold">Shipment Preference</label></div>
            <div className="col-md-3">
              <Controller name="shipmentPreference" control={control} render={({ field }) => (
                <select {...field} className="form-select form-select-sm">
                  <option value="">Choose the shipment preference or type to add</option>
                  <option value="Air">Air</option>
                  <option value="Road">Road</option>
                  <option value="Sea">Sea</option>
                </select>
              )} />
            </div>

            <div className="col-md-3"><label className="fw-semibold">Payment Terms</label></div>
            <div className="col-md-3">
              <Controller name="paymentTerms" control={control} render={({ field }) => (
                <select {...field} className="form-select form-select-sm">
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                </select>
              )} />
            </div>
          </div>

          <div className="row align-items-center mb-3">
            <div className="col-md-3" />
            <div className="col-md-9">
              <Controller name="reverseCharge" control={control} render={({ field }) => (
                <div className="form-check">
                  <input {...field} type="checkbox" className="form-check-input" id="reverseCharge" checked={field.value} />
                  <label htmlFor="reverseCharge" className="form-check-label">This transaction is applicable for reverse charge</label>
                </div>
              )} />
            </div>
          </div>
        </div>

        <hr />

        {/* Item Table - Layout B (Item | Account | Qty | Rate | Tax | Amount | Remove) */}
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-semibold mb-0">Item Table</h6>
            <button type="button" className="btn btn-link btn-sm">Bulk Actions</button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle small mb-0">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ minWidth: 220, textAlign: "left" }}>ITEM DETAILS</th>
                  <th>ACCOUNT</th>
                  <th style={{ width: 120 }}>QUANTITY</th>
                  <th style={{ width: 140 }}>RATE</th>
                  <th style={{ width: 140 }}>TAX</th>
                  <th style={{ width: 140 }}>AMOUNT</th>
                  <th style={{ width: 40 }}></th>
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
                            <input {...field} className="form-control form-control-sm" placeholder="Type or click to select an item." />
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

                                // find selected item and autofill rate from costPrice
                                const selected = itemOptions.find((it) => {
                                  const label = it?.name ?? it?.itemName ?? it?.title ?? "";
                                  return String(it?.id) === String(value) || String(label) === String(value);
                                });

                                if (selected) {
                                  // use costPrice for purchase orders
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
                          <select {...field} className="form-select form-select-sm">
                            <option value="">Select an account</option>
                            <option value="Purchase">Purchase</option>
                            <option value="Expense">Expense</option>
                            <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                          </select>
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
                            <input {...field} type="number" min="0" className={`form-control form-control-sm text-end ${errors?.items?.[index]?.quantity ? "is-invalid" : ""}`} />
                            {errors?.items?.[index]?.quantity && <div className="text-danger small mt-1">{errors.items[index].quantity.message}</div>}
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
                            <input {...field} type="number" min="0" className={`form-control form-control-sm text-end ${errors?.items?.[index]?.rate ? "is-invalid" : ""}`} />
                            {errors?.items?.[index]?.rate && <div className="text-danger small mt-1">{errors.items[index].rate.message}</div>}
                          </>
                        )}
                      />
                    </td>

                    <td>
                      <Controller
                        name={`items.${index}.tax`}
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="form-select form-select-sm">
                            <option value="">Select a Tax</option>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        )}
                      />
                    </td>

                    <td>
                      <Controller
                        name={`items.${index}.amount`}
                        control={control}
                        render={({ field }) => (
                          <input {...field} readOnly className="form-control form-control-sm text-end bg-light" />
                        )}
                      />
                    </td>

                    <td className="text-center">
                      {fields.length > 1 && (
                        <button type="button" className="btn btn-link text-danger p-0" onClick={() => remove(index)}>
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex gap-2 mt-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => append({ itemDetails: "", account: "", quantity: 1, rate: 0, amount: 0, tax: "" })}
            >
              + Add New Row
            </button>

            {/* Bulk add removed as requested */}
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="row small">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Customer Notes</label>
            <Controller name="notes" control={control} render={({ field }) => (
              <textarea {...field} className="form-control form-control-sm" rows="3" placeholder="Will be displayed on purchase order"></textarea>
            )} />

            <label className="form-label fw-semibold mt-3">Terms & Conditions</label>
            <Controller name="terms" control={control} render={({ field }) => (
              <textarea {...field} className="form-control form-control-sm" rows="3" placeholder="Enter the terms and conditions"></textarea>
            )} />
          </div>

          <div className="col-md-6">
            <div className="border rounded p-3">
              <div className="d-flex justify-content-between">
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
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              <div className="d-flex align-items-center mt-2">
                <span className="me-auto">Discount</span>
                <div className="input-group input-group-sm" style={{ width: "120px" }}>
                  <Controller name="discountPercent" control={control} render={({ field }) => <input {...field} type="number" className="form-control text-end" />} />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="text-end small">{discountValue.toFixed(2)}</div>

              <div className="d-flex align-items-center mt-2 gap-2">
                <Controller name="taxType" control={control} render={({ field }) => (
                  <>
                    <div className="form-check">
                      <input {...field} type="radio" value="TDS" className="form-check-input" checked={field.value === "TDS"} />
                      <label className="form-check-label">TDS</label>
                    </div>
                    <div className="form-check">
                      <input {...field} type="radio" value="TCS" className="form-check-input" checked={field.value === "TCS"} />
                      <label className="form-check-label">TCS</label>
                    </div>
                  </>
                )} />

                <Controller name="taxRate" control={control} render={({ field }) => (
                  <select {...field} className="form-select form-select-sm" style={{ width: "120px" }}>
                    <option value="">Select a Tax</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                )} />
              </div>
              <div className="text-end small">+ {taxValue.toFixed(2)}</div>

              <div className="d-flex align-items-center mt-2">
                <span className="me-auto">Adjustment</span>
                <Controller name="adjustment" control={control} render={({ field }) => <input {...field} type="number" className="form-control form-control-sm text-end" style={{ width: "120px" }} />} />
              </div>
              <div className="text-end">{Number(adjustment).toFixed(2)}</div>

              <hr className="my-2" />
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
        </div>

        {/* Attachments Section */}
        <div className="row mt-3">
          <div className="col-md-8" />
          {/* <div className="col-md-4">
            <label className="form-label fw-semibold">Attach File(s) to Purchase Order</label>
            <div className="d-flex gap-2 align-items-center">
              <label className="btn btn-outline-secondary btn-sm mb-0">
             
                <i className="bi bi-upload me-1"></i> Upload File
              </label>
              <small className="text-muted">You can upload a maximum of 10 files, 10MB each</small>
            </div>

            <div className="mt-2">
              {uploadedFiles.length === 0 ? (
                <div className="small text-muted">No attachments</div>
              ) : (
                <ul className="list-group list-group-flush small">
                  {uploadedFiles.map((f, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <div>{f.name}</div>
                        <div className="text-muted small">{f.size}</div>
                      </div>
                      <div>
                        <a href={f.url} target="_blank" rel="noreferrer" className="btn btn-link btn-sm p-0 me-2">View</a>
                        <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => removeFile(i)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div> */}
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 mt-4">
    
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
            {isSaving ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update and Send" : "Save and Send"}
          </button>

          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={isSaving} onClick={() => navigate("/purchaseorders")}>
            Cancel
          </button>
        </div>

        <div className="mt-3 small text-muted">
          Additional Fields: Start adding custom fields for your purchase orders by going to <strong>Settings ➜ Purchases ➜ Purchase Orders.</strong>
        </div>
      </form>
    </div>
  );
};

export default NewPurchaseOrder;
