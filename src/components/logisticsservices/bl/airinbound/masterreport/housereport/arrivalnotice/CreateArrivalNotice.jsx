import React, { useEffect, useMemo, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";
import moment from "moment";
import { extractItems } from "../../../../../../../utils/extractItems";

// Bootstrap modal close
import bootstrapBundle from "bootstrap/dist/js/bootstrap.bundle";
import { createAirInboundArrivalNotice, updateAirInboundArrivalNotice, getAirInboundProvisionals } from "../../../Api";
import { refreshKeyboard } from "../../../../../../../utils/refreshKeyboard";
import { notifySuccess, notifyError, notifyInfo } from "../../../../../../../utils/notifications";

const closeModal = () => {
    const modalElement = document.getElementById("createArrivalNoticeModal");
    if (!modalElement) return;

    const bs = window.bootstrap || bootstrapBundle;
    if (bs?.Modal) {
        const modal = bs.Modal.getOrCreateInstance(modalElement);
        modal.hide();
        // Ensure backdrop and body classes are cleaned up
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('paddingRight');
        return;
    }

    if (window.$) {
        window.$(modalElement).modal("hide");
        // jQuery usually handles cleanup, but double-check
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('paddingRight');
        return;
    }

    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
    if (closeBtn) closeBtn.click();
    // Fallback cleanup
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((bd) => bd.parentNode && bd.parentNode.removeChild(bd));
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('paddingRight');
};

// Helper function to format date for input[type="date"]
const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    try {
        // Try moment first (common format)
        if (moment(dateValue).isValid()) {
            return moment(dateValue).format("YYYY-MM-DD");
        }
        // Fallback to Date
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    } catch {
        return "";
    }
};

// Helper functions
const safeNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
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
const safeStr = (v) => (v ?? "").toString();
const safeArr = (v) => (Array.isArray(v) ? v : []);

const CreateArrivalNotice = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?._id || editData?.id);
    
    // Get jobNo and hawb from sessionStorage
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");



    console.log("CreateArrivalNotice Rendered - editData:", storedHouse);
    const jobNo = storedMaster?.jobNo ?? "";
    const hawb = storedHouse?.hawb ?? storedHouse?.hawbNo ?? storedHouse?.houseNumber ?? "";

    // Fetch provisional entries to map to charges
    const { data: provisionalApiRaw, isLoading: provisionalsLoading } = useQuery({
        queryKey: ["airInboundProvisionals", jobNo, hawb],
        queryFn: () => getAirInboundProvisionals(jobNo, hawb, { page: 1, pageSize: 1000 }), // Fetch all for mapping
        enabled: Boolean(jobNo && hawb), // Fetch as soon as jobNo + hawb available for both create/edit
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Normalize provisional entries to charges format (similar to ProvisionalEntry.jsx)
    const mappedCharges = useMemo(() => {
        if (isEditing || !provisionalApiRaw) return [];

        // Extract all provisional entries
        const entries = extractItems(provisionalApiRaw) ?? [];

        // Normalize function (same pattern as ProvisionalEntry.jsx)
        const normalize = (entry = {}) => {
            const items = Array.isArray(entry?.items) ? entry.items : [];
            if (items.length === 0) return [];

            // Map each item to charge format
            return items.map((it) => ({
                id: `${entry?.id ?? ""}_${it?.id ?? Date.now()}`,
                description: safeStr(it?.description ?? it?.accountService ?? ""),
                sac: safeStr(it?.sac ?? ""),
                currency: safeStr(it?.currency ?? "INR"),
                qty: safeNum(it?.qty ?? 1),
                amount: safeNum(it?.amount ?? 0),
                exRate: safeNum(it?.exRate ?? 1),
                amountInInr: safeNum(it?.amountInInr ?? it?.amountInINR ?? 0),
                gst: safeNum(it?.gstPer ?? it?.gst ?? 0),
                cgst: safeNum(it?.cgst ?? 0),
                sgst: safeNum(it?.sgst ?? 0),
                igst: safeNum(it?.igst ?? 0),
                total: safeNum(it?.total ?? 0),
            }));
        };

        // Flatten all entries and their items
        return entries.flatMap(normalize);
    }, [provisionalApiRaw, isEditing]);

    // Auto-fill default values from master and house data
    // SECTION 1: HEADER FIELDS FROM MASTER (auto-filled, editable - no readonly)
    // SECTION 2: HEADER FIELDS FROM HOUSE (auto-filled, editable - no readonly)
    // SECTION 3: FLIGHT DETAILS FROM MASTER (auto-filled, editable - no readonly)
    // SECTION 4: PHYSICAL DETAILS FROM MASTER (auto-filled, editable - no readonly)
    // SECTION 5: INVOICE DETAILS FROM HOUSE (auto-filled, editable - no readonly)
    const autoFilledDefaults = useMemo(() => {
        return {
            // SECTION 1: FROM MASTER - Header Fields (editable, not readonly)
            // 1. Job No/Ref No - Value Source: master.job_no
            jobNo: storedMaster?.jobNo ?? storedMaster?.job_no ?? "",
            // 2. MAWB No - Value Source: master.mawb_no
            mawbNo: storedMaster?.mawbNo ?? storedMaster?.mawb_no ?? storedMaster?.mawb ?? "",
            // 3. Branch - Value Source: master.branch
            branch: storedMaster?.branch ?? storedHouse?.branch ?? "HEAD OFFICE",

            // SECTION 2: FROM HOUSE - Header Fields (editable, not readonly)
            // 4. HAWB No - Value Source: house.hawb_no
            hawbNo: storedHouse?.hawb ?? storedHouse?.hawbNo ?? storedHouse?.hawb_no ?? storedHouse?.houseNumber ?? "",
            // 5. Shipper's Name & Address - Value Source: house.shipper_name
            shipperName: storedHouse?.shipperName ?? storedHouse?.shipper_name ?? "",
            shipperAddress: storedHouse?.shipperAddress ?? storedHouse?.shipper_address ?? storedHouse?.shipperAddr ?? "",
            // 6. Consignee Name & Address - Value Source: house.consignee_name
            consigneeName: storedHouse?.consigneeName ?? storedHouse?.consignee_name ?? "",
            consigneeAddress: storedHouse?.consigneeAddress ?? storedHouse?.consignee_address ?? storedHouse?.consigneeAddr ?? "",
            // 7. Air Waybill (Not Negotiable Carrier) - Value Source: house.air_waybill or master.carrier_name
            airwbName: storedHouse?.agentName ?? storedHouse?.air_waybill ?? storedMaster?.carrierName ?? storedMaster?.carrier_name ?? "",
            airwbAddress: storedHouse?.agentAddress ?? storedHouse?.airwb_address ?? "",
            // 8. Notify Name & Address - Value Source: house.notify_address
            notifyName: storedHouse?.notifyName ?? storedHouse?.notify_name ?? "",
            notifyAddress: storedHouse?.notifyAddress ?? storedHouse?.notify_address ?? storedHouse?.notifyAddr ?? "",

            // SECTION 3: FLIGHT DETAILS FROM MASTER (editable, not readonly)
            // 9. Origin (Airport of Departure) - Value Source: master.airport_departure
            origin: storedMaster?.airportDeparture ?? storedMaster?.airport_departure ?? storedHouse?.airportDeparture ?? "",
            // 10. Destination (Airport) - Value Source: master.airport_destination
            destination: storedMaster?.airportDestination ?? storedMaster?.airport_destination ?? storedHouse?.airportDest ?? storedHouse?.airport_destination ?? "",
            // 11. Flight No - Value Source: master.flight_no
            flightNo: storedMaster?.flightNo ?? storedMaster?.flight_no ?? "",
            // 12. Departure Date - Value Source: master.departure_date
            departureDate: formatDateForInput(storedMaster?.departureDate ?? storedMaster?.departure_date ?? storedHouse?.departureDate),
            // 13. Arrival Date - Value Source: master.arrival_date
            arrivalDate: formatDateForInput(storedMaster?.arrivalDate ?? storedMaster?.arrival_date ?? storedHouse?.arrivalDate),

            // SECTION 4: PHYSICAL DETAILS FROM MASTER (editable, not readonly)
            // 14. No. of Pieces RCP - Value Source: master.no_pieces_rcp
            piecesRCP: storedMaster?.noPiecesRcp ?? storedMaster?.no_pieces_rcp ?? storedMaster?.pieces ?? storedHouse?.pieces ?? "",
            // 15. Gross Weight - Value Source: master.gross_weight
            grossWeight: storedMaster?.grossWeight ?? storedMaster?.gross_weight ?? storedHouse?.grossWeight ?? "",
            // 16. Chargeable Weight - Value Source: master.chargeable_weight
            chargeableWeight: storedMaster?.chargeableWeight ?? storedMaster?.chargeable_weight ?? storedHouse?.chargeableWeight ?? "",

            // SECTION 5: INVOICE DETAILS FROM HOUSE (editable, not readonly)
            // 17. Shipper Invoice No - Value Source: house.shipper_invoice_no
            shipperInvoiceNo: storedHouse?.shipperInvoiceNo ?? storedHouse?.shipper_invoice_no ?? "",
            // 18. Shipper Invoice Date - Value Source: house.shipper_invoice_date
            shipperInvoiceDate: formatDateForInput(storedHouse?.shipperInvoiceDate ?? storedHouse?.shipper_invoice_date),
            // 19. Shipper Invoice Amount - Value Source: house.shipper_invoice_amount
            shipperInvoiceAmount: storedHouse?.shipperInvoiceAmount ?? storedHouse?.shipper_invoice_amount ?? "",

            // Default empty fields (not auto-filled)
            canNo: "",
            canDate: "",
            remarks: "",
            handlingInfo: "",
            // Charges will be auto-filled from provisional entries when creating new
            charges: [],
        };
    }, [storedMaster, storedHouse]);

    const queryClient = useQueryClient();

    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: isEditing ? (editData || autoFilledDefaults) : autoFilledDefaults,
    });

    // Watch charges from form (display only)
    const charges = useWatch({ control, name: "charges" }) || [];

    // Calculate subtotal and grandTotal from charges
    const { subtotal, grandTotal } = useMemo(() => {
        const sub = safeArr(charges).reduce((sum, charge) => sum + safeNum(charge?.amountInInr ?? charge?.amountInINR ?? 0), 0);
        const grand = safeArr(charges).reduce((sum, charge) => sum + safeNum(charge?.total ?? 0), 0);
        return {
            subtotal: sub.toFixed(2),
            grandTotal: grand.toFixed(2),
        };
    }, [charges]);


    // Track initialization to prevent infinite loops
    const initializedRef = useRef(false);
    const lastEditIdRef = useRef(null);

    // Auto-fill form when editData changes (for editing mode)
    useEffect(() => {
        const currentEditId = editData?._id || editData?.id;

        if (isEditing && editData && currentEditId !== lastEditIdRef.current) {
            // When editing, use editData with formatted dates
            reset({
                ...autoFilledDefaults,
                ...editData,
                departureDate: formatDateForInput(editData?.departureDate),
                arrivalDate: formatDateForInput(editData?.arrivalDate),
                shipperInvoiceDate: formatDateForInput(editData?.shipperInvoiceDate),
                // Use charges from editData if available
                charges: safeArr(editData?.charges),
            });
            // Call refreshKeyboard after form values are populated
            refreshKeyboard();
            lastEditIdRef.current = currentEditId;
            initializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, editData?._id, editData?.id]); // Only reset when editData ID changes

    // Initialize form immediately (not waiting for modal shown) for create mode
    useEffect(() => {
        if (!isEditing && !initializedRef.current) {
            const currentMappedCharges = mappedCharges.length > 0 ? mappedCharges : [];
            reset({
                ...autoFilledDefaults,
                charges: currentMappedCharges,
            });
            initializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, autoFilledDefaults]);

    // Watch for changes in mappedCharges and update form immediately (for create mode only)
    useEffect(() => {
        // If not initialized yet and mapped charges arrive, initialize now
        if (!initializedRef.current && !isEditing) {
            const currentMappedCharges = mappedCharges.length > 0 ? mappedCharges : [];
            reset({
                ...autoFilledDefaults,
                charges: currentMappedCharges,
            });
            initializedRef.current = true;
            return;
        }
        // If already initialized, keep charges in sync when mapped data changes
        if (mappedCharges.length > 0 && initializedRef.current) {
            setValue("charges", mappedCharges, { shouldDirty: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mappedCharges]);

    // Reset initialization flag when editData is cleared
    useEffect(() => {
        if (!editData && !isEditing) {
            initializedRef.current = false;
            lastEditIdRef.current = null;
        }
    }, [editData, isEditing]);

    // ------------------------------------
    // API MUTATIONS
    // ------------------------------------
    const createMutation = useMutation({
        mutationFn: (payload) => createAirInboundArrivalNotice(jobNo, hawb, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["airInboundArrivalNotice", jobNo, hawb] });
            notifySuccess("Arrival Notice Created");
            setEditData?.(null);
            closeModal();
        },
        onError: (error) => handleProvisionalError(error, "Create Arrival Notice"),
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updateAirInboundArrivalNotice(jobNo, hawb, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["airInboundArrivalNotice", jobNo, hawb] });
            notifySuccess("Arrival Notice Updated");
            setEditData?.(null);
            closeModal();
        },
        onError: (error) => handleProvisionalError(error, "Update Arrival Notice"),
    });

    // ------------------------------------
    // SUBMIT HANDLER
    // ------------------------------------
    const onSubmit = (values) => {
        if (!jobNo || !hawb) {
            notifyError("Job No and HAWB are required");
            return;
        }

        // Compute totals (display only)
        const chargesArr = safeArr(values.charges);
        const subtotal = chargesArr.reduce(
            (sum, charge) => sum + safeNum(charge?.amountInInr ?? charge?.amountInINR ?? 0),
            0
        );
        const grandTotal = chargesArr.reduce(
            (sum, charge) => sum + safeNum(charge?.total ?? 0),
            0
        );

        // Normalize all fields per backend DTO
        const normalized = {
            canNo: toNullableString(values.canNo),
            canDate: values.canDate || null,
            branch: toNullableString(values.branch),

            shipperName: toNullableString(values.shipperName),
            shipperShort: toNullableString(values.shipperShort),
            shipperAddress: toNullableString(values.shipperAddress),

            airwbName: toNullableString(values.airwbName),
            airwbShort: toNullableString(values.airwbShort),
            airwbAddress: toNullableString(values.airwbAddress),

            consigneeName: toNullableString(values.consigneeName),
            consigneeAddress: toNullableString(values.consigneeAddress),
            notifyName: toNullableString(values.notifyName),
            notifyAddress: toNullableString(values.notifyAddress),
            notNegotiable: values.notNegotiable ?? null,

            carrier: toNullableString(values.carrier),
            origin: toNullableString(values.origin),
            destination: toNullableString(values.destination),
            flightNo: toNullableString(values.flightNo),
            departureDate: values.departureDate || null,
            arrivalDate: values.arrivalDate || null,

            piecesRCP: toNullableInt(values.piecesRCP),
            grossWeight: toNullableDecimal(values.grossWeight),
            chargeableWeight: toNullableDecimal(values.chargeableWeight),

            shipperInvoiceNo: toNullableString(values.shipperInvoiceNo),
            shipperInvoiceDate: values.shipperInvoiceDate || null,
            shipperInvoiceAmount: toNullableDecimal(values.shipperInvoiceAmount),

            remarks: toNullableString(values.remarks),
            handlingInfo: toNullableString(values.handlingInfo),

            subtotal: toNullableDecimal(subtotal),
            grandTotal: toNullableDecimal(grandTotal),
            charges: toNullableDecimal(subtotal),
            totalAmount: toNullableDecimal(grandTotal),
        };

        if (isEditing) {
            updateMutation.mutate(normalized);
        } else {
            createMutation.mutate(normalized);
        }
    };

    return (
        <>
        <div
            className="modal fade"
            id="createArrivalNoticeModal"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Arrival Notice</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" />
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        <form onSubmit={handleSubmit(onSubmit)}>

                            {/* -------- ALL YOUR UI BELOW (NOT CHANGED) ---------- */}

                            {/* Top Section */}
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Job No/Ref No</label>
                                    <Controller name="jobNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">CAN No</label>
                                    <Controller name="canNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">CAN Date</label>
                                    <Controller
                                        name="canDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="date" className="form-control" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">MAWB No</label>
                                    <Controller name="mawbNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">HAWB No</label>
                                    <Controller name="hawbNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Branch</label>
                                    <Controller name="branch" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* Shipper */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold d-flex align-items-center gap-2">
                                        Shipper's Name & Address <FaSearch className="ms-2 text-primary" />
                                    </label>
                                    <Controller name="shipperName" control={control} render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="shipperAddress" control={control} render={({ field }) => <textarea {...field} rows={4} className="form-control" />} />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold d-flex align-items-center gap-2">
                                        Not Negotiable &nbsp; <strong>Air Waybill</strong> <FaSearch className="ms-2 text-primary" />
                                    </label>
                                    <Controller name="airwbName" control={control} render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="airwbAddress" control={control} render={({ field }) => <textarea {...field} rows={4} className="form-control bg-light" />} />
                                </div>
                            </div>

                            {/* Consignee */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Consignee Name & Address</label>
                                    <Controller name="consigneeName" control={control} render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="consigneeAddress" control={control} render={({ field }) => <textarea {...field} rows={4} className="form-control" />} />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Notify Name & Address</label>
                                    <Controller name="notifyName" control={control} render={({ field }) => <input {...field} className="form-control mb-2" />} />
                                    <Controller name="notifyAddress" control={control} render={({ field }) => <textarea {...field} rows={4} className="form-control" />} />
                                </div>
                            </div>

                            {/* Flight details */}
                            <hr className="my-3" />

                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Origin</label>
                                    <Controller name="origin" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Destination</label>
                                    <Controller name="destination" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Flight No</label>
                                    <Controller name="flightNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Departure Date</label>
                                    <Controller name="departureDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Arrival Date</label>
                                    <Controller name="arrivalDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>
                            </div>

                            {/* Weights */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">No.of Pieces RCP</label>
                                    <Controller name="piecesRCP" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Gross Weight</label>
                                    <Controller name="grossWeight" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Chargeable Weight</label>
                                    <Controller name="chargeableWeight" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Handling Info</label>
                                    <Controller name="handlingInfo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* Invoice */}
                            <div className="row g-3 mt-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice No</label>
                                    <Controller name="shipperInvoiceNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice Date</label>
                                    <Controller name="shipperInvoiceDate" control={control} render={({ field }) => <input {...field} type="date" className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice Amount</label>
                                    <Controller name="shipperInvoiceAmount" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="mt-3">
                                <label className="form-label fw-bold">Remarks</label>
                                <Controller name="remarks" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                            </div>

                            {/* Charges table */}
                            <div className="mt-4" style={{ overflowX: "auto" }}>
                                <table className="table table-bordered table-striped">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: 36 }}><input type="checkbox" /></th>
                                            <th>Description</th>
                                            <th>SAC</th>
                                            <th>Currency</th>
                                            <th>Qty</th>
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
                                        {charges.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="text-center text-muted py-3">
                                                    No charges added yet
                                                </td>
                                            </tr>
                                        ) : (
                                            charges.map((r, index) => (
                                                <tr key={r?.id ?? index}>
                                                    <td><input type="checkbox" /></td>
                                                    <td>{r?.description ?? ""}</td>
                                                    <td>{r?.sac ?? ""}</td>
                                                    <td>{r?.currency ?? ""}</td>
                                                    <td>{r?.qty ?? ""}</td>
                                                    <td>{r?.amount ?? ""}</td>
                                                    <td>{r?.exRate ?? ""}</td>
                                                    <td className="text-success fw-bold">{r?.amountInInr ?? r?.amountInINR ?? ""}</td>
                                                    <td>{r?.gst ?? ""}</td>
                                                    <td>{r?.cgst ?? ""}</td>
                                                    <td>{r?.sgst ?? ""}</td>
                                                    <td>{r?.igst ?? ""}</td>
                                                    <td>{r?.total ?? ""}</td>
                                                </tr>
                                            ))
                                        )}

                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="text-end fw-bold">Subtotal</td>
                                            <td className="fw-bold text-end">{subtotal}</td>
                                            <td colSpan={3}></td>
                                            <td></td>
                                        </tr>

                                        <tr>
                                            <td colSpan={7}></td>
                                            <td className="text-end fw-bold">Total</td>
                                            <td className="fw-bold text-end">{grandTotal}</td>
                                            <td colSpan={3}></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Buttons */}
                            <div className="mt-3 d-flex justify-content-end gap-2">
                                {/* Print is handled in ArrivalNotice view via PdfPreviewModal */}
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                    onClick={() => {
                                        setEditData?.(null);
                                        initializedRef.current = false;
                                        lastEditIdRef.current = null;
                                        reset({
                                            ...autoFilledDefaults,
                                            charges: mappedCharges.length > 0 ? mappedCharges : [],
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? (
                                        <>
                                            <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading
                                        </>
                                    ) : (
                                        isEditing ? "Update" : "Save"
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </div>
        {/* PDF preview is centralized in view page, not here */}
        </>
    );
};

export default CreateArrivalNotice;
