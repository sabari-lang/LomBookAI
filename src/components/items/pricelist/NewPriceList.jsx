import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const NewPriceList = () => {
    const { state } = useLocation();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        defaultValues: {
            name: "",
            transactionType: "Sales",
            priceListType: "All Items",
            description: "",
            percentageType: "Markup",
            percentageValue: "",
            roundOff: "Never mind",
            pricingScheme: "Unit", // ← new
        },
    });

    const [selectedType, setSelectedType] = useState("All Items");

    const editId = state?.id;

    // 🔁 Dynamic form value logic (edit mode / deep-link state)
    useEffect(() => {
        if (!editId) return;
        reset({
            name: state.name ?? "",
            transactionType: state.transactionType ?? "Sales",
            priceListType: state.priceListType ?? "All Items",
            description: state.description ?? "",
            percentageType: state.percentageType ?? "Markup",
            percentageValue: state.percentageValue ?? "",
            roundOff: state.roundOff ?? "Never mind",
            pricingScheme: state.pricingScheme ?? "Unit",
        });
        setSelectedType((state?.priceListType) ?? "All Items");
    }, [editId]);

    // Keep RHF value updated when the card is clicked
    useEffect(() => {
        setValue("priceListType", selectedType, { shouldDirty: true });
    }, [selectedType, setValue]);

    const priceListType = watch("priceListType");

    const onSubmit = (data) => {
        console.log("Form Submitted:", data);
        alert("Price List Saved Successfully!");
    };

    return (
        <div className="container-fluid py-4" style={{ fontSize: "0.9rem" }}>
            <div className="border rounded shadow-sm bg-white p-4 mx-auto">
                <h5 className="fw-semibold mb-4">New Price List</h5>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Name */}
                    <div className="mb-3 row align-items-center">
                        <label className="col-sm-3 col-form-label fw-semibold">
                            Name<span className="text-danger">*</span>
                        </label>
                        <div className="col-sm-9">
                            <input
                                type="text"
                                className={`form-control form-control-sm ${errors.name ? "is-invalid" : ""
                                    }`}
                                {...register("name", { required: true })}
                            />
                            {errors.name && <div className="invalid-feedback">Name is required</div>}
                        </div>
                    </div>

                    {/* Transaction Type */}
                    <div className="mb-3 row">
                        <label className="col-sm-3 col-form-label fw-semibold">
                            Transaction Type
                        </label>
                        <div className="col-sm-9 d-flex gap-4 align-items-center">
                            <div className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    value="Sales"
                                    {...register("transactionType")}
                                    defaultChecked
                                />
                                <label className="form-check-label">Sales</label>
                            </div>
                            <div className="form-check">
                                <input
                                    type="radio"
                                    className="form-check-input"
                                    value="Purchase"
                                    {...register("transactionType")}
                                />
                                <label className="form-check-label">Purchase</label>
                            </div>
                        </div>
                    </div>

                    {/* Price List Type */}
                    <div className="mb-3 row">
                        <label className="col-sm-3 col-form-label fw-semibold">
                            Price List Type
                        </label>
                        <div className="col-sm-9 d-flex gap-3">
                            <div
                                className={`flex-fill border rounded p-3 ${selectedType === "All Items" ? "border-primary bg-light" : ""
                                    }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setSelectedType("All Items")}
                            >
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input me-2"
                                        value="All Items"
                                        {...register("priceListType")}
                                        checked={selectedType === "All Items"}
                                        onChange={() => setSelectedType("All Items")}
                                    />
                                    <label className="form-check-label fw-semibold">All Items</label>
                                </div>
                                <small className="text-muted">
                                    Mark up or mark down the rates of all items
                                </small>
                            </div>

                            <div
                                className={`flex-fill border rounded p-3 ${selectedType === "Individual Items" ? "border-primary bg-light" : ""
                                    }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setSelectedType("Individual Items")}
                            >
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input me-2"
                                        value="Individual Items"
                                        {...register("priceListType")}
                                        checked={selectedType === "Individual Items"}
                                        onChange={() => setSelectedType("Individual Items")}
                                    />
                                    <label className="form-check-label fw-semibold">
                                        Individual Items
                                    </label>
                                </div>
                                <small className="text-muted">
                                    Customize the rate of each item
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-3 row">
                        <label className="col-sm-3 col-form-label fw-semibold">Description</label>
                        <div className="col-sm-9">
                            <textarea
                                className="form-control form-control-sm"
                                rows={2}
                                placeholder="Enter the description"
                                {...register("description")}
                            />
                        </div>
                    </div>

                    {/* Percentage */}
                    <div className="mb-3 row align-items-center">
                        <label className="col-sm-3 col-form-label fw-semibold">
                            Percentage<span className="text-danger">*</span>
                        </label>
                        <div className="col-sm-9 d-flex align-items-center gap-2">
                            <select
                                className="form-select form-select-sm w-auto"
                                {...register("percentageType")}
                            >
                                <option>Markup</option>
                                <option>Markdown</option>
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                className={`form-control form-control-sm w-25 ${errors.percentageValue ? "is-invalid" : ""
                                    }`}
                                {...register("percentageValue", { required: true })}
                            />
                            <span className="fw-semibold">%</span>
                            {errors.percentageValue && (
                                <div className="invalid-feedback d-block">Required</div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Pricing Scheme (only for Individual Items) */}
                    {priceListType === "Individual Items" && (
                        <div className="mb-3 row">
                            <label className="col-sm-3 col-form-label fw-semibold">
                                Pricing Scheme
                            </label>
                            <div className="col-sm-9 d-flex gap-3">
                                <label className="border rounded p-3 d-flex align-items-center gap-2">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        value="Unit"
                                        {...register("pricingScheme")}
                                        defaultChecked
                                    />
                                    <span className="fw-semibold">Unit Pricing</span>
                                </label>
                                <label className="border rounded p-3 d-flex align-items-center gap-2">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        value="Volume"
                                        {...register("pricingScheme")}
                                    />
                                    <span className="fw-semibold">Volume Pricing</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Round Off */}
                    <div className="mb-2 row align-items-center">
                        <label className="col-sm-3 col-form-label fw-semibold">Round Off To</label>
                        <div className="col-sm-9">
                            <select className="form-select form-select-sm w-50" {...register("roundOff")}>
                                <option>Never mind</option>
                                <option>0.01</option>
                                <option>0.05</option>
                                <option>0.10</option>
                                <option>1.00</option>
                            </select>
                          
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="submit" className="btn btn-primary btn-sm px-3">
                            Save
                        </button>
                        <button type="button" className="btn btn-outline-secondary btn-sm px-3">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewPriceList;
