import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import moment from "moment";

const labelStyle = {
    fontWeight: "700",
    fontSize: "14px",
    color: "#000",
};

const titleStyle = {
    fontWeight: "500",
    fontSize: "16px",
    color: "#000",
};

const HouseStatusUpdateSeaIn = ({ editData, setEditData, onSubmitStatus, isLoading = false }) => {

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            status: "Open",
            arrivalDate: "",
            departureDate: "",
            cc1: "",
            cc2: "",
            cc3: "",
            cha: "",
            cfs: "",
            sbType: "",
            cargoDeliveryDate: "",
            dispatcher: "",
            beNo: "",
            beDate: "",
            assessableValue: "",
            invoiceValue: "",
            invoiceDate: "",
            dispatchDate: "",
            jobCloseDate: "",
            clearanceDate: "",          // ⭐ ADDED MISSING FIELD
            remarks: "",
            handReceivedBy: "",
            handDate: "",
            handTime: "",
            courierName: "",
            trackingNo: "",
            courierReceivedBy: "",
            courierDate: "",
            courierTime: "",
        }
    });

    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        try {
            // If it's already in YYYY-MM-DD format, return as is
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
            }
            // Try to parse as Date
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            return "";
        } catch {
            return "";
        }
    };

    useEffect(() => {
        if (editData) {
            // Auto-fill arrivalDate, departureDate, and status from house creation data
            const formattedData = {
                ...editData,
                // Auto-fill status from house data if available
                status: editData.status || editData.houseStatus || "Open",
                // Auto-fill arrivalDate from house data (check multiple possible field names)
                arrivalDate: formatDateForInput(editData.arrivalDate || editData.eta || editData.arrival),
                // Auto-fill departureDate from house data (check multiple possible field names)
                departureDate: formatDateForInput(editData.departureDate || editData.etd || editData.departure),
            };
            reset(formattedData);
        }
    }, [editData, reset]);

    const onSubmit = (values) => {
        // Convert empty date strings to null for MongoDB
        const cleanedData = { ...values };
        const dateFields = ['arrivalDate', 'departureDate', 'cargoDeliveryDate', 'beDate', 'clearanceDate', 'invoiceDate', 'dispatchDate', 'jobCloseDate', 'handDate', 'courierDate'];
        dateFields.forEach(field => {
            if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
                cleanedData[field] = null;
            }
        });

        if (onSubmitStatus) {
            onSubmitStatus(cleanedData);
        } else {
            console.log("Updated Values:", cleanedData);
        }
    };

    const handleClose = () => {
        reset();
        setEditData?.(null);
    };

    return (
        <div
            className="modal fade"
            id="seainboundHouseStatusUpdateModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title" style={titleStyle}>Status Update</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={handleClose}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* BODY */}
                        <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>

                            {/* Row 1 */}
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Status</label>
                                    <select className="form-select" {...register("status")}>
                                        <option value="Open">Open</option>
                                        <option value="Not Arrived">Not Arrived</option>
                                        <option value="Today Planning">Today Planning</option>
                                        <option value="Awaiting for Duty">Awaiting for Duty</option>
                                        <option value="Queries from Customs">Queries from Customs</option>
                                        <option value="Awaiting CEPA">Awaiting CEPA</option>
                                        <option value="OOC Completed">OOC Completed</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Others">Others</option>
                                        <option value="Clearance Completed">Clearance Completed</option>
                                        <option value="Pending for Query">Pending for Query</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Arrival Date</label>
                                    <input type="date" className="form-control" {...register("arrivalDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Departure Date</label>
                                    <input type="date" className="form-control" {...register("departureDate")} />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name</label>
                                    <select className="form-select" {...register("cc1")}>
                                        <option></option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name 2</label>
                                    <select className="form-select" {...register("cc2")}>
                                        <option></option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name 3</label>
                                    <select className="form-select" {...register("cc3")}>
                                        <option></option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>CHA</label>
                                    <input className="form-control" {...register("cha")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>CFS</label>
                                    <input className="form-control" {...register("cfs")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>SB / BOE Type</label>
                                    <select className="form-select" {...register("sbType")}>
                                        <option value="">Select SB/BOE Type</option>
                                        <option value="RMS">RMS</option>
                                        <option value="Open">Open</option>
                                        <option value="Query">Query</option>
                                        <option value="Duty">Duty</option>
                                        <option value="Assessable Value">Assessable Value</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 4 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Cargo Delivery Date</label>
                                    <input type="date" className="form-control" {...register("cargoDeliveryDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Dispatcher</label>
                                    <select className="form-select" {...register("dispatcher")}>
                                        <option></option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 5 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>BE No</label>
                                    <input className="form-control" {...register("beNo")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>BE Date</label>
                                    <input type="date" className="form-control" {...register("beDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Assessable Value</label>
                                    <input className="form-control" {...register("assessableValue")} />
                                </div>
                            </div>

                            {/* Row 6 — ⭐ ADDED CLEARANCE DATE */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Clearance Date</label>
                                    <input type="date" className="form-control" {...register("clearanceDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Invoice Date</label>
                                    <input type="date" className="form-control" {...register("invoiceDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Dispatch Date</label>
                                    <input type="date" className="form-control" {...register("dispatchDate")} />
                                </div>
                            </div>

                            {/* Row 7 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Job Close Date</label>
                                    <input type="date" className="form-control" {...register("jobCloseDate")} />
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="row mt-4">
                                <div className="col-md-12">
                                    <label style={labelStyle}>Remarks</label>
                                    <textarea className="form-control" rows="3" {...register("remarks")}></textarea>
                                </div>
                            </div>

                            {/* BY HAND */}
                            <h6 style={titleStyle} className="mt-4">By Hand</h6>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Received By</label>
                                    <input className="form-control" {...register("handReceivedBy")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" className="form-control" {...register("handDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Time</label>
                                    <input type="time" className="form-control" {...register("handTime")} />
                                </div>
                            </div>

                            {/* BY COURIER */}
                            <h6 style={titleStyle} className="mt-4">By Courier</h6>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Courier Name</label>
                                    <input className="form-control" {...register("courierName")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Tracking No</label>
                                    <input className="form-control" {...register("trackingNo")} />
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Received By</label>
                                    <input className="form-control" {...register("courierReceivedBy")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" className="form-control" {...register("courierDate")} />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Time</label>
                                    <input type="time" className="form-control" {...register("courierTime")} />
                                </div>
                            </div>

                        </div>

                        {/* FOOTER */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>

                            <button 
                                className="btn btn-primary" 
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default HouseStatusUpdateSeaIn;
