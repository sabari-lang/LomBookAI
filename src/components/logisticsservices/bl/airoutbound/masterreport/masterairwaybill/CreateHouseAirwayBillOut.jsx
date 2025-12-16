import { useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import React, { useEffect } from 'react'
import { useForm, Controller } from "react-hook-form";
import { useUnlockInputs } from "../../../../../../hooks/useUnlockInputs";


const CreateHouseAirwayBillOut = ({ editData, setEditData }) => {



    const storedRaw = sessionStorage.getItem("houseAirwayData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    const jobNo = storedData?.jobNo;  // ⭐ CORRECT PLACE
    console.log("ed", storedData)

    const initialValues = {
        jobNo: storedData?.jobNo,
        blType: "House B/L",
        consol: "Consol",
        exportField: "Export",
        mawb: storedData?.mawbNo,
        hawb: "",
        shipment: "",
        status: "Open",
        branch: "HEAD OFFICE",

        shipperName: "",
        shipperAddr: "",

        consigneeName: "",
        consigneeAddr: "",

        notifyName: "",
        notifyAddr: "",
        sameAsConsignee: false,
        copyAsConsignee: false,

        agentName: "",
        iataCode: "",
        accountNo: "",
        accountingInfo: "",

        airportDeparture: "",
        to1: "",
        byFirstCarrier: "",
        airportDest: "",
        requestedFlight: "",
        declaredValueCarriage: "",
        declaredValueCustoms: "",
        departureDate: "",
        arrivalDate: "",
        insuranceAmount: "",
        freightTerm: "",

        cur: "",
        code: "",
        wtValPp: "",
        coll1: "",
        otherPp: "",
        coll2: "",

        to2: "",
        by2: "",
        to3: "",
        by3: "",


        handlingInfo: "",
        shipperInvoiceNo: "",
        shipperInvoiceDate: "",
        shipperInvoiceAmount: "",

        pieces: "",
        grossWeight: "",
        kgLb: "",
        rateClass: "",
        chargeableWeight: "",
        rateCharge: "",
        asArranged: false,
        goodsNature: "",

        weightChargePrepaid: "",
        weightChargeCollect: "",
        valuationChargePrepaid: "",
        valuationChargeCollect: "",
        taxPrepaid: "",
        taxCollect: "",
        agentChargesPrepaid: "",
        agentChargesCollect: "",
        carrierChargesPrepaid: "",
        carrierChargesCollect: "",
        totalPrepaid: "",
        totalCollect: "",

        executedDate: "",
        placeAt: "",
        signature: "",
    }


    const { control, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: initialValues,
    });


    const isEditing = Boolean(editData?.id);
    const queryClient = useQueryClient();

    // ✅ Keyboard unlock hook for edit mode
    useUnlockInputs(isEditing);

    // Edit Form Data
    useEffect(() => {
        if (!storedData) return;

        reset({
            ...initialValues, // BASE DEFAULTS
            ...storedData,        // OVERRIDE WITH API DATA
            arrivalDate: storedData?.arrivalDate
                ? moment(storedData.arrivalDate).format("YYYY-MM-DD")
                : "",

            departureDate: storedData?.departureDate
                ? moment(storedData.departureDate).format("YYYY-MM-DD")
                : "",
            executedDate: storedData?.executedDate
                ? moment(storedData.executedDate).format("YYYY-MM-DD")
                : "",
            shipperInvoiceDate: storedData?.shipperInvoiceDate
                ? moment(storedData.shipperInvoiceDate).format("YYYY-MM-DD")
                : "",
        });
    }, [reset]);


    const onSubmit = (data) => {

    }

    return (
        <>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="container-fluid py-4"
            >

                <fieldset disabled>
                    {/* Row 1 */}
                    <div className="row g-2">
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Job No/Ref No</label>
                            <Controller
                                name="jobNo"
                                control={control}
                                render={({ field }) => (
                                    <input {...field}
                                        className="form-control form-control-sm"
                                        readOnly
                                    />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">B/L Type</label>
                            <Controller
                                name="blType"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="form-select form-select-sm">
                                        <option>House B/L</option>
                                    </select>
                                )}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Console</label>
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

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Export</label>
                            <Controller
                                name="exportField"
                                control={control}
                                render={({ field }) => (
                                    <input {...field}
                                        className="form-control form-control-sm"
                                        readOnly
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* MAWB HAWB Status Branch */}
                    <div className="row g-2 mt-2">
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">MAWB No</label>
                            <Controller
                                name="mawb"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">HAWB No</label>
                            <Controller
                                name="hawb"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Shipment</label>
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

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Status</label>
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

                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Branch</label>
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

                    <hr className="mt-3" />
                    {/* SHIPPER + AIRWAYBILL */}
                    <div className="row g-2">
                        {/* SHIPPER LEFT */}
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Shipper's Name & Address <span className="text-primary">🔍</span>
                            </label>

                            <Controller
                                name="shipperName"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm mb-1"
                                    />
                                )}
                            />

                            <Controller
                                name="shipperAddr"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        className="form-control form-control-sm"
                                        rows={4}
                                    />
                                )}
                            />
                        </div>

                        {/* AIRWAYBILL RIGHT */}
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Not Negotiable — Air Waybill <span className="text-primary">🔍</span>
                            </label>

                            <Controller
                                name="agentName"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm mb-1"
                                    />
                                )}
                            />

                            <Controller
                                name="shipperAddr"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        className="form-control form-control-sm"
                                        rows={4}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <hr className="mt-3" />

                    {/* CONSIGNEE / NOTIFY */}
                    <div className="row g-2">
                        {/* CONSIGNEE LEFT */}
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Consignee Name & Address <span className="text-primary">🔍</span>
                            </label>

                            <Controller
                                name="consigneeName"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm mb-1"
                                    />
                                )}
                            />

                            <Controller
                                name="consigneeAddr"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        className="form-control form-control-sm"
                                        rows={4}
                                    />
                                )}
                            />
                        </div>

                        {/* NOTIFY RIGHT */}
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Notify Name & Address <span className="text-primary">🔍</span>
                            </label>

                            <Controller
                                name="notifyName"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm mb-1"
                                    />
                                )}
                            />

                            <Controller
                                name="notifyAddr"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        className="form-control form-control-sm"
                                        rows={4}
                                    />
                                )}
                            />

                            {/* SAME AS / COPY AS */}
                            <div className="form-check form-check-inline mt-2">
                                <Controller
                                    name="sameAsConsignee"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="checkbox"
                                            className="form-check-input"
                                            id="sameAsConsignee"
                                        />
                                    )}
                                />
                                <label
                                    htmlFor="sameAsConsignee"
                                    className="form-check-label small fw-bold ms-1"
                                    onChange={(e) => handleSameAsConsignee(e.target.checked)}
                                >
                                    SAME AS CONSIGNEE
                                </label>
                            </div>

                            <div className="form-check form-check-inline mt-2">
                                <Controller
                                    name="copyAsConsignee"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="checkbox"
                                            className="form-check-input"
                                            id="copyAsConsignee"
                                        />
                                    )}
                                />
                                <label
                                    htmlFor="copyAsConsignee"
                                    className="form-check-label small fw-bold ms-1"
                                >
                                    COPY AS CONSIGNEE
                                </label>
                            </div>
                        </div>
                    </div>

                    <hr className="mt-3" />

                    {/* ISSUING CARRIER + ACCOUNTING INFO */}
                    <div className="row g-2">
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Issuing Carrier's Agent Name & City
                            </label>
                            <Controller
                                name="agentName"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm"
                                    />
                                )}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Accounting Information</label>
                            <Controller
                                name="accountingInfo"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        className="form-control form-control-sm"
                                        rows={3}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="row g-2 mt-2">
                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Agent's IATA Code</label>
                            <Controller
                                name="iataCode"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm"
                                    />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Account No</label>
                            <Controller
                                name="accountNo"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm"
                                    />
                                )}
                            />
                        </div>

                        <div className="col-md-6" />
                    </div>

                    <hr className="mt-3" />

                    {/* ROUTING SECTION */}
                    <div className="row g-2">
                        <div className="col-md-6">
                            <label className="form-label small fw-bold">
                                Airport of Departure & Requested Routing
                            </label>

                            <Controller
                                name="airportDeparture"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="form-control form-control-sm"
                                    />
                                )}
                            />

                            <div className="row g-2 mt-2">
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">To</label>
                                    <Controller
                                        name="to1"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="col-md-8">
                                    <label className="form-label small fw-bold">By First Carrier</label>
                                    <Controller
                                        name="byFirstCarrier"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                className="form-control form-control-sm"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CUR + CODE + WT/VAL */}
                        <div className="col-md-6">
                            <div className="row g-2">

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">CUR</label>
                                    <Controller
                                        name="cur"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">CODE</label>
                                    <Controller
                                        name="code"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">WT/VAL PP</label>
                                    <Controller
                                        name="wtValPp"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">COLL</label>
                                    <Controller
                                        name="coll1"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">Other PP</label>
                                    <Controller
                                        name="otherPp"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">COLL</label>
                                    <Controller
                                        name="coll2"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>
                            </div>
                            {/* ROUTING — TO/BY rows */}
                            <div className="row g-2 mt-2">

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">To</label>
                                    <Controller
                                        name="to2"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">By</label>
                                    <Controller
                                        name="by2"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">To</label>
                                    <Controller
                                        name="to3"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small fw-bold">By</label>
                                    <Controller
                                        name="by3"
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} className="form-control form-control-sm" />
                                        )}
                                    />
                                </div>



                            </div>
                        </div>
                    </div>

                    {/* DESTINATION + DECLARATIONS */}
                    <div className="row g-2 mt-3">

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Airport of Destination</label>
                            <Controller
                                name="airportDest"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Requested Flight</label>
                            <Controller
                                name="requestedFlight"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Declared Value for Carriage</label>
                            <Controller
                                name="declaredValueCarriage"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Declared Value for Customs</label>
                            <Controller
                                name="declaredValueCustoms"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                    </div>

                    <div className="row g-2 mt-2">

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Departure Date</label>
                            <Controller
                                name="departureDate"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} type="date" className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Arrival Date</label>
                            <Controller
                                name="arrivalDate"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} type="date" className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Amount of Insurance</label>
                            <Controller
                                name="insuranceAmount"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Freight Term</label>
                            <Controller
                                name="freightTerm"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                    </div>

                    <hr className="mt-3" />

                    {/* HANDLING / INVOICE SECTION */}
                    <div className="row g-2">

                        <div className="col-md-6">
                            <label className="form-label small fw-bold">Handling Information</label>
                            <Controller
                                name="handlingInfo"
                                control={control}
                                render={({ field }) => (
                                    <textarea {...field} className="form-control form-control-sm" rows={3} />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Shipper Invoice No</label>
                            <Controller
                                name="shipperInvoiceNo"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />

                            <label className="form-label small fw-bold mt-2">Shipper Invoice Amount</label>
                            <Controller
                                name="shipperInvoiceAmount"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label small fw-bold">Shipper Invoice Date</label>
                            <Controller
                                name="shipperInvoiceDate"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} type="date" className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                    </div>

                    <hr className="mt-3" />

                    {/* ----------------- CARGO SECTION ------------------ */}
                    <div className="mt-3">

                        {/* HEADER */}
                        <div className="row fw-semibold small mb-2">
                            <div className="col-md-2 fw-bold">No.of Pieces RCP</div>
                            <div className="col-md-2 fw-bold">Gross Weight</div>
                            <div className="col-md-1 fw-bold">kg / lb</div>
                            <div className="col-md-2 fw-bold">Rate Class Commodity Item</div>
                            <div className="col-md-2 fw-bold">Chargeable Weight</div>
                            <div className="col-md-2 fw-bold">Rate / Charge ARRANGED</div>
                            <div className="col-md-1 fw-bold">AS</div>
                            <div className="col-md-1 fw-bold">Total</div>
                        </div>

                        {/* INPUT ROW */}
                        <div className="row g-3 mb-4">

                            <div className="col-md-2">
                                <Controller
                                    name="pieces"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-2">
                                <Controller
                                    name="grossWeight"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-1">
                                <Controller
                                    name="kgLb"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-2">
                                <Controller
                                    name="rateClass"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-2">
                                <Controller
                                    name="chargeableWeight"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-2">
                                <Controller
                                    name="rateCharge"
                                    control={control}
                                    render={({ field }) => (
                                        <input {...field} className="form-control form-control-sm" />
                                    )}
                                />
                            </div>

                            <div className="col-md-1 d-flex align-items-center">
                                <Controller
                                    name="asArranged"
                                    control={control}
                                    render={({ field }) => (
                                        <input type="checkbox" {...field} className="form-check-input" />
                                    )}
                                />
                            </div>

                            <div className="col-md-1 d-flex align-items-center">
                                <span className="small fw-bold">AS ARRANGED</span>
                            </div>

                        </div>

                    </div>

                    <hr className="mt-3" />

                    {/* NATURE OF GOODS */}
                    <div className="mt-3">
                        <label className="form-label small fw-bold">
                            Nature and Quality of Goods (incl. Dimensions / Volume)
                        </label>
                        <Controller
                            name="goodsNature"
                            control={control}
                            render={({ field }) => (
                                <textarea {...field} className="form-control form-control-sm" rows={3} />
                            )}
                        />
                    </div>

                    {/* ---------------- CHARGES SECTION ---------------- */}
                    <div className="row g-4 mt-3">

                        {/* LEFT COLUMN */}
                        <div className="col-md-6">

                            {/* WEIGHT CHARGE */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">Weight Charge</div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <Controller
                                            name="weightChargePrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="weightChargeCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TAX */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">Tax</div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <Controller
                                            name="taxPrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="taxCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL OTHER CHARGES DUE CARRIER */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">
                                    Total other Charges Due Carrier
                                </div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">

                                    <div className="col-6">
                                        <Controller
                                            name="carrierChargesPrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="carrierChargesCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="col-md-6">

                            {/* VALUATION CHARGES */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">Valuation Charge</div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <Controller
                                            name="valuationChargePrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="valuationChargeCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AGENT CHARGES */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">
                                    Total other Charges Due Agent
                                </div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <Controller
                                            name="agentChargesPrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="agentChargesCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL */}
                            <div className="mb-4">
                                <div className="fw-bold small mb-1">Total</div>

                                <div className="row small mb-1 fw-bold">
                                    <div className="col-6">Prepaid</div>
                                    <div className="col-6">Collect</div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <Controller
                                            name="totalPrepaid"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <Controller
                                            name="totalCollect"
                                            control={control}
                                            render={({ field }) => (
                                                <input {...field} className="form-control form-control-sm" />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <hr className="mt-3" />
                    {/* SIGNATURE SECTION */}
                    <div className="row g-2 align-items-center">

                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Executed Date</label>
                            <Controller
                                name="executedDate"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} type="date" className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label small fw-bold">Place At</label>
                            <Controller
                                name="placeAt"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label small fw-bold">
                                Signature of Issuing Carrier
                            </label>
                            <Controller
                                name="signature"
                                control={control}
                                render={({ field }) => (
                                    <input {...field} className="form-control form-control-sm" />
                                )}
                            />
                        </div>

                    </div>


                </fieldset>
            </form>
        </>
    )
}

export default CreateHouseAirwayBillOut