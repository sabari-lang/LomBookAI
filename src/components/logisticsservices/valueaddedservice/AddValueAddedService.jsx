import React, { useEffect } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createValueAddedService, updateValueAddedService } from "./api";
import { notifySuccess } from "../../../utils/notifications";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { closeModal as closeModalUtil, cleanupModalBackdrop } from "../../../utils/closeModal";

const DEFAULTS = {
    jobNo: "",
    masterNo: "",
    houseNo: "",
    branch: "HEAD OFFICE",
    type: "",
    jobCloseDate: "",
    invoiceDate: "",
    status: "Open",
    fields: Array.from({ length: 10 }, (_, i) => ({
        fieldName: "",
        fieldValue: "",
    })),
    remarks: "",
};

const AddValueAddedService = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: DEFAULTS,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "fields",
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createValueAddedService,
        onSuccess: () => {
            queryClient.invalidateQueries(["valueAddedServices"]);
            notifySuccess("Value Added Service Created!");
            close();
        },
        onError: (err) => handleProvisionalError(err, "Create Value Added Service"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateValueAddedService(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["valueAddedServices"]);
            notifySuccess("Value Added Service Updated!");
            close();
        },
        onError: (err) => handleProvisionalError(err, "Update Value Added Service"),
    });

    useEffect(() => {
        if (editData) {
            const formData = {
                jobNo: editData.jobNo || "",
                masterNo: editData.masterNo || "",
                houseNo: editData.houseNo || "",
                branch: editData.branch || "HEAD OFFICE",
                type: editData.type || "",
                jobCloseDate: editData.jobCloseDate || "",
                invoiceDate: editData.invoiceDate || "",
                status: editData.status || "Open",
                fields: editData.fields || DEFAULTS.fields,
                remarks: editData.remarks || "",
            };
            reset(formData);
        } else {
            reset(DEFAULTS);
        }
    }, [editData, reset]);

    const close = () => {
        reset(DEFAULTS);
        setEditData?.(null);
        closeModalUtil("addValueAddedServiceModal");
        cleanupModalBackdrop();
    };

    // Cleanup on modal close
    useEffect(() => {
        const modalElement = document.getElementById("addValueAddedServiceModal");
        if (!modalElement) return;

        const handleHidden = () => {
            reset(DEFAULTS);
            setEditData?.(null);
            cleanupModalBackdrop();
        };

        modalElement.addEventListener("hidden.bs.modal", handleHidden);
        return () => {
            modalElement.removeEventListener("hidden.bs.modal", handleHidden);
        };
    }, []);

    const onSubmit = (values) => {
        const payload = {
            ...values,
            fields: values.fields.filter(f => f.fieldName || f.fieldValue),
        };
        if (editData?.id) {
            updateMutation.mutate({ id: editData.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div
            className="modal fade"
            id="addValueAddedServiceModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Value Added Service</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={close}
                        ></button>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                            <div className="container-fluid">
                                {/* First Row */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Job No</label>
                                        <Controller
                                            name="jobNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Job No" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Master No</label>
                                        <Controller
                                            name="masterNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Master No" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">House No</label>
                                        <Controller
                                            name="houseNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="House No" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Branch</label>
                                        <Controller
                                            name="branch"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="HEAD OFFICE">HEAD OFFICE</option>
                                                    <option value="ANATHAPUR">ANATHAPUR</option>
                                                    <option value="BANGALORE">BANGALORE</option>
                                                    <option value="MUMBAI">MUMBAI</option>
                                                    <option value="NEW DELHI">NEW DELHI</option>
                                                    <option value="BLR SALES">BLR SALES</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Second Row */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Type</label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="">Select Type</option>
                                                    <option value="Ware House">Ware House</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Job Close Date</label>
                                        <Controller
                                            name="jobCloseDate"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Invoice Date</label>
                                        <Controller
                                            name="invoiceDate"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Status</label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Open">Open</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Fields */}
                                {fields.map((field, index) => (
                                    <div key={field.id} className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Select Field {index + 1}</label>
                                            <Controller
                                                name={`fields.${index}.fieldName`}
                                                control={control}
                                                render={({ field: fieldCtrl }) => (
                                                    <select {...fieldCtrl} className="form-select">
                                                        <option value="">Select Field {index + 1}</option>
                                                        <option value={`Field${index + 1}`}>Field {index + 1}</option>
                                                    </select>
                                                )}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">value{index + 1}</label>
                                            <Controller
                                                name={`fields.${index}.fieldValue`}
                                                control={control}
                                                render={({ field: fieldCtrl }) => (
                                                    <input {...fieldCtrl} className="form-control" placeholder={`value${index + 1}`} />
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Remarks */}
                                <div className="row mb-3">
                                    <div className="col-md-12">
                                        <label className="form-label fw-bold">Remarks</label>
                                        <Controller
                                            name="remarks"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea {...field} rows={4} className="form-control" placeholder="Remarks"></textarea>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                    reset(DEFAULTS);
                                    setEditData?.(null);
                                }}
                                disabled={isEditing ? updateMutation.isLoading : createMutation.isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isEditing ? updateMutation.isLoading : createMutation.isLoading}
                            >
                                {isEditing ? (
                                    updateMutation.isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update"
                                    )
                                ) : (
                                    createMutation.isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        "Save"
                                    )
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddValueAddedService;

