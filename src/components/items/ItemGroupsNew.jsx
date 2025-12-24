import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";

import { useAppBack } from "../../hooks/useAppBack";
import { notifySuccess, notifyError, notifyInfo } from "../../utils/notifications";

const ItemGroupsNew = () => {
    // Report filter/create-only form - always unlock on mount
    
    const { goBack } = useAppBack();

    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            // ✅ Replaced / merged with Tally fields
            type: "Goods",
            groupName: "TV", // replaces itemGroupName
            alias: "Tv_sub_modules",
            description: "",
            returnableItem: true,
            unit: "Nos",
            manufacturer: "",
            brand: "",
            inventoryValuationMethod: "FIFO (First In First Out)",
            multipleItems: false,
            createAttributesAndOptions: false,
            attributes: [{ attribute: "", options: [""] }],
            sellable: true,
            purchasable: true,
            trackInventory: true,
            items: [],

            // ✅ New / Additional Tally Fields
            company: "LOM TECHNOLOGIES INDIA PRIVATE LIMITED",
            under: "Primary",
            shouldQuantitiesBeAdded: true,

            hsnSacDetails: "As per Company/Stock Group",
            hsnSourceOfDetails: "Not Available",
            hsnCode: null,
            hsnDescription: null,

            gstRateDetails: "As per Company/Stock Group",
            gstSourceOfDetails: "Not Available",
            taxabilityType: null,
            gstRatePercent: 0,
        },
    });

    const { fields: attrFields, append: addAttr, remove: removeAttr } = useFieldArray({
        control,
        name: "attributes",
    });

    const { fields: itemFields, replace: replaceItems } = useFieldArray({
        control,
        name: "items",
    });

    const multipleItems = watch("multipleItems");
    const createAttributesAndOptions = watch("createAttributesAndOptions");
    const attributes = watch("attributes");
    const groupName = watch("groupName");

    // 🔹 Generate combinations dynamically
    useEffect(() => {
        if (!createAttributesAndOptions) return;
        const validAttrs = attributes.filter(
            (attr) => attr.attribute && attr.options.some((opt) => opt.trim() !== "")
        );
        if (validAttrs.length === 0) {
            replaceItems([]);
            return;
        }

        const combinations = validAttrs.reduce((acc, attr) => {
            const opts = attr.options.filter((opt) => opt.trim() !== "");
            if (acc.length === 0) return opts.map((opt) => [opt]);
            return acc.flatMap((a) => opts.map((opt) => [...a, opt]));
        }, []);

        const newItems = combinations.map((combo, idx) => ({
            itemName: `${groupName ? groupName + " - " : ""}${combo.join(" / ")}`,
            sku: `SKU-${String(idx + 1).padStart(3, "0")}`,
            costPrice: 0,
            sellingPrice: 0,
            upc: "",
            ean: "",
            isbn: "",
            reorderPoint: "",
            salesAccount: "Sales",
            purchaseAccount: "Cost of Goods Sold",
            inventoryAccount: "Inventory Asset",
        }));

        replaceItems(newItems);
    }, [attributes, createAttributesAndOptions, groupName, replaceItems]);

    // 🔹 Copy-to-all helpers
    const handleCopyToAll = (fieldName) => {
        const items = watch("items");
        if (!items?.length) return;
        const firstValue = items[0][fieldName];
        const updatedItems = items.map((item) => ({ ...item, [fieldName]: firstValue }));
        setValue("items", updatedItems);
    };

    const onSubmit = (data) => {
        console.log("✅ Final Item Group:", data);
        notifySuccess("Item Group saved successfully!");
    };

    return (
        <div className="container-fluid bg-white p-4" style={{ fontSize: "0.9rem" }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <h5 className="fw-bold mb-4">New Item Group</h5>

                {/* ===== Top Section ===== */}
                <div className="row g-4">
                    <div className="col-md-8">
                        {/* Type */}
                        <div className="mb-2">
                            <label className="form-label small text-danger fw-semibold">Type*</label>
                            <div className="d-flex gap-3">
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            <label>
                                                <input
                                                    type="radio"
                                                    value="Goods"
                                                    checked={field.value === "Goods"}
                                                    onChange={() => field.onChange("Goods")}
                                                />{" "}
                                                Goods
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    value="Service"
                                                    checked={field.value === "Service"}
                                                    onChange={() => field.onChange("Service")}
                                                />{" "}
                                                Service
                                            </label>
                                        </>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Group Name */}
                        <label className="form-label small text-danger fw-semibold">Group Name*</label>
                        <Controller
                            name="groupName"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm mb-2" />
                            )}
                        />

                        {/* Alias */}
                        <label className="form-label small fw-semibold">Alias</label>
                        <Controller
                            name="alias"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm mb-2" />
                            )}
                        />

                        {/* Under */}
                        <label className="form-label small fw-semibold">Under*</label>
                        <Controller
                            name="under"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm mb-3">
                                    <option value="Primary">Primary</option>
                                    <option value="Sub Group">Sub Group</option>
                                </select>
                            )}
                        />

                        {/* Should Quantities Be Added */}
                        <div className="form-check mb-3">
                            <Controller
                                name="shouldQuantitiesBeAdded"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        {...field}
                                        checked={field.value}
                                        className="form-check-input"
                                    />
                                )}
                            />
                            <label className="form-check-label small fw-semibold">
                                Should Quantities Be Added
                            </label>
                        </div>

                        {/* Description */}
                        <label className="form-label small fw-semibold">Description</label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <textarea {...field} className="form-control form-control-sm mb-3" rows={2} />
                            )}
                        />

                        {/* Company */}
                        <label className="form-label small fw-semibold">Company*</label>
                        <Controller
                            name="company"
                            control={control}
                            render={({ field }) => (
                                <input {...field} readOnly className="form-control form-control-sm mb-3" />
                            )}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="col-md-4">
                        <div
                            className="border rounded text-center p-3"
                            style={{
                                borderStyle: "dashed",
                                minHeight: "160px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <i className="bi bi-image mb-2 fs-4 text-muted"></i>
                            <p className="small text-muted mb-0">
                                Drag image(s) here or <a href="#">Browse images</a>
                            </p>
                            <p className="text-muted small mb-0">
                                You can add up to 15 images, each not exceeding 5 MB and 7000×7000px.
                            </p>
                        </div>
                    </div>
                </div>

                <hr />

                {/* ===== HSN / GST Section ===== */}
                <h6 className="fw-bold text-success mb-3">HSN / GST Details</h6>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">HSN/SAC Details</label>
                        <Controller
                            name="hsnSacDetails"
                            control={control}
                            render={({ field }) => (
                                <input {...field} readOnly className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">HSN Source of Details</label>
                        <Controller
                            name="hsnSourceOfDetails"
                            control={control}
                            render={({ field }) => (
                                <input {...field} readOnly className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">HSN Code</label>
                        <Controller
                            name="hsnCode"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">HSN Description</label>
                        <Controller
                            name="hsnDescription"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">GST Rate Details</label>
                        <Controller
                            name="gstRateDetails"
                            control={control}
                            render={({ field }) => (
                                <input {...field} readOnly className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">GST Source of Details</label>
                        <Controller
                            name="gstSourceOfDetails"
                            control={control}
                            render={({ field }) => (
                                <input {...field} readOnly className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Taxability Type</label>
                        <Controller
                            name="taxabilityType"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">GST Rate (%)</label>
                        <Controller
                            name="gstRatePercent"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="number" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                <hr />
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="submit" className="btn btn-primary btn-sm px-4">
                        Save
                    </button>
                    <button
                        type="button"
                        className="btn btn-light border btn-sm px-4"
                        onClick={() => goBack()}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ItemGroupsNew;
