import React, { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle";
import { createOceanInboundArrivalNotice, updateOceanInboundArrivalNotice } from "../../../oceanInboundApi";

// Helper to convert empty/null/undefined to null for nullable fields (MongoDB compatibility)
const toNullableDecimal = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
};
const toNullableInt = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};
// Helper to convert empty strings to null for string fields (MongoDB compatibility)
const toNullableString = (v) => {
    if (v === null || v === undefined || v === "") return null;
    return String(v).trim() || null;
};
const safeArr = (v) => (Array.isArray(v) ? v : []);

// Helper function to format date for input[type="date"]
const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
    } catch {
        return "";
    }
};

const closeModal = () => {
    const modalElement = document.getElementById("seaincreateArrivalNoticeModal");
    if (modalElement) {
        const bootstrap = window.bootstrap || bootstrap;
        if (bootstrap?.Modal) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
                return;
            }
        }
        if (window.$) {
            window.$(modalElement).modal("hide");
            return;
        }
        const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
        if (closeBtn) {
            closeBtn.click();
        }
    }
};

const CreateArrivalNoticeSeaIn = ({ editData, setEditData }) => {
    // Get jobNo and hblNo from sessionStorage
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");
    
    const jobNo = storedMaster?.jobNo ?? "";
    const hblNo = storedHouse?.hbl ?? storedHouse?.hblNo ?? storedHouse?.houseNumber ?? "";

    const isEditing = Boolean(editData?._id || editData?.id);
    const defaultValues = {
        jobNo: "",
        canNo: "",
        canDate: "",
        mblNo: "",
        hblNo: "",
        branch: "HEAD OFFICE",

        shipperName: "",
        shipperAddress: "",

        blName: "",
        blAddress: "",

        consigneeName: "",
        consigneeAddress: "",

        notifyName: "",
        notifyAddress: "",

        origin: "",
        destination: "",
        vesselName: "",
        onBoardDate: "",
        arrivalDate: "",
        package: "",
        grossWeight: "",
        noOfContainer: "",

        shipperInvoiceNo: "",
        shipperInvoiceDate: "",
        shipperInvoiceAmount: "",

        remarks: "",

        charges: [],
    };

    const queryClient = useQueryClient();

    const { control, handleSubmit, reset } = useForm({
        defaultValues: isEditing ? (editData || defaultValues) : defaultValues,
    });

    // Watch charges (display only) and compute totals
    const charges = useWatch({ control, name: "charges" }) || [];
    const { subtotal, totalAmount } = useMemo(() => {
        const sub = charges.reduce(
            (sum, charge) => sum + Number(charge?.amountInInr ?? charge?.amountInINR ?? 0),
            0
        );
        const grand = charges.reduce((sum, charge) => sum + Number(charge?.total ?? 0), 0);
        return {
            subtotal: sub,
            totalAmount: grand,
        };
    }, [charges]);

    // Reset form when editData changes
    useEffect(() => {
        if (editData) {
            reset({
                ...defaultValues,
                ...editData,
                canDate: formatDateForInput(editData?.canDate),
                onBoardDate: formatDateForInput(editData?.onBoardDate),
                arrivalDate: formatDateForInput(editData?.arrivalDate),
                shipperInvoiceDate: formatDateForInput(editData?.shipperInvoiceDate),
                charges: safeArr(editData?.charges),
            });
        } else {
            reset(defaultValues);
        }
    }, [editData, reset]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (payload) => createOceanInboundArrivalNotice(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundArrivalNotice", jobNo, hblNo] });
            alert("Arrival Notice Created");
            setEditData?.(null);
            closeModal();
        },
        onError: (error) => handleProvisionalError(error, "Create Arrival Notice"),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (payload) => updateOceanInboundArrivalNotice(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundArrivalNotice", jobNo, hblNo] });
            alert("Arrival Notice Updated");
            setEditData?.(null);
            closeModal();
        },
        onError: (error) => handleProvisionalError(error, "Update Arrival Notice"),
    });

    const onSubmit = (values) => {
        if (!jobNo || !hblNo) {
            alert("Job No and HBL No are required");
            return;
        }

        // Normalize all fields per backend DTO
        const normalized = {
            canNo: toNullableString(values.canNo),
            canDate: values.canDate || null,
            branch: toNullableString(values.branch),

            shipperName: toNullableString(values.shipperName),
            shipperAddress: toNullableString(values.shipperAddress),

            blName: toNullableString(values.blName),
            blAddress: toNullableString(values.blAddress),

            consigneeName: toNullableString(values.consigneeName),
            consigneeAddress: toNullableString(values.consigneeAddress),
            notifyName: toNullableString(values.notifyName),
            notifyAddress: toNullableString(values.notifyAddress),

            origin: toNullableString(values.origin),
            destination: toNullableString(values.destination),

            vesselName: toNullableString(values.vesselName),
            onBoardDate: values.onBoardDate || null,
            arrivalDate: values.arrivalDate || null,

            package: toNullableInt(values.package),
            grossWeight: toNullableDecimal(values.grossWeight),
            noOfContainer: toNullableInt(values.noOfContainer),

            shipperInvoiceNo: toNullableString(values.shipperInvoiceNo),
            shipperInvoiceDate: values.shipperInvoiceDate || null,
            shipperInvoiceAmount: toNullableDecimal(values.shipperInvoiceAmount),

            remarks: toNullableString(values.remarks),

            subtotal: toNullableDecimal(subtotal),
            charges: toNullableDecimal(subtotal),
            totalAmount: toNullableDecimal(totalAmount),
        };

        if (isEditing) {
            updateMutation.mutate(normalized);
        } else {
            createMutation.mutate(normalized);
        }
    };

    return (
        <div
            className="modal fade"
            id="seaincreateArrivalNoticeModal"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Arrival Notice</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    {/* BODY */}
                    <div className="modal-body" style={{ maxHeight: "85vh", overflowY: "auto" }}>
                        <form onSubmit={handleSubmit(onSubmit)}>

                            {/* TOP ROW */}
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Job No/Ref No</label>
                                    <Controller name="jobNo" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">CAN No</label>
                                    <Controller name="canNo" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">CAN Date</label>
                                    <Controller name="canDate" control={control}
                                        render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">M.B/L No</label>
                                    <Controller name="mblNo" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">H.B/L No</label>
                                    <Controller name="hblNo" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Branch</label>
                                    <Controller name="branch" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* SHIPPER + BL */}
                            <div className="row g-3 mt-3">
                                {/* SHIPPER */}
                                <div className="col-md-6">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        Shipper's Name & Address <FaSearch className="ms-2 text-primary" />
                                    </label>

                                    <Controller name="shipperName" control={control}
                                        render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="shipperAddress" control={control}
                                        render={({ field }) =>
                                            <textarea {...field} rows={4} className="form-control" />} />
                                </div>

                                {/* B/L */}
                                <div className="col-md-6">
                                    <label className="form-label fw-bold d-flex align-items-center">
                                        Bill of Lading <FaSearch className="ms-2 text-primary" />
                                    </label>

                                    <Controller name="blName" control={control}
                                        render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="blAddress" control={control}
                                        render={({ field }) =>
                                            <textarea {...field} rows={4} className="form-control" />} />
                                </div>
                            </div>

                            {/* CONSIGNEE + NOTIFY */}
                            <div className="row g-3 mt-3">
                                {/* CONSIGNEE */}
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Consignee Name & Address
                                    </label>

                                    <Controller name="consigneeName" control={control}
                                        render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="consigneeAddress" control={control}
                                        render={({ field }) =>
                                            <textarea {...field} rows={4} className="form-control" />} />
                                </div>

                                {/* NOTIFY */}
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">
                                        Notify Name & Address
                                    </label>

                                    <Controller name="notifyName" control={control}
                                        render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="notifyAddress" control={control}
                                        render={({ field }) =>
                                            <textarea {...field} rows={4} className="form-control" />} />
                                </div>
                            </div>

                            {/* ORIGIN – ARRIVAL */}
                            <div className="row g-3 mt-4">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Origin</label>
                                    <Controller name="origin" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Destination</label>
                                    <Controller name="destination" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Vessel Name</label>
                                    <Controller name="vesselName" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-1">
                                    <label className="form-label fw-bold">On Board</label>
                                    <Controller name="onBoardDate" control={control}
                                        render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Arrival Date</label>
                                    <Controller name="arrivalDate" control={control}
                                        render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>
                            </div>

                            {/* PACKAGE + WEIGHT */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Package</label>
                                    <Controller name="package" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Gross Weight</label>
                                    <Controller name="grossWeight" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">No of Container</label>
                                    <Controller name="noOfContainer" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* INVOICE DETAILS */}
                            <div className="row g-3 mt-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice No</label>
                                    <Controller name="shipperInvoiceNo" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Invoice Date</label>
                                    <Controller name="shipperInvoiceDate" control={control}
                                        render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Invoice Amount</label>
                                    <Controller name="shipperInvoiceAmount" control={control}
                                        render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* REMARKS */}
                            <div className="mt-4">
                                <label className="form-label fw-bold">Remarks</label>
                                <Controller name="remarks" control={control}
                                    render={({ field }) => <textarea {...field} rows={3} className="form-control" />} />
                            </div>

                            {/* CHARGES TABLE (STATIC FOR NOW) */}
                            <div className="mt-4" style={{ overflowX: "auto" }}>
                                <table className="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Description</th>
                                            <th>Currency</th>
                                            <th>Amount</th>
                                            <th>Ex.Rate</th>
                                            <th>Amount in INR</th>
                                            <th>GST %</th>
                                            <th>CGST</th>
                                            <th>SGST</th>
                                            <th>IGST</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td colSpan="11" className="text-center text-muted">
                                                No charges added
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* FOOTER */}
                            <div className="modal-footer mt-3">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        setEditData?.(null);
                                        reset(defaultValues);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending 
                                        ? "Saving..." 
                                        : isEditing 
                                            ? "Update" 
                                            : "Save"}
                                </button>
                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateArrivalNoticeSeaIn;
