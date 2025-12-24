import React, { useEffect, useMemo, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";
import bootstrapBundle from "bootstrap/dist/js/bootstrap.bundle";
import { createOceanInboundArrivalNotice, updateOceanInboundArrivalNotice, getOceanInboundProvisionals } from "../../../oceanInboundApi";
import { extractItems } from "../../../../../../../utils/extractItems";
import { refreshKeyboard } from "../../../../../../../utils/refreshKeyboard";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../../utils/notifications";

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
    if (!modalElement) return;

    const bs = window.bootstrap || bootstrapBundle;
    if (bs?.Modal) {
        const modal = bs.Modal.getOrCreateInstance(modalElement);
        modal.hide();
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('paddingRight');
        return;
    }

    if (window.$) {
        window.$(modalElement).modal("hide");
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('paddingRight');
        return;
    }

    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
    if (closeBtn) closeBtn.click();
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('paddingRight');
};

const CreateArrivalNoticeSeaIn = ({ editData, setEditData }) => {
    // Get jobNo and hblNo from sessionStorage
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hblNo = storedHouse?.hbl ?? storedHouse?.hblNo ?? storedHouse?.houseNumber ?? "";




    const isEditing = Boolean(editData?._id || editData?.id);


    // Fetch provisional entries to map to charges (like Air Inbound)
    const { data: provisionalApiRaw } = useQuery({
        queryKey: ["oceanInboundProvisionals", jobNo, hblNo],
        queryFn: () => getOceanInboundProvisionals(jobNo, hblNo, { page: 1, pageSize: 1000 }),
        enabled: Boolean(jobNo && hblNo),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Always fetch provisional charges for display (Create & Edit)
    const mappedProvisionalCharges = useMemo(() => {
        if (!provisionalApiRaw) return [];
        const entries = extractItems(provisionalApiRaw) ?? [];
        return entries.flatMap(entry => Array.isArray(entry?.items) ? entry.items : []);
    }, [provisionalApiRaw]);



    // Auto-fill default values from master and house data (like Air Inbound)
    const autoFilledDefaults = useMemo(() => {
        return {
            jobNo: storedMaster?.jobNo ?? storedMaster?.job_no ?? "",
            mblNo: storedMaster?.mblNo ?? storedMaster?.mbl_no ?? storedMaster?.mbl ?? "",
            hblNo: storedHouse?.hbl ?? storedHouse?.hblNo ?? storedHouse?.houseNumber ?? "",
            branch: storedMaster?.branch ?? storedHouse?.branch ?? "HEAD OFFICE",
            shipperName: storedHouse?.shipperName ?? storedHouse?.shipper_name ?? "",
            shipperAddress: storedHouse?.shipperAddress ?? storedHouse?.shipper_address ?? storedHouse?.shipperAddr ?? "",
            blName: storedMaster?.blNo ?? storedMaster?.bl_name ?? "",
            blAddress: storedMaster?.blText ?? storedMaster?.bl_address ?? "",
            consigneeName: storedHouse?.consigneeName ?? storedHouse?.consignee_name ?? "",
            consigneeAddress: storedHouse?.consigneeAddress ?? storedHouse?.consignee_address ?? storedHouse?.consigneeAddr ?? "",
            notifyName: storedHouse?.notifyName ?? storedHouse?.notify_name ?? "",
            notifyAddress: storedHouse?.notifyAddress ?? storedHouse?.notify_address ?? storedHouse?.notifyAddr ?? "",
            origin: storedMaster?.originPort ?? storedMaster?.origin ?? storedHouse?.origin ?? "",
            destination: storedMaster?.finalDestination ?? storedMaster?.destination ?? storedHouse?.destination ?? "",
            vesselName: storedMaster?.vesselName ?? storedMaster?.vessel_name ?? storedHouse?.vesselName ?? "",
            onBoardDate: formatDateForInput(storedMaster?.onBoardDate ?? storedMaster?.on_board_date ?? storedHouse?.onBoardDate),
            arrivalDate: formatDateForInput(storedMaster?.arrivalDate ?? storedMaster?.arrival_date ?? storedHouse?.arrivalDate),
            package: storedMaster?.package ?? storedHouse?.package ?? "",
            grossWeight: storedMaster?.grossWeight ?? storedMaster?.gross_weight ?? storedHouse?.grossWeight ?? "",
            noOfContainer: storedMaster?.containers?.length ?? storedHouse?.noOfContainer ?? "",
            shipperInvoiceNo: storedHouse?.shipperInvoiceNo ?? storedHouse?.shipper_invoice_no ?? "",
            shipperInvoiceDate: formatDateForInput(storedHouse?.shipperInvoiceDate ?? storedHouse?.shipper_invoice_date),
            shipperInvoiceAmount: storedHouse?.shipperInvoiceAmount ?? storedHouse?.shipper_invoice_amount ?? "",
            canNo: "",
            canDate: "",
            remarks: "",
            charges: null,
        };
    }, [storedMaster, storedHouse]);

    const queryClient = useQueryClient();

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: isEditing ? (editData || autoFilledDefaults) : autoFilledDefaults,
    });

    // For display: prefer saved charges in edit, else provisional
    const watchedCharges = useWatch({ control, name: "charges" }) || [];
    const displayCharges = useMemo(() => {
        // Edit: prefer saved charges if present, else fallback to provisional
        if (isEditing) {
            if (watchedCharges && watchedCharges.length > 0) return watchedCharges;
            if (mappedProvisionalCharges.length > 0) return mappedProvisionalCharges;
            return [];
        }
        // Create: always show provisional
        return mappedProvisionalCharges.length > 0 ? mappedProvisionalCharges : [];
    }, [isEditing, watchedCharges, mappedProvisionalCharges]);
    // For backend: single decimal/null value for charges
    const chargesValue = displayCharges.length > 0
        ? displayCharges.reduce((sum, r) => sum + (typeof r?.total === 'number' ? r.total : Number(r?.total) || 0), 0)
        : null;



    // --- Initialization logic (like Air Inbound) ---
    const initializedRef = useRef(false);
    const lastEditIdRef = useRef(null);

    // Helper: deep compare arrays of charges (shallow for this use case)
    const areChargesEqual = (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return false;
        }
        return true;
    };

    // Auto-fill form when editData changes (for editing mode)
    useEffect(() => {
        const currentEditId = editData?._id || editData?.id;
        if (isEditing && editData && currentEditId !== lastEditIdRef.current) {
            reset({
                ...autoFilledDefaults,
                ...editData,
                onBoardDate: formatDateForInput(editData?.onBoardDate),
                arrivalDate: formatDateForInput(editData?.arrivalDate),
                shipperInvoiceDate: formatDateForInput(editData?.shipperInvoiceDate),
                charges: Array.isArray(editData?.charges) && editData.charges.length > 0
                    ? editData.charges
                    : mappedProvisionalCharges,
            });
            // Call refreshKeyboard after form values are populated
            refreshKeyboard();
            lastEditIdRef.current = currentEditId;
            initializedRef.current = true;
        }
    // Only depend on editData id and isEditing, not on mappedProvisionalCharges (which is stable via useMemo)
    }, [isEditing, editData?._id, editData?.id, autoFilledDefaults, editData]);

    // Initialize form for create mode (run once)
    useEffect(() => {
        if (!isEditing && !initializedRef.current) {
            reset({
                ...autoFilledDefaults,
                charges: mappedProvisionalCharges,
            });
            initializedRef.current = true;
        }
    }, [isEditing, autoFilledDefaults, mappedProvisionalCharges]);

    // Watch for changes in mappedProvisionalCharges and update form (create mode only)
    useEffect(() => {
        if (!isEditing && initializedRef.current) {
            // Only update if charges actually changed
            if (!areChargesEqual(watchedCharges, mappedProvisionalCharges)) {
                setValue("charges", mappedProvisionalCharges, { shouldDirty: false });
            }
        }
    }, [mappedProvisionalCharges, isEditing, setValue, watchedCharges]);

    // Reset initialization flag when editData is cleared
    useEffect(() => {
        if (!editData && !isEditing) {
            initializedRef.current = false;
            lastEditIdRef.current = null;
        }
    }, [editData, isEditing]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (payload) => createOceanInboundArrivalNotice(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundArrivalNotice", jobNo, hblNo] });
            notifySuccess("Arrival Notice Created");
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
            notifySuccess("Arrival Notice Updated");
            setEditData?.(null);
            closeModal();
        },
        onError: (error) => handleProvisionalError(error, "Update Arrival Notice"),
    });

    const onSubmit = (values) => {
        if (!jobNo || !hblNo) {
            notifyError("Job No and HBL No are required");
            return;
        }

        // Normalize all fields per backend DTO, but send only a single decimal/null for charges
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

            charges: chargesValue,
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
                                        {displayCharges.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="text-center text-muted">
                                                    No charges added
                                                </td>
                                            </tr>
                                        ) : (
                                            displayCharges.map((r, idx) => (
                                                <tr key={r?.id ?? idx}>
                                                    <td></td>
                                                    <td>{r?.description ?? ""}</td>
                                                    <td>{r?.currency ?? ""}</td>
                                                    <td>{r?.amount ?? ""}</td>
                                                    <td>{r?.exRate ?? ""}</td>
                                                    <td className="text-success fw-bold">{r?.amountInInr ?? r?.amountInINR ?? ""}</td>
                                                    <td>{r?.gst ?? r?.gstPer ?? ""}</td>
                                                    <td>{r?.cgst ?? ""}</td>
                                                    <td>{r?.sgst ?? ""}</td>
                                                    <td>{r?.igst ?? ""}</td>
                                                    <td>{r?.total ?? ""}</td>
                                                </tr>
                                            ))
                                        )}

                                        {/* Subtotal/Total rows removed as not required by API */}
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
