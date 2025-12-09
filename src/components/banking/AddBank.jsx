import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBankingTransaction, updateBankingTransaction } from "./api";
import { handleProvisionalError } from "../../utils/handleProvisionalError";

const AddBank = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const editData = location.state;
    const isEditing = Boolean(editData?.id || editData?._id);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
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

    // Load edit data
    useEffect(() => {
        if (editData) {
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
        }
    }, [editData, reset]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (payload) => createBankingTransaction(payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["banking-transactions"]);
            alert("Bank Account created successfully");
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
            alert("Bank Account updated successfully");
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
                            render={({ field }) => (
                                <select {...field} className="form-select form-select-sm">
                                    <option value="INR">INR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            )}
                        />
                    </div>
                </div>

                {/* Account Number */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">Account Number</label>
                    <div className="col-sm-4">
                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="text" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

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

                {/* IFSC */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">IFSC</label>
                    <div className="col-sm-4">
                        <Controller
                            name="ifsc"
                            control={control}
                            render={({ field }) => (
                                <input {...field} type="text" className="form-control form-control-sm" />
                            )}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="row mb-3">
                    <label className="col-sm-2 col-form-label fw-semibold">Description</label>
                    <div className="col-sm-4">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    className="form-control form-control-sm"
                                    rows="3"
                                    placeholder="Max. 500 characters"
                                ></textarea>
                            )}
                        />
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
        </div>
    );
};

export default AddBank;
