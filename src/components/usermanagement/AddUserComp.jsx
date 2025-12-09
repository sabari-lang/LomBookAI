import React from "react";
import { useForm, Controller } from "react-hook-form";

const AddUserComp = () => {
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            userName: "",
            password: "",
            firstName: "",
            lastName: "",
            mobile: "",
            email: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            role: "",
            branch: "",
            status: "Active",   // default set to Active
        },
    });

    const onSubmit = (data) => {
        console.log("USER DATA:", data);
        alert("User Added Successfully!");
        reset();
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
                        <h5 className="modal-title fw-bold">Add User</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
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
                                            name="mobile"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control" placeholder="Mobile Number" />
                                            )}
                                        />
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
                                        <label className="form-label fw-bold">Status</label>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <select {...field} className="form-select">
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
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
                            >
                                Cancel
                            </button>

                            <button type="submit" className="btn btn-primary">
                                Add User
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default AddUserComp;
