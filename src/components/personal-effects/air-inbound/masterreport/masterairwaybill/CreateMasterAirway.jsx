import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Search, X } from "react-bootstrap-icons";
import { refreshKeyboard } from "../../../../../utils/refreshKeyboard";

const CreateMasterAirway = ({ editData }) => {
    const isEditing = Boolean(editData?.id || editData?._id);

    
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            jobNo: "",
            blType: "",
            consol: "",
            shipment: "",
            status: "",
            branch: "",
            mawbNo: "",
            shipperName: "",
            shipperAddress: "",
            airWayBill: "",
            consigneeName: "",
            consigneeAddress: "",
            notifyName: "",
            notifyAddress: "",
            issuingAgent: "",
            iataCode: "",
            accountNo: "",
            accountingInfo: "",
            airportDeparture: "",
            to1: "",
            by1: "",
            airportDestination: "",
            flightNo: "",
            declaredCarriage: "",
            declaredCustoms: "",
            departureDate: "",
            arrivalDate: "",
            insurance: "",
            freightTerm: "",
            currency: "",
            code: "",
            wtvalPP: "",
            coll1: "",
            otherPP: "",
            coll2: "",
            rto1: "",
            rby1: "",
            rto2: "",
            rby2: "",
            handlingInfo: "",
            pieces: "",
            grossWeight: "",
            kgLb: "",
            rateClass: "",
            chargeableWeight: "",
            rateCharge: "",
            totalCharge: "",
            natureGoods: "",
            weightPrepaid: "",
            weightCollect: "",
            valuationPrepaid: "",
            valuationCollect: "",
            taxPrepaid: "",
            taxCollect: "",
            agentPrepaid: "",
            agentCollect: "",
            carrierPrepaid: "",
            carrierCollect: "",
            totalPrepaid: "",
            totalCollect: "",
            executedDate: "",
            placeAt: "",
            signature: "",
        },
    });

    const storedRaw = sessionStorage.getItem("peUbMasterAirwayData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    console.log("storedData", storedData)

    useEffect(() => {
        if (!storedData) return;

        // DATE FIX – convert to yyyy-MM-dd
        const fixedData = { ...storedData };

        reset(fixedData);
        // Call refreshKeyboard after form values are populated
        refreshKeyboard();

    }, []);   // 👈 EMPTY DEPENDENCY ARRAY (run once)



    const onSubmit = (data) => {
        console.log("Master Airway SAVE payload:", data);
    };

    return (
        <>

            <form onSubmit={handleSubmit(onSubmit)} className="py-3">

                {/* ================= BLOCK 1 — JOB DETAILS ================= */}
                <div className="row g-3 mb-4">

                    <div className="col-md-4">
                        <label className="fw-bold">Job No/Ref No</label>
                        <Controller
                            name="jobNo"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control" {...field} disabled />
                            )}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="fw-bold">B/L Type</label>
                        <Controller
                            name="blType"
                            control={control}
                            render={({ field }) => (
                                <select className="form-select" {...field} disabled>
                                    <option>Master B/L</option>
                                    <option>House B/L</option>
                                </select>
                            )}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold">Consol</label>
                        <Controller
                            name="consol"
                            control={control}
                            render={({ field }) => (
                                <select className="form-select" {...field} disabled>
                                    <option>Consol</option>
                                    <option>Single</option>
                                </select>
                            )}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold">Import</label>
                        <button className="btn btn-light w-100" type="button" disabled>
                            Import
                        </button>
                    </div>

                    <div className="col-md-4">
                        <label className="fw-bold">MAWB No</label>
                        <Controller
                            name="mawbNo"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control" {...field} disabled />
                            )}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="fw-bold">Shipment</label>
                        <Controller
                            name="shipment"
                            control={control}
                            render={({ field }) => (
                                <select className="form-select" {...field} disabled>
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
                        <label className="fw-bold">Status</label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <select className="form-select" {...field} disabled>
                                    <option>Open</option>
                                    <option>Not Arrived</option>
                                    <option>Today Planning</option>
                                    <option>Awaiting for Duty</option>
                                    <option>Queries from Customs</option>
                                    <option>Awaiting CEPA</option>
                                    <option>OOC Completed</option>
                                    <option>Delivered</option>
                                    <option>Others</option>
                                    <option>Clearance Completed</option>
                                    <option>Pending for Query</option>
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
                                <select className="form-select" {...field} disabled>
                                    <option>HEAD OFFICE</option>
                                    <option>ANATHAPUR</option>
                                    <option>BANGALORE</option>
                                    <option>MUMBAI</option>
                                    <option>NEW DELHI</option>
                                    <option>BLR SALES</option>
                                </select>
                            )}
                        />
                    </div>

                    {/* Shipper */}
                    <div className="col-md-6">
                        <label className="fw-bold d-flex align-items-center gap-2">
                            Shipper's Name & Address <Search size={15} />
                        </label>

                        <Controller
                            name="shipperName"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-2" {...field} disabled />
                            )}
                        />

                        <Controller
                            name="shipperAddress"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control" rows={4} {...field} disabled></textarea>
                            )}
                        />
                    </div>

                    {/* Air Waybill */}
                    <div className="col-md-6">
                        <label className="fw-bold d-flex align-items-center gap-2">
                            Not Negotiable Air Waybill <Search size={15} />
                        </label>

                        <Controller
                            name="airWayBill"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-2" {...field} disabled />
                            )}
                        />

                        <textarea className="form-control" rows={4} disabled></textarea>
                    </div>
                </div>

                {/* ================= BLOCK 2 — CONSIGNEE + NOTIFY ================= */}
                <div className="row g-3 mb-4">

                    <div className="col-md-6">
                        <label className="fw-bold d-flex align-items-center gap-2">
                            Consignee Name & Address <Search size={15} />
                        </label>

                        <Controller
                            name="consigneeName"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-2" {...field} disabled />
                            )}
                        />

                        <Controller
                            name="consigneeAddress"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control" rows={4} {...field} disabled></textarea>
                            )}
                        />
                    </div>

                    <div className="col-md-6">

                        <div className="d-flex align-items-center gap-3 mb-1">
                            <label className="fw-bold d-flex align-items-center gap-2 mb-0">
                                Notify Name & Address <Search size={15} />
                            </label>

                            <label className="fw-bold small mb-0 d-flex align-items-center">
                                <input type="checkbox" className="me-2" disabled />
                                SAME AS CONSIGNEE
                            </label>
                        </div>

                        <Controller
                            name="notifyName"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-2" {...field} disabled />
                            )}
                        />

                        <Controller
                            name="notifyAddress"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control" rows={4} {...field} disabled></textarea>
                            )}
                        />
                    </div>
                </div>

                {/* ================= BLOCK 3 — AGENT + ACCOUNTING ================= */}
                <div className="row g-4">

                    <div className="col-md-6">

                        <label className="fw-bold d-flex align-items-center gap-2">
                            Issuing Carrier's Agent Name & City <Search size={15} />
                        </label>

                        <Controller
                            name="issuingAgent"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-3" {...field} disabled />
                            )}
                        />

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="fw-bold">Agent's IATA Code</label>
                                <Controller
                                    name="iataCode"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Account No</label>
                                <Controller
                                    name="accountNo"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>

                        <label className="fw-bold mt-3 d-flex align-items-center gap-2">
                            Airport of Departure & Requested Routing <Search size={15} />
                        </label>

                        <Controller
                            name="airportDeparture"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control mb-3" {...field} disabled />
                            )}
                        />

                        <div className="row g-2">
                            <div className="col-md-4">
                                <label className="fw-bold small">To</label>
                                <Controller
                                    name="to1"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-8">
                                <label className="fw-bold small">By First Carrier</label>
                                <Controller
                                    name="by1"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mt-3">
                            <div className="col-md-6">
                                <label className="fw-bold d-flex align-items-center gap-2">
                                    Airport of Destination <Search size={15} />
                                </label>
                                <Controller
                                    name="airportDestination"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Flight No</label>
                                <Controller
                                    name="flightNo"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mt-3">
                            <div className="col-md-6">
                                <label className="fw-bold">Departure Date</label>
                                <Controller
                                    name="departureDate"
                                    control={control}
                                    render={({ field }) => (
                                        <input type="date" className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Arrival Date</label>
                                <Controller
                                    name="arrivalDate"
                                    control={control}
                                    render={({ field }) => (
                                        <input type="date" className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>

                        <label className="fw-bold mt-3">Handling Information</label>
                        <Controller
                            name="handlingInfo"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control" rows={3} {...field} disabled></textarea>
                            )}
                        />
                    </div>

                    {/* ================= RIGHT SIDE ================= */}
                    <div className="col-md-6">
                        <label className="fw-bold">Accounting Information</label>

                        <Controller
                            name="accountingInfo"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control mb-3" rows={4} {...field} disabled></textarea>
                            )}
                        />

                        <div className="row g-2">
                            {[
                                { name: "currency", label: "Currency" },
                                { name: "code", label: "Code" },
                                { name: "wtvalPP", label: "WT/VAL PP" },
                                { name: "coll1", label: "COLL" },
                                { name: "otherPP", label: "Other PP" },
                                { name: "coll2", label: "COLL" },
                            ].map((f, i) => (
                                <div className="col-md-2" key={i}>
                                    <label className="fw-bold small">{f.label}</label>
                                    <Controller
                                        name={f.name}
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} disabled />
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="row g-2 mt-2">
                            {[
                                { name: "rto1", label: "To" },
                                { name: "rby1", label: "By" },
                                { name: "rto2", label: "To" },
                                { name: "rby2", label: "By" },
                            ].map((f, i) => (
                                <div className="col-md-3" key={i}>
                                    <label className="fw-bold small">{f.label}</label>
                                    <Controller
                                        name={f.name}
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} disabled />
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="row g-3 mt-3">
                            <div className="col-md-6">
                                <label className="fw-bold">Declared Value for Carriage</label>
                                <Controller
                                    name="declaredCarriage"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Declared Value for Customs</label>
                                <Controller
                                    name="declaredCustoms"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mt-3">
                            <div className="col-md-6">
                                <label className="fw-bold">Amount of Insurance</label>
                                <Controller
                                    name="insurance"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Freight Term</label>
                                <Controller
                                    name="freightTerm"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= BLOCK 4 — PIECES / GOODS ================= */}
                <div className="row g-3 mt-4 border-top">

                    <div className="col-md-2">
                        <label className="fw-bold small">No.of Pieces RCP</label>
                        <Controller
                            name="pieces"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold small">Gross Weight</label>
                        <Controller
                            name="grossWeight"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-1">
                        <label className="fw-bold small">Kg/lb</label>
                        <Controller
                            name="kgLb"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold small">Rate class</label>
                        <Controller
                            name="rateClass"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold small">Chargeable Weight</label>
                        <Controller
                            name="chargeableWeight"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold small">Rate / Charge</label>
                        <Controller
                            name="rateCharge"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>

                    <div className="col-md-1 d-flex align-items-center">
                        <Controller
                            name="arranged"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="checkbox"
                                    className="me-2"
                                    checked={field.value || false}
                                    disabled
                                />
                            )}
                        />
                        AS
                    </div>

                    <div className="col-md-2">
                        <label className="fw-bold small">Total</label>
                        <Controller
                            name="totalCharge"
                            control={control}
                            render={({ field }) => <input className="form-control" {...field} disabled />}
                        />
                    </div>
                </div>

                {/* GOODS DESCRIPTION */}
                <div className="mt-3 border-top">
                    <label className="fw-bold">
                        Nature and Quality of Goods (incl. Dimensions or Volume)
                    </label>

                    <Controller
                        name="natureGoods"
                        control={control}
                        render={({ field }) => (
                            <textarea className="form-control" rows={3} {...field} disabled></textarea>
                        )}
                    />
                </div>

                {/* ================= BLOCK 5 — CHARGES ================= */}
                <div className="row g-4 mt-4">

                    {/* Weight Charge */}
                    <div className="col-md-6">
                        <label className="fw-bold">Weight Charge</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="weightPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="weightCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Valuation Charge */}
                    <div className="col-md-6">
                        <label className="fw-bold">Valuation Charge</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="valuationPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="valuationCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax */}
                    <div className="col-md-6">
                        <label className="fw-bold">Tax</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="taxPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="taxCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Charges Due Agent */}
                    <div className="col-md-6">
                        <label className="fw-bold">Total other Charges Due Agent</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="agentPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="agentCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Charges Due Carrier */}
                    <div className="col-md-6">
                        <label className="fw-bold">Total other Charges Due Carrier</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="carrierPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="carrierCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="col-md-6">
                        <label className="fw-bold">Total</label>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="small fw-bold">Prepaid</label>
                                <Controller
                                    name="totalPrepaid"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="small fw-bold">Collect</label>
                                <Controller
                                    name="totalCollect"
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} disabled />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="row g-3 mt-4">

                    <div className="col-md-4">
                        <label className="fw-bold">Executed date</label>
                        <Controller
                            name="executedDate"
                            control={control}
                            render={({ field }) => (
                                <input type="date" className="form-control" {...field} disabled />
                            )}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="fw-bold">Place at</label>
                        <Controller
                            name="placeAt"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control" {...field} disabled />
                            )}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="fw-bold">Signature of issuing Carrier</label>
                        <Controller
                            name="signature"
                            control={control}
                            render={({ field }) => (
                                <input className="form-control" {...field} disabled />
                            )}
                        />
                    </div>
                </div>

            </form>





        </>
    );
};

export default CreateMasterAirway;
