import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "react-bootstrap-icons";
import moment from "moment";
import { createLscOceanOutboundTracking, updateLscOceanOutboundTracking } from "../../../services/lsc/oceanOutbound/lscOceanOutboundTrackingService";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { notifySuccess } from "../../../utils/notifications";
import { closeModal as closeModalUtil, cleanupModalBackdrop } from "../../../utils/closeModal";

const DEFAULTS = {
    blNo: "",
    shipperInvoiceNo: "",
    shipperInvoiceDate: "",
    branch: "HEAD_OFFICE",
    shipperName: "",
    consigneeName: "",
    vesselName: "",
    containerNo: "",
    etdDate: "",
    etaDate: "",
    status: "Open",
    remarks: "",
};

const JobModal = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id || editData?._id);
    const { control, handleSubmit, reset } = useForm({ defaultValues: DEFAULTS });
    const queryClient = useQueryClient();

    // Helper to close Bootstrap modal using shared utility
    const handleCloseModal = () => {
        reset(DEFAULTS);
        setEditData?.(null);
        closeModalUtil("lscOceanOutboundJobModal");
        cleanupModalBackdrop();
    };

    // Cleanup on modal close
    useEffect(() => {
        const modalElement = document.getElementById("lscOceanOutboundJobModal");
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

    const createMutation = useMutation({
        mutationFn: createLscOceanOutboundTracking,
        onSuccess: () => {
            queryClient.invalidateQueries(["lscOceanOutboundTracking"]);
            notifySuccess("Ocean Outbound created successfully!");
            handleCloseModal();
        },
        onError: (err) => handleProvisionalError(err, "Create Ocean Outbound"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateLscOceanOutboundTracking(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["lscOceanOutboundTracking"]);
            notifySuccess("Ocean Outbound updated successfully!");
            handleCloseModal();
        },
        onError: (err) => handleProvisionalError(err, "Update Ocean Outbound"),
    });

    useEffect(() => {
        if (editData) {
            const formData = {
                blNo: editData.blNo || "",
                shipperInvoiceNo: editData.shipperInvoiceNo || "",
                shipperInvoiceDate: editData.shipperInvoiceDate ? moment(editData.shipperInvoiceDate).format("YYYY-MM-DD") : "",
                branch: editData.branch || "HEAD_OFFICE",
                shipperName: editData.shipperName || "",
                consigneeName: editData.consigneeName || "",
                vesselName: editData.vesselName || "",
                containerNo: editData.containerNo || "",
                etdDate: editData.etdDate ? moment(editData.etdDate).format("YYYY-MM-DD") : "",
                etaDate: editData.etaDate ? moment(editData.etaDate).format("YYYY-MM-DD") : "",
                status: editData.status || "Open",
                remarks: editData.remarks || "",
            };
            reset(formData);
        } else {
            reset(DEFAULTS);
        }
    }, [editData, reset]);

    const onSubmit = (data) => {
        const payload = {
            ...data,
            shipperInvoiceDate: data.shipperInvoiceDate ? moment(data.shipperInvoiceDate).toISOString() : null,
            etdDate: data.etdDate ? moment(data.etdDate).toISOString() : null,
            etaDate: data.etaDate ? moment(data.etaDate).toISOString() : null,
            branch: data.branch || "HEAD_OFFICE",
        };

        if (isEditing) {
            const id = editData?.id || editData?._id;
            updateMutation.mutate({ id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div
            className="modal fade"
            id="lscOceanOutboundJobModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Ocean Outbound</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => {
                                reset(DEFAULTS);
                                setEditData?.(null);
                            }}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body">
                            <div className="container-fluid">
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">BL No</label>
                                        <Controller name="blNo" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="BL No" />} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Shipper Invoice No</label>
                                        <Controller name="shipperInvoiceNo" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="Shipper Invoice No" />} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Shipper Invoice Date</label>
                                        <Controller
                                            name="shipperInvoiceDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
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
                                                    <option value="HEAD_OFFICE">HEAD OFFICE</option>
                                                    <option value="ANATHAPUR">ANATHAPUR</option>
                                                    <option value="BANGALORE">BANGALORE</option>
                                                    <option value="MUMBAI">MUMBAI</option>
                                                    <option value="NEW_DELHI">NEW DELHI</option>
                                                    <option value="BLR_SALES">BLR SALES</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Shipper Name</label>
                                        <Controller name="shipperName" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="Shipper Name" />} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Consignee Name</label>
                                        <Controller name="consigneeName" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="Consignee Name" />} />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Vessel Name</label>
                                        <Controller name="vesselName" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="Vessel Name" />} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Container No</label>
                                        <Controller name="containerNo" control={control} render={({ field }) => <input {...field} className="form-control" placeholder="Container No" />} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Status</label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Open">Open</option>
                                                    <option value="Closed">Closed</option>
                                                    <option value="Not Arrived">Not Arrived</option>
                                                    <option value="Pending for Query">Pending for Query</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">E.T.D Date</label>
                                        <Controller
                                            name="etdDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">E.T.A Date</label>
                                        <Controller
                                            name="etaDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Remarks</label>
                                        <Controller name="remarks" control={control} render={({ field }) => <textarea {...field} rows={3} className="form-control" placeholder="Remarks"></textarea>} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                    reset(DEFAULTS);
                                    setEditData(null);
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
                                            Saving...
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

export default JobModal;

