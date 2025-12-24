import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import moment from "moment";
import { refreshKeyboard } from "../../../../../../utils/refreshKeyboard";

const labelStyle = {
    fontWeight: "700",
    fontSize: "14px",
    color: "#000"
};

const titleStyle = {
    fontWeight: "500",
    fontSize: "16px",
    color: "#000"
};

const HouseStatusUpdate = ({ editData, setEditData, onSubmitStatus, isLoading = false }) => {
    const isEditing = Boolean(editData?.id || editData?._id);

    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        try {
            // If it's already in YYYY-MM-DD format, return as is
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                return dateValue;
            }
            // Try to parse with moment
            const date = moment(dateValue);
            if (date.isValid()) {
                return date.format("YYYY-MM-DD");
            }
            return "";
        } catch {
            return "";
        }
    };

    const {
        control,
        handleSubmit,
        reset
    } = useForm({
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
            clearanceDate: "",    // ⭐ Added Missing Field
            invoiceDate: "",
            dispatchDate: "",
            jobCloseDate: "",
            remarks: "",
            handReceivedBy: "",
            handDate: "",
            handTime: "",
            courierName: "",
            trackingNo: "",
            courierReceivedBy: "",
            courierDate: "",
            courierTime: ""
        }
    });
    
    useEffect(() => {
        if (!editData?.id) return;

        // Auto-fill arrivalDate, departureDate, and status from house creation data
        const formattedData = {
            ...editData,
            // Auto-fill status from house data if available
            status: editData.status || editData.houseStatus || "Open",
            // Auto-fill arrivalDate from house data (check multiple possible field names)
            arrivalDate: formatDateForInput(editData.arrivalDate || editData.eta || editData.arrival),
            // Auto-fill departureDate from house data (check multiple possible field names)
            departureDate: formatDateForInput(editData.departureDate || editData.etd || editData.departure),
            cargoDeliveryDate: formatDateForInput(editData.cargoDeliveryDate),
            beDate: formatDateForInput(editData.beDate),
            clearanceDate: formatDateForInput(editData.clearanceDate),
            invoiceDate: formatDateForInput(editData.invoiceDate),
            dispatchDate: formatDateForInput(editData.dispatchDate),
            jobCloseDate: formatDateForInput(editData.jobCloseDate),
            handDate: formatDateForInput(editData.handDate),
            courierDate: formatDateForInput(editData.courierDate),
        };
        reset(formattedData);
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();
    }, [editData?.id]);

    const handleClose = () => {
        reset();
        setEditData?.(null);
    };

    const onSubmit = (data) => {
        // Convert empty date strings to null for MongoDB
        const cleanedData = { ...data };
        const dateFields = ['arrivalDate', 'departureDate', 'cargoDeliveryDate', 'beDate', 'clearanceDate', 'invoiceDate', 'dispatchDate', 'jobCloseDate', 'handDate', 'courierDate'];
        dateFields?.forEach(field => {
            if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
                cleanedData[field] = null;
            }
        });
        console.log("UPDATED:", cleanedData);
        if (onSubmitStatus) {
            onSubmitStatus(cleanedData);
        } else {
            console.log("UPDATED:", cleanedData);
        }
    };

    return (
        <div
            className="modal fade"
            id="airinboundHouseStatusUpdateModal"
            tabIndex="-1"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title" style={titleStyle}>Status Update</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={handleClose}></button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* BODY */}
                        <div
                            className="modal-body"
                            style={{
                                maxHeight: "calc(100vh - 200px)",
                                overflowY: "auto"
                            }}
                        >

                            {/* Row 1 */}
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Status</label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
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
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Arrival Date</label>
                                    <Controller
                                        name="arrivalDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Departure Date</label>
                                    <Controller
                                        name="departureDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name</label>
                                    <Controller
                                        name="cc1"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}></select>
                                        )}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name 2</label>
                                    <Controller
                                        name="cc2"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}></select>
                                        )}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label style={labelStyle}>Customer Care Name 3</label>
                                    <Controller
                                        name="cc3"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}></select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>CHA</label>
                                    <Controller
                                        name="cha"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label style={labelStyle}>CFS</label>
                                    <Controller
                                        name="cfs"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label style={labelStyle}>SB / BOE Type</label>
                                    <Controller
                                        name="sbType"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="">Select SB/BOE Type</option>
                                                <option value="RMS">RMS</option>
                                                <option value="Open">Open</option>
                                                <option value="Query">Query</option>
                                                <option value="Duty">Duty</option>
                                                <option value="Assessable Value">Assessable Value</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 4 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Cargo Delivery Date</label>
                                    <Controller
                                        name="cargoDeliveryDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Dispatcher</label>
                                    <Controller
                                        name="dispatcher"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}></select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 5 */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>BE No</label>
                                    <Controller
                                        name="beNo"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>BE Date</label>
                                    <Controller
                                        name="beDate"
                                        control={control}
                                        render={({ field }) => <input type="date" className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Assessable Value</label>
                                    <Controller
                                        name="assessableValue"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                            </div>

                            {/* Row 6 — ⭐ Clearance Date Added */}
                            <div className="row g-3 mt-3">

                                <div className="col-md-3">
                                    <label style={labelStyle}>Clearance Date</label>
                                    <Controller
                                        name="clearanceDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Invoice Date</label>
                                    <Controller
                                        name="invoiceDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Dispatch Date</label>
                                    <Controller
                                        name="dispatchDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Job Close Date</label>
                                    <Controller
                                        name="jobCloseDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Row 7 - Invoice Value */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Invoice Value</label>
                                    <Controller
                                        name="invoiceValue"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                            </div>

                            {/* REMARKS */}
                            <div className="row mt-4">
                                <div className="col-md-12">
                                    <label style={labelStyle}>Remarks</label>
                                    <Controller
                                        name="remarks"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea className="form-control" rows="3" {...field}></textarea>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* BY HAND */}
                            <h6 style={titleStyle} className="mt-4">By Hand</h6>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Received By</label>
                                    <Controller
                                        name="handReceivedBy"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Date</label>
                                    <Controller
                                        name="handDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Time</label>
                                    <Controller
                                        name="handTime"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="time" className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* BY COURIER */}
                            <h6 style={titleStyle} className="mt-4">By Courier</h6>

                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Courier Name</label>
                                    <Controller
                                        name="courierName"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Tracking No</label>
                                    <Controller
                                        name="trackingNo"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-md-4">
                                    <label style={labelStyle}>Received By</label>
                                    <Controller
                                        name="courierReceivedBy"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Date</label>
                                    <Controller
                                        name="courierDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label style={labelStyle}>Time</label>
                                    <Controller
                                        name="courierTime"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="time" className="form-control" {...field} />
                                        )}
                                    />
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

export default HouseStatusUpdate;
