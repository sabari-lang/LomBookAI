import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";

import { createCreditNote, updateCreditNote, getCustomers } from "../api";
import { getItems } from "../../items/api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { extractItems } from "../../../utils/extractItems";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, toNumber } from "../../../utils/calculations";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";

// --------------------------------------------------
// NEW CREDIT NOTES (FULL PRODUCTION VERSION)
// --------------------------------------------------
const NewCreditNotes = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const editId = state?.id || null;
  const isNewFromInvoice = state?.isNew === true;
  const isEditing = Boolean(editId) && !isNewFromInvoice;

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  // DEFAULT VALUES
  const DEFAULTS = {
    customerName: "",
    reason: "",
    creditNoteNumber: "CN-00001",
    referenceNumber: "",
    creditNoteDate: moment().format("YYYY-MM-DD"),
    accountReceivable: "Accounts Receivable",
    salesperson: "",
    subject: "",
    customerNotes: "Will be displayed on the credit note",
    termsConditions: "",
    taxType: "TDS",
    taxSelect: "",
    adjustment: 0,
    totalAmount: 0,
    taxAmount: 0,
    items: [
      {
        itemDetails: "",
        account: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        taxSelect: "",
        amount: 0,
      },
    ],
    attachments: [],
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULTS,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // fetch customers and items
  const { data: fetchedCustomers } = useQuery({
    queryKey: ["customers", "creditnote-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Customers"),
  });
  const customerOptions = extractItems(fetchedCustomers) || [];

  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "creditnote-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (err) => handleProvisionalError(err, "Fetch Items"),
  });
  const itemOptions = extractItems(fetchedItemsRaw) || [];

  const watchedItems = useWatch({ control, name: "items" }) || [];
  const adjustment = Number(watch("adjustment") || 0);
  const selectedTaxPercent = Number(watch("taxSelect") || 0);

  const [uploadedFiles, setUploadedFiles] = useState([]);

  // --------------------------------------------------
  // FORMAT & PREFILL EDIT MODE
  // --------------------------------------------------
  useEffect(() => {
    if (state) {
      if (isNewFromInvoice) {
        console.info('📌 [CREDIT NOTE FROM INVOICE]', {
          sourceInvoiceId: state?.sourceInvoiceId,
          sourceInvoiceNumber: state?.sourceInvoiceNumber,
          conversionTimestamp: state?.conversionTimestamp,
        });
      }
      reset({
        ...DEFAULTS,
        ...state,
        creditNoteDate: state.creditNoteDate
          ? moment(state.creditNoteDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        items: state.items?.length ? state.items : DEFAULTS.items,
      });

      setUploadedFiles(state.attachments || []);
      setValue("attachments", state.attachments || []);
      return;
    }

    reset({
      ...DEFAULTS,
      creditNoteDate: moment().format("YYYY-MM-DD"),
    });

    setUploadedFiles([]);
    setValue("attachments", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // --------------------------------------------------
  // ITEM LINE CALCULATION - Using shared utility
  // --------------------------------------------------
  // calculateLineAmount is imported from utils/calculations

  // Sync item amounts when items change
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      // Map taxSelect to tax for calculation
      const itemForCalc = { ...item, tax: Number(item.taxSelect || item.tax) || 0 };
      const calculatedAmount = calculateLineAmount(itemForCalc);
      const currentAmount = toNumber(item?.amount, 0);
      if (Math.abs(calculatedAmount - currentAmount) > 0.01) {
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
    });
  }, [watchedItems, setValue]);

  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems.map(item => ({ ...item, tax: Number(item.taxSelect || item.tax) || 0 })));
  }, [watchedItems]);

  // Summary TDS/TCS tax calculation using shared utility
  const taxType = watch("taxType") || "TDS";
  const summaryTaxAmount = useMemo(() => {
    return calculateTaxAmount(subTotal, selectedTaxPercent, taxType);
  }, [selectedTaxPercent, subTotal, taxType]);

  const finalTotal = useMemo(() => {
    return calculateGrandTotal(subTotal, summaryTaxAmount, adjustment);
  }, [subTotal, summaryTaxAmount, adjustment]);

  // --------------------------------------------------
  // FILE UPLOAD
  // --------------------------------------------------
  const handleFileUpload = (e) => {
    const list = Array.from(e.target.files || []).map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      url: URL.createObjectURL(file),
      type: file.type,
    }));

    const updated = [...uploadedFiles, ...list];
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  const removeFile = (idx) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  // --------------------------------------------------
  // API MUTATIONS
  // --------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (payload) => createCreditNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["creditNotes"]);
      alert("Credit Note created successfully!");
      navigate("/creditnotes");
    },
    onError: (err) => handleProvisionalError(err, "Create Credit Note"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCreditNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["creditNotes"]);
      alert("Credit Note updated successfully!");
      navigate("/creditnotes");
    },
    onError: (err) => handleProvisionalError(err, "Update Credit Note"),
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  // --------------------------------------------------
  // SUBMIT PAYLOAD
  // --------------------------------------------------
  const onSubmit = (data) => {
      // Calculate and sync all amounts before submission using shared utilities
      const itemsWithAmounts = (data.items || []).map((item) => {
        const itemForCalc = { ...item, tax: Number(item.taxSelect || item.tax) || 0 };
        return {
          itemDetails: item?.itemDetails || "",
          account: item?.account || "",
          quantity: toNumber(item?.quantity, 1),
          rate: toNumber(item?.rate, 0),
          discount: toNumber(item?.discount, 0),
          taxSelect: item?.taxSelect || "",
          amount: calculateLineAmount(itemForCalc),
        };
      });

      // Recalculate totals using shared utilities
      const finalSubTotal = calculateSubtotal(itemsWithAmounts.map(item => ({ ...item, tax: Number(item.taxSelect || 0) })));
      const finalTaxPercent = toNumber(data.taxSelect, 0);
      const finalTaxType = data.taxType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalSubTotal, finalTaxPercent, finalTaxType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotalAmount = calculateGrandTotal(finalSubTotal, finalTaxAmount, finalAdjustment);

    // Build payload matching DEFAULTS structure exactly
    const payload = {
      customerName: data?.customerName || "",
      reason: data?.reason || "",
      creditNoteNumber: data?.creditNoteNumber || "CN-00001",
      referenceNumber: data?.referenceNumber || "",
      creditNoteDate: data.creditNoteDate ? moment(data.creditNoteDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
      accountReceivable: data?.accountReceivable || "Accounts Receivable",
      salesperson: data?.salesperson || "",
      subject: data?.subject || "",
      customerNotes: data?.customerNotes || "Will be displayed on the credit note",
      termsConditions: data?.termsConditions || "",
      items: itemsWithAmounts,
      taxType: data?.taxType || "TDS",
      taxSelect: data?.taxSelect || "",
      adjustment: finalAdjustment,
      taxAmount: finalTaxAmount,
      totalAmount: finalTotalAmount,
      attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
    };

    if (isEditing && !isNewFromInvoice) {
      console.info('[CREDIT NOTE UPDATE]', { 
        id: editId,
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        taxAmount: finalTaxAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      updateMutation.mutate({ id: editId, payload });
    } else {
      console.info('[CREDIT NOTE CREATE] mode:', isNewFromInvoice ? 'NEW FROM INVOICE (POST)' : 'NEW (POST)', {
        customerName: payload.customerName,
        totalAmount: finalTotalAmount,
        taxAmount: finalTaxAmount,
        itemsCount: payload.items.length,
        payload: payload
      });
      createMutation.mutate(payload);
    }
  };

  // --------------------------------------------------
  // UI START
  // --------------------------------------------------
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
        <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-receipt"></i>
          {isEditing ? "Edit Credit Note" : "New Credit Note"}
        </h5>

        <button
          className="btn btn-light btn-sm border"
          type="button"
          onClick={() => navigate("/creditnotes")}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">

        {/* CUSTOMER NAME */}
        <div className="bg-light rounded mb-3">
          <label className="form-label text-danger small fw-semibold">
            Customer Name*
          </label>
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
                      <option key={c?.id ?? idx} value={label ?? ""} title={optionText}>{optionText}</option>
                    );
                  })}
                </select>
              )}
            />
            <button type="button" className="btn btn-primary">
              <i className="bi bi-search"></i>
            </button>
          </div>
          {errors?.customerName && <div className="text-danger small mt-1">{errors.customerName.message}</div>}
        </div>

        {/* REASON */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Reason</label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option value="">Select a Reason</option>
                  <option value="Sales Return">Sales Return</option>
                  <option value="Post Sale Discount">Post Sale Discount</option>
                  <option value="Deficiency in service">Deficiency in service</option>
                  <option value="Correction in invoice">Correction in invoice</option>
                  <option value="Change in POS">Change in POS</option>
                  <option value="Finalization of Provisional assessment">Finalization of Provisional assessment</option>
                  <option value="Others">Others</option>
                </select>
              )}
            />
          </div>

        {/* CREDIT NOTE DETAILS */}
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">
              Credit Note#*
            </label>
            <div className="input-group">
              <Controller
                name="creditNoteNumber"
                control={control}
                render={({ field }) => (
                  <input {...field} type="text" readOnly className="form-control" />
                )}
              />
              <span className="input-group-text">
                <i className="bi bi-gear"></i>
              </span>
            </div>
          </div>

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

          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">
              Credit Note Date*
            </label>
            <Controller
              name="creditNoteDate"
              control={control}
              render={({ field }) => (
                <input {...field} type="date" className="form-control" />
              )}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">
              Accounts Receivable
            </label>
            <Controller
              name="accountReceivable"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option value="Accounts Receivable">Accounts Receivable</option>
                  <option value="Other">Other</option>
                </select>
              )}
            />
          </div>
        </div>

        <hr />

        {/* SALESPERSON */}
        <div className="mb-3">
          <label className="form-label small fw-semibold">Salesperson</label>
          <Controller
            name="salesperson"
            control={control}
            render={({ field }) => (
              <select {...field} className="form-select">
                <option value="">Select or Add Salesperson</option>
              </select>
            )}
          />
        </div>

        {/* SUBJECT */}
        <div className="mb-3">
          <label className="form-label small fw-semibold">Subject</label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={1}
                className="form-control"
                placeholder="Let your customer know what this Credit Note is for"
              />
            )}
          />
        </div>

        {/* ITEM TABLE */}
        <div className="border rounded mb-3">
          <div className="d-flex justify-content-between align-items-center p-2 bg-light border-bottom">
            <strong>Item Table</strong>
            <a href="#" className="small text-primary">Bulk Actions</a>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ITEM DETAILS</th>
                  <th>ACCOUNT</th>
                  <th>QUANTITY</th>
                  <th>RATE</th>
                  <th>DISCOUNT</th>
                  <th>TAX (%)</th>
                  <th>AMOUNT</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {fields.map((row, index) => {
                  const item = watchedItems[index] || {};
                  const itemForCalc = { ...item, tax: Number(item.taxSelect || item.tax) || 0 };
                  const lineAmount = calculateLineAmount(itemForCalc);

                  return (
                    <tr key={row.id}>
                      {/* ITEM */}
                      <td>
                        <Controller
                          name={`items.${index}.itemDetails`}
                          control={control}
                          rules={{ required: "Item is required" }}
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
                                    if (value === "__add__") { navigate('/newitem'); field.onChange(''); return; }
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
                                    return (<option key={it?.id ?? idx} value={it?.id ?? label} title={optionText}>{optionText}</option>);
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

                      {/* ACCOUNT */}
                      <td>
                        <Controller
                          name={`items.${index}.account`}
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select">
                              <option value="">Select an account</option>
                              <option value="Sales">Sales</option>
                              <option value="Returns">Returns</option>
                            </select>
                          )}
                        />
                      </td>

                      {/* QUANTITY */}
                      <td style={{ width: 90 }}>
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

                      {/* RATE */}
                      <td style={{ width: 120 }}>
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

                      {/* DISCOUNT */}
                      <td style={{ width: 100 }}>
                        <div className="input-group">
                          <Controller
                            name={`items.${index}.discount`}
                            control={control}
                            render={({ field }) => (
                              <input {...field} type="number" className="form-control text-end" />
                            )}
                          />
                          <span className="input-group-text">%</span>
                        </div>
                      </td>

                      {/* TAX */}
                      <td style={{ width: 110 }}>
                        <Controller
                          name={`items.${index}.taxSelect`}
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="form-select">
                              <option value="">None</option>
                              <option value="1">1%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          )}
                        />
                      </td>

                      {/* AMOUNT */}
                      <td className="text-end">
                        <Controller
                          name={`items.${index}.amount`}
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              readOnly
                              value={lineAmount.toFixed(2)}
                              className="form-control form-control-sm text-end border-0 bg-transparent"
                              style={{ width: "100px" }}
                            />
                          )}
                        />
                      </td>

                      {/* DELETE ROW */}
                      <td className="text-center text-danger">
                        <i
                          className="bi bi-x-lg"
                          style={{ cursor: "pointer" }}
                          onClick={() => remove(index)}
                        ></i>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex gap-2 p-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() =>
                append({
                  itemDetails: "",
                  account: "",
                  quantity: 1,
                  rate: 0,
                  discount: 0,
                  taxSelect: "",
                  amount: 0,
                })
              }
            >
              + Add New Row
            </button>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
            >
              + Add Items in Bulk
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="row mb-3">

          {/* NOTES */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller
              name="customerNotes"
              control={control}
              render={({ field }) => (
                <textarea {...field} rows={2} className="form-control" />
              )}
            />
          </div>

          {/* SUMMARY BOX */}
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

              {/* TDS / TCS + SELECT TAX */}
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="form-check">
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        value="TDS"
                        type="radio"
                        checked={field.value === "TDS"}
                        className="form-check-input"
                      />
                    )}
                  />
                  <label className="form-check-label small">TDS</label>
                </div>

                <div className="form-check">
                  <Controller
                    name="taxType"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        value="TCS"
                        type="radio"
                        checked={field.value === "TCS"}
                        className="form-check-input"
                      />
                    )}
                  />
                  <label className="form-check-label small">TCS</label>
                </div>

                <Controller
                  name="taxSelect"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select form-select-sm w-auto">
                      <option value="">Select Tax</option>
                      <option value="1">1%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  )}
                />
              </div>

              {/* SUMMARY TAX */}
              <div className="d-flex justify-content-between mb-2">
                <span>Tax Amount ({selectedTaxPercent || 0}%)</span>
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

              {/* ADJUSTMENT */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Adjustment</span>
                <Controller
                  name="adjustment"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      className="form-control form-control-sm text-end w-25"
                      placeholder="0.00"
                    />
                  )}
                />
              </div>

              <hr />

              {/* TOTAL */}
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

        {/* TERMS */}
        <div className="mb-3">
          <label className="form-label small fw-semibold">Terms & Conditions</label>
          <Controller
            name="termsConditions"
            control={control}
            render={({ field }) => (
              <textarea {...field} rows={3} className="form-control" />
            )}
          />
        </div>

        {/* ATTACHMENTS */}
        <div className="mb-3">
          <label className="form-label small fw-semibold">Attachments</label>
          {/* ...existing code... */}

          {uploadedFiles.length > 0 && (
            <ul className="list-group mt-2">
              {uploadedFiles.map((file, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  {file.name} ({file.size})
                  <button
                    type="button"
                    className="btn btn-link text-danger btn-sm"
                    onClick={() => removeFile(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-3 text-end">
          <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
            {isSaving
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
                ? "Update Credit Note"
                : "Save Credit Note"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewCreditNotes;
