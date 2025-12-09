import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBill, updateBill, getVendors } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";
import { getCustomers } from "../../sales/api";
import { calculateLineAmount, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal, toNumber, parseTaxPercentage } from "../../../utils/calculations";

const DEFAULTS = {
  vendorName: "",
  vendorId: null,
  billNumber: "",
  orderNumber: "",
  billDate: "",
  dueDate: new Date().toISOString().split("T")[0],
  paymentTerms: "Due on Receipt",
  accountsPayable: "Accounts Payable",
  reverseCharge: false,
  subject: "",
  discountValue: 0,
  discountPercent: 0,
  tdsType: "TDS",
  tax: "",
  adjustment: 0,
  notes: "",
  items: [
    {
      itemDetails: "",
      account: "",
      quantity: 1,
      rate: 0,
      tax: "",
      customerDetails: "",
      amount: 0,
    },
  ],
  attachments: [],
};

const NewBill = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const queryClient = useQueryClient();

  const editId = state?.id;
  const isNewFromPO = state?.isNew === true; // conversion flag from PO
  const isEditing = Boolean(editId) && !isNewFromPO;

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
      if (isNewFromPO) {
        console.info("📄 [BILL FROM PO CONVERSION]", {
          sourcePOId: state?.sourcePurchaseOrderId,
          sourcePONumber: state?.sourcePurchaseOrderNumber,
          conversionTimestamp: state?.conversionTimestamp,
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
  }, [state, reset, setValue, isNewFromPO]);

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
    mutationFn: (payload) => createBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["bills"]);
      alert("Bill created successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/bills");
    },
    onError: (error) => handleProvisionalError(error, "Create Bill"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBill(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["bills"]);
      alert("Bill updated successfully");
      navigate("/bills");
    },
    onError: (error) => handleProvisionalError(error, "Update Bill"),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  // useWatch gives reactive updates on change (not only on blur)
  const watchItems = useWatch({ control, name: "items" }) || [];
  const watchDiscount = parseFloat(watch("discountPercent") || 0) || 0;
  const watchAdjustment = parseFloat(watch("adjustment") || 0) || 0;

  // Sync per-item amount back into the form using shared calculation utility
  const itemsWithAmount = useMemo(() => {
    return (watchItems || []).map((item, index) => {
      // Parse tax percentage from string like "GST 12%" to number 12
      const taxString = item?.tax || "";
      const parsedTax = parseFloat(String(taxString).match(/(\d+(?:\.\d+)?)/)?.[0] || 0) || 0;
      
      // Create item object with parsed tax for calculation
      const itemForCalc = {
        ...item,
        tax: parsedTax,
        discount: toNumber(item?.discount, 0),
        quantity: toNumber(item?.quantity, 1),
        rate: toNumber(item?.rate, 0),
      };
      
      const calculatedAmount = calculateLineAmount(itemForCalc);
      const prev = toNumber(item?.amount, 0);
      if (Math.abs(calculatedAmount - prev) > 0.01) {
        // keep form field in sync (not marking dirty)
        setValue(`items.${index}.amount`, calculatedAmount, { shouldDirty: false, shouldValidate: false });
      }
      return { ...item, amount: calculatedAmount };
    });
  }, [watchItems, setValue]);

  // Subtotal based on synced item amounts using shared utility
  const subtotal = calculateSubtotal(itemsWithAmount);

  // Fetch items for dropdown
  const { data: fetchedItemsRaw } = useQuery({
    queryKey: ["items", "bill-form"],
    queryFn: () => getItems({ Page: 1, PageSize: 500 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Items"),
  });

  const itemOptions = extractItems(fetchedItemsRaw) || [];

  // Fetch vendors
  const { data: fetchedVendorsRaw } = useQuery({
    queryKey: ["vendors", "bill-form"],
    queryFn: () => getVendors({ Page: 1, PageSize: 200 }),
    keepPreviousData: true,
    retry: 1,
    onError: (error) => handleProvisionalError(error, "Fetch Vendors"),
  });

  const vendorOptions = extractItems(fetchedVendorsRaw) || [];

  // Fetch customers for customerDetails dropdown (reuse sales customers API)
  const { data: fetchedCustomersRaw } = useQuery({
    queryKey: ["customers", "bill-form"],
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
  }, [vendorOptions, state, setValue]);

  // ✅ Calculate totals using shared utilities
  const discountAmount = calculateDiscountAmount(subtotal, watchDiscount);
  const taxableAmount = subtotal - discountAmount;

  // parse tax percent from selected tax option like 'GST 5%'
  const taxField = watch("tax") || "";
  const parsedTax = parseFloat(String(taxField).match(/(\d+(?:\.\d+)?)/)?.[0] || 0) || 0;
  const tdsType = watch("tdsType") || "TDS";
  const taxAmount = calculateTaxAmount(taxableAmount, parsedTax, tdsType);

  // TDS reduces total, TCS increases total - using shared utility
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
      if (isNewFromPO) {
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
      const itemsWithAmounts = (data.items || []).map((item) => {
        // Parse tax percentage from string like "GST 12%" to number 12.0 for backend
        const parsedTax = parseTaxPercentage(item?.tax);
        
        const itemForCalc = {
          quantity: toNumber(item?.quantity, 1),
          rate: toNumber(item?.rate, 0),
          discount: toNumber(item?.discount, 0),
          tax: parsedTax,
        };
        
        return {
          itemDetails: item?.itemDetails || "",
          account: item?.account || "",
          quantity: toNumber(item?.quantity, 1),
          rate: toNumber(item?.rate, 0),
          discount: toNumber(item?.discount, 0),
          tax: parsedTax, // Send as number, not string
          customerDetails: item?.customerDetails || "",
          amount: calculateLineAmount(itemForCalc),
        };
      });

      // Recalculate totals using shared utilities
      const finalSubtotal = calculateSubtotal(itemsWithAmounts);
      const finalDiscountPercent = toNumber(data.discountPercent, 0);
      const finalDiscountAmount = calculateDiscountAmount(finalSubtotal, finalDiscountPercent);
      const finalTaxableAmount = finalSubtotal - finalDiscountAmount;
      const parsedTax = parseTaxPercentage(data.tax);
      const finalTdsType = data.tdsType || "TDS";
      const finalTaxAmount = calculateTaxAmount(finalTaxableAmount, parsedTax, finalTdsType);
      const finalAdjustment = toNumber(data.adjustment, 0);
      const finalTotal = calculateGrandTotal(finalTaxableAmount, finalTaxAmount, finalAdjustment);

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        vendorName: data?.vendorName || "",
        vendorId: data?.vendorId || selectedVendor?.id || null,
        billNumber: data?.billNumber || "",
        orderNumber: data?.orderNumber || "",
        billDate: data?.billDate || "",
        dueDate: data?.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        paymentTerms: data?.paymentTerms || "Due on Receipt",
        accountsPayable: data?.accountsPayable || "Accounts Payable",
        reverseCharge: Boolean(data?.reverseCharge),
        subject: data?.subject || "",
        discountValue: finalDiscountAmount,
        discountPercent: finalDiscountPercent,
        tdsType: finalTdsType,
        tax: parsedTax, // Send as number, not string
        adjustment: finalAdjustment,
        notes: data?.notes || "",
        items: itemsWithAmounts,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
      };

      // Ensure required fields are not empty strings
      if (!payload.vendorName || payload.vendorName.trim() === "") {
        handleProvisionalError(new Error("Vendor name is required"), "VALIDATION", "❌ Vendor name is required");
        return;
      }
      if (!payload.billDate || payload.billDate.trim() === "") {
        handleProvisionalError(new Error("Bill date is required"), "VALIDATION", "❌ Bill date is required");
        return;
      }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        handleProvisionalError(new Error("At least one item is required"), "VALIDATION", "❌ At least one item is required");
        return;
      }
      
      // Clean up optional empty string fields
      if (!payload.orderNumber || payload.orderNumber.trim() === "") delete payload.orderNumber;
      if (!payload.subject || payload.subject.trim() === "") delete payload.subject;
      if (!payload.notes || payload.notes.trim() === "") delete payload.notes;

      if (isEditing && !isNewFromPO) {
        console.info("📝 [EDIT (PUT)] Bill:", { 
          id: editId, 
          vendorName: payload.vendorName,
          total: finalTotal,
          itemsCount: payload.items.length,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
        return;
      }

      // NEW (POST) - includes conversion from PO
      const submissionType = isNewFromPO ? "NEW FROM PO" : "NEW";
      console.info(`📄 [${submissionType} (POST)] Bill`, {
        sourcePOId: isNewFromPO ? state?.sourcePurchaseOrderId : null,
        vendorName: payload.vendorName,
        itemsCount: payload.items.length,
        total: finalTotal,
        payload: payload
      });
      createMutation.mutate(payload);
    } catch (err) {
      console.error("❌ [BILL SUBMIT ERROR]", err);
      handleProvisionalError(err, "Bill Submit", "Failed to submit bill");
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
          <i className="bi bi-journal-text me-1"></i>
          {isEditing ? "Edit Bill" : "New Bill"}
        </h5>

        <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate("/bills")}>
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

                      <button type="button" className="btn btn-primary ms-2" onClick={() => navigate("/vendors") } title="Search Vendors">
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

        {/* Bill Details */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label text-danger fw-semibold">
                Bill#*
              </label>
              <Controller
                name="billNumber"
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
              <label className="form-label text-danger fw-semibold">
                Bill Date*
              </label>
              <Controller
                name="billDate"
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
              <label className="form-label fw-semibold">Due Date</label>
              <Controller
                name="dueDate"
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
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="form-label fw-semibold">Subject</label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="Enter a subject within 250 characters"
                className="form-control form-control-sm"
                style={{ maxWidth: "500px" }}
              />
            )}
          />
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
                          {...field}
                          className="form-select form-select-sm"
                        >
                          <option value="">Select a Tax</option>
                          <option value="GST 5%">GST 5%</option>
                          <option value="GST 12%">GST 12%</option>
                          <option value="GST 18%">GST 18%</option>
                          <option value="GST 28%">GST 28%</option>
                          <option value="IGST 5%">IGST 5%</option>
                          <option value="IGST 12%">IGST 12%</option>
                          <option value="IGST 18%">IGST 18%</option>
                          <option value="IGST 28%">IGST 28%</option>
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
                              // store the chosen label (display) or id depending on options
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
                    tax: "",
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

            {/* TDS / TCS */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <Controller
                  name="tdsType"
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
                      <option value="GST 5%">GST 5%</option>
                      <option value="GST 12%">GST 12%</option>
                      <option value="GST 18%">GST 18%</option>
                      <option value="GST 28%">GST 28%</option>
                    </select>
                  )}
                />
              </div>
              <span className="fw-semibold" style={{ width: "80px", textAlign: "right" }}>
                {taxAmount.toFixed(2)}
              </span>
            </div>

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
            {/* ...existing code... */}
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
                ? "Update Bill"
                : "Save Bill"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-4"
            onClick={() => navigate("/bills")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewBill;
