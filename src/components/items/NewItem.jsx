import React, { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createItem, updateItem } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";

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

const initialValues = {
    type: "Goods",
    name: "",
    unit: "",
    hsn: "",
    sac: "",
    taxPref: "Taxable",

    sellable: true,
    sellingPrice: "",
    salesAccount: "Sales",
    salesDesc: "",

    purchasable: true,
    costPrice: "",
    purchaseAccount: "Cost of Goods Sold",
    purchaseDesc: "",

    vendor: "",

    intraTax: 18, // Default to 18% (GST18)
    interTax: 18, // Default to 18% (IGST18)
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
        if (!isEditing) return;

        // Normalize tax values - ensure they are numbers
        const intraTaxValue = editSource?.intraTax != null 
            ? (typeof editSource.intraTax === 'number' ? editSource.intraTax : Number(editSource.intraTax) || 18)
            : 18;
        const interTaxValue = editSource?.interTax != null
            ? (typeof editSource.interTax === 'number' ? editSource.interTax : Number(editSource.interTax) || 18)
            : 18;

        reset({
            ...initialValues,
            ...editSource,
            sellable: Boolean(editSource?.sellable),
            purchasable: Boolean(editSource?.purchasable),
            sellingPrice: editSource?.sellingPrice ?? "",
            costPrice: editSource?.costPrice ?? "",
            intraTax: intraTaxValue,
            interTax: interTaxValue,
        });
    }, [isEditing, editSource, reset]);

    const sellable = useWatch({ control, name: "sellable" });
    const purchasable = useWatch({ control, name: "purchasable" });
    const itemType = useWatch({ control, name: "type" });

    // Auto-clear opposite fields when switching Goods ⇄ Service
    useEffect(() => {
        if (itemType === "Goods") {
            setValue("sac", "");
        } else {
            setValue("hsn", "");
        }
    }, [itemType, setValue]);

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

    const onSubmit = (data) => {
        // Normalize data before submission
        const normalized = {
            ...data,
            // Convert prices to numbers (0 if empty/invalid)
            sellingPrice: toNumber(data?.sellingPrice),
            costPrice: toNumber(data?.costPrice),
            // Ensure tax values are numbers
            intraTax: typeof data?.intraTax === 'number' ? data.intraTax : Number(data?.intraTax) || 18,
            interTax: typeof data?.interTax === 'number' ? data.interTax : Number(data?.interTax) || 18,
            // Ensure boolean values
            sellable: Boolean(data?.sellable),
            purchasable: Boolean(data?.purchasable),
        };

        // Remove empty string fields that should be null/undefined
        if (!normalized.hsn) delete normalized.hsn;
        if (!normalized.sac) delete normalized.sac;
        if (!normalized.vendor) delete normalized.vendor;
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
                                    <option>Sales</option>
                                    <option>Service Revenue</option>
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
                                >
                                    <option>Cost of Goods Sold</option>
                                    <option>Purchase Expense</option>
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
                                <input {...field} disabled={!purchasable} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                {/* TAX SECTION */}
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
