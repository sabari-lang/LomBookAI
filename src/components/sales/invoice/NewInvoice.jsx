import React, { useEffect, useMemo, useState } from "react";
import moment from "moment/moment";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInvoice, updateInvoice, getCustomers, getInvoices, getQuotes } from "../api";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { calculateLineAmount, calculateSubtotal, calculateTaxAmount, calculateGrandTotal, toNumber, parseTaxPercentage } from "../../../utils/calculations";

const NewInvoice = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const DEFAULTS = {
    customerName: "",
    invoiceNumber: "INV-000001",
    orderNumber: "",
    invoiceDate: moment().format("YYYY-MM-DD"),
    terms: "Due on Receipt",
    dueDate: moment().format("YYYY-MM-DD"),
    accountsReceivable: "Accounts Receivable",
    salesperson: "",
    subject: "",
    customerNotes: "Thanks for your business.",
    termsAndConditions: "",
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

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const editId = state?.id || null;
  const isNewFromQuote = state?.isNew === true; // conversion flag
  const isEditing = Boolean(editId) && !isNewFromQuote;

  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (state) {
      if (isNewFromQuote) {
        console.info("📄 [INVOICE FROM CONVERSION]", {
          sourceId: state?.sourceQuoteId ?? state?.sourceSalesOrderId ?? null,
          sourceNumber: state?.sourceQuoteNumber ?? state?.sourceSalesOrderNumber ?? null,
          sourceType: state?.sourceType ?? "unknown",
          conversionTimestamp: state?.conversionTimestamp,
        });
      }

      reset({
        ...DEFAULTS,
        ...state,
        invoiceDate: state?.invoiceDate
          ? moment(state.invoiceDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        dueDate: state?.dueDate
          ? moment(state.dueDate).format("YYYY-MM-DD")
          : null,
      });
      setUploadedFiles(state?.attachments || []);
      setValue("attachments", state?.attachments || []);
      return;
    }
    reset(DEFAULTS);
    setUploadedFiles([]);
    setValue("attachments", []);
  }, [state, reset, setValue, isNewFromQuote]);

  // Fetch customers for select (show phone/address)
  const { data: fetchedCustomers } = useQuery({
    queryKey: ["customers", "invoice-form"],
    queryFn: () => getCustomers({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Customers"),
  });

  const customerOptions = extractItems(fetchedCustomers) || [];

  // Watch selected customer name to fetch related quotes and invoices
  const selectedCustomerName = watch("customerName");

  const { data: fetchedQuotesForCustomer, isLoading: quotesLoading } = useQuery({
    queryKey: ["quotes", "byCustomer", selectedCustomerName],
    queryFn: () => getQuotes({ Page: 1, PageSize: 200 }),
    enabled: Boolean(selectedCustomerName),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Quotes"),
  });

  const allQuotes = extractItems(fetchedQuotesForCustomer) || [];
  const relatedQuotes = (allQuotes || []).filter((q) => {
    if (!selectedCustomerName) return false;
    return (q?.customerName || "").toLowerCase() === String(selectedCustomerName || "").toLowerCase();
  });

  // Fetch invoices for selected customer to show proforma count
  const { data: fetchedInvoicesForCustomer, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices", "byCustomer", selectedCustomerName],
    queryFn: () => getInvoices({ Page: 1, PageSize: 200 }),
    enabled: Boolean(selectedCustomerName),
    keepPreviousData: true,
    onError: (err) => handleProvisionalError(err, "Fetch Invoices"),
  });

  const allInvoices = extractItems(fetchedInvoicesForCustomer) || [];
  const relatedInvoices = (allInvoices || []).filter((inv) => {
    if (!selectedCustomerName) return false;
    return (inv?.customerName || "").toLowerCase() === String(selectedCustomerName || "").toLowerCase();
  });

  // Count proformas (invoices with status = 'Proforma' or similar)
  const proformaCount = relatedInvoices.filter((inv) => 
    (inv?.status || "").toLowerCase().includes("proforma") || 
    (inv?.status || "") === "Draft"
  ).length;

  // Fetch items for item dropdown
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "invoice-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (err) => handleProvisionalError(err, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];


  // ===========================
  // LIVE WATCH FOR ITEMS (useWatch for stable updates)
  // ===========================
  const watchedItems = useWatch({ control, name: "items" }) || [];

  // Auto-calculate Due Date based on `terms` (e.g. "Net 15") and invoiceDate
  const paymentTermsValue = watch("terms");
  const invoiceDateValue = watch("invoiceDate");

  useEffect(() => {
    try {
      if (!paymentTermsValue) return;

      const base = invoiceDateValue ? moment(invoiceDateValue) : moment();
      const lower = String(paymentTermsValue || "").toLowerCase();

      // Match patterns like 'Net 15', 'Net 30', or numeric days
      const netMatch = (paymentTermsValue || "").match(/\bnet\s*(\d+)/i);
      if (netMatch && netMatch[1]) {
        const days = Number(netMatch[1]) || 0;
        const due = base.clone().add(days, "days").format("YYYY-MM-DD");
        setValue("dueDate", due);
        return;
      }

      if (lower.includes("due on receipt") || lower.includes("due on receipt")) {
        setValue("dueDate", base.format("YYYY-MM-DD"));
        return;
      }

      // fallback: if terms include a number, use that as days
      const numMatch = (paymentTermsValue || "").match(/(\d+)/);
      if (numMatch && numMatch[1]) {
        const days = Number(numMatch[1]) || 0;
        const due = base.clone().add(days, "days").format("YYYY-MM-DD");
        setValue("dueDate", due);
      }
    } catch (e) {
      // ignore errors
      // console.error(e);
    }
  }, [paymentTermsValue, invoiceDateValue, setValue]);

  // ===========================
  // SHARED ROW CALCULATION
  // ===========================
  // Use shared calculation utility
  // calculateLineAmount is imported from utils/calculations

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

  // ===========================
  // SUMMARY CALC - Using shared utilities
  // ===========================
  const subTotal = useMemo(() => {
    return calculateSubtotal(watchedItems);
  }, [watchedItems]);

  const taxRate = toNumber(watch("taxSelect"), 0);
  const taxType = watch("taxType") || "TDS";

  const summaryTax = useMemo(() => {
    return calculateTaxAmount(subTotal, taxRate, taxType);
  }, [subTotal, taxRate, taxType]);

  const adjustment = toNumber(watch("adjustment"), 0);

  const finalTotal = useMemo(() => {
    return calculateGrandTotal(subTotal, summaryTax, adjustment);
  }, [subTotal, summaryTax, adjustment]);

  // Sync calculated values to form state (for display)
  useEffect(() => {
    setValue("totalAmount", finalTotal, { shouldDirty: false });
    setValue("taxAmount", Math.abs(summaryTax), { shouldDirty: false });
  }, [finalTotal, summaryTax, setValue]);


  // ===========================
  // FILE UPLOAD
  // ===========================
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

  // ===========================
  // API HANDLING
  // ===========================
  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      alert("Invoice Created!");
      reset(DEFAULTS);
      navigate("/invoices");
    },
    onError: (err) => handleProvisionalError(err, "Create Invoice"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateInvoice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices"]);
      alert("Invoice Updated!");
      navigate("/invoices");
    },
    onError: (err) => handleProvisionalError(err, "Update Invoice"),
  });

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  const onSubmit = (data) => {
    try {
      // Basic validation used for conversions as well
      if (!data || typeof data !== "object") {
        throw new Error("Form data invalid");
      }

      if (!data?.customerName || !String(data.customerName).trim()) {
        handleProvisionalError(new Error("Customer name required"), "Validation", "❌ Customer name is required");
        return;
      }

      if (!Array.isArray(data?.items) || data.items.length === 0) {
        handleProvisionalError(new Error("At least one item required"), "Validation", "❌ At least one item is required");
        return;
      }

      const invalidItem = data.items.find((it) => !it?.itemDetails || !it?.quantity || !it?.rate);
      if (invalidItem) {
        handleProvisionalError(new Error("Each item must have details, quantity and rate"), "Validation", "❌ Items are incomplete");
        return;
      }

      // Calculate and sync all amounts before submission using shared utilities
      const itemsWithAmounts = (data.items || []).map((item) => ({
        itemDetails: item?.itemDetails || "",
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
        invoiceNumber: data?.invoiceNumber || "INV-000001",
        orderNumber: data?.orderNumber || "",
        invoiceDate: data?.invoiceDate ? moment(data.invoiceDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
        terms: data?.terms || "Due on Receipt",
        dueDate: data?.dueDate ? moment(data.dueDate).toISOString().split("T")[0] : moment().format("YYYY-MM-DD"),
        accountsReceivable: data?.accountsReceivable || "Accounts Receivable",
        salesperson: data?.salesperson || "",
        subject: data?.subject || "",
        customerNotes: data?.customerNotes || "Thanks for your business.",
        termsAndConditions: data?.termsAndConditions || "",
        items: itemsWithAmounts,
        taxType: finalTaxType,
        taxSelect: finalTaxRate, // Send as number, not string
        adjustment: finalAdjustment,
        taxAmount: finalTaxAmount,
        totalAmount: finalTotalAmount,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      // Clean up empty string fields (except required ones)
      if (!payload.orderNumber) delete payload.orderNumber;
      if (!payload.salesperson) delete payload.salesperson;
      if (!payload.subject) delete payload.subject;
      if (!payload.termsAndConditions) delete payload.termsAndConditions;

      if (isEditing && !isNewFromQuote) {
        console.info("📝 [EDIT (PUT)] Invoice", { 
          id: editId, 
          customerName: payload.customerName,
          totalAmount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
      } else {
        const submissionType = isNewFromQuote ? "NEW FROM CONVERSION" : "NEW";
        console.info(`[INVOICE ${submissionType}]`, {
          sourceId: isNewFromQuote ? state?.sourceQuoteId ?? state?.sourceSalesOrderId : null,
          customerName: payload.customerName,
          itemsCount: payload.items.length,
          totalAmount: finalTotalAmount,
          taxAmount: finalTaxAmount,
          payload: payload
        });
        createMutation.mutate(payload);
      }
    } catch (err) {
      console.error("❌ [INVOICE SUBMIT ERROR]", err);
      handleProvisionalError(err, "Invoice Submit", err?.message || "Failed to submit invoice");
    }
  };

  // ===========================
  // UI STARTS (NO CHANGES)
  // ===========================
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
        <h5 className="fw-semibold">New Invoice</h5>
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

        {/* CUSTOMER NAME */}
        <div className="rounded shadow-sm mb-3">
          <label className="form-label text-danger fw-semibold small">Customer Name*</label>
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
            <button type="button" className="btn btn-primary" onClick={() => navigate('/newcustomer')}>
              <i className="bi bi-people"></i>
            </button>
          </div>
        </div>

        {/* Related Quotes & Proformas Count */}
        {selectedCustomerName && (
          <div className="mb-2">
            <small className="text-muted">
              {quotesLoading || invoicesLoading ? (
                <>Checking related documents...</>
              ) : (
                <>
                  <span className="fw-semibold text-primary">{relatedQuotes.length} quote(s)</span> found.{" "}
                  <span className="fw-semibold text-primary">{proformaCount} proforma(s)</span> found for this customer.{" "}
                  <a href="#" className="text-primary small" onClick={(e) => { e.preventDefault(); navigate("/quotes", { state: { customerName: selectedCustomerName } }); }}>
                    View Quotes
                  </a>
                </>
              )}
            </small>
          </div>
        )}

        {/* INVOICE HEADER FIELDS */}
        <div className="row g-3 mb-3">

          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">Invoice#*</label>
            <Controller
              name="invoiceNumber"
              control={control}
              render={({ field }) => <input {...field} className={`form-control ${errors.invoiceNumber ? "is-invalid" : ""}`} />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Order Number</label>
            <Controller
              name="orderNumber"
              control={control}
              render={({ field }) => <input {...field} className="form-control" />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label text-danger small fw-semibold">Invoice Date*</label>
            <Controller
              name="invoiceDate"
              control={control}
              render={({ field }) => <input {...field} type="date" className={`form-control ${errors.invoiceDate ? "is-invalid" : ""}`} />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Terms</label>
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option>Due on Receipt</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              )}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Due Date</label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => <input {...field} type="date" className="form-control" />}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold">Accounts Receivable</label>
            <Controller
              name="accountsReceivable"
              control={control}
              render={({ field }) => (
                <select {...field} className="form-select">
                  <option value="Accounts Receivable">Accounts Receivable</option>
                </select>
              )}
            />
          </div>

          <div className="col-md-3">
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

          <div className="col-md-6">
            <label className="form-label small fw-semibold">Subject</label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <input {...field} className="form-control" placeholder="Let your customer know what this Invoice is for" />
              )}
            />
          </div>

        </div>
        {/* ITEM TABLE */}
        <div className="border rounded shadow-sm mb-3">

          <div className="p-2 d-flex justify-content-between bg-light border-bottom">
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
                  <th>TAX</th>    {/* Added same as Sales Order */}
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
                                  {itemOptions?.map((it, idx) => {
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
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => remove(index)}
                        >
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
          </div>

        </div>


        {/* SUMMARY SECTION */}
        <div className="row mb-3">

          <div className="col-md-6">
            <label className="form-label small fw-semibold">Customer Notes</label>
            <Controller
              name="customerNotes"
              control={control}
              render={({ field }) => (
                <>
                  <textarea {...field} className="form-control" rows="2"></textarea>
                  {/* <small>Will be displayed on the invoice</small> */}
                </>
              )}
            />
          </div>

          <div className="col-md-6">
            <div className="border rounded p-3 shadow-sm">

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

              <div className="d-flex align-items-center gap-3 mt-2">

                <Controller
                  name="taxType"
                  control={control}
                  render={({ field }) => (
                    <>
                      <div className="form-check">
                        <input type="radio" value="TDS" {...field} checked={field.value === "TDS"} className="form-check-input" />
                        <label className="form-check-label">TDS</label>
                      </div>
                      <div className="form-check">
                        <input type="radio" value="TCS" {...field} checked={field.value === "TCS"} className="form-check-input" />
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
                      <option value={1}>1%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  )}
                />

              </div>

              <div className="d-flex justify-content-between mt-2">
                <span>Tax Amount ({taxRate}%)</span>
                <Controller
                  name="taxAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      readOnly
                      value={Math.abs(summaryTax).toFixed(2)}
                      className="form-control form-control-sm text-end border-0 bg-transparent"
                      style={{ width: "100px" }}
                    />
                  )}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <span>Adjustment</span>
                <Controller
                  name="adjustment"
                  control={control}
                  render={({ field }) => (
                    <input {...field} className="form-control form-control-sm text-end w-25" type="number" />
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


        {/* TERMS AND CONDITIONS */}
        <div className="row mb-3">

          <div className="col-md-8">
            <label className="form-label small fw-semibold">Terms & Conditions</label>
            <Controller
              name="termsAndConditions"
              control={control}
              render={({ field }) => (
                <textarea {...field} className="form-control" rows="3"></textarea>
              )}
            />
          </div>

          {/* ...existing code... */}

        </div>


        <button type="submit" disabled={isSaving} className="btn btn-primary">
          {isSaving ? "Saving..." : isEditing ? "Update Invoice" : "Save Invoice"}
        </button>

      </form>
    </div>
  );
};

export default NewInvoice;
