import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";


import { notifySuccess } from "@/utils/notifications";
import { createServiceCode, updateServiceCode } from "../api";

const DEFAULTS = {
    serviceCode: "",
    serviceName: "",
    sacCode: "",
    gstPercentage: "",
    custTallyLedger: "",
    custTallyGroup: "",
    custTallyNature: "",
    custStateTax: "",
    custInterStateTax: "",
    vendorTallyLedger: "",
    vendorTallyGroup: "",
    vendorTallyNature: "",
    vendorStateTax: "",
    vendorInterStateTax: "",
};

const AddServiceCode = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: DEFAULTS,
    });

    const queryClient = useQueryClient();

    // CREATE
    const createMutation = useMutation({
        mutationFn: createServiceCode,
        onSuccess: () => {
            queryClient.invalidateQueries(["serviceCodes"]);
            notifySuccess("Service Code Added!");
            close();
        },
    });

    // UPDATE
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateServiceCode(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["serviceCodes"]);
            notifySuccess("Service Code Updated!");
            close();
        },
    });

    // LOAD DEFAULTS
    useEffect(() => {
        if (editData) reset(editData);
        else reset(DEFAULTS);
    }, [editData]);

    // CLOSE MODAL
    const close = () => {
        const modal = document.getElementById("addServiceCodeModal");
        const bs = window.bootstrap;

        if (bs) {
            const instance = bs.Modal.getInstance(modal) || new bs.Modal(modal);
            instance.hide();
        }

        setEditData(null);
    };

    const onSubmit = (values) => {
        if (isEditing)
            updateMutation.mutate({ id: editData.id, payload: values });
        else createMutation.mutate(values);
    };

    return (
        <div
            className="modal fade"
            id="addServiceCodeModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            {isEditing ? "Edit Service Code" : "Service Code"}
                        </h5>

                        <button
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={close}
                        ></button>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body">
                            <div className="container-fluid">

                                <div className="row">
                                    {/* LEFT + RIGHT FIELDS */}
                                    {[
                                        { name: "serviceCode", label: "Service Code" },
                                        { name: "custTallyLedger", label: "For Customer(Tally Ledger)", green: true },
                                        { name: "serviceName", label: "Service Name", full: true },
                                        { name: "sacCode", label: "SAC Code", red: true },
                                        { name: "gstPercentage", label: "GST Percentage", red: true },
                                        { name: "custTallyNature", label: "Nature for Customer(Tally Nature)", green: true },
                                        { name: "custTallyGroup", label: "For Customer Group(Tally Group)", green: true },
                                        { name: "custStateTax", label: "For Customer(State Tax)", green: true },
                                        { name: "custInterStateTax", label: "For Customer (Interstate Tax)", green: true },
                                        { name: "vendorTallyLedger", label: "For Vendor(Tally Ledger)", blue: true },
                                        { name: "vendorTallyGroup", label: "For Vendor Group(Tally Group)", blue: true },
                                        { name: "vendorTallyNature", label: "Nature for Vendor(Tally Nature)", blue: true },
                                        { name: "vendorStateTax", label: "For Vendor(State Tax)", blue: true },
                                        { name: "vendorInterStateTax", label: "For Vendor(Interstate Tax)", blue: true },
                                    ].map((f, index) => (
                                        <div
                                            className={f.full ? "col-md-12 mb-3" : "col-md-6 mb-3"}
                                            key={index}
                                        >
                                            <label
                                                className="fw-bold"
                                                style={{
                                                    color: f.red ? "red" : f.green ? "green" : f.blue ? "blue" : "black",
                                                }}
                                            >
                                                {f.label}
                                            </label>

                                            <Controller
                                                name={f.name}
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="form-control" />
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                type="button"
                                data-bs-dismiss="modal"
                                onClick={close}
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

export default AddServiceCode;
