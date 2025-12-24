// src/modules/currency/NewCurrency.jsx
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    notifySuccess,
    notifyError,
} from "@/utils/notifications";
import { createCurrency, updateCurrency } from "../api";

const DEFAULTS = {
    currencyCode: "",
    currencyName: "",
    country: "",
};

const NewCurrency = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: DEFAULTS,
    });

    const queryClient = useQueryClient();

    // CREATE
    const createMutation = useMutation({
        mutationFn: createCurrency,
        onSuccess: () => {
            queryClient.invalidateQueries(["currencies"]);
            notifySuccess("Currency Added!");
            closeModal();
            reset(DEFAULTS);
            setEditData(null);
        },
    });

    // UPDATE
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateCurrency(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["currencies"]);
            notifySuccess("Currency Updated!");
            closeModal();
            setEditData(null);
        },
    });

    // RESET ON EDIT
    useEffect(() => {
        if (editData) reset(editData);
        else reset(DEFAULTS);
    }, [editData]);

    const closeModal = () => {
        const modal = document.getElementById("newCurrencyModal");
        if (!modal) return;
        const bootstrap = window.bootstrap;
        if (bootstrap) {
            const instance =
                bootstrap.Modal.getInstance(modal) ||
                new bootstrap.Modal(modal);
            instance.hide();
        }
    };

    const onSubmit = (values) => {
        if (isEditing) {
            updateMutation.mutate({ id: editData.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    return (
        <div
            className="modal fade"
            id="newCurrencyModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-md modal-dialog-centered">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            {isEditing ? "Edit Currency" : "New Currency"}
                        </h5>

                        <button
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={() => setEditData(null)}
                        ></button>
                    </div>

                    {/* BODY */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body">
                            <div className="container-fluid">

                                {/* Code */}
                                <div className="mb-3">
                                    <label className="fw-bold">Currency Code</label>
                                    <Controller
                                        name="currencyCode"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control"
                                                placeholder="INR / USD / EUR"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Name */}
                                <div className="mb-3">
                                    <label className="fw-bold">Currency Name</label>
                                    <Controller
                                        name="currencyName"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control"
                                                placeholder="Indian Rupee"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Country */}
                                <div className="mb-3">
                                    <label className="fw-bold">Country</label>
                                    <Controller
                                        name="country"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control"
                                                placeholder="India"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                type="button"
                                onClick={() => setEditData(null)}
                            >
                                Cancel
                            </button>

                            <button className="btn btn-primary" type="submit">
                                {isEditing ? "Update" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewCurrency;
