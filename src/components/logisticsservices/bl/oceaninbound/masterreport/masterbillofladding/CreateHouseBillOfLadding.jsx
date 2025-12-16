import React, { useEffect } from 'react'
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Search, Trash } from "react-bootstrap-icons";
import { useQueryClient } from '@tanstack/react-query';
import { CONTAINER_SIZE_LIST, UNIT_PKG_LIST } from '../../../../../../utils/unitPkgList';


const CreateHouseBillOfLadding = () => {


    const storedRaw = sessionStorage.getItem("houseAirwayData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    const jobNo = storedData?.jobNo;  // ⭐ CORRECT PLACE
    console.log("ed", storedData)

    const initialValues = {
        // TOP / header / basic
        jobNo: storedData?.jobNo,
        blType: "House B/L",
        consol: "Consol",
        mblNo: storedData?.mblNo,
        hblNo: storedData?.hblNo,
        shipment: "",
        status: "Open",
        branch: "HEAD OFFICE",
        // LEFT stacked blocks
        shipperName: "",
        shipperAddress: "",
        consigneeName: "",
        consigneeAddress: "",
        notifyName: "",
        notifyAddress: "",
        // dates & terms
        onBoardDate: "",
        arrivalDate: "",
        precarriageBy: "N.A",
        portDischarge: "",
        freightTerm: "",
        shippingTerm: "",
        // RIGHT stacked blocks (B/L + For delivery + routing)
        blNo: "",
        blText: "",
        forDeliveryApplyTo: "",
        forDeliveryApplyTo2: "",
        placeReceipt: "",
        portLoading: "",
        placeDelivery: "",
        finalDestination: "",
        vesselName: "",
        voy: "",
        callSign: "",
        // package/weight/measurement
        package: "",
        unitPkg: "BALES",
        grossWeight: "",
        unitWeight: "Kgs",
        measurement: "",
        unitCbm: "CBM",
        // containers dynamic
        containers: [
            {
                containerNo: "",
                size: "20 HC",
                term: "CFS/CFS",
                wgt: "",
                pkg: "",
                sealNo: "",
            },
        ],
        // last section
        markNumbers: "",
        descShort: '"SAID TO CONTAIN"',
        descLong: "",
        freightPayable: "",
        originalBL: "",
        place: "",
        dateOfIssue: "",
        // additional HBL-specific fields requested
        shipperInvoiceNo: "",
        shipperInvoiceDate: "",
        shipperInvoiceAmount: "",
    }

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        formState: { isDirty },
    } = useForm({
        defaultValues: initialValues
    });



    const { fields, append, remove } = useFieldArray({ control, name: "containers" });

    const isEditing = Boolean(storedData?.id);
    const queryClient = useQueryClient();

    // Edit Form Data
    useEffect(() => {
        if (!storedData) return;

        reset({
            ...initialValues, // BASE DEFAULTS
            ...storedData,        // OVERRIDE WITH API DATA
        });
    }, [reset]);

    const addContainer = () =>
        append({ containerNo: "", size: "20 HC", term: "CFS/CFS", wgt: "", pkg: "", sealNo: "" });


    const onSubmit = (data) => {

    }
    return (
        <>


            <form onSubmit={handleSubmit(onSubmit)}>

                <fieldset disabled>
                    {/* TOP: ONE ROW split into two col-6 sections */}
                    <div className="row g-3 mb-3">
                        {/* LEFT: Job No, M.B/L No, H.B/L No (only these two/three fields stacked) */}
                        <div className="col-md-6">
                            <div className="row g-3">
                                <div className="col-md-12">
                                    <label className="fw-bold">Job No/Ref No</label>
                                    <Controller name="jobNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                </div>

                                <div className="col-md-12">
                                    <label className="fw-bold">M.B/L No</label>
                                    <Controller name="mblNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                </div>

                                <div className="col-md-12">
                                    <label className="fw-bold">H.B/L No</label>
                                    <Controller name="hblNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: B/L Type, Consol, Import button, Shipment, Status, Branch */}
                        <div className="col-md-6">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="fw-bold">B/L Type</label>
                                    <Controller
                                        name="blType"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option>House B/L</option>
                                                <option>Master B/L</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="fw-bold">Consol</label>
                                    <Controller
                                        name="consol"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option>Consol</option>
                                                <option>Single</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="fw-bold">Type</label>
                                    <button type="button" className="btn btn-light form-control">Import</button>
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Shipment</label>
                                    <Controller
                                        name="shipment"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="">--Select--</option>
                                                <option value="CIF">CIF</option>
                                                <option value="C & F">C & F</option>
                                                <option value="CAF">CAF</option>
                                                <option value="CFR">CFR</option>
                                                <option value="CPT">CPT</option>
                                                <option value="DAP">DAP</option>
                                                <option value="DDP">DDP</option>
                                                <option value="DDU">DDU</option>
                                                <option value="EXW">EXW</option>
                                                <option value="FAS">FAS</option>
                                                <option value="FCA">FCA</option>
                                                <option value="FOB">FOB</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="fw-bold">Status</label>
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

                                <div className="col-md-3">
                                    <label className="fw-bold">Branch</label>
                                    <Controller
                                        name="branch"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
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
                        </div>
                    </div>

                    {/* MAIN single row with two big columns (left stacked, right stacked) */}
                    <div className="row g-3">
                        {/* LEFT column (Shipper, Consignee, Notify, Dates & Terms, Shipper Invoice fields) */}
                        <div className="col-md-6">
                            {/* Shipper */}
                            <div className="mb-3">
                                <label className="fw-bold d-flex align-items-center gap-2">Shipper's/ Consignor (Name & Address) <Search size={14} /></label>
                                <Controller name="shipperName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                <Controller name="shipperAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                            </div>

                            {/* Consignee */}
                            <div className="mb-3">
                                <label className="fw-bold d-flex align-items-center gap-2">Consignee (Name & Address) <Search size={14} /></label>
                                <Controller name="consigneeName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                <Controller name="consigneeAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                            </div>

                            {/* Notify Party */}
                            <div className="mb-3">
                                <label className="fw-bold d-flex align-items-center gap-2">Notify Party (Name & Address) <Search size={14} /></label>
                                <div className="d-flex gap-3 small mb-2">
                                    <label><input type="checkbox" className="me-1" onChange={(e) => handleSameAsConsignee(e.target.checked)} /> SAME AS CONSIGNEE</label>
                                    <label><input type="checkbox" className="me-1" /> COPY AS</label>
                                </div>
                                <div className="small text-muted mb-1">CONSIGNEE</div>
                                <Controller name="notifyName" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                <Controller name="notifyAddress" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                            </div>

                            {/* Dates & Terms */}
                            <div className="mb-3 border-top pt-2">
                                <div className="row g-2 mb-2 align-items-end">
                                    <div className="col-md-4">
                                        <label className="fw-bold">On Board Date</label>
                                        <Controller name="onBoardDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold">Arrival Date</label>
                                        <Controller name="arrivalDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="fw-bold">Precarriage by</label>
                                        <Controller name="precarriageBy" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                </div>

                                <div className="row g-2 align-items-end mt-1">
                                    <div className="col-md-4">
                                        <label className="fw-bold">Port of Discharge</label>
                                        <Controller name="portDischarge" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Freight Term</label>
                                        <Controller name="freightTerm" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Shipping Term</label>
                                        <Controller name="shippingTerm" control={control} render={({ field }) => <select className="form-select" {...field}><option value="">--Select--</option><option>FCL/FCL</option><option>CIF</option></select>} />
                                    </div>
                                </div>

                                {/* Shipper Invoice fields (HBL specific) */}
                                <div className="row g-2 align-items-end mt-3">
                                    <div className="col-md-6">
                                        <label className="fw-bold">Shipper Invoice No</label>
                                        <Controller name="shipperInvoiceNo" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="fw-bold">Shipper Invoice Date</label>
                                        <Controller name="shipperInvoiceDate" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="fw-bold">Shipper Invoice Amount</label>
                                        <Controller name="shipperInvoiceAmount" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT column (Bill of Lading, For Delivery, Routing, Vessel, Package, Measurement) */}
                        <div className="col-md-6">
                            {/* Bill of Lading */}
                            <div className="mb-3">
                                <label className="fw-bold d-flex align-items-center gap-2">Not Negotiable <span className="fw-bold">Bill of Lading</span> <Search size={14} /></label>
                                <Controller name="blNo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                <Controller name="blText" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                            </div>

                            {/* For Delivery */}
                            <div className="mb-3">
                                <label className="fw-bold d-flex align-items-center gap-2">For delivery of goods please apply to <Search size={14} /></label>
                                <Controller name="forDeliveryApplyTo" control={control} render={({ field }) => <input className="form-control mb-2" {...field} />} />
                                <Controller name="forDeliveryApplyTo2" control={control} render={({ field }) => <textarea className="form-control" rows={6} {...field} />} />
                            </div>

                            {/* Routing block */}
                            <div className="mb-3">
                                <div className="row g-2 mb-2">
                                    <div className="col-md-3">
                                        <label className="fw-bold">Place of Receipt</label>
                                        <Controller name="placeReceipt" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Port of Loading</label>
                                        <Controller name="portLoading" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Place of Delivery</label>
                                        <Controller name="placeDelivery" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Final Destination</label>
                                        <Controller name="finalDestination" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                </div>

                                <div className="row g-2 align-items-end mt-1">
                                    <div className="col-md-4">
                                        <label className="fw-bold">Vessel Name</label>
                                        <Controller name="vesselName" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Voy</label>
                                        <Controller name="voy" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="fw-bold">Call & Sign</label>
                                        <Controller name="callSign" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                </div>
                            </div>

                            {/* Package / Unit / Weight / Measurement */}
                            <div className="mb-3">
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-3">
                                        <label className="fw-bold">Package</label>
                                        <Controller name="package" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Unit</label>
                                        <Controller
                                            name="unitPkg"
                                            control={control}
                                            render={({ field }) => (
                                                <select className="form-select" {...field}>
                                                    <option value="">-- Select Unit --</option>
                                                    {UNIT_PKG_LIST?.map((item) => (
                                                        <option key={item} value={item}>
                                                            {item}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        />

                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Gross Weight</label>
                                        <Controller name="grossWeight" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3">
                                        <label className="fw-bold">Unit</label>
                                        <Controller name="unitWeight" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3 mt-2">
                                        <label className="fw-bold">Measurement</label>
                                        <Controller name="measurement" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>

                                    <div className="col-md-3 mt-2">
                                        <label className="fw-bold">Unit</label>
                                        <Controller name="unitCbm" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Containers section */}
                    <div className="row g-2 mb-3 border-top pt-2">
                        <div className="col-12 d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-bold">Container Details</div>
                            <button type="button" className="btn btn-success btn-sm" onClick={addContainer}>+ Container No</button>
                        </div>

                        <table className="table table-bordered table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: "20%" }}>Container No</th>
                                    <th style={{ width: "12%" }}>Size</th>
                                    <th style={{ width: "12%" }}>Term</th>
                                    <th style={{ width: "10%" }}>Wgt</th>
                                    <th style={{ width: "15%" }}>Pkg</th>
                                    <th style={{ width: "15%" }}>Seal No</th>
                                    <th style={{ width: "8%" }}>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {fields?.map((f, i) => (
                                    <tr key={f.id}>
                                        {/* Container No */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.containerNo`}
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control form-control-sm" {...field} />
                                                )}
                                            />
                                        </td>

                                        {/* Size */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.size`}
                                                control={control}
                                                render={({ field }) => (
                                                    <select className="form-select form-select-sm" {...field}>
                                                        <option value="">--Select--</option>
                                                        {CONTAINER_SIZE_LIST?.map((size) => (
                                                            <option key={size} value={size}>{size}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            />

                                        </td>

                                        {/* Term */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.term`}
                                                control={control}
                                                render={({ field }) => (
                                                    <select className="form-select form-select-sm" {...field}>
                                                        <option value="">--Select--</option>
                                                        <option value="CFS/CFS">CFS/CFS</option>
                                                        <option value="CY/CY">CY/CY</option>
                                                        <option value="FCL/LCL">FCL/LCL</option>
                                                        <option value="LCL/FCL">LCL/FCL</option>
                                                    </select>
                                                )}
                                            />

                                        </td>

                                        {/* Weight */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.wgt`}
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control form-control-sm" {...field} />
                                                )}
                                            />
                                        </td>

                                        {/* Package */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.pkg`}
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control form-control-sm" {...field} />
                                                )}
                                            />
                                        </td>

                                        {/* Seal No */}
                                        <td>
                                            <Controller
                                                name={`containers.${i}.sealNo`}
                                                control={control}
                                                render={({ field }) => (
                                                    <input className="form-control form-control-sm" {...field} />
                                                )}
                                            />
                                        </td>

                                        {/* Action */}
                                        <td className="text-center">
                                            {i !== 0 ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => remove(i)}
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            ) : (
                                                <span className="text-muted small">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mark & Description (two col-6 blocks under one row) */}
                        <div className="col-12">
                            <div className="row g-3">
                                {/* LEFT */}
                                <div className="col-md-6">
                                    <label className="fw-bold">Mark & Numbers</label>
                                    <Controller name="markNumbers" control={control} render={({ field }) => <textarea className="form-control" rows={5} {...field} />} />

                                    <div className="row g-2 mt-3">
                                        <div className="col-md-6">
                                            <label className="fw-bold">Freight Payable</label>
                                            <Controller name="freightPayable" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="fw-bold">No. of Original B/L</label>
                                            <Controller name="originalBL" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                        </div>

                                        <div className="col-md-6 mt-2">
                                            <label className="fw-bold">Place</label>
                                            <Controller name="place" control={control} render={({ field }) => <input className="form-control" {...field} />} />
                                        </div>

                                        <div className="col-md-6 mt-2">
                                            <label className="fw-bold">Date of Issue</label>
                                            <Controller name="dateOfIssue" control={control} render={({ field }) => <input type="date" className="form-control" {...field} />} />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT */}
                                <div className="col-md-6">
                                    <label className="fw-bold">Description</label>
                                    <Controller name="descShort" control={control} render={({ field }) => <textarea className="form-control mb-2" rows={2} {...field} />} />
                                    <Controller name="descLong" control={control} render={({ field }) => <textarea className="form-control" rows={8} {...field} />} />
                                </div>
                            </div>
                        </div>
                    </div>

                </fieldset>
            </form>
        </>
    )
}

export default CreateHouseBillOfLadding