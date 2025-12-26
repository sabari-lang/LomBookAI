import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createQuotation, updateQuotation, getQuotationDetails, getSalesPersons, uploadQuotationFile } from "../api/quotationApi";
import { toUiDDMMYYYY, toApiYYYYMMDD } from "../utils/dateFormat";
import SearchableCustomerInput from "../components/SearchableCustomerInput";
import FileUploadField from "../components/FileUploadField";
import { notifySuccess, notifyError } from "../../../utils/notifications";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";

const BOUND_OPTIONS = [
    "Select Bound",
    "Air Import(C)",
    "Air Export(C)",
    "Sea Import(C)",
    "Sea Export(C)",
    "Air Import(P)",
    "Air Export(P)",
    "Sea Import(P)",
    "Sea Export(P)",
    "VALUE ADDED SERVICE",
];

const STATUS_OPTIONS = ["Open", "In Progress", "Won", "Lost"];

const SHIPMENT_OPTIONS = [
    "--Select--",
    "CIF",
    "C & F",
    "CAF",
    "CFR",
    "CPT",
    "DAP",
    "DDP",
    "DDU",
    "EXW",
    "FAS",
    "FCA",
    "FOB",
];

const QuotationForm = ({ mode = "N" }) => {
    const navigate = useNavigate();
    const { qid } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = Boolean(qid);
    const isViewMode = searchParams.get("view") === "true";
    const queryClient = useQueryClient();

    const [salesPersons, setSalesPersons] = useState([]);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [existingFile, setExistingFile] = useState(null);

    const defaultValues = {
        customerName: "",
        quotationDate: new Date(),
        notes: "",
        quotationNo: "",
        salesPerson: "",
        expiryDate: null,
        bound: "",
        status: "Open",
        shipment: "",
        subject: "",
        commodity: "",
        address: "",
    };

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues,
    });

    // Fetch quotation details if editing
    const { data: quotationData, isLoading: loadingDetails } = useQuery({
        queryKey: ["quotation", qid],
        queryFn: () => getQuotationDetails({ qid }),
        enabled: isEdit,
    });

    // Fetch sales persons
    useEffect(() => {
        getSalesPersons()
            .then((data) => {
                const persons = data?.data || data?.salesPersons || data || [];
                setSalesPersons(persons);
                if (persons.length > 0 && !isEdit) {
                    // Set default to admin if exists, otherwise first person
                    const admin = persons.find((p) => p.name?.toLowerCase().includes("admin"));
                    setValue("salesPerson", admin?.id || admin?.name || persons[0]?.id || persons[0]?.name || "");
                }
            })
            .catch((err) => {
                console.error("Error fetching sales persons:", err);
            });
    }, [isEdit, setValue]);

    // Populate form when quotation data loads
    useEffect(() => {
        if (quotationData && isEdit) {
            const data = quotationData.data || quotationData;
            reset({
                customerName: data.customerName || "",
                quotationDate: data.quotationDate ? new Date(data.quotationDate) : new Date(),
                notes: data.notes || "",
                quotationNo: data.quotationNo || data.quotationNumber || "",
                salesPerson: data.salesPerson || data.salesPersonId || "",
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                bound: data.bound || "",
                status: data.status || "Open",
                shipment: data.shipment || "",
                subject: data.subject || "",
                commodity: data.commodity || "",
                address: data.address || "",
            });
            if (data.fileUrl) {
                setExistingFile({ url: data.fileUrl, name: data.fileName || "Quotation File" });
            }
        }
    }, [quotationData, isEdit, reset]);

    const createMutation = useMutation({
        mutationFn: ({ payload }) => createQuotation({ mode, payload }),
        onSuccess: async (data) => {
            const createdQid = data?.data?.id || data?.id || data?.qid;
            
            // Upload file if provided
            if (uploadedFile && createdQid) {
                try {
                    await uploadQuotationFile({ qid: createdQid, file: uploadedFile });
                } catch (err) {
                    console.error("Error uploading file:", err);
                    notifyError("Quotation created but file upload failed");
                }
            }
            
            queryClient.invalidateQueries(["quotations", mode]);
            notifySuccess("Quotation created successfully");
            navigate(`/estimates/quotation-${mode.toLowerCase()}`);
        },
        onError: (error) => {
            handleProvisionalError(error, "Create Quotation");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ qid, payload }) => updateQuotation({ qid, payload }),
        onSuccess: async () => {
            // Upload file if reuploaded
            if (uploadedFile && qid) {
                try {
                    await uploadQuotationFile({ qid, file: uploadedFile });
                } catch (err) {
                    console.error("Error uploading file:", err);
                    notifyError("Quotation updated but file upload failed");
                }
            }
            
            queryClient.invalidateQueries(["quotations", mode]);
            queryClient.invalidateQueries(["quotation", qid]);
            notifySuccess("Quotation updated successfully");
            navigate(`/estimates/quotation-${mode.toLowerCase()}`);
        },
        onError: (error) => {
            handleProvisionalError(error, "Update Quotation");
        },
    });

    const onSubmit = (data) => {
        // Validation
        if (!data.customerName || !data.customerName.trim()) {
            notifyError("Customer Name is required");
            return;
        }
        if (!data.salesPerson) {
            notifyError("Sales Person is required");
            return;
        }
        if (!data.bound || data.bound === "Select Bound") {
            notifyError("Bound is required");
            return;
        }
        if (!data.status) {
            notifyError("Status is required");
            return;
        }
        if (!data.quotationDate) {
            notifyError("Quotation Date is required");
            return;
        }
        if (data.expiryDate && data.expiryDate < data.quotationDate) {
            notifyError("Expiry Date must be greater than or equal to Quotation Date");
            return;
        }
        if (data.notes && data.notes.length > 500) {
            notifyError("Notes cannot exceed 500 characters");
            return;
        }

        const payload = {
            customerName: data.customerName.trim(),
            quotationDate: data.quotationDate,
            notes: data.notes || "",
            salesPerson: data.salesPerson,
            expiryDate: data.expiryDate || null,
            bound: data.bound,
            status: data.status,
            shipment: data.shipment || "",
            subject: data.subject || "",
            commodity: data.commodity || "",
            address: data.address || "",
        };

        if (isEdit) {
            updateMutation.mutate({ qid, payload });
        } else {
            createMutation.mutate({ payload });
        }
    };

    const titleText = isEdit ? (isViewMode ? "View Quotation" : "Edit Quotation") : "New Quotation";
    const breadcrumbText = isEdit ? "Quotation Edit" : "Quotation New";

    if (loadingDetails && isEdit) {
        return (
            <div className="container-fluid p-0">
                <div className="card shadow-sm m-3">
                    <div className="card-body text-center py-5">
                        <div className="spinner-border text-primary"></div> Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                {/* Breadcrumb */}
             

                {/* Yellow Title Bar */}
                <div className="bg-warning text-dark fw-semibold rounded-1 px-3 py-2">
                    <h5 className="m-0">{titleText}</h5>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="row g-3">
                            {/* Customer Name - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">
                                    Customer Name <span className="text-danger">*</span>
                                </label>
                                <Controller
                                    name="customerName"
                                    control={control}
                                    rules={{ required: "Customer Name is required" }}
                                    render={({ field }) => (
                                        <SearchableCustomerInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors.customerName?.message}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>

                            {/* Row 1: Quotation No, Sales Person, Bound, Status - 4 Equal Columns */}
                            <div className="col-12 col-lg-3">
                                <label className="form-label fw-semibold">Quotation No</label>
                                <Controller
                                    name="quotationNo"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="text"
                                            className="form-control w-100"
                                            readOnly
                                            placeholder={isEdit ? "" : "Auto"}
                                        />
                                    )}
                                />
                            </div>

                            <div className="col-12 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Sales Person <span className="text-danger">*</span>
                                </label>
                                <Controller
                                    name="salesPerson"
                                    control={control}
                                    rules={{ required: "Sales Person is required" }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className={`form-select w-100 ${errors.salesPerson ? "is-invalid" : ""}`}
                                            disabled={isViewMode}
                                        >
                                            <option value="">--Select--</option>
                                            {salesPersons.map((person, index) => {
                                                const id = person.id || person._id || person.name;
                                                const name = person.name || person.displayName || person;
                                                return (
                                                    <option key={index} value={id}>
                                                        {name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
                                />
                                {errors.salesPerson && (
                                    <div className="text-danger small mt-1">{errors.salesPerson.message}</div>
                                )}
                            </div>

                            <div className="col-12 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Bound <span className="text-danger">*</span>
                                </label>
                                <Controller
                                    name="bound"
                                    control={control}
                                    rules={{ required: "Bound is required" }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className={`form-select w-100 ${errors.bound ? "is-invalid" : ""}`}
                                            disabled={isViewMode}
                                        >
                                            {BOUND_OPTIONS.map((option) => (
                                                <option key={option} value={option === "Select Bound" ? "" : option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {errors.bound && (
                                    <div className="text-danger small mt-1">{errors.bound.message}</div>
                                )}
                            </div>

                            <div className="col-12 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Status <span className="text-danger">*</span>
                                </label>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: "Status is required" }}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className={`form-select w-100 ${errors.status ? "is-invalid" : ""}`}
                                            disabled={isViewMode}
                                        >
                                            {STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {errors.status && (
                                    <div className="text-danger small mt-1">{errors.status.message}</div>
                                )}
                            </div>

                            {/* Row 2: Quotation Date, Expiry Date, Shipment - 3 Equal Columns */}
                            <div className="col-12 col-lg-4">
                                <label className="form-label fw-semibold">
                                    Quotation Date <span className="text-danger">*</span>
                                </label>
                                <Controller
                                    name="quotationDate"
                                    control={control}
                                    rules={{ required: "Quotation Date is required" }}
                                    render={({ field }) => (
                                        <DatePicker
                                            selected={field.value}
                                            onChange={field.onChange}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="dd-mm-yyyy"
                                            className={`form-control w-100 ${errors.quotationDate ? "is-invalid" : ""}`}
                                            showYearDropdown
                                            dropdownMode="select"
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                                {errors.quotationDate && (
                                    <div className="text-danger small mt-1">{errors.quotationDate.message}</div>
                                )}
                            </div>

                            <div className="col-12 col-lg-4">
                                <label className="form-label fw-semibold">Expiry Date</label>
                                <Controller
                                    name="expiryDate"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            selected={field.value}
                                            onChange={field.onChange}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="dd-mm-yyyy"
                                            className="form-control w-100"
                                            showYearDropdown
                                            dropdownMode="select"
                                            minDate={watch("quotationDate")}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>

                            <div className="col-12 col-lg-4">
                                <label className="form-label fw-semibold">Shipment</label>
                                <Controller
                                    name="shipment"
                                    control={control}
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            className="form-select w-100"
                                            disabled={isViewMode}
                                        >
                                            {SHIPMENT_OPTIONS.map((option) => (
                                                <option key={option} value={option === "--Select--" ? "" : option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>

                            {/* Subject - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">Subject</label>
                                <Controller
                                    name="subject"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="text"
                                            className="form-control w-100"
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>

                            {/* Commodity - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">Commodity</label>
                                <Controller
                                    name="commodity"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            className="form-control w-100"
                                            rows={4}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>

                            {/* Address - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">Address</label>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            className="form-control w-100"
                                            rows={4}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>

                            {/* Notes - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">Notes</label>
                                <Controller
                                    name="notes"
                                    control={control}
                                    rules={{
                                        maxLength: {
                                            value: 500,
                                            message: "Notes cannot exceed 500 characters",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            className={`form-control w-100 ${errors.notes ? "is-invalid" : ""}`}
                                            rows={6}
                                            maxLength={500}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                                <small className="text-muted">
                                    {watch("notes")?.length || 0}/500 characters
                                </small>
                                {errors.notes && (
                                    <div className="text-danger small mt-1">{errors.notes.message}</div>
                                )}
                            </div>

                            {/* File Upload - Full Width */}
                            <div className="col-12">
                                <label className="form-label fw-semibold">Upload File</label>
                                <Controller
                                    name="file"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUploadField
                                            value={uploadedFile}
                                            onChange={(file) => {
                                                setUploadedFile(file);
                                                field.onChange(file);
                                            }}
                                            existingFileUrl={existingFile?.url}
                                            existingFileName={existingFile?.name}
                                            disabled={isViewMode}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        {!isViewMode && (
                            <div className="d-flex justify-content-start pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createMutation.isLoading || updateMutation.isLoading}
                                >
                                    {createMutation.isLoading || updateMutation.isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {isEdit ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        isEdit ? "Update" : "Create"
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary ms-2"
                                    onClick={() => navigate(`/estimates/quotation-${mode.toLowerCase()}`)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuotationForm;
