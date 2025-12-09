import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";

import DownloadIcon from "@mui/icons-material/Download";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { saveAs } from "file-saver";


import { useLocation, useNavigate } from "react-router-dom";

import moment from "moment";
import { useDispatch } from "react-redux";

import { createInvoice, deleteInvoice, getInvoices } from "./api";
import { removeInvoice } from "../redux/invoiceslice/InvoiceSlice";
import { images } from "../../assets/images/Image";




const InvoiceAgentForm = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        setValue,
        watch,
        getValues,
        reset,
    } = useForm({
        mode: "onChange",
        defaultValues: {
            InvoiceName: "N/A",
            VendorName: "",
            VendorAddress: "",
            InvoiceNumber: "",
            CreatedAt: new Date().toISOString().split("T")[0], // yyyy-mm-dd
            Currency: "INR",
            Gst: 0,
            Total: 0,
            Status: "DRAFT",

            LineItems: [
                {
                    Description: "",
                    HsnSac: "",
                    Qty: 1,
                    Unit: "",
                    UnitPrice: 0,
                    Discount: 0,
                    Igst: 0,
                    Cgst: 0,
                    Sgst: 0,
                    TaxRate: 18,
                    BatchNumbers: "",
                    Per: "",
                    LineSubtotal: 0,
                    LineTax: 0,
                    LineTotal: 0,
                },
            ],

            PaymentMode: "",
            VehicleNo: "",
            Destination: "",
            PaymentTerms: "",
            VendorGst: "",
            Po: "",
            VendorEmail: "",
            VendorPhone: "",
            VendorState: "",
            VendorStateCode: "",
            BankDetails: "",
            CustomerName: "N/A",
            CustomerGST: "",
            BillingAddress: "",
            ShippingAddress: "",
            State: "",
            PlaceOfSupply: "",
            PlaceOfSupplyCode: "",
            EWayBillNo: "",
            EwayBillDate: new Date().toISOString().split("T")[0],
            ReferenceDate: new Date().toISOString().split("T")[0],
            BuyersOrderDate: new Date().toISOString().split("T")[0],
            DeliveryNoteDate: new Date().toISOString().split("T")[0],
            DueDate: new Date().toISOString().split("T")[0],
            DeliveryNote: "",
            ReferenceNo: "",
            BuyersOrderNo: "",
            DispatchDocNo: "",
            DispatchedThrough: "",
            BillOfLadingNo: "",
            TermsOfDelivery: "",
            CompanyPAN: "",
            Declaration: "",
            AuthorisedSignatory: "",
            Notes: "",
        },
    });
    // ✅ Hook setup with PascalCase name
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "LineItems",
    });
    const { state } = useLocation();
    console.log("Edit state:", state);
    let invoicedata = state || {};
    const location = useLocation();
    const hasSubmittedRef = useRef(false);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postLoading, setPostLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [downloadloading, setDownLoading] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showRange, setShowRange] = useState(false);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    let recordsPerPage = 8;

    // ✅ Watch line items in PascalCase
    const items = useWatch({ control, name: "LineItems" }) || [];

    // ✅ Electron keyboard refresh helper
    const refreshKeyboard = () => {
        try {
            if (window?.electronAPI?.refreshKeyboard) {
                window.electronAPI.refreshKeyboard();
            }
        } catch (e) {
            // ignore if not running inside Electron
        }
    };


    // ✅ Auto-split GST → CGST + SGST (Half each)
    useEffect(() => {
        items?.forEach((row, i) => {
            const gst = Number(row?.Gst) || 0;

            // Half split for CGST / SGST
            const half = gst / 2;

            // Update CGST
            if (row?.Cgst !== half) {
                setValue(`LineItems.${i}.Cgst`, half, { shouldDirty: true });
            }

            // Update SGST
            if (row?.Sgst !== half) {
                setValue(`LineItems.${i}.Sgst`, half, { shouldDirty: true });
            }

            // IGST always 0 for now (intrastate)
            if (row?.Igst !== 0) {
                setValue(`LineItems.${i}.Igst`, 0, { shouldDirty: true });
            }
        });
    }, [items, setValue]);




    // 👉 Subtotal
    const subtotal = items?.reduce((sum, item) => {
        const qty = Number(item?.Qty) || 0;
        const price = Number(item?.UnitPrice) || 0;
        return sum + qty * price;
    }, 0);

    // 👉 GST amount (based on GST %)
    const taxTotal = items?.reduce((sum, item) => {
        const qty = Number(item?.Qty) || 0;
        const price = Number(item?.UnitPrice) || 0;
        const gst = Number(item?.Gst) || 0;

        const base = qty * price;

        return sum + (gst / 100) * base;
    }, 0);

    // 👉 Final Total
    const grandTotal = subtotal + taxTotal;

    // 👉 Update form totals
    useEffect(() => {
        setValue("Currency", subtotal.toFixed(2));
        setValue("Gst", taxTotal.toFixed(2));
        setValue("Total", grandTotal.toFixed(2));
    }, [subtotal, taxTotal, grandTotal, setValue, items]);


    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInvoices();
            setRecords(res || []); // if res is falsy, fallback to []
        } catch (error) {
            console.error("❌ Error fetching invoices:", error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    // STATE VALUES TO EDIT FORM
    useEffect(() => {
        if (!state) return;

        // ✅ Scalar fields (right side camelCase, left side PascalCase)
        // setValue("InvoiceName", state?.invoiceName ?? "");
        setValue("VendorName", state?.vendorName ?? "");
        setValue("VendorAddress", state?.vendorAddress ?? "");
        setValue("InvoiceNumber", state?.invoiceNumber ?? "");
        setValue("Status", state?.status ?? "DRAFT");
        setValue("Currency", state?.currency ?? "INR");

        setValue(
            "BuyersOrderDate",
            state?.BuyersOrderDate
                ? new Date(state?.BuyersOrderDate).toISOString().slice(0, 10)
                : ""
        );

        const dueDateValue = state?.dueDate ?? "";
        setValue(
            "DueDate",
            dueDateValue ? new Date(dueDateValue).toISOString().slice(0, 10) : ""
        );

        // ✅ Numeric and other scalars
        setValue("Total", Number(state?.total) || 0);
        setValue("Gst", Number(state?.gst) || 0);
        setValue("PaymentTerms", state?.paymentTerms ?? "");
        setValue("VehicleNo", state?.vehicleNo ?? "");
        setValue("Po", state?.po ?? "");
        setValue("PaymentMode", state?.paymentMode ?? "");
        setValue("Destination", state?.destination ?? "");
        setValue("EWayBillNo", state?.eWayBillNo ?? "");
        setValue("DispatchedThrough", state?.dispatchedThrough ?? "");
        setValue("BillOfLadingNo", state?.billOfLadingNo ?? "");
        setValue("TermsOfDelivery", state?.termsOfDelivery ?? "");
        setValue("DispatchDocNo", state?.dispatchDocNo ?? "");
        setValue("VendorGst", state?.vendorGst ?? "");

        // ✅ Normalize invoice date from multiple possible property keys
        const invoiceDateValue =
            state?.invoiceDate ??
            state?.InvoiceDate ??
            state?.EwayBillDate ??
            state?.ewayBillDate ??
            state?.invoice_date ?? // optional: handle snake_case if needed
            state?.Invoice_Date ??
            "";

        setValue(
            "EwayBillDate",
            invoiceDateValue
                ? new Date(invoiceDateValue).toISOString().slice(0, 10)
                : ""
        );

        setValue(
            "ReferenceDate",
            state?.referenceDate
                ? new Date(state?.referenceDate).toISOString().slice(0, 10)
                : ""
        );

        setValue(
            "DeliveryNoteDate",
            state?.deliveryNoteDate
                ? new Date(state?.deliveryNoteDate).toISOString().slice(0, 10)
                : ""
        );

        // ✅ LineItems array mapping — must use replace()
        // const mappedItems = Array.isArray(state?.lineItems)
        //   ? state.lineItems.map((it) => {
        //       const taxRate = Number(it?.taxRate);
        //       return {
        //         Description: it?.description ?? it?.descriptionOfGoods ?? "",
        //         HsnSac: it?.hsnSac ?? it?.hsnCode ?? "",
        //         Qty: Number(it?.qty ?? it?.quantity ?? 0),
        //         Unit: it?.unit ?? "",
        //         UnitPrice: Number(it?.unitPrice ?? 0),
        //         Discount: Number(it?.discount ?? 0),
        //         TaxRate: !Number.isFinite(taxRate) || taxRate === 0 ? 18 : taxRate,
        //         Cgst: Number(it?.cgst ?? 0),
        //         Sgst: Number(it?.sgst ?? 0),
        //         Igst: Number(it?.igst ?? 0),
        //         BatchNumbers: it?.batchNumbers ?? "",
        //         Per: it?.per ?? "",
        //         LineSubtotal: Number(it?.lineSubtotal ?? 0),
        //         LineTax: Number(it?.lineTax ?? 0),
        //         LineTotal: Number(it?.lineTotal ?? 0),
        //       };
        //     })
        //   : [];

        // ✅ LineItems array mapping — supports both camelCase & PascalCase keys
        const mappedItems = Array.isArray(state?.lineItems || state?.LineItems)
            ? (state?.lineItems || state?.LineItems)?.map((It) => {
                const TaxRate = Number(It?.TaxRate ?? It?.taxRate);

                return {
                    Description:
                        It?.Description ??
                        It?.description ??
                        It?.DescriptionOfGoods ??
                        It?.descriptionOfGoods ??
                        "",
                    HsnSac:
                        It?.HsnSac ?? It?.hsnSac ?? It?.HsnCode ?? It?.hsnCode ?? "",
                    Qty: Number(
                        It?.Qty ?? It?.qty ?? It?.Quantity ?? It?.quantity ?? 0
                    ),
                    Unit: It?.Unit ?? It?.unit ?? "",
                    UnitPrice: Number(It?.UnitPrice ?? It?.unitPrice ?? 0),
                    Discount: Number(It?.Discount ?? It?.discount ?? 0),
                    TaxRate: !Number.isFinite(TaxRate) || TaxRate === 0 ? 18 : TaxRate,
                    Cgst: Number(It?.Cgst ?? It?.cgst ?? 0),
                    Sgst: Number(It?.Sgst ?? It?.sgst ?? 0),
                    Igst: Number(It?.Igst ?? It?.igst ?? 0),
                    BatchNumbers: It?.BatchNumbers ?? It?.batchNumbers ?? "",
                    Per: It?.Per ?? It?.per ?? "",
                    LineSubtotal: Number(It?.LineSubtotal ?? It?.lineSubtotal ?? 0),
                    LineTax: Number(It?.LineTax ?? It?.lineTax ?? 0),
                    LineTotal: Number(It?.LineTotal ?? It?.lineTotal ?? 0),
                };
            })
            : [];
        refreshKeyboard();
        replace(mappedItems);
    }, [state, setValue, replace]);



    const onSubmit = async (data) => {
        // ✅ Helper to format date fields safely
        const formatDate = (value) => {
            if (!value) return new Date().toISOString();
            return new Date(value).toISOString();
        };

        // ✅ Build form data
        const formData = {
            InvoiceName: data?.InvoiceName ?? "N/A",
            VendorName: data?.VendorName ?? "",
            VendorAddress: data?.VendorAddress ?? "",
            VendorGst: data?.VendorGst ?? "",
            VendorEmail: data?.VendorEmail ?? "",
            VendorPhone: data?.VendorPhone ?? "",
            VendorState: data?.VendorState ?? "",
            VendorStateCode: data?.VendorStateCode ?? "",
            BankDetails: data?.BankDetails ?? "",
            CustomerName: data?.CustomerName ?? "N/A",
            CustomerGST: data?.CustomerGST ?? "",
            BillingAddress: data?.BillingAddress ?? "",
            ShippingAddress: data?.ShippingAddress ?? "",
            State: data?.State ?? "",
            PlaceOfSupply: data?.PlaceOfSupply ?? "",
            PlaceOfSupplyCode: data?.PlaceOfSupplyCode ?? "",
            InvoiceNumber: data?.InvoiceNumber ?? "",
            CreatedAt: formatDate(data?.CreatedAt),
            DueDate: formatDate(data?.DueDate),
            Currency: data?.Currency ?? "INR",
            PaymentTerms: data?.PaymentTerms ?? "",
            PaymentMode: data?.PaymentMode ?? "",
            Po: data?.Po ?? "",
            Notes: data?.Notes ?? "",
            Gst: Number(data?.Gst) || 0,
            Total: Number(data?.Total) || 0,
            LineItems: data?.LineItems ?? [],
            Status: data?.Status ?? "DRAFT",
            VehicleNo: data?.VehicleNo ?? "",
            Destination: data?.Destination ?? "",
            EWayBillNo: data?.EWayBillNo ?? "",
            EwayBillDate: formatDate(data?.EwayBillDate),
            ReferenceDate: formatDate(data?.ReferenceDate),
            BuyersOrderDate: formatDate(data?.BuyersOrderDate),
            DeliveryNoteDate: formatDate(data?.DeliveryNoteDate),
            DeliveryNote: data?.DeliveryNote ?? "",
            ReferenceNo: data?.ReferenceNo ?? "",
            BuyersOrderNo: data?.BuyersOrderNo ?? "",
            DispatchDocNo: data?.DispatchDocNo ?? "",
            DispatchedThrough: data?.DispatchedThrough ?? "",
            BillOfLadingNo: data?.BillOfLadingNo ?? "",
            TermsOfDelivery: data?.TermsOfDelivery ?? "",
            CompanyPAN: data?.CompanyPAN ?? "",
            Declaration: data?.Declaration ?? "",
            AuthorisedSignatory: data?.AuthorisedSignatory ?? "",
        };

        try {
            setPostLoading(true);

            const response = await createInvoice(formData);

            if (response) {
                // ✅ Show success alert
                alert("✅ Invoice submitted successfully!");

                // Optional: clear from local state if needed
                const invoiceToRemove = formData?.InvoiceNumber;
                if (invoiceToRemove) {
                    dispatch(removeInvoice(invoiceToRemove));
                }

                reset(); // Clear form values
                await fetchRecords(); // Refresh list
                navigate(location.pathname, { replace: true }); // Clear router state
                refreshKeyboard();
            }
        } catch (err) {
            console.error("❌ Error submitting invoice:", err);
            alert("❌ Failed to submit invoice. Please try again."); // ✅ Show error alert
            refreshKeyboard();
        } finally {
            setPostLoading(false);
        }
    };

    // DELETE API
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this invoice?"))
            return;

        try {
            setDeleteLoading(true);
            const res = await deleteInvoice(id);
            console.log("Invoice deleted:", res);

            // Option 1: Refresh page
            // window.location.reload();
            await fetchRecords();
            // Option 2: Update state without reload
            setRecords((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    // PAGINATION LOGIC START
    const totalPages = Math.ceil(records?.length / recordsPerPage);

    const getCurrentRecords = () => {
        const start = (currentPage - 1) * recordsPerPage;
        return records.slice(start, start + recordsPerPage);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const currentRecords = getCurrentRecords();

    // PAGINATION LOGIC END

    // DOWNLOADING EXCEL SHEET

    // "YYYY-MM-DD" in local time (no UTC shift)
    const ymd = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;

    const BASE_URL =
        "https://invoice-generator-101-gahjerfgddcefqf5.canadacentral-01.azurewebsites.net/api/invoices/download-multi-excel";
    const onApply = async () => {
        if (!fromDate || !toDate) return;

        // *** use the exact param names your API expects ***
        const params = {
            startDate: ymd(fromDate),
            endDate: ymd(toDate),
        };

        try {
            const res = await axios.get(BASE_URL, {
                params,
                responseType: "arraybuffer",
                headers: {
                    Accept:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream",
                },
            });

            // pick filename from Content-Disposition if present
            let filename = `Invoices_${params.startDate}_${params.endDate}.xlsx`;
            const dispo = res.headers["content-disposition"];
            if (dispo) {
                const m = dispo.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
                if (m && m[1]) filename = decodeURIComponent(m[1]);
            }

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(blob, filename);
        } catch (e) {
            console.error(e);
            alert(`Download failed: ${e?.message || "Unknown error"}`);
        }
    };

    // DOWNLOADING EXCEL SHEET END

    const onClick = async (id) => {
        try {
            setDownLoading(true);
            await handleDownload(id); // <-- call the separate function
        } finally {
            setDownLoading(false);
        }
    };

    // ✅ Watch relevant form fields
    const createdAt = useWatch({ control, name: "CreatedAt" });
    const paymentTerms = useWatch({ control, name: "PaymentTerms" });

    // ✅ Auto-calculate Due Date whenever CreatedAt or PaymentTerms changes
    useEffect(() => {
        if (createdAt && paymentTerms) {
            const dueDate = new Date(createdAt);
            dueDate.setDate(dueDate.getDate() + Number(paymentTerms));

            const formattedDueDate = dueDate.toISOString().split("T")[0];
            setValue("DueDate", formattedDueDate);
        } else {
            // Clear due date if required fields are not set
            setValue("DueDate", "");
        }
    }, [createdAt, paymentTerms, setValue]);

    return (
        <>
            <div className="container my-4">
                <div className="card shadow-lg mb-4">
                    <div className="card-body">
                        {/* Back */}
                        <div
                            style={{ width: 40, height: 40, cursor: "pointer" }}
                            onClick={() => navigate(-1)}
                        >
                            <span className="text-primary">&larr; Back</span>
                        </div>
                        <h4 className="text-primary fw-bold text-center mb-4">INVOICE</h4>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* 🔹 Top Fields */}
                            <div className="row g-4 mb-3">
                                {/* Invoice Number ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Invoice Number</label>
                                    <Controller
                                        control={control}
                                        name="InvoiceNumber"
                                        rules={{ required: "Invoice Number is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Invoice Date ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Invoice Date</label>
                                    <Controller
                                        control={control}
                                        name="EwayBillDate"
                                        rules={{ required: "Invoice Date is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    type="date"
                                                    className={`form-control ${fieldState.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Vendor Name ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Vendor Name</label>
                                    <Controller
                                        control={control}
                                        name="VendorName"
                                        rules={{ required: "Vendor Name is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Vendor Address ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Vendor Address</label>
                                    <Controller
                                        control={control}
                                        name="VendorAddress"
                                        rules={{ required: "Vendor Address is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <textarea
                                                    rows={2}
                                                    className={`form-control ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* PO Number ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">PO Number</label>
                                    <Controller
                                        control={control}
                                        name="Po"
                                        rules={{ required: "PO Number is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Vehicle Number ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Vehicle Number</label>
                                    <Controller
                                        control={control}
                                        name="VehicleNo"
                                        render={({ field }) => (
                                            <input type="text" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                {/* Payment Mode ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Payment Mode</label>
                                    <Controller
                                        control={control}
                                        name="PaymentMode"
                                        rules={{ required: "Payment Mode is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <select
                                                    className={`form-select ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                >
                                                    <option value="">Select Mode</option>
                                                    <option value="Cash">Cash</option>
                                                    <option value="Credit Card">Credit Card</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="UPI">UPI</option>
                                                </select>
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Payment Terms ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Payment Terms</label>
                                    <Controller
                                        control={control}
                                        name="PaymentTerms"
                                        rules={{ required: "Payment Terms are required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <select
                                                    className={`form-select ${fieldState.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                >
                                                    <option value="">Select Term</option>
                                                    <option value="30">30 Days</option>
                                                    <option value="45">45 Days</option>
                                                    <option value="60">60 Days</option>
                                                    <option value="90">90 Days</option>
                                                </select>
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>

                                {/* Due Date ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Due Date</label>
                                    <Controller
                                        control={control}
                                        name="DueDate"
                                        render={({ field }) => (
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={field.value ?? ""}
                                                readOnly
                                            />
                                        )}
                                    />
                                </div>

                                {/* Vendor GST ✅ Required */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Vendor GST</label>
                                    <Controller
                                        control={control}
                                        name="VendorGst"
                                        rules={{ required: "Vendor GST is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldState?.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                />
                                                {fieldState?.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState?.error?.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* 🔹 Dispatch Section */}
                            <hr className="my-4" />
                            <h6 className="fw-bold mb-3">Dispatch / Delivery Details</h6>

                            <div className="row g-4 mb-3">
                                {/* Dispatch Doc No ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Dispatch Doc No.</label>
                                    <Controller
                                        control={control}
                                        name="DispatchDocNo"
                                        render={({ field }) => (
                                            <input type="text" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                {/* Dispatched Through ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Dispatched Through</label>
                                    <Controller
                                        control={control}
                                        name="DispatchedThrough"
                                        render={({ field }) => (
                                            <input type="text" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                {/* Bill of Lading No ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">
                                        Bill of Lading / LR-RR No.
                                    </label>
                                    <Controller
                                        control={control}
                                        name="BillOfLadingNo"
                                        render={({ field }) => (
                                            <input type="text" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                {/* Terms of Delivery ❌ Optional */}
                                <div className="col-12 col-sm-6 col-md-3">
                                    <label className="form-label">Terms of Delivery</label>
                                    <Controller
                                        control={control}
                                        name="TermsOfDelivery"
                                        render={({ field }) => (
                                            <input type="text" className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* 🔹 Items Section */}
                            <hr className="my-4" />
                            <h6 className="fw-semibold mb-3">Items</h6>

                            {fields?.map((item, index) => (
                                <div className="row g-3 mb-2" key={item?.id ?? index}>

                                    {/* Description */}
                                    <div className="col-12 col-sm-3">
                                        <label className="form-label">Description</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Description`}
                                            rules={{ required: "Description is required" }}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${fieldState?.error ? "is-invalid" : ""}`}
                                                        {...field}
                                                    />
                                                    {fieldState?.error && (
                                                        <div className="invalid-feedback">{fieldState?.error?.message}</div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    {/* HSN / SAC */}
                                    <div className="col-12 col-sm-2">
                                        <label className="form-label">HSN/SAC</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.HsnSac`}
                                            rules={{ required: "HSN/SAC is required" }}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${fieldState?.error ? "is-invalid" : ""}`}
                                                        {...field}
                                                    />
                                                    {fieldState?.error && (
                                                        <div className="invalid-feedback">{fieldState?.error?.message}</div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    {/* QTY */}
                                    <div className="col-6 col-sm-1">
                                        <label className="form-label">Qty</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Qty`}
                                            rules={{ required: "Quantity is required" }}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <input
                                                        type="number"
                                                        className={`form-control ${fieldState?.error ? "is-invalid" : ""}`}
                                                        {...field}
                                                    />
                                                    {fieldState?.error && (
                                                        <div className="invalid-feedback">{fieldState?.error?.message}</div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    {/* UNIT PRICE */}
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label">Unit Price</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.UnitPrice`}
                                            rules={{ required: "Unit Price is required" }}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        className={`form-control ${fieldState?.error ? "is-invalid" : ""}`}
                                                        {...field}
                                                    />
                                                    {fieldState?.error && (
                                                        <div className="invalid-feedback">{fieldState?.error?.message}</div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    {/* GST INPUT */}
                                    <div className="col-6 col-sm-1">
                                        <label className="form-label">GST %</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Gst`}
                                            render={({ field }) => (
                                                <input type="number" step="any" className="form-control" {...field} />
                                            )}
                                        />
                                    </div>

                                    {/* CGST (Auto) */}
                                    <div className="col-4 col-sm-1">
                                        <label className="form-label">CGST %</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Cgst`}
                                            render={({ field }) => (
                                                <input type="number" className="form-control" readOnly {...field} />
                                            )}
                                        />
                                    </div>

                                    {/* SGST (Auto) */}
                                    <div className="col-4 col-sm-1">
                                        <label className="form-label">SGST %</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Sgst`}
                                            render={({ field }) => (
                                                <input type="number" className="form-control" readOnly {...field} />
                                            )}
                                        />
                                    </div>

                                    {/* IGST (Auto) */}
                                    <div className="col-4 col-sm-1">
                                        <label className="form-label">IGST %</label>
                                        <Controller
                                            control={control}
                                            name={`LineItems.${index}.Igst`}
                                            render={({ field }) => (
                                                <input type="number" className="form-control" readOnly {...field} />
                                            )}
                                        />
                                    </div>

                                    {/* ADD / REMOVE BUTTONS */}
                                    <div className="col-12 col-sm-2 d-flex align-items-end gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm w-50"
                                            onClick={() =>
                                                append({
                                                    Description: "",
                                                    HsnSac: "",
                                                    Qty: 1,
                                                    UnitPrice: 0,
                                                    Gst: 0,
                                                    Cgst: 0,
                                                    Sgst: 0,
                                                    Igst: 0,
                                                    LineSubtotal: 0,
                                                    LineTax: 0,
                                                    LineTotal: 0,
                                                })
                                            }
                                        >
                                            + Add
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm w-50"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}


                            {/* Payment Status ✅ Required */}
                            <div className="row g-4 mb-3">
                                <div className="col-12 col-sm-6 col-md-4">
                                    <label className="form-label">Payment Status</label>
                                    <Controller
                                        control={control}
                                        name="Status"
                                        rules={{ required: "Payment Status is required" }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <select
                                                    className={`form-select ${fieldState.error ? "is-invalid" : ""
                                                        }`}
                                                    {...field}
                                                >
                                                    <option value="">-- Select Status --</option>
                                                    <option value="DRAFT">Draft</option>
                                                    <option value="PENDING">Pending</option>
                                                    <option value="SUCCESS">Success</option>
                                                </select>
                                                {fieldState.error && (
                                                    <div className="invalid-feedback">
                                                        {fieldState.error.message}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* 🔹 Totals Section */}
                            <hr className="my-4" />
                            <div className="row mb-4">
                                <div className="col-12 col-sm-4">
                                    <label className="form-label">Currency</label>
                                    <Controller
                                        control={control}
                                        name="Currency"
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                className="form-control"
                                                readOnly
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-12 col-sm-4">
                                    <label className="form-label">Tax Total</label>
                                    <Controller
                                        control={control}
                                        name="Gst"
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                className="form-control"
                                                readOnly
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-12 col-sm-4">
                                    <label className="form-label fw-bold">Grand Total</label>
                                    <Controller
                                        control={control}
                                        name="Total"
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                className="form-control fw-bold text-primary"
                                                readOnly
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end align-items-center gap-2 mt-5 mb-2">
                                <button type="submit" className="btn btn-success shadow">
                                    {postLoading ? (
                                        <i className="fa fa-circle-o-notch fa-spin" />
                                    ) : (
                                        "Save Invoice"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="container my-4 ">
                <div className="card shadow-lg mb-4 p-4">
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <h5 className="mb-0" style={{ fontWeight: 600 }}>
                            Invoices Details
                        </h5>

                        <button
                            type="button"
                            className="btn btn-primary d-flex align-items-center gap-2"
                            onClick={() => setShowRange((s) => !s)}
                        >
                            Download
                        </button>
                    </div>
                    {showRange && (
                        <div className="d-flex gap-2 align-items-end my-3">
                            <div>
                                <label className="form-label small mb-1">From</label>
                                <DatePicker
                                    className="form-control"
                                    selected={fromDate}
                                    onChange={(d) => {
                                        setFromDate(d);
                                        if (toDate && d && d > toDate) setToDate(d);
                                    }}
                                    selectsStart
                                    startDate={fromDate}
                                    endDate={toDate}
                                    maxDate={toDate || new Date()}
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="Start date"
                                    /* ⬇️ Year dropdown */
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>

                            <div>
                                <label className="form-label small mb-1">To</label>
                                <DatePicker
                                    className="form-control"
                                    selected={toDate}
                                    onChange={(d) => setToDate(d)}
                                    selectsEnd
                                    startDate={fromDate}
                                    endDate={toDate}
                                    minDate={fromDate || undefined}
                                    maxDate={new Date()}
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="End date"
                                    /* ⬇️ Year dropdown */
                                    showYearDropdown
                                    dropdownMode="select"
                                />
                            </div>

                            <button
                                className="btn btn-success"
                                onClick={onApply}
                                disabled={!fromDate || !toDate}
                            >
                                Apply
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center py-8">
                            <div
                                className="spinner-border"
                                role="status"
                                aria-label="Loading"
                            />
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th className="invoice-table-head">INVOICE NUMBER</th>
                                        <th className="invoice-table-head">DATE</th>
                                        <th className="invoice-table-head">VENDOR NAME</th>
                                        <th className="invoice-table-head">GRAND TOTAL</th>
                                        <th className="invoice-table-head">PAYMENT STATUS</th>
                                        <th className="invoice-table-head">ACTION</th>
                                        {/* <th>Payment Mode</th>
              <th>Source</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center">
                                                No records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentRecords?.map((rec, idx) => (
                                            <tr key={rec._id || rec.Id || rec.id || idx}>
                                                <td className="invoice-table-data">
                                                    {rec.InvoiceNumber ||
                                                        rec.invoiceNumber ||
                                                        rec.invoice_no ||
                                                        "-"}
                                                </td>
                                                <td className="invoice-table-data">
                                                    {(rec.InvoiceDate &&
                                                        moment(rec.InvoiceDate).format("DD-MM-YYYY")) ||
                                                        (rec.invoiceDate &&
                                                            moment(rec.invoiceDate).format("DD-MM-YYYY")) ||
                                                        (rec.EwayBillDate &&
                                                            moment(rec.EwayBillDate).format("DD-MM-YYYY")) ||
                                                        (rec.ewayBillDate &&
                                                            moment(rec.ewayBillDate).format("DD-MM-YYYY")) ||
                                                        "-"}
                                                </td>
                                                <td className="invoice-table-data">
                                                    {rec.VendorName ||
                                                        rec.vendorName ||
                                                        rec.vendor_name ||
                                                        "-"}
                                                </td>
                                                <td className="invoice-table-data">
                                                    {rec.Total || rec.total || rec.grand_total || "-"}
                                                </td>
                                                <td className="invoice-table-data">
                                                    {rec.Status ||
                                                        rec.status ||
                                                        rec.payment_status ||
                                                        "-"}
                                                </td>
                                                <td className="invoice-table-data">
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            className="btn p-0 border-0 bg-transparent"
                                                            style={{ width: 40, height: 40 }}
                                                            onClick={() => handleDelete(rec.Id || rec.id)}
                                                            title="Delete"
                                                        >
                                                            <img
                                                                src={images?.deleteIcon}
                                                                // src={Image?.d}
                                                                alt="Delete"
                                                                className="img-fluid"
                                                            />
                                                        </button>

                                                        {/* Download */}
                                                        <button
                                                            type="button"
                                                            className="btn p-0 border-0 bg-transparent"
                                                            style={{ width: 40, height: 40 }}
                                                            onClick={() =>
                                                                navigate("/invoiceDownload", { state: rec })
                                                            }
                                                            disabled={downloadloading}
                                                            title="Download Excel"
                                                        >
                                                            {loading ? (
                                                                <div
                                                                    className="spinner-border spinner-border-sm text-primary"
                                                                    role="status"
                                                                >
                                                                    <span className="visually-hidden">
                                                                        Loading…
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <img
                                                                    src={images?.downloadIcon}
                                                                    alt="Download"
                                                                    className="img-fluid"
                                                                />
                                                            )}
                                                        </button>

                                                        {/* <button
                                                            type="button"
                                                            class="btn btn-outline-primary"
                                                            onClick={() => {
                                                                navigate("/finance/payables", {
                                                                    state: rec,
                                                                });
                                                            }}
                                                        >
                                                            Payable
                                                        </button>

                                               
                                                        <button
                                                            type="button"
                                                            class="btn btn-outline-secondary"
                                                            onClick={() => {
                                                                navigate("/finance/receivables", {
                                                                    state: rec,
                                                                });
                                                            }}
                                                        >
                                                            Receivable
                                                        </button> */}

                                                        {/* Print */}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination Navigation */}
                    <nav
                        aria-label="Page navigation example"
                        className="mt-5 d-flex justify-content-center"
                    >
                        <ul className="pagination">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => goToPage(currentPage - 1)}
                                    aria-label="Previous"
                                >
                                    <span aria-hidden="true">&laquo;</span>
                                    <span className="sr-only">Previous</span>
                                </button>
                            </li>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                (page) => (
                                    <li
                                        key={page}
                                        className={`page-item ${currentPage === page ? "active" : ""
                                            }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => goToPage(page)}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                )
                            )}

                            <li
                                className={`page-item ${currentPage === totalPages ? "disabled" : ""
                                    }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => goToPage(currentPage + 1)}
                                    aria-label="Next"
                                >
                                    <span aria-hidden="true">&raquo;</span>
                                    <span className="sr-only">Next</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>{" "}
            </div>
        </>
    );
};

export default InvoiceAgentForm;
