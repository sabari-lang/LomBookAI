import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { refreshKeyboard } from "../../../utils/refreshKeyboard";
import { useAppBack } from "../../../hooks/useAppBack";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

const NewCompositeItems = () => {
    const { goBack } = useAppBack();
    const { state } = useLocation(); // <-- edit mode data (optional)
    const [manufacturers, setManufacturers] = useState(["Manufacturer A", "Manufacturer B"]);
    const [brands, setBrands] = useState(["Brand X", "Brand Y"]);
    const [newManufacturer, setNewManufacturer] = useState("");
    const [newBrand, setNewBrand] = useState("");
    const [showNewManufacturer, setShowNewManufacturer] = useState(false);
    const [showNewBrand, setShowNewBrand] = useState(false);
    const {
        control,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            itemType: "Assembly",
            compositeItemImages: [],
            sku: "",
            unit: "",
            returnable: true,

            preferredVendor: "",
            dimensionsLength: "",
            dimensionsWidth: "",
            dimensionsHeight: "",
            dimensionUnit: "cm",
            weight: "",
            weightUnit: "kg",
            manufacturer: "",
            brand: "",
            upc: "",
            ean: "",
            mpn: "",
            isbn: "",

            associateItems: [{ item: "", quantity: 1, sellingPrice: 0, costPrice: 0 }],
            associateServices: [{ item: "", quantity: 1, sellingPrice: 0, costPrice: 0 }],

            sellable: true,
            purchasable: true,
            salesPrice: "",
            salesAccount: "Sales",
            salesDescription: "",
            costPrice: "",
            purchaseAccount: "Cost of Goods Sold",
            purchaseDescription: "",

            inventoryAccount: "",
            valuationMethod: "",
            openingStock: "",
            stockRate: "",
            reorderPoint: "",
        },
    });
    // existing items rows
    const {
        fields: itemFields,
        append: addItemRow,
        remove: removeItemRow,
    } = useFieldArray({
        control,
        name: "associateItems",
    });

    // NEW: services rows
    const {
        fields: serviceFields,
        append: addServiceRow,
        remove: removeServiceRow,
    } = useFieldArray({
        control,
        name: "associateServices",
    });

    // conditional sections
    const sellable = watch("sellable");
    const purchasable = watch("purchasable");

    const editId = state?.id;
    const isEditing = Boolean(editId);

    // --- Edit Mode: prefill all values safely
    useEffect(() => {
        if (!editId) return;
        reset({
            ...state,
            associateItems:
                Array.isArray(state?.associateItems) && state.associateItems.length
                    ? state.associateItems
                    : [{ item: "", quantity: 1, sellingPrice: 0, costPrice: 0 }],
            associateServices:
                Array.isArray(state?.associateServices) && state.associateServices.length
                    ? state.associateServices
                    : [{ item: "", quantity: 1, sellingPrice: 0, costPrice: 0 }],
            sellable: state?.sellable ?? true,
            purchasable: state?.purchasable ?? true,
        });
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
    }, [editId]);



    const handleAddManufacturer = () => {
        if (newManufacturer.trim() !== "") {
            setManufacturers((prev) => [...prev, newManufacturer.trim()]);
            setValue("manufacturer", newManufacturer.trim());
            setNewManufacturer("");
            setShowNewManufacturer(false);
        }
    };

    const handleAddBrand = () => {
        if (newBrand.trim() !== "") {
            setBrands((prev) => [...prev, newBrand.trim()]);
            setValue("brand", newBrand.trim());
            setNewBrand("");
            setShowNewBrand(false);
        }
    };
    const onSubmit = (data) => {
        console.log("Composite Item Form:", data);
        notifySuccess(state ? "Composite Item Updated ✅" : "Composite Item Saved ✅");
    };

    return (
        <div className="container-fluid bg-white p-4" style={{ fontSize: "0.9rem" }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <h6 className="fw-bold mb-4">
                    {state ? "Edit Composite Item" : "New Composite Item"}
                </h6>

                {/* ===== Basic Info ===== */}
                <div className="row g-4">
                    <div className="col-md-8">
                        {/* Name */}
                        <div className="mb-2">
                            <label className="form-label text-danger fw-semibold">Name*</label>
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: "Name is required" }}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className={`form-control form-control-sm ${errors.name ? "is-invalid" : ""
                                            }`}
                                    />
                                )}
                            />
                            {errors.name && (
                                <div className="invalid-feedback">{errors.name.message}</div>
                            )}
                        </div>

                        {/* Item Type */}
                        <div className="mb-3">
                            <label className="form-label text-danger fw-semibold">
                                Item Type*
                            </label>
                            <Controller
                                name="itemType"
                                control={control}
                                render={({ field }) => (
                                    <div className="d-flex flex-column gap-1">
                                        <label>
                                            <input
                                                type="radio"
                                                value="Assembly"
                                                checked={field.value === "Assembly"}
                                                onChange={() => field.onChange("Assembly")}
                                            />{" "}
                                            <strong>Assembly Item</strong>
                                            <p className="text-muted small mb-0">
                                                A group of items combined together to be tracked and
                                                managed as a single item.
                                            </p>
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                value="Kit"
                                                checked={field.value === "Kit"}
                                                onChange={() => field.onChange("Kit")}
                                            />{" "}
                                            <strong>Kit Item</strong>
                                            <p className="text-muted small mb-0">
                                                Individual items sold together as one kit.
                                            </p>
                                        </label>
                                    </div>
                                )}
                            />
                        </div>

                        {/* SKU + Unit */}
                        <div className="row mb-2">
                            <div className="col-md-6">
                                <label className="form-label">SKU</label>
                                <Controller
                                    name="sku"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            className="form-control form-control-sm"
                                        />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label text-danger">Unit*</label>
                                <Controller
                                    name="unit"
                                    control={control}
                                    rules={{ required: "Unit is required" }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className={`form-select form-select-sm ${errors.unit ? "is-invalid" : ""
                                                }`}
                                        >
                                            <option value="">Select unit</option>
                                            <option value="Nos">Nos</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Box">Box</option>
                                        </select>
                                    )}
                                />
                                {errors.unit && (
                                    <div className="invalid-feedback">{errors.unit.message}</div>
                                )}
                            </div>
                        </div>

                        {/* Returnable */}
                        <div className="form-check mb-4">
                            <Controller
                                name="returnable"
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
                                Returnable Item{" "}
                                <i className="bi bi-question-circle text-muted"></i>
                            </label>
                        </div>
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
                                Up to 15 images, 5 MB each, 7000×7000px max.
                            </p>
                        </div>
                    </div>
                </div>

                <hr />

                {/* ===== Associate Items ===== */}
                <h6 className="text-danger fw-semibold mb-2">Associate Items*</h6>
                <div className="table-responsive mb-3">
                    <table className="table table-bordered table-sm align-middle">
                        <thead className="table-light">
                            <tr className="text-muted small">
                                <th>Item Details</th>
                                <th>Quantity</th>
                                <th>Selling Price</th>
                                <th>Cost Price</th>
                                <th className="text-center" style={{ width: "5%" }}>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemFields.map((field, index) => (
                                <tr key={field.id}>
                                    <td>
                                        <Controller
                                            name={`associateItems.${index}.item`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className="form-control form-control-sm"
                                                    placeholder="Click to select an item"
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            name={`associateItems.${index}.quantity`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            name={`associateItems.${index}.sellingPrice`}
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
                                            name={`associateItems.${index}.costPrice`}
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
                                    <td className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link text-danger p-0"
                                            onClick={() => removeItemRow(index)}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="d-flex gap-2 mb-4">
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                            addItemRow({
                                item: "",
                                quantity: 1,
                                sellingPrice: 0,
                                costPrice: 0,
                            })
                        }
                    >
                        <i className="bi bi-plus"></i> Add New Row
                    </button>
                </div>

                {/* ===== Associate Services (NEW) ===== */}
                <h6 className="text-danger fw-semibold mb-2">Associate Services*</h6>
                <div className="table-responsive mb-3">
                    <table className="table table-bordered table-sm align-middle">
                        <thead className="table-light">
                            <tr className="text-muted small">
                                <th>Service Details</th>
                                <th>Quantity</th>
                                <th>Selling Price</th>
                                <th>Cost Price</th>
                                <th className="text-center" style={{ width: "5%" }}>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceFields.map((field, index) => (
                                <tr key={field.id}>
                                    <td>
                                        <Controller
                                            name={`associateServices.${index}.item`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className="form-control form-control-sm"
                                                    placeholder="Click to select an item"
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            name={`associateServices.${index}.quantity`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                />
                                            )}
                                        />
                                    </td>
                                    <td>
                                        <Controller
                                            name={`associateServices.${index}.sellingPrice`}
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
                                            name={`associateServices.${index}.costPrice`}
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
                                    <td className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link text-danger p-0"
                                            onClick={() => removeServiceRow(index)}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary btn-sm mb-4"
                    onClick={() =>
                        addServiceRow({
                            item: "",
                            quantity: 1,
                            sellingPrice: 0,
                            costPrice: 0,
                        })
                    }
                >
                    <i className="bi bi-plus"></i> Add New Row
                </button>

                <hr />

                {/* ===== Sales & Purchase Info ===== */}
                <div className="row g-4 mb-4">
                    {/* Sales */}
                    <div className="col-md-6">
                        <h6 className="fw-semibold">Sales Information</h6>

                        <div className="form-check mb-2">
                            <Controller
                                name="sellable"
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
                                Sellable
                            </label>
                        </div>

                        {sellable && (
                            <>
                                <label className="form-label small text-danger">
                                    Selling Price (INR)*
                                </label>
                                <div className="input-group mb-3">
                                    <Controller
                                        name="salesPrice"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="number"
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => {
                                            // sum of all selling costs (items + services)
                                            const items = watch("associateItems") || [];
                                            const services = watch("associateServices") || [];
                                            const total =
                                                [...items, ...services].reduce(
                                                    (acc, r) =>
                                                        acc + (Number(r?.sellingPrice || 0) * Number(r?.quantity || 0)),
                                                    0
                                                ) || 0;
                                            setValue("salesPrice", Number(total).toFixed(2));
                                        }}
                                    >
                                        Copy from total
                                    </button>
                                </div>

                                <label className="form-label small text-danger">Account*</label>
                                <Controller
                                    name="salesAccount"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="form-select form-select-sm mb-2"
                                        >
                                            <option>Sales</option>
                                            <option>Revenue</option>
                                        </select>
                                    )}
                                />

                                <Controller
                                    name="salesDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            className="form-control form-control-sm"
                                            placeholder="Description"
                                            rows="2"
                                        ></textarea>
                                    )}
                                />
                            </>
                        )}
                    </div>

                    {/* Purchase */}
                    {/* ===== Purchase Information ===== */}
                    <div className="col-md-6">
                        <h6 className="fw-semibold">Purchase Information</h6>

                        {/* Purchasable checkbox */}
                        <div className="form-check mb-2">
                            <Controller
                                name="purchasable"
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
                                Purchasable
                            </label>
                        </div>

                        {purchasable && (
                            <>
                                {/* Cost Price */}
                                <label className="form-label small text-danger">
                                    Cost Price (INR)*
                                </label>
                                <div className="input-group mb-3">
                                    <Controller
                                        name="costPrice"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="number"
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => {
                                            const items = watch("associateItems") || [];
                                            const services = watch("associateServices") || [];
                                            const total =
                                                [...items, ...services].reduce(
                                                    (acc, r) =>
                                                        acc + (Number(r?.costPrice || 0) * Number(r?.quantity || 0)),
                                                    0
                                                ) || 0;
                                            setValue("costPrice", Number(total).toFixed(2));
                                        }}
                                    >
                                        Copy from total
                                    </button>
                                </div>

                                {/* Purchase Account */}
                                <label className="form-label small text-danger">Account*</label>
                                <Controller
                                    name="purchaseAccount"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="form-select form-select-sm mb-2"
                                        >
                                            <option>Cost of Goods Sold</option>
                                            <option>Purchases</option>
                                        </select>
                                    )}
                                />

                                {/* Description */}
                                <Controller
                                    name="purchaseDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            className="form-control form-control-sm mb-3"
                                            placeholder="Description"
                                            rows="2"
                                        ></textarea>
                                    )}
                                />

                                {/* ✅ Preferred Vendor (added below Description) */}
                                <label className="form-label small fw-semibold">
                                    Preferred Vendor
                                </label>
                                <Controller
                                    name="preferredVendor"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className="form-select form-select-sm">
                                            <option value="">Select Vendor</option>
                                            <option value="Vendor A">Vendor A</option>
                                            <option value="Vendor B">Vendor B</option>
                                        </select>
                                    )}
                                />
                            </>
                        )}
                    </div>

                </div>


                <hr />



                <div className="row g-3 mt-1">
                    <div className="col-md-8">
                        <label className="form-label small fw-semibold">Dimensions</label>
                        <div className="d-flex align-items-center gap-2">
                            <Controller
                                name="dimensionsLength"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} placeholder="L" className="form-control form-control-sm" />
                                )}
                            />
                            <span>x</span>
                            <Controller
                                name="dimensionsWidth"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} placeholder="W" className="form-control form-control-sm" />
                                )}
                            />
                            <span>x</span>
                            <Controller
                                name="dimensionsHeight"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} placeholder="H" className="form-control form-control-sm" />
                                )}
                            />
                            <Controller
                                name="dimensionUnit"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="form-select form-select-sm" style={{ width: "70px" }}>
                                        <option value="cm">cm</option>
                                        <option value="m">m</option>
                                        <option value="in">in</option>
                                    </select>
                                )}
                            />
                        </div>
                        <small className="text-muted">(Length × Width × Height)</small>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Weight</label>
                        <div className="input-group input-group-sm">
                            <Controller
                                name="weight"
                                control={control}
                                render={({ field }) => <input {...field} className="form-control" />}
                            />
                            <Controller
                                name="weightUnit"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="form-select" style={{ width: "70px" }}>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="lb">lb</option>
                                    </select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="row g-3 mt-1">
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Manufacturer</label>
                        {showNewManufacturer ? (
                            <div className="d-flex gap-2">
                                <input
                                    value={newManufacturer}
                                    onChange={(e) => setNewManufacturer(e.target.value)}
                                    className="form-control form-control-sm"
                                    placeholder="Enter new manufacturer"
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={handleAddManufacturer}
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm border"
                                    onClick={() => setShowNewManufacturer(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="input-group input-group-sm">
                                <Controller
                                    name="manufacturer"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className="form-select">
                                            <option value="">Select Manufacturer</option>
                                            {manufacturers.map((m, i) => (
                                                <option key={i}>{m}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => setShowNewManufacturer(true)}
                                >
                                    + Add
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">Brand</label>
                        {showNewBrand ? (
                            <div className="d-flex gap-2">
                                <input
                                    value={newBrand}
                                    onChange={(e) => setNewBrand(e.target.value)}
                                    className="form-control form-control-sm"
                                    placeholder="Enter new brand"
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={handleAddBrand}
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm border"
                                    onClick={() => setShowNewBrand(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="input-group input-group-sm">
                                <Controller
                                    name="brand"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className="form-select">
                                            <option value="">Select Brand</option>
                                            {brands.map((b, i) => (
                                                <option key={i}>{b}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => setShowNewBrand(true)}
                                >
                                    + Add
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">UPC</label>
                        <Controller
                            name="upc"
                            control={control}
                            render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">EAN</label>
                        <Controller
                            name="ean"
                            control={control}
                            render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">MPN</label>
                        <Controller
                            name="mpn"
                            control={control}
                            render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small fw-semibold">ISBN</label>
                        <Controller
                            name="isbn"
                            control={control}
                            render={({ field }) => <input {...field} className="form-control form-control-sm" />}
                        />
                    </div>
                </div>

                <hr />

                {/* ===== Additional / Inventory Info ===== */}
                <div className="row g-4 mb-4">
                    <div className="col-md-6">
                        <label className="form-label text-danger small">
                            Inventory Account*
                        </label>
                        <Controller
                            name="inventoryAccount"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm">
                                    <option value="">Select an account</option>
                                    <option value="Inventory">Inventory</option>
                                </select>
                            )}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-danger small">
                            Inventory Valuation Method*
                        </label>
                        <Controller
                            name="valuationMethod"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm">
                                    <option value="">Select method</option>
                                    <option value="FIFO">FIFO</option>
                                    <option value="LIFO">LIFO</option>
                                </select>
                            )}
                        />
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-md-3">
                        <label className="form-label small">Opening Stock</label>
                        <Controller
                            name="openingStock"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Opening Stock Rate per Unit</label>
                        <Controller
                            name="stockRate"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Reorder Point</label>
                        <Controller
                            name="reorderPoint"
                            control={control}
                            render={({ field }) => (
                                <input {...field} className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                <hr />

                {/* ===== Buttons ===== */}
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

export default NewCompositeItems;
