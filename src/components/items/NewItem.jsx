import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createItem, updateItem } from "./api";
import { getVendors } from "../purchases/api";
import { extractItems } from "../../utils/extractItems";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { useUnlockInputs } from "../../hooks/useUnlockInputs";

const labelBase = { fontWeight: 600, fontSize: "13px" };
const reqColor = "#d9534f";

const UNIT_LIST = [
    "box (Box)",
    "cm (Centimeter)",
    "dz (Dozen)",
    "ft (Feet)",
    "g (Grams)",
    "in (Inches)",
    "kg (Kilograms)",
    "km (Kilometers)",
    "lb (Pounds)",
    "mg (Milli Grams)",
    "ml (Milli Litre)",
    "m (Meter)",
    "pcs (Pieces)",
];

const TAX_OPTIONS = [
    { value: 18, label: "GST18 [18%]" },
    { value: 12, label: "GST12 [12%]" },
    { value: 5, label: "GST5 [5%]" },
    { value: 0, label: "GST0 [0%]" },
];

const INTER_TAX_OPTIONS = [
    { value: 18, label: "IGST18 [18%]" },
    { value: 12, label: "IGST12 [12%]" },
    { value: 5, label: "IGST5 [5%]" },
    { value: 0, label: "IGST0 [0%]" },
];

const TAX_PREF_LIST = ["Taxable", "Non-Taxable", "Out of Scope", "Non-GST Supply"];

const DEFAULT_TAX = 0;
const TAXABLE_DEFAULT_RATE = 18;
const ADD_VENDOR_VALUE = "__ADD_VENDOR__";

const ADD_ACCOUNT_VALUE = "__ADD_ACCOUNT__";

const PURCHASE_ACCOUNT_OPTIONS = [
    // COGS group
    { label: "Cost of Goods Sold", value: "Cost of Goods Sold" },
    { label: "Job Costing", value: "Job Costing" },
    { label: "Labor", value: "Labor" },
    { label: "Materials", value: "Materials" },
    { label: "Subcontractor", value: "Subcontractor" },

    // Other Expenses (group header)
    { label: "Other Expenses", value: "Other Expenses", disabled: true },
    { label: "Postage", value: "Postage" },
    { label: "Printing and Stationery", value: "Printing and Stationery" },
    { label: "Purchase Discounts", value: "Purchase Discounts" },
    { label: "Raw Materials And Consumables", value: "Raw Materials And Consumables" },
    { label: "Rent Expense", value: "Rent Expense" },
    { label: "Repairs and Maintenance", value: "Repairs and Maintenance" },
    { label: "Salaries and Employee Wages", value: "Salaries and Employee Wages" },
    { label: "Telephone Expense", value: "Telephone Expense" },
    { label: "Transportation Expense", value: "Transportation Expense" },
    { label: "Travel Expense", value: "Travel Expense" },
    { label: "Uncategorized", value: "Uncategorized" },

    // IT / Depreciation / General expenses
    { label: "Depreciation Expense", value: "Depreciation Expense" },
    { label: "IT and Internet Expenses", value: "IT and Internet Expenses" },
    { label: "Janitorial Expense", value: "Janitorial Expense" },
    { label: "Lodging", value: "Lodging" },
    { label: "Meals and Entertainment", value: "Meals and Entertainment" },
    { label: "Merchandise", value: "Merchandise" },

    // Expense group
    { label: "Expense", value: "Expense", disabled: true },
    { label: "Advertising And Marketing", value: "Advertising And Marketing" },
    { label: "Automobile Expense", value: "Automobile Expense" },
    { label: "Bad Debt", value: "Bad Debt" },
    { label: "Bank Fees and Charges", value: "Bank Fees and Charges" },
    { label: "Consultant Expense", value: "Consultant Expense" },

    // From last screenshot list (important accounts)
    { label: "TDS Receivable", value: "TDS Receivable" },
    { label: "Fixed Asset", value: "Fixed Asset", disabled: true },
    { label: "Furniture and Equipment", value: "Furniture and Equipment" },
    { label: "Other Current Liability", value: "Other Current Liability", disabled: true },
    { label: "Employee Reimbursements", value: "Employee Reimbursements" },
    { label: "GST Payable", value: "GST Payable", disabled: true },
    { label: "Output CGST", value: "Output CGST" },

    // Add Account CTA (must be last)
    { label: "+ New Account", value: ADD_ACCOUNT_VALUE },
];

const SALES_ACCOUNT_OPTIONS = [
    // Income
    { label: "Sales", value: "Sales" },
    { label: "Discount", value: "Discount" },
    { label: "General Income", value: "General Income" },
    { label: "Interest Income", value: "Interest Income" },
    { label: "Late Fee Income", value: "Late Fee Income" },
    { label: "Other Charges", value: "Other Charges" },

    // GST Payable (header-like, kept disabled)
    { label: "GST Payable", value: "GST Payable", disabled: true },
    { label: "Output CGST", value: "Output CGST" },
    { label: "Output SGST", value: "Output SGST" },
    { label: "Output IGST", value: "Output IGST" },

    // Liabilities
    { label: "Opening Balance Adjustments", value: "Opening Balance Adjustments" },
    { label: "Tax Payable", value: "Tax Payable" },
    { label: "TDS Payable", value: "TDS Payable" },
    { label: "Unearned Revenue", value: "Unearned Revenue" },
    { label: "Reverse Charge Tax Input but not due", value: "Reverse Charge Tax Input but not due" },

    // Assets
    { label: "Other Current Asset", value: "Other Current Asset" },
    { label: "Advance Tax", value: "Advance Tax" },
    { label: "Employee Advance", value: "Employee Advance" },
    { label: "Input CGST", value: "Input CGST" },
    { label: "Input SGST", value: "Input SGST" },
    { label: "Input IGST", value: "Input IGST" },

    // Fixed Assets
    { label: "Fixed Asset", value: "Fixed Asset" },
    { label: "Furniture and Equipment", value: "Furniture and Equipment" },
];

const initialValues = {
    type: "Goods",
    name: "",
    unit: "",
    hsn: "",
    sac: "",
    taxPref: "Non-Taxable",

    sellable: true,
    sellingPrice: "",
    salesAccount: "Sales",
    salesDesc: "",

    purchasable: true,
    costPrice: "",
    purchaseAccount: "Cost of Goods Sold",
    purchaseDesc: "",

    vendor: "",

    intraTax: DEFAULT_TAX,
    interTax: DEFAULT_TAX,
};

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const NewItem = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const editSource = state || {};
    const editId = editSource?.id ?? editSource?._id ?? editSource?.itemId ?? null;
    const isEditing = Boolean(editId);
    const queryClient = useQueryClient();

    // First input ref for autofocus
    const firstInputRef = useRef(null);
    useEffect(() => {
        if (firstInputRef && firstInputRef.current) {
            try {
                firstInputRef.current.focus();
            } catch {}
        }
    }, []);

    // ✅ Keyboard unlock hook for edit mode
    useUnlockInputs(isEditing);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: initialValues,
    });

    useEffect(() => {
        if (!editId) return;

            // Determine tax preference and normalize tax values
            const taxPrefFromSource = editSource?.taxPref ?? initialValues.taxPref;

            let intraTaxValue;
            let interTaxValue;
            if (taxPrefFromSource === "Taxable") {
                intraTaxValue = editSource?.intraTax != null
                    ? (typeof editSource.intraTax === 'number' ? editSource.intraTax : Number(editSource.intraTax) || TAXABLE_DEFAULT_RATE)
                    : TAXABLE_DEFAULT_RATE;
                interTaxValue = editSource?.interTax != null
                    ? (typeof editSource.interTax === 'number' ? editSource.interTax : Number(editSource.interTax) || TAXABLE_DEFAULT_RATE)
                    : TAXABLE_DEFAULT_RATE;
            } else {
                // Non-taxable variants should be zeroed
                intraTaxValue = DEFAULT_TAX;
                interTaxValue = DEFAULT_TAX;
            }

            reset({
                ...initialValues,
                ...editSource,
                sellable: Boolean(editSource?.sellable),
                purchasable: Boolean(editSource?.purchasable),
                sellingPrice: editSource?.sellingPrice ?? "",
                costPrice: editSource?.costPrice ?? "",
                intraTax: intraTaxValue,
                interTax: interTaxValue,
                taxPref: taxPrefFromSource,
            });
            // sync local taxPreference and rates with edit source
            setTaxPreference(taxPrefFromSource);
            setIntraStateTaxRate(intraTaxValue);
            setInterStateTaxRate(interTaxValue);
    }, [editId]);

    const sellable = useWatch({ control, name: "sellable" });
    const purchasable = useWatch({ control, name: "purchasable" });
    const itemType = useWatch({ control, name: "type" });

    // Vendors list for Preferred Vendor
    const { data: vendorsRaw } = useQuery({
        queryKey: ["vendors", "for-item", 500],
        queryFn: () => getVendors({ page: 1, pageSize: 500 }),
        staleTime: 5 * 60 * 1000,
    });
    const vendorItems = extractItems(vendorsRaw) || [];
    const vendorOptions = vendorItems.map((v) => ({
        id: v?.id ?? v?._id ?? v?.vendorId ?? v?.contactId ?? v?.zohoId ?? v?.id,
        name: v?.name ?? v?.vendorName ?? v?.displayName ?? v?.companyName ?? v?.fullName ?? "Unnamed",
    }));
    const vendorSelectOptions = [
        ...vendorOptions,
        { id: ADD_VENDOR_VALUE, name: "+ Add Vendor" },
    ];

    // Auto-clear opposite fields when switching Goods ⇄ Service
    useEffect(() => {
        if (itemType === "Goods") {
            setValue("sac", "");
        } else {
            setValue("hsn", "");
        }
    }, [itemType, setValue]);

    const [taxPreference, setTaxPreference] = useState(() => initialValues.taxPref);
    const [intraStateTaxRate, setIntraStateTaxRate] = useState(() => initialValues.intraTax);
    const [interStateTaxRate, setInterStateTaxRate] = useState(() => initialValues.interTax);

    const handleTaxPreferenceChange = (value) => {
        setTaxPreference(value);
        if (value === "Taxable") {
            // Show taxes and default to the standard taxable rate
            setIntraStateTaxRate(TAXABLE_DEFAULT_RATE);
            setInterStateTaxRate(TAXABLE_DEFAULT_RATE);
            setValue("intraTax", TAXABLE_DEFAULT_RATE);
            setValue("interTax", TAXABLE_DEFAULT_RATE);
        } else {
            // Non-taxable / out of scope / non-gst — force 0 and hide tax UI
            setIntraStateTaxRate(DEFAULT_TAX);
            setInterStateTaxRate(DEFAULT_TAX);
            setValue("intraTax", DEFAULT_TAX);
            setValue("interTax", DEFAULT_TAX);
        }
    };

    const createMutation = useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries(["items"]);
            alert("Item created successfully");
            reset(initialValues);
            navigate("/items");
        },
        onError: (error) => handleProvisionalError(error, "Create Item"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, normalized }) => updateItem(id, normalized),
        onSuccess: () => {
            queryClient.invalidateQueries(["items"]);
            if (editId) queryClient.invalidateQueries(["items", editId]);
            alert("Item updated successfully");
            reset(initialValues);
            navigate("/items");
        },
        onError: (error) => handleProvisionalError(error, "Update Item"),
    });

    const selectedTaxPref = taxPreference; // local state reflects form via handler

    const onSubmit = (data) => {
        // Normalize data before submission
        const normalized = {
            ...data,
            // Convert prices to numbers (0 if empty/invalid)
            sellingPrice: toNumber(data?.sellingPrice),
            costPrice: toNumber(data?.costPrice),
            // Ensure tax values are numbers
            intraTax: selectedTaxPref === "Taxable" ? (typeof data?.intraTax === 'number' ? data.intraTax : Number(data?.intraTax) || DEFAULT_TAX) : DEFAULT_TAX,
            interTax: selectedTaxPref === "Taxable" ? (typeof data?.interTax === 'number' ? data.interTax : Number(data?.interTax) || DEFAULT_TAX) : DEFAULT_TAX,
            // Ensure boolean values
            sellable: Boolean(data?.sellable),
            purchasable: Boolean(data?.purchasable),
        };

        // Remove empty string fields that should be null/undefined
        if (!normalized.hsn) delete normalized.hsn;
        if (!normalized.sac) delete normalized.sac;
        // Prevent sending the Add Vendor sentinel value
        if (!normalized.vendor) delete normalized.vendor;
        if (normalized.vendor === ADD_VENDOR_VALUE) delete normalized.vendor;
        // Prevent sending the Add Account sentinel value for purchaseAccount
        if (normalized.purchaseAccount === ADD_ACCOUNT_VALUE) delete normalized.purchaseAccount;
        if (!normalized.salesDesc) delete normalized.salesDesc;
        if (!normalized.purchaseDesc) delete normalized.purchaseDesc;

        if (isEditing) {
            updateMutation.mutate({ id: editId, normalized });
        } else {
            createMutation.mutate(normalized);
        }
    };

    const isSaving = createMutation.isLoading || updateMutation.isLoading;

    const requiredLabel = (text) => (
        <label style={{ ...labelBase, color: reqColor }}>{text} *</label>
    );

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
                <h4 className="fw-semibold m-0">
                    {/* <i className="fa fa-box me-2" style={{ fontSize: "18px" }}></i> */}
                    New Item
                </h4>
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

                {/* TYPE */}
                <div className="mb-3">
                    <label style={labelBase}>Type</label>
                    <div className="d-flex gap-3 mt-1">
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <label className="d-flex align-items-center gap-1">
                                        <input
                                            type="radio"
                                            value="Goods"
                                            checked={field.value === "Goods"}
                                            onChange={() => field.onChange("Goods")}
                                        />
                                        Goods
                                    </label>

                                    <label className="d-flex align-items-center gap-1">
                                        <input
                                            type="radio"
                                            value="Service"
                                            checked={field.value === "Service"}
                                            onChange={() => field.onChange("Service")}
                                        />
                                        Service
                                    </label>
                                </>
                            )}
                        />
                    </div>
                </div>

                <div className="row g-3">

                    {/* NAME */}
                    <div className="col-md-5">
                        {requiredLabel("Name")}
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    ref={firstInputRef}
                                    className={`form-control form-control-sm ${errors.name ? "is-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.name && <div className="text-danger">{errors.name.message}</div>}
                    </div>

                    {/* UNIT */}
                    <div className="col-md-5">
                        <label style={labelBase}>Unit</label>
                        <Controller
                            name="unit"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <input {...field} list="unitList" className="form-control form-control-sm" />
                                    <datalist id="unitList">
                                        {UNIT_LIST.map((u) => (
                                            <option key={u} value={u} />
                                        ))}
                                    </datalist>
                                </>
                            )}
                        />
                    </div>

                    {/* HSN / SAC */}
                    {itemType === "Goods" ? (
                        <div className="col-md-5">
                            <label style={labelBase}>HSN Code</label>
                            <Controller
                                name="hsn"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>
                    ) : (
                        <div className="col-md-5">
                            <label style={labelBase}>SAC</label>
                            <Controller
                                name="sac"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>
                    )}

                    {/* TAX PREF */}
                    <div className="col-md-5">
                        {requiredLabel("Tax Preference")}
                        <Controller
                            name="taxPref"
                            control={control}
                            rules={{ required: "Tax Preference is required" }}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`form-select form-select-sm ${errors.taxPref ? "is-invalid" : ""}`}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        handleTaxPreferenceChange(e.target.value);
                                    }}
                                >
                                    {TAX_PREF_LIST.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.taxPref && <div className="text-danger">{errors.taxPref.message}</div>}
                    </div>
                </div>

                {/* SALES INFORMATION */}
                <div className="row mt-4 g-4">
                    <div className="col-md-5">

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-semibold">Sales Information</h6>
                            <Controller
                                name="sellable"
                                control={control}
                                render={({ field }) => (
                                    <label className="d-flex gap-1">
                                        <input type="checkbox" {...field} checked={field.value} /> Sellable
                                    </label>
                                )}
                            />
                        </div>

                        {requiredLabel("Selling Price")}
                        <div className="input-group mb-2">
                            <span className="input-group-text py-1 px-2">INR</span>
                            <Controller
                                name="sellingPrice"
                                control={control}
                                rules={{
                                    required: sellable ? "Selling price is required" : false,
                                    validate: (v) => {
                                        if (!sellable) return true;
                                        if (!v || v === "") return "Selling price is required";
                                        const num = Number(v);
                                        return (!isNaN(num) && num >= 0) || "Enter a valid number";
                                    },
                                }}
                                render={({ field }) => (
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        disabled={!sellable}
                                        className={`form-control form-control-sm ${errors.sellingPrice ? "is-invalid" : ""}`}
                                    />
                                )}
                            />
                        </div>
                        {errors.sellingPrice && <div className="text-danger">{errors.sellingPrice.message}</div>}

                        {requiredLabel("Account")}
                        <Controller
                            name="salesAccount"
                            control={control}
                            rules={{ required: sellable ? "Sales account is required" : false }}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    disabled={!sellable}
                                    className={`form-select form-select-sm mb-2 ${errors.salesAccount ? "is-invalid" : ""}`}
                                >
                                    <option value="">Select Sales Account</option>
                                    {SALES_ACCOUNT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.salesAccount && <div className="text-danger">{errors.salesAccount.message}</div>}

                        <label style={labelBase}>Description</label>
                        <Controller
                            name="salesDesc"
                            control={control}
                            render={({ field }) => (
                                <textarea {...field} disabled={!sellable} rows={2} className="form-control form-control-sm" />
                            )}
                        />
                    </div>

                    {/* PURCHASE */}
                    <div className="col-md-5">

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-semibold">Purchase Information</h6>
                            <Controller
                                name="purchasable"
                                control={control}
                                render={({ field }) => (
                                    <label className="d-flex gap-1">
                                        <input type="checkbox" {...field} checked={field.value} /> Purchasable
                                    </label>
                                )}
                            />
                        </div>

                        {requiredLabel("Cost Price")}
                        <div className="input-group mb-2">
                            <span className="input-group-text py-1 px-2">INR</span>
                            <Controller
                                name="costPrice"
                                control={control}
                                rules={{
                                    required: purchasable ? "Cost price is required" : false,
                                    validate: (v) => {
                                        if (!purchasable) return true;
                                        if (!v || v === "") return "Cost price is required";
                                        const num = Number(v);
                                        return (!isNaN(num) && num >= 0) || "Enter a valid number";
                                    },
                                }}
                                render={({ field }) => (
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                        disabled={!purchasable}
                                        className={`form-control form-control-sm ${errors.costPrice ? "is-invalid" : ""}`}
                                    />
                                )}
                            />
                        </div>
                        {errors.costPrice && <div className="text-danger">{errors.costPrice.message}</div>}

                        {requiredLabel("Account")}
                        <Controller
                            name="purchaseAccount"
                            control={control}
                            rules={{ required: purchasable ? "Purchase account is required" : false }}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    disabled={!purchasable}
                                    className={`form-select form-select-sm mb-2 ${errors.purchaseAccount ? "is-invalid" : ""}`}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === ADD_ACCOUNT_VALUE) {
                                            navigate("/accounts/new");
                                            return;
                                        }
                                        field.onChange(value);
                                    }}
                                >
                                    <option value="">Select Purchase Account</option>
                                    {PURCHASE_ACCOUNT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.purchaseAccount && <div className="text-danger">{errors.purchaseAccount.message}</div>}

                        <label style={labelBase}>Description</label>
                        <Controller
                            name="purchaseDesc"
                            control={control}
                            render={({ field }) => (
                                <textarea {...field} disabled={!purchasable} rows={2} className="form-control form-control-sm" />
                            )}
                        />

                        <label style={{ ...labelBase, marginTop: 10 }}>Preferred Vendor</label>
                        <Controller
                            name="vendor"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    disabled={!purchasable}
                                    className="form-select form-select-sm"
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === ADD_VENDOR_VALUE) {
                                            navigate("/newvendor");
                                            return;
                                        }
                                        field.onChange(v);
                                    }}
                                >
                                    <option value="">Select Vendor</option>
                                    {vendorSelectOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>
                </div>

                {/* TAX SECTION (only shown when Tax Preference === Taxable) */}
                {taxPreference === "Taxable" && (
                    <div className="mt-4">
                        <h6 className="fw-semibold">Default Tax Rates</h6>

                        <div className="row g-3 mt-1">

                            {/* Intra Tax */}
                            <div className="col-md-5">
                                {requiredLabel("Intra State Tax Rate")}
                                <Controller
                                    name="intraTax"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className="form-select form-select-sm">
                                            {TAX_OPTIONS.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>

                            {/* Inter Tax */}
                            <div className="col-md-5">
                                {requiredLabel("Inter State Tax Rate")}
                                <Controller
                                    name="interTax"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className="form-select form-select-sm">
                                            {INTER_TAX_OPTIONS.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* BUTTONS */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn btn-light border btn-sm px-4"
                        onClick={() => navigate("/items")}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                </div>

            </form>
        </div>
    );
};

export default NewItem;
