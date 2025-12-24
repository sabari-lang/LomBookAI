import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBankingTransaction, updateBankingTransaction } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { refreshKeyboard } from "../../utils/refreshKeyboard";
import { notifySuccess, notifyError, notifyInfo } from "../../utils/notifications";

const AddBank = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const editData = location.state;
    const editId = editData?.id || editData?._id;
    const isEditing = Boolean(editId);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm({
        defaultValues: {
            accountType: "Bank",
            accountName: "",
            accountCode: "",
            currency: "INR",
            accountNumber: "",
            bankName: "",
            ifsc: "",
            description: "",
            primary: false,
        },
    });

    // Toggle UI based on account type
    const accountType = watch("accountType");
    const isBank = accountType === "Bank";
    const isCredit = accountType === "Credit Card";

    // Load edit data
    useEffect(() => {
        if (!editId) return;
        reset({
            accountType: editData?.accountType || "Bank",
            accountName: editData?.accountName || "",
            accountCode: editData?.accountCode || "",
            currency: editData?.currency || "INR",
            accountNumber: editData?.accountNumber || "",
            bankName: editData?.bankName || "",
            ifsc: editData?.ifsc || "",
            description: editData?.description || "",
            primary: Boolean(editData?.primary),
        });
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
    }, [editId]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (payload) => createBankingTransaction(payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["banking-transactions"]);
            notifySuccess("Bank Account created successfully");
            reset();
            navigate("/banking");
        },
        onError: (error) => handleProvisionalError(error, "Create Bank Account"),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateBankingTransaction(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["banking-transactions"]);
            notifySuccess("Bank Account updated successfully");
            navigate("/banking");
        },
        onError: (error) => handleProvisionalError(error, "Update Bank Account"),
    });

    const onSubmit = (data) => {
        // Build payload matching defaultValues structure exactly
        const payload = {
            accountType: data?.accountType || "Bank",
            accountName: data?.accountName || "",
            accountCode: data?.accountCode || "",
            currency: data?.currency || "INR",
            accountNumber: data?.accountNumber || "",
            bankName: data?.bankName || "",
            ifsc: data?.ifsc || "",
            description: data?.description || "",
            primary: Boolean(data?.primary),
        };

        if (isEditing) {
            const id = editData?.id || editData?._id;
            updateMutation.mutate({ id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        // <div className="container-fluid bg-white p-4" style={{ fontSize: "14px" }}>
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">{isEditing ? "Edit Bank Account" : "Add Bank or Credit Card"}</h6>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Account Type */}
                <div className="row mb-3 align-items-center">
                    <label className="col-sm-2 col-form-label fw-semibold text-danger">
                        Select Account Type<span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-10 d-flex align-items-center gap-3">
                        <Controller
                            name="accountType"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            id="bank"
                                            value="Bank"
                                            checked={field.value === "Bank"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <label className="form-check-label" htmlFor="bank">
                                            Bank
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            id="creditCard"
                                            value="Credit Card"
                                            checked={field.value === "Credit Card"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <label className="form-check-label" htmlFor="creditCard">
                                            Credit Card
                                        </label>
                                    </div>
                                </>
                            )}
                        />
                    </div>
                </div>

                {/* Account Name */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold text-danger">
                        Account Name<span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-4">
                        <Controller
                            name="accountName"
                            control={control}
                            rules={{ required: "Account Name is required" }}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="text"
                                    className={`form-control form-control-sm ${errors.accountName ? "is-invalid" : ""
                                        }`}
                                    aria-invalid={Boolean(errors.accountName)}
                                />
                            )}
                        />
                        {errors.accountName && (
                            <div className="invalid-feedback">{errors.accountName.message}</div>
                        )}
                    </div>
                </div>

                {/* Account Code */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">Account Code</label>
                    <div className="col-sm-4">
                        <Controller
                            name="accountCode"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="text" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                {/* Currency */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold text-danger">
                        Currency<span className="text-danger">*</span>
                    </label>
                    <div className="col-sm-4">
                        <Controller
                            name="currency"
                            control={control}
                            rules={{ required: "Currency is required" }}
                            render={({ field }) => (
                                <select {...field} className={`form-select form-select-sm ${errors.currency ? "is-invalid" : ""}`} aria-invalid={Boolean(errors.currency)}>
                                    <option value="INR">INR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            )}
                        />
                        {errors.currency && (
                            <div className="invalid-feedback">{errors.currency.message}</div>
                        )}
                    </div>
                </div>

                {/* Account Number - Bank only (hidden for Credit Card per template) */}
                {isBank && (
                    <div className="row mb-3">
                        <label className="col-sm-2 col-form-label fw-semibold">Account Number</label>
                        <div className="col-sm-4">
                            <Controller
                                name="accountNumber"
                                control={control}
                                rules={{
                                    pattern: {
                                        value: /^[0-9\s-]*$/,
                                        message: "Only digits, spaces or hyphens are allowed"
                                    }
                                }}
                                render={({ field }) => (
                                    <input {...field} type="text" className={`form-control form-control-sm ${errors.accountNumber ? "is-invalid" : ""}`} aria-invalid={Boolean(errors.accountNumber)} />
                                )}
                            />
                            {errors.accountNumber && (
                                <div className="invalid-feedback">{errors.accountNumber.message}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bank Name */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">Bank Name</label>
                    <div className="col-sm-4">
                        <Controller
                            name="bankName"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="text" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                {/* IFSC - Bank only */}
                {isBank && (
                    <div className="row mb-3">
                        <label className="col-sm-2 col-form-label fw-semibold">IFSC</label>
                        <div className="col-sm-4">
                            <Controller
                                name="ifsc"
                                control={control}
                                rules={isBank ? {
                                    pattern: {
                                        value: /^[A-Za-z]{4}[0][A-Za-z0-9]{6}$/,
                                        message: "Enter a valid IFSC (e.g., HDFC0001234)"
                                    }
                                } : undefined}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="text"
                                        className={`form-control form-control-sm ${errors.ifsc ? "is-invalid" : ""}`}
                                        onBlur={(e) => field.onChange(e.target.value?.toUpperCase?.() || e.target.value)}
                                        aria-invalid={Boolean(errors.ifsc)}
                                    />
                                )}
                            />
                            {errors.ifsc && (
                                <div className="invalid-feedback">{errors.ifsc.message}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">Description</label>
                    <div className="col-sm-4">
                        <Controller
                            name="description"
                            control={control}
                            rules={{
                                maxLength: { value: 500, message: "Maximum 500 characters" }
                            }}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    className={`form-control form-control-sm ${errors.description ? "is-invalid" : ""}`}
                                    rows="3"
                                    placeholder="Max. 500 characters"
                                ></textarea>
                            )}
                        />
                        {errors.description && (
                            <div className="invalid-feedback">{errors.description.message}</div>
                        )}
                    </div>
                </div>

                {/* Make Primary */}
                <div className="row mb-4">
                    <div className="col-sm-2"></div>
                    <div className="col-sm-4">
                        <div className="form-check">
                            <Controller
                                name="primary"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="primary"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                )}
                            />
                            <label className="form-check-label" htmlFor="primary">
                                Make this primary
                            </label>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="row">
                    <div className="col-sm-2"></div>
                    <div className="col-sm-4 d-flex gap-2">
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-sm"
                            disabled={createMutation.isLoading || updateMutation.isLoading}
                        >
                            {createMutation.isLoading || updateMutation.isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                reset();
                                navigate("/banking");
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
            {/* Local style to mimic dotted label underline from template */}
            <style>{`
                .col-form-label { border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
            `}</style>
        </div>
    );
};

export default AddBank;
