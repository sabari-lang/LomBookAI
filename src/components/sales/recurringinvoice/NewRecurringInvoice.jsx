import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecurringInvoice, updateRecurringInvoice, getCustomers } from "../api";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, calculateRoundOff, toNumber } from "../../../utils/calculations";
import { refreshKeyboard } from "../../../utils/refreshKeyboard";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const NewRecurringInvoice = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const DEFAULTS = {
    customerName: "",
    profileName: "",
    orderNumber: "",
    repeatEvery: "Week",
    startOn: moment().format("YYYY-MM-DD"),
    endsOn: "",
    neverExpires: true,
    paymentTerms: "Due on Receipt",
    receivableAccount: "Accounts Receivable",
    salesperson: "",
    associateProjects: "",
    subject: "",
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
    roundOff: "No Rounding",
    notes: "Thanks for your business.",
    terms: "",
    totalAmount: 0,
    taxAmount: 0,
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
  const isEditing = Boolean(editId);

  const [uploadedFiles, setUploadedFiles] = useState([]);

  // format dates in edit mode and initialize
  useEffect(() => {
    if (state) {
      const formattedState = {
        ...state,
        startOn: state?.startOn ? moment(state.startOn).format("YYYY-MM-DD") : "",
        endsOn: state?.endsOn ? moment(state.endsOn).format("YYYY-MM-DD") : "",
      };

      // ensure items exist as array
      if (!Array.isArray(formattedState.items) || formattedState.items.length === 0) {
        formattedState.items = DEFAULTS.items;
      }

      reset({ ...DEFAULTS, ...formattedState });
      setUploadedFiles(state?.attachments || []);
      setValue("attachments", state?.attachments || []);
      // Call refreshKeyboard after form values are populated
      refreshKeyboard();
      return;
    }

    // NEW mode
    reset({
      ...DEFAULTS,
      startOn: moment().format("YYYY-MM-DD"),
      neverExpires: true,
    });
    setUploadedFiles([]);
    setValue("attachments", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Fetch customers/items for selects
  const { data: fetchedCustomers } = useQuery({
    queryKey: ["customers", "recurring-invoice-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Customers"),
  });
  const customerOptions = extractItems(fetchedCustomers) || [];

  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "recurring-invoice-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (err) => handleProvisionalError(err, "Fetch Items"),
  });
  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // watch items live so every change triggers recalculation (useWatch for stability)
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

  // subtotal is sum of line amounts using shared utility
  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems);
  }, [watchedItems]);

  // summary tax (TDS/TCS) using shared utility
  const taxRate = toNumber(watch("taxSelect"), 0);
  const taxType = watch("taxType") || "TDS";

  const summaryTaxAmount = useMemo(() => {
    return calculateTaxAmount(subTotal, taxRate, taxType);
  }, [subTotal, taxRate, taxType]);

  // adjustment
  const adjustment = toNumber(watch("adjustment"), 0);

  // round off mode
  const roundOffMode = watch("roundOff") || "No Rounding";

  // compute round off amount using shared utility
  const roundOffAmount = useMemo(() => {
    const preRoundTotal = subTotal + summaryTaxAmount + adjustment;
    return calculateRoundOff(preRoundTotal, roundOffMode);
  }, [subTotal, summaryTaxAmount, adjustment, roundOffMode]);

  // final total includes roundOffAmount using shared utility
  const finalTotal = useMemo(() => {
    return calculateGrandTotal(subTotal, summaryTaxAmount, adjustment, roundOffAmount);
  }, [subTotal, summaryTaxAmount, adjustment, roundOffAmount]);

  // Sync calculated values to form state
  useEffect(() => {
    setValue("totalAmount", finalTotal, { shouldDirty: false });
    setValue("taxAmount", Math.abs(summaryTaxAmount), { shouldDirty: false });
  }, [finalTotal, summaryTaxAmount, setValue]);

  // file upload handlers
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
    const updated = uploadedFiles.filter((_, idx) => idx !== i);
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  // API submit handlers
  const createMutation = useMutation({
    mutationFn: createRecurringInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringInvoices"]);
      notifySuccess("Recurring Invoice Created!");
      reset(DEFAULTS);
      navigate("/recurring");
    },
    onError: (err) => handleProvisionalError(err, "Create Recurring Invoice"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRecurringInvoice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["recurringInvoices"]);
      notifySuccess("Recurring Invoice Updated!");
      navigate("/recurring");
    },
    onError: (err) => handleProvisionalError(err, "Update Recurring Invoice"),
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
    const finalRoundOff = data.roundOff || "No Rounding";
    
    // Calculate round off using shared utility
    const beforeRoundOff = finalSubTotal + finalTaxAmount + finalAdjustment;
    const roundOffAmount = calculateRoundOff(beforeRoundOff, finalRoundOff);
    const finalTotalAmount = calculateGrandTotal(finalSubTotal, finalTaxAmount, finalAdjustment, roundOffAmount);

    // Build payload matching DEFAULTS structure exactly
    const payload = {
      customerName: data?.customerName || "",
      profileName: data?.profileName || "",
      orderNumber: data?.orderNumber || "",
      repeatEvery: data?.repeatEvery || "Week",
      startOn: data.startOn ? moment(data.startOn).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
      endsOn: data.endsOn ? moment(data.endsOn).toISOString().split("T")[0] : "",
      neverExpires: Boolean(data?.neverExpires),
      paymentTerms: data?.paymentTerms || "Due on Receipt",
      receivableAccount: data?.receivableAccount || "Accounts Receivable",
      salesperson: data?.salesperson || "",
      associateProjects: data?.associateProjects || "",
      subject: data?.subject || "",
      items: itemsWithAmounts,
      taxType: finalTaxType,
      taxSelect: data?.taxSelect || "",
      adjustment: finalAdjustment,
      roundOff: finalRoundOff,
      notes: data?.notes || "Thanks for your business.",
      terms: data?.terms || "",
      taxAmount: finalTaxAmount,
      totalAmount: finalTotalAmount,
      attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
    };

    if (isEditing) {
      console.info('[RECURRING INVOICE UPDATE]', {
        id: editId,
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        taxAmount: finalTaxAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      updateMutation.mutate({ id: editId, payload });
    } else {
      console.info('[RECURRING INVOICE CREATE]', {
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        taxAmount: finalTaxAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      createMutation.mutate(payload);
    }
  };

  // UI (keeps your layout/classes intact — only logic added)
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
        <h5 className="fw-semibold">
          <i className="bi bi-repeat"></i> {isEditing ? "Edit Recurring Invoice" : "New Recurring Invoice"}
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

        {/* Customer Name */}
        <div className="p-0 rounded shadow-sm mb-3">
          <label className="form-label text-danger small fw-semibold">Customer Name*</label>
          <div className="input-group">
            <Controller
              name="customerName"
              control={control}
              rules={{ required: "Customer Name is required" }}
              render={({ field }) => (
                <select {...field} className={`form-select ${errors.customerName ? "is-invalid" : ""}`} aria-invalid={errors.customerName ? true : false}>
                  <option value="">Select Customer</option>
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
                      <option key={c?.id ?? idx} value={label ?? ""} title={optionText}>{optionText}</option>
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

        {/* Profile Name / Order Number / Repeat / Dates / Payment Terms */}
        <div className="row g-3 mb-3">

          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">Profile Name*</label>
            <Controller name="profileName" control={control}
              render={({ field }) => <input {...field} className="form-control" />} />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Order Number</label>
            <Controller name="orderNumber" control={control}
              render={({ field }) => <input {...field} className="form-control" />} />
          </div>

          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">Repeat Every*</label>
            <Controller name="repeatEvery" control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option>Day</option>
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              )} />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Start On</label>
            <Controller name="startOn" control={control}
              render={({ field }) => <input {...field} type="date" className="form-control" />} />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Ends On</label>
            <div className="d-flex gap-2 align-items-center">
              <Controller name="endsOn" control={control}
                render={({ field }) => <input {...field} type="date" className="form-control" />} />
              <Controller name="neverExpires" control={control}
                render={({ field }) => (
                  <div className="form-check ms-2">
                    <input {...field} type="checkbox" checked={!!field.value} className="form-check-input" />
                    <label className="form-check-label small">Never Expires</label>
                  </div>
                )} />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label small text-danger fw-semibold">Payment Terms*</label>
            <Controller name="paymentTerms" control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option>Due on Receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                  <option>Net 60</option>
                </select>
              )} />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Accounts Receivable</label>
            <Controller name="receivableAccount" control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option>Accounts Receivable</option>
                </select>
              )} />
          </div>

        </div>

        <hr />

        {/* Salesperson / Project / Subject */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Salesperson</label>
            <Controller name="salesperson" control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option value="">Select or Add Salesperson</option>
                </select>
              )} />
          </div>

          <div className="col-md-8">
            <label className="form-label small fw-semibold">Associate Project(s) / Hours</label>
            <div className="text-muted small">There are no active projects for this customer.</div>
          </div>

          <div className="col-12">
            <label className="form-label small fw-semibold">Subject</label>
            <Controller name="subject" control={control}
              render={({ field }) => <textarea {...field} className="form-control" rows="2" placeholder="Let your customer know what this Recurring Invoice is for" />} />
          </div>
        </div>

        {/* ITEM TABLE */}
        <div className="border rounded shadow-sm mb-3">
          <div className="p-2 bg-light border-bottom d-flex justify-content-between">
            <strong>Item Table</strong>
            <a href="#" className="text-primary small text-decoration-none">Bulk Actions</a>
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
                        <Controller name={`items.${index}.itemDetails`} control={control} rules={{ required: "Item is required" }}
                          render={({ field }) => (
                            itemOptions.length === 0 ? (
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-muted">No items available</span>
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/newitem')}>+ Add Item</button>
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
                                      navigate('/newitem');
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
                                      <option key={it?.id ?? idx} value={it?.id ?? label} title={optionText}>{optionText}</option>
                                    );
                                  })}
                                  <option value="__add__">+ Add new item...</option>
                                </select>
                                {errors?.items?.[index]?.itemDetails && (
                                  <div className="text-danger small mt-1">{errors.items[index].itemDetails.message}</div>
                                )}
                              </>
                            )
                          )} />
                      </td>

                      <td>
                        <Controller name={`items.${index}.quantity`} control={control} rules={{ required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } }}
                          render={({ field }) => (
                            <>
                              <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.quantity ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.quantity ? true : false} />
                              {errors?.items?.[index]?.quantity && (
                                <div className="text-danger small mt-1">{errors.items[index].quantity.message}</div>
                              )}
                            </>
                          )} />
                      </td>

                      <td>
                        <Controller name={`items.${index}.rate`} control={control} rules={{ required: "Rate is required", min: { value: 0, message: "Rate must be >= 0" } }}
                          render={({ field }) => (
                            <>
                              <input {...field} type="number" className={`form-control text-end ${errors?.items?.[index]?.rate ? "is-invalid" : ""}`} aria-invalid={errors?.items?.[index]?.rate ? true : false} />
                              {errors?.items?.[index]?.rate && (
                                <div className="text-danger small mt-1">{errors.items[index].rate.message}</div>
                              )}
                            </>
                          )} />
                      </td>

                      <td>
                        <Controller name={`items.${index}.discount`} control={control}
                          render={({ field }) => (
                            <div className="input-group">
                              <input {...field} type="number" className="form-control text-end" />
                              <span className="input-group-text">%</span>
                            </div>
                          )} />
                      </td>

                      <td>
                        <Controller name={`items.${index}.tax`} control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select">
                              <option value="">Select a Tax</option>
                              <option value={1}>1%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                            </select>
                          )} />
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
                        <button type="button" className="btn btn-link text-danger p-0" onClick={() => remove(index)}>
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-2 d-flex gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm"
              onClick={() => append({ itemDetails: "", quantity: 1, rate: 0, discount: 0, tax: "" })}>
              + Add New Row
            </button>

            <button type="button" className="btn btn-outline-primary btn-sm">+ Add Items in Bulk</button>
          </div>
        </div>

        {/* NOTES + SUMMARY */}
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller name="notes" control={control}
              render={({ field }) => <textarea {...field} className="form-control" rows="2" />} />
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

              <div className="d-flex align-items-center gap-3 mb-2">
                <Controller name="taxType" control={control}
                  render={({ field }) => (
                    <>
                      <div className="form-check">
                        <input {...field} type="radio" value="TDS" checked={field.value === "TDS"} className="form-check-input" />
                        <label className="form-check-label">TDS</label>
                      </div>
                      <div className="form-check">
                        <input {...field} type="radio" value="TCS" checked={field.value === "TCS"} className="form-check-input" />
                        <label className="form-check-label">TCS</label>
                      </div>
                    </>
                  )} />

                <Controller name="taxSelect" control={control}
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
                    </select>
                  )} />
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
                      value={summaryTaxAmount.toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Adjustment</span>
                <Controller name="adjustment" control={control}
                  render={({ field }) => <input {...field} type="number" className="form-control form-control-sm text-end w-25" />} />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Round Off</span>
                <div className="d-flex align-items-center gap-2">
                  <Controller
                    name="roundOff"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select form-select-sm w-auto">
                        <option value="No Rounding">No Rounding</option>
                        <option value="nearest">Nearest</option>
                        <option value="floor">Floor</option>
                        <option value="ceil">Ceil</option>
                      </select>
                    )}
                  />
                  <Controller
                    name="roundOffAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        readOnly
                        value={roundOffAmount.toFixed(2)}
                        className="form-control form-control-sm text-end border-0 bg-transparent fw-semibold"
                        style={{ width: "80px" }}
                      />
                    )}
                  />
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

        {/* TERMS & ATTACHMENTS */}
        <div className="row mb-3">
          <div className="col-md-8">
            <label className="form-label small fw-semibold">Terms & Conditions</label>
            <Controller name="terms" control={control}
              render={({ field }) => <textarea {...field} className="form-control" rows="3" />} />
          </div>

          <div className="col-md-4">
            <label className="form-label small fw-semibold">Attach File(s)</label>
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

        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Update Recurring Invoice" : "Save Recurring Invoice"}
        </button>
      </form>
    </div>
  );
};

export default NewRecurringInvoice;
