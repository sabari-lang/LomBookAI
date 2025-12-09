import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDeliveryChallan, updateDeliveryChallan, getCustomers } from "../api";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, toNumber } from "../../../utils/calculations";

const NewDeliveryChallan = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const DEFAULTS = {
    customerName: "",
    deliveryChallanNo: "DC-00001",
    reference: "",
    deliveryDate: moment().format("YYYY-MM-DD"),
    challanType: "",
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
    adjustment: 0,
    totalAmount: 0,
    customerNotes: "",
    terms: "",
    files: [],
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
  const isEditing = Boolean(editId);

  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Format dates for edit mode and initialize form
  useEffect(() => {
    if (state) {
      const formattedState = {
        ...state,
        deliveryChallanDate: state?.deliveryChallanDate
          ? moment(state.deliveryChallanDate).format("YYYY-MM-DD")
          : "",
      };

      // Ensure items present
      if (!Array.isArray(formattedState.items) || formattedState.items.length === 0) {
        formattedState.items = DEFAULTS.items;
      }

      // Map old field names for backward compatibility
      const mappedState = {
        ...formattedState,
        deliveryChallanNo: formattedState.deliveryChallanNo || formattedState.deliveryChallanNumber || "",
        reference: formattedState.reference || formattedState.referenceNumber || "",
        deliveryDate: formattedState.deliveryDate || (formattedState.deliveryChallanDate
          ? moment(formattedState.deliveryChallanDate).format("YYYY-MM-DD")
          : ""),
        terms: formattedState.terms || formattedState.termsAndConditions || "",
        files: formattedState.files || formattedState.attachments || [],
      };
      reset({ ...DEFAULTS, ...mappedState });
      setUploadedFiles(mappedState.files);
      setValue("files", mappedState.files);
      return;
    }

    // New mode defaults
    reset({
      ...DEFAULTS,
      deliveryDate: moment().format("YYYY-MM-DD"),
    });
    setUploadedFiles([]);
    setValue("files", []);
  }, [state, reset, setValue]);

  // Fetch customers for select
  const { data: fetchedCustomers } = useQuery({
    queryKey: ["customers", "delivery-challan-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Customers"),
  });

  const customerOptions = extractItems(fetchedCustomers) || [];

  // Fetch items for item dropdown
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "delivery-challan-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (err) => handleProvisionalError(err, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // Live watch for nested items (useWatch for stable array subscription)
  const watchedItems = useWatch({ control, name: "items" }) || [];

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

  // Subtotal = sum of line amounts using shared utility
  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems);
  }, [watchedItems]);

  // TDS/TCS calculation using shared utility
  const taxRate = toNumber(watch("taxSelect"), 0);
  const taxType = watch("taxType") || "TDS";
  const taxAmount = useMemo(() => {
    return calculateTaxAmount(subTotal, taxRate, taxType);
  }, [subTotal, taxRate, taxType]);

  // Adjustment and Total using shared utility
  const adjustment = toNumber(watch("adjustment"), 0);
  const finalTotal = useMemo(() => {
    return calculateGrandTotal(subTotal, taxAmount, adjustment);
  }, [subTotal, taxAmount, adjustment]);

  // Sync calculated values to form state
  useEffect(() => {
    setValue("subTotal", subTotal, { shouldDirty: false });
    setValue("taxAmount", Math.abs(taxAmount), { shouldDirty: false });
    setValue("totalAmount", finalTotal, { shouldDirty: false });
  }, [subTotal, taxAmount, finalTotal, setValue]);

  // File upload
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
    setValue("files", updated);
  };

  const removeFile = (i) => {
    const updated = uploadedFiles.filter((_, idx) => idx !== i);
    setUploadedFiles(updated);
    setValue("files", updated);
  };

  // API Mutations
  const createMutation = useMutation({
    mutationFn: createDeliveryChallan,
    onSuccess: () => {
      queryClient.invalidateQueries(["deliveryChallans"]);
      alert("Delivery Challan Created!");
      reset(DEFAULTS);
      navigate("/deliverychallans");
    },
    onError: (err) => handleProvisionalError(err, "Create Delivery Challan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDeliveryChallan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["deliveryChallans"]);
      alert("Delivery Challan Updated!");
      navigate("/deliverychallans");
    },
    onError: (err) => handleProvisionalError(err, "Update Delivery Challan"),
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data) => {
      // Calculate and sync all amounts before submission using shared utilities
      const itemsWithAmounts = (data.items || []).map((item) => ({
        itemDetails: item?.itemDetails || "",
        quantity: toNumber(item?.quantity, 1),
        rate: toNumber(item?.rate, 0),
        discount: toNumber(item?.discount, 0),
        tax: item?.tax || "",
        amount: calculateLineAmount(item),
      }));

      // Recalculate totals using shared utilities
      const finalSubTotal = calculateSubtotal(itemsWithAmounts);
      const finalTaxRate = toNumber(data.taxSelect, 0);
      const finalTaxType = data.taxType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalSubTotal, finalTaxRate, finalTaxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotalAmount = calculateGrandTotal(finalSubTotal, finalTaxAmount, finalAdjustment);

    // Build payload matching DEFAULTS structure exactly
    const payload = {
      customerName: data?.customerName || "",
      deliveryChallanNo: data?.deliveryChallanNo || "DC-00001",
      reference: data?.reference || "",
      deliveryDate: data.deliveryDate ? moment(data.deliveryDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
      challanType: data?.challanType || "",
      items: itemsWithAmounts,
      taxType: data?.taxType || "TDS",
      taxSelect: data?.taxSelect || "",
      adjustment: finalAdjustment,
      totalAmount: finalTotalAmount,
      customerNotes: data?.customerNotes || "",
      terms: data?.terms || "",
      files: uploadedFiles.length > 0 ? uploadedFiles : (data?.files || []),
      // Keep backward compatibility - also send old field names if needed
      attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.files || []),
      deliveryChallanNumber: data?.deliveryChallanNo || "DC-00001",
      referenceNumber: data?.reference || "",
      deliveryChallanDate: data.deliveryDate ? moment(data.deliveryDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
      termsAndConditions: data?.terms || "",
    };

    if (isEditing) {
      console.info('[DELIVERY CHALLAN UPDATE]', {
        id: editId,
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      updateMutation.mutate({ id: editId, payload });
    } else {
      console.info('[DELIVERY CHALLAN CREATE]', {
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      createMutation.mutate(payload);
    }
  };

  // Render UI (layout and classes preserved exactly)
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
        <h5 className="fw-semibold d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-truck"></i> {isEditing ? "Edit Delivery Challan" : "New Delivery Challan"}
        </h5>
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent"
          style={{ fontSize: "22px", lineHeight: 1, color: "red" }}
          onClick={() => navigate("/deliverychallans")}
        >
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="py-2">

        {/* Customer Name */}
        <div className="rounded shadow-sm mb-3">
          <label className="form-label text-danger small fw-semibold">Customer Name*</label>
          <div className="input-group">
            <Controller
              name="customerName"
              control={control}
              rules={{ required: "Customer Name is required" }}
              render={({ field }) => (
                <select {...field} className={`form-select ${errors.customerName ? "is-invalid" : ""}`} aria-invalid={errors.customerName ? true : false}>
                  <option value="">Select or add a customer</option>
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
          {errors?.customerName && <div className="text-danger small mt-1">{errors.customerName.message}</div>}
        </div>

        {/* Header fields */}
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Delivery Challan#*</label>
            <Controller
              name="deliveryChallanNo"
              control={control}
              render={({ field }) => <input {...field} className="form-control" readOnly />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Reference#</label>
            <Controller
              name="reference"
              control={control}
              render={({ field }) => <input {...field} className="form-control" />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Delivery Challan Date*</label>
            <Controller
              name="deliveryDate"
              control={control}
              rules={{ required: "Delivery Challan Date is required" }}
              render={({ field }) => <input {...field} type="date" className={`form-control ${errors.deliveryDate ? "is-invalid" : ""}`} aria-invalid={errors.deliveryDate ? true : false} />}
            />
            {errors?.deliveryDate && (
              <div className="text-danger small mt-1">{errors.deliveryDate.message}</div>
            )}
          </div>
        </div>

        <hr />

        {/* Challan Type (mandatory) */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label className="form-label small text-danger fw-semibold">Challan Type*</label>
            <Controller
              name="challanType"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option value="">Choose a proper challan type.</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Return">Return</option>
                  <option value="Transfer">Transfer</option>
                </select>
              )}
            />
          </div>
        </div>

        {/* Item Table */}
        <div className="border rounded shadow-sm mb-3">
          <div className="p-2 bg-light border-bottom">
            <strong>Item Table</strong>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ITEM DETAILS</th>
                  <th>QUANTITY</th>
                  <th>RATE</th>
                  <th>DISCOUNT</th>
                  <th>TAX</th>
                  <th>AMOUNT</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {fields.map((row, index) => {
                  const item = watchedItems[index] || {};
                  const amount = calculateLineAmount(item);

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
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate("/newitem")}>
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
                              <option value="">Select a Tax</option>
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
                              value={amount.toFixed(2)}
                              className="form-control form-control-sm text-end border-0 bg-transparent"
                              style={{ width: "100px" }}
                            />
                          )}
                        />
                      </td>

                      <td className="text-center">
                        {fields.length > 1 && (
                          <button type="button" className="btn btn-link text-danger p-0" onClick={() => remove(index)}>
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

          <div className="p-2 d-flex gap-2">
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
                  amount: 0,
                })
              }
            >
              + Add New Row
            </button>

            <button type="button" className="btn btn-outline-primary btn-sm">+ Add Items in Bulk</button>
          </div>
        </div>

        {/* Customer Notes & Summary (Zoho-style: only adjustment + total) */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller
              name="customerNotes"
              control={control}
              render={({ field }) => <textarea {...field} className="form-control" rows="2" placeholder="Enter any notes to be displayed in your transaction" />}
            />
          </div>

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
                      value={subTotal.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              {/* Tax Type and Tax Select */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
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
                          <label className="form-check-label small">TDS</label>
                        </div>
                        <div className="form-check">
                          <input
                            {...field}
                            type="radio"
                            value="TCS"
                            checked={field.value === "TCS"}
                            className="form-check-input"
                          />
                          <label className="form-check-label small">TCS</label>
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
                        <option value="1">1%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                    )}
                  />
                </div>
                <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                  {taxAmount.toFixed(2)}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Adjustment</span>
                <div className="d-flex align-items-center gap-2">
                  <Controller
                    name="adjustment"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="number" className="form-control form-control-sm text-end" style={{ width: "80px" }} placeholder="0.00" />
                    )}
                  />
                  <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                    {adjustment.toFixed(2)}
                  </span>
                </div>
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
                      value={finalTotal.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent fw-bold"
                      style={{ width: "120px", fontSize: "1.25rem" }}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Attachments */}
        <div className="row">
          <div className="col-md-8">
            <label className="form-label small fw-semibold">Terms & Conditions</label>
            <Controller
              name="terms"
              control={control}
              render={({ field }) => <textarea {...field} className="form-control" rows="3" />}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small fw-semibold">Attach File(s) to Delivery Challan</label>
            {/* ...existing code... */}

            {uploadedFiles.length > 0 && (
              <ul className="list-group mt-2">
                {uploadedFiles.map((file, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                    {file.name} ({file.size})
                    <button type="button" className="btn btn-link text-danger btn-sm" onClick={() => removeFile(i)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="btn btn-primary mt-3">
          {isSaving ? "Saving..." : isEditing ? "Update Delivery Challan" : "Save Delivery Challan"}
        </button>
      </form>
    </div>
  );
};

export default NewDeliveryChallan;
