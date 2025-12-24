import { clearAuth } from "@/utils/auth";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createUser, updateUser } from "./api";
import { mapFormToApi, mapApiToForm } from "./mapper";
import { handleProvisionalError } from "../../utils/handleProvisionalError";
import { MOBILE_REQUIRED, onlyDigits } from "../../utils/validation";

import { notifySuccess, notifyError, notifyInfo } from "../../utils/notifications";

const DEFAULTS = {
    userName: "",
    email: "",
    mobileNumber: "",
    role: "",
    isActive: true,
    password: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    branch: "",
    firstName: "",
    lastName: "",
};

const AddUserComp = ({ editData, setEditData }) => {
    const isEditing = Boolean(editData?.id || editData?._id);
    
    
    const { control, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: DEFAULTS });
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const closeAddUserModal = () => {
        const modalEl = document.getElementById("addUserModal");
        try {
            if (window.bootstrap && modalEl) {
                const inst = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                inst.hide();
                return;
            }
        } catch (e) {
            // ignore
        }
        const closeBtn = modalEl?.querySelector('.btn-close') || document.querySelector('#addUserModal [data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (modalEl) {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    };

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
            notifySuccess("User Created!");
            // close modal then reset and navigate
            closeAddUserModal();
            reset(DEFAULTS);
            setEditData?.(null);
            navigate("/user-management");
        },
        onError: (err) => handleProvisionalError(err, "Create User"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => updateUser(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["users"]);
            notifySuccess("User Updated!");
            // close modal then reset/edit state and navigate
            closeAddUserModal();
            setEditData?.(null);
            clearAuth();
            window.location.hash = "#/";
        },
        onError: (err) => handleProvisionalError(err, "Update User"),
    });

    useEffect(() => {
        if (editData) reset(mapApiToForm(editData));
        else reset(DEFAULTS);
        // eslint-disable-next-line
    }, [editData]);

    const onSubmit = (values) => {
        // Ensure MobileNumber is sent with capital M for backend
        const payload = {
            ...mapFormToApi(values),
            mobileNumber: values.mobileNumber,
        };
        if (editData?.id) {
            updateMutation.mutate({ id: editData.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div
            className="modal fade"
            id="addUserModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">{editData ? "Edit User" : "Add User"}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={() => setEditData?.(null)}
                        ></button>
                    </div>
                    {/* BODY */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body">
                            <div className="container-fluid">

                                {/* User Name / Password */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">User Name</label>
                                        <Controller
                                            name="userName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="User Name" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Password</label>
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} type="password" className="form-control" placeholder="Password" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* First / Last Name */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">First Name</label>
                                        <Controller
                                            name="firstName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="First Name" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Last Name</label>
                                        <Controller
                                            name="lastName"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Last Name" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Mobile / Email */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Mobile Number</label>
                                        <Controller
                                            name="mobileNumber"
                                            control={control}
                                            rules={MOBILE_REQUIRED}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    onInput={onlyDigits}
                                                    className={`form-control ${errors.mobileNumber ? "is-invalid" : ""}`}
                                                    placeholder="Mobile Number"
                                                />
                                            )}
                                        />
                                        {errors.mobileNumber && (
                                            <div className="invalid-feedback d-block">{errors.mobileNumber.message}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">E-Mail Address</label>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} type="email" className="form-control" placeholder="E-Mail Address" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Address / City */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Address</label>
                                        <Controller
                                            name="address"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea {...field} rows={3} className="form-control" placeholder="Address"></textarea>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">City</label>
                                        <Controller
                                            name="city"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="City" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* State / Pincode */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">State</label>
                                        <Controller
                                            name="state"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="">Select State</option>
                                                    <option>Tamil Nadu</option>
                                                    <option>Karnataka</option>
                                                    <option>Kerala</option>
                                                    <option>Telangana</option>
                                                    <option>Andhra Pradesh</option>
                                                </select>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Pincode</label>
                                        <Controller
                                            name="pincode"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Pincode" />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Role / Branch */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Role</label>
                                        <Controller
                                            name="role"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="">Select Role</option>
                                                    <option value="Super User">Super User</option>
                                                    <option value="Normal User">Normal User</option>
                                                    <option value="Customer Service Access">Customer Service Access</option>
                                                    <option value="Branch Access">Branch Access</option>
                                                    <option value="Despatch and Data Entry">Despatch and Data Entry</option>
                                                    <option value="Billing">Billing</option>
                                                    <option value="Quote">Quote</option>
                                                    <option value="Account MGR">Account MGR</option>
                                                </select>
                                            )}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Branch</label>
                                        <Controller
                                            name="branch"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="">Select Branch</option>
                                                    <option value="HEAD OFFICE">HEAD OFFICE</option>
                                                    <option value="ANATHAPUR">ANATHAPUR</option>
                                                    <option value="BANGALORE">BANGALORE</option>
                                                    <option value="MUMBAI">MUMBAI</option>
                                                    <option value="NEW DELHI">NEW DELHI</option>
                                                    <option value="BLR SALES">BLR SALES</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ⭐ NEW FIELD — STATUS */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Active</label>
                                        <Controller
                                            name="isActive"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value={true}>Active</option>
                                                    <option value={false}>Inactive</option>
                                                </select>
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
                                onClick={() => setEditData?.(null)}
                                disabled={editData ? updateMutation.isLoading : createMutation.isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={editData ? updateMutation.isLoading : createMutation.isLoading}
                            >
                                {editData ? (
                                    updateMutation.isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update User"
                                    )
                                ) : (
                                    createMutation.isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        "Add User"
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

export default AddUserComp;
