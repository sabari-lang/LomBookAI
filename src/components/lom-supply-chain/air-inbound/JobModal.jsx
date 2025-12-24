import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Calendar } from "react-bootstrap-icons";
import moment from "moment";
import { createLscAirInboundTracking, updateLscAirInboundTracking } from "../../../services/lsc/airInbound/lscAirInboundTrackingService";
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
    flightName: "",
    etdDate: "",
    etaDate: "",
    status: "Open",
    customerCareName: "Unknown",
    customerCareName2: "Unknown",
    customerCareName3: "Unknown",
    cfsPort: "",
    clearanceDate: "",
    manifestAlertDate: "",
    manifestDate: "",
    originalDocument: "",
    remarks: "",
};

const JobModal = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id || editData?._id);
    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: DEFAULTS,
    });
    const queryClient = useQueryClient();

    // Helper to close Bootstrap modal using shared utility
    const handleCloseModal = () => {
        reset(DEFAULTS);
        setEditData?.(null);
        closeModalUtil("lscAirInboundJobModal");
        cleanupModalBackdrop();
    };

    // Cleanup on modal close
    useEffect(() => {
        const modalElement = document.getElementById("lscAirInboundJobModal");
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
        mutationFn: createLscAirInboundTracking,
        onSuccess: () => {
            queryClient.invalidateQueries(["lscAirInboundTracking"]);
            notifySuccess("Air Inbound created successfully!");
            handleCloseModal();
        },
        onError: (err) => handleProvisionalError(err, "Create Air Inbound"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateLscAirInboundTracking(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["lscAirInboundTracking"]);
            notifySuccess("Air Inbound updated successfully!");
            handleCloseModal();
        },
        onError: (err) => handleProvisionalError(err, "Update Air Inbound"),
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
                flightName: editData.flightName || "",
                etdDate: editData.etdDate ? moment(editData.etdDate).format("YYYY-MM-DD") : "",
                etaDate: editData.etaDate ? moment(editData.etaDate).format("YYYY-MM-DD") : "",
                status: editData.status || "Open",
                customerCareName: editData.customerCareName || "Unknown",
                customerCareName2: editData.customerCareName2 || "Unknown",
                customerCareName3: editData.customerCareName3 || "Unknown",
                cfsPort: editData.cfsPort || "",
                clearanceDate: editData.clearanceDate ? moment(editData.clearanceDate).format("YYYY-MM-DD") : "",
                manifestAlertDate: editData.manifestAlertDate ? moment(editData.manifestAlertDate).format("YYYY-MM-DD") : "",
                manifestDate: editData.manifestDate ? moment(editData.manifestDate).format("YYYY-MM-DD") : "",
                originalDocument: editData.originalDocument || "",
                remarks: editData.remarks || "",
            };
            reset(formData);
        } else {
            reset(DEFAULTS);
        }
    }, [editData, reset]);

    const onSubmit = (data) => {
        // Normalize dates: convert to ISO string or null
        const payload = {
            ...data,
            shipperInvoiceDate: data.shipperInvoiceDate ? moment(data.shipperInvoiceDate).toISOString() : null,
            etdDate: data.etdDate ? moment(data.etdDate).toISOString() : null,
            etaDate: data.etaDate ? moment(data.etaDate).toISOString() : null,
            clearanceDate: data.clearanceDate ? moment(data.clearanceDate).toISOString() : null,
            manifestAlertDate: data.manifestAlertDate ? moment(data.manifestAlertDate).toISOString() : null,
            manifestDate: data.manifestDate ? moment(data.manifestDate).toISOString() : null,
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
            id="lscAirInboundJobModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Air Inbound</h5>
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

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                            <div className="container-fluid">
                                {/* Row 1 */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">BL No</label>
                                        <Controller
                                            name="blNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="BL No" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Shipper Invoice No</label>
                                        <Controller
                                            name="shipperInvoiceNo"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Shipper Invoice No" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Shipper Invoice Date</label>
                                        <Controller
                                            name="shipperInvoiceDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
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

                                {/* Row 2 */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold d-flex align-items-center gap-2">
                                            Shipper Name
                                            <Search size={14} style={{ cursor: "pointer" }} />
                                        </label>
                                        <Controller
                                            name="shipperName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Shipper Name" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold d-flex align-items-center gap-2">
                                            Consignee Name
                                            <Search size={14} style={{ cursor: "pointer" }} />
                                        </label>
                                        <Controller
                                            name="consigneeName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Consignee Name" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 3 */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Flight Name</label>
                                        <Controller
                                            name="flightName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Flight Name" />
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">E.T.D Date</label>
                                        <Controller
                                            name="etdDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
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
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
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
                                                    <option value="Not Arrived">Not Arrived</option>
                                                    <option value="Clearance Completed">Clearance Completed</option>
                                                    <option value="Pending for Query">Pending for Query</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 4 */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Customer care Name</label>
                                        <Controller
                                            name="customerCareName"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Unknown">Unknown</option>
                                                    {/* Add more options as needed */}
                                                </select>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Customer care Name 2</label>
                                        <Controller
                                            name="customerCareName2"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Unknown">Unknown</option>
                                                    {/* Add more options as needed */}
                                                </select>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Customer care Name 3</label>
                                        <Controller
                                            name="customerCareName3"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Unknown">Unknown</option>
                                                    {/* Add more options as needed */}
                                                </select>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">CFS / Port</label>
                                        <Controller
                                            name="cfsPort"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="CFS / Port" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 5 */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Clearance Date</label>
                                        <Controller
                                            name="clearanceDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Manifest Alert Date</label>
                                        <Controller
                                            name="manifestAlertDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Manifest Date</label>
                                        <Controller
                                            name="manifestDate"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="input-group">
                                                    <input {...field} type="date" className="form-control" placeholder="dd-mm-yyyy" />
                                                    <span className="input-group-text bg-white">
                                                        <Calendar size={16} />
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Original Document</label>
                                        <Controller
                                            name="originalDocument"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Original Document" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 6 */}
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

