import React, { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";



const NewPurchaseReceives = () => {
    // Create-only form - always unlock on mount
    
    const { control, handleSubmit } = useForm({
        defaultValues: {
            vendorName: "",
            purchaseOrder: "PO-00001",
            purchaseReceiveNo: "",
            receivedDate: new Date().toISOString().split("T")[0],
            items: [
                {
                    description: "Hp-Laptop",
                    note: "office use",
                    ordered: 1,
                    received: 0,
                    inTransit: 0,
                    quantityToReceive: 1,
                },
            ],
            notes: "",
            files: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
        setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // limit 5
    };

    const onSubmit = (data) => {
        console.log("Purchase Receive Data:", data);
    };

    return (
        <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
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
                <h5 className="fw-semibold m-0 d-flex align-items-center gap-2"><i className="bi bi-arrow-return-left me-1"></i> New Purchase Receive</h5>

                <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate('/purchasereceives')}>
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Vendor and PO Section */}
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-semibold text-danger">
                            Vendor Name*
                        </label>
                        <Controller
                            name="vendorName"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm">
                                    <option value="">Select Vendor</option>
                                    <option value="IT">IT</option>
                                    <option value="Office Supplies">Office Supplies</option>
                                </select>
                            )}
                        />
                    </div>

                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-semibold text-danger">
                            Purchase Order#*
                        </label>
                        <Controller
                            name="purchaseOrder"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm">
                                    <option value="PO-00001">PO-00001</option>
                                    <option value="PO-00002">PO-00002</option>
                                </select>
                            )}
                        />
                    </div>
                </div>

                {/* Purchase Receive Info */}
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-semibold text-danger">
                            Purchase Receive#*
                        </label>
                        <Controller
                            name="purchaseReceiveNo"
                            control={control}
                            render={({ field }) => (
                                <div className="input-group input-group-sm">
                                    <input
                                        {...field}
                                        className="form-control"
                                        placeholder="Auto-generate"
                                    />
                                    <span className="input-group-text">
                                        <i className="bi bi-gear"></i>
                                    </span>
                                </div>
                            )}
                        />
                    </div>

                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-semibold text-danger">
                            Received Date*
                        </label>
                        <Controller
                            name="receivedDate"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="date" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                {/* Info Note */}
                <div className="alert alert-warning py-2 small" role="alert">
                    <i className="bi bi-info-circle"></i> You can also select or scan the
                    items to be included from the purchase order.{" "}
                    <a href="#" className="text-primary">
                        Select
                    </a>{" "}
                    or{" "}
                    <a href="#" className="text-primary">
                        Scan items
                    </a>
                </div>

                {/* Items Table */}
                <div className="table-responsive mb-3">
                    <table className="table table-bordered align-middle small">
                        <thead className="table-light text-center">
                            <tr>
                                <th>ITEMS & DESCRIPTION</th>
                                <th>ORDERED</th>
                                <th>RECEIVED</th>
                                <th>IN TRANSIT</th>
                                <th>QUANTITY TO RECEIVE</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map((item, index) => (
                                <tr key={item.id}>
                                    <td>
                                        <Controller
                                            name={`items.${index}.description`}
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <input
                                                        {...field}
                                                        className="form-control form-control-sm mb-1"
                                                        readOnly
                                                    />
                                                    <Controller
                                                        name={`items.${index}.note`}
                                                        control={control}
                                                        render={({ field: noteField }) => (
                                                            <small className="text-muted">{noteField.value}</small>
                                                        )}
                                                    />
                                                </>
                                            )}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Controller
                                            name={`items.${index}.ordered`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className="form-control form-control-sm text-center bg-light"
                                                    readOnly
                                                />
                                            )}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Controller
                                            name={`items.${index}.received`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className="form-control form-control-sm text-center bg-light"
                                                    readOnly
                                                />
                                            )}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Controller
                                            name={`items.${index}.inTransit`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className="form-control form-control-sm text-center bg-light"
                                                    readOnly
                                                />
                                            )}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Controller
                                            name={`items.${index}.quantityToReceive`}
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="number"
                                                    min="0"
                                                    className="form-control form-control-sm text-center"
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
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notes Section */}
                <div className="mb-3">
                    <label className="form-label fw-semibold">Notes (For Internal Use)</label>
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => (
                            <textarea
                                {...field}
                                className="form-control form-control-sm"
                                rows="3"
                                placeholder="Enter internal notes"
                            ></textarea>
                        )}
                    />
                </div>

                {/* File Upload */}
                <div className="mb-3">
                    <label className="form-label fw-semibold">
                        Attach File(s) to Purchase Receive
                    </label>
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.png,.docx"
                            className="form-control form-control-sm w-auto"
                            onChange={handleFileUpload}
                        />
                        <small className="text-muted">
                            You can upload a maximum of 5 files, 10MB each
                        </small>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <ul className="mt-2 small">
                            {uploadedFiles.map((file, i) => (
                                <li key={i}>{file.name}</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="d-flex gap-2 mt-4">
                    <button type="button" className="btn btn-secondary btn-sm">
                        Save as Draft
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                        Save as Received
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewPurchaseReceives;
