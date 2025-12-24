import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";




const CreateMasterAirwayBillOut = () => {
    // Create-only form - always unlock on mount
    
    const { control, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: {
            // leave defaults empty as requested
            jobNo: "",
            blType: "",
            consol: "",
            shipment: "",
            status: "",
            branch: "",
            mawb: "",
            shipperName: "",
            shipperAddr: "",
            airwbName: "",
            airwbAddr: "",
            consigneeName: "",
            consigneeAddr: "",
            notifyName: "",
            notifyAddr: "",
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
            currency: "",
            code: "",
            wtValPp: "",
            coll1: "",
            otherPp: "",
            coll2: "",
            to2: "",
            by2: "",
            to3: "",
            by3: "",
            to4: "",
            by4: "",
            handlingInfo: "",
            pieces: "",
            grossWeight: "",
            kgLb: "",
            rateClass: "",
            chargeableWeight: "",
            rateCharge: "",
            total: "",
            natureOfGoods: "",
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
        },
    });

    const storedRaw = sessionStorage.getItem("masterAirwayData");
    const storedData = storedRaw ? JSON.parse(storedRaw) : null;

    useEffect(() => {
        if (!storedData) return;

        // DATE FIX – convert to yyyy-MM-dd
        const fixedData = { ...storedData };

        reset(fixedData);

    }, []);   // 👈 EMPTY DEPENDENCY ARRAY (run once)



    const onSubmit = (data) => {
        console.log("Create Master Airway payload:", data);
        // call API to save
    };

    return (
        <>
            <form className="py-4" onSubmit={handleSubmit(onSubmit)}>
                {/* ALL FIELDS NOW DISABLED */}
                <fieldset disabled>

                    {/* ================= BLOCK 1 — JOB DETAILS ================= */}
                    <div className="row g-3 mb-4">

                        <div className="col-md-4">
                            <label className="fw-bold">Job No/Ref No</label>
                            <Controller
                                name="jobNo"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control" {...field} />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="fw-bold">B/L Type</label>
                            <Controller
                                name="blType"
                                control={control}
                                render={({ field }) => (
                                    <select className="form-select" {...field}>
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
                                    <select className="form-select" {...field}>
                                        <option>Consol</option>
                                        <option>Single</option>
                                    </select>
                                )}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="fw-bold">Export</label>
                            <button className="btn btn-light w-100" type="button">
                                Export
                            </button>
                        </div>

                        <div className="col-md-4">
                            <label className="fw-bold">MAWB No</label>
                            <Controller
                                name="mawbNo"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control" {...field} />
                                )}
                            />
                        </div>

                        <div className="col-md-3">
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

                        <div className="col-md-2">
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

                        {/* Shipper */}
                        <div className="col-md-6">
                            <label className="fw-bold">Shipper's Name & Address</label>

                            <Controller
                                name="shipperName"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-2" {...field} />
                                )}
                            />

                            <Controller
                                name="shipperAddress"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control" rows={4} {...field}></textarea>
                                )}
                            />
                        </div>

                        {/* Air Waybill */}
                        <div className="col-md-6">
                            <label className="fw-bold">Not Negotiable Air Waybill</label>

                            <Controller
                                name="airWayBill"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-2" {...field} />
                                )}
                            />

                            <Controller
                                name="airWayBillAddress"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control" rows={4} {...field}></textarea>
                                )}
                            />
                        </div>
                    </div>

                    {/* ================= BLOCK 2 — CONSIGNEE + NOTIFY ================= */}
                    <div className="row g-3 mb-4">

                        <div className="col-md-6">
                            <label className="fw-bold">Consignee Name & Address</label>

                            <Controller
                                name="consigneeName"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-2" {...field} />
                                )}
                            />

                            <Controller
                                name="consigneeAddress"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control" rows={4} {...field}></textarea>
                                )}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="fw-bold">Notify Name & Address</label>

                            <Controller
                                name="sameAsConsignee"
                                control={control}
                                render={({ field }) => (
                                    <label className="fw-bold small">
                                        <input
                                            type="checkbox"
                                            className="me-2"
                                            checked={field.value || false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                        SAME AS CONSIGNEE
                                    </label>
                                )}
                            />

                            <Controller
                                name="copyConsignee"
                                control={control}
                                render={({ field }) => (
                                    <label className="fw-bold small ms-3">
                                        <input
                                            type="checkbox"
                                            className="me-2"
                                            checked={field.value || false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                        COPY AS CONSIGNEE
                                    </label>
                                )}
                            />

                            <Controller
                                name="notifyName"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-2" {...field} />
                                )}
                            />

                            <Controller
                                name="notifyAddress"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control" rows={4} {...field}></textarea>
                                )}
                            />
                        </div>
                    </div>

                    {/* ================= BLOCK 3 — AGENT + ACCOUNTING ================= */}
                    <div className="row g-4">
                        {/* LEFT COLUMN */}
                        <div className="col-md-6">
                            <label className="fw-bold">Issuing Carrier's Agent Name & City</label>

                            <Controller
                                name="issuingAgent"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-3" {...field} />
                                )}
                            />

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="fw-bold">Agent's IATA Code</label>
                                    <Controller
                                        name="iataCode"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Account No</label>
                                    <Controller
                                        name="accountNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            <label className="fw-bold mt-3">Airport of Departure</label>
                            <Controller
                                name="airportDeparture"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control mb-3" {...field} />
                                )}
                            />

                            <div className="row g-2">
                                <div className="col-md-4">
                                    <label className="fw-bold small">To</label>
                                    <Controller
                                        name="to1"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-8">
                                    <label className="fw-bold small">By First Carrier</label>
                                    <Controller
                                        name="by1"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-md-6">
                                    <label className="fw-bold">Airport of Destination</label>
                                    <Controller
                                        name="airportDestination"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Flight No</label>
                                    <Controller
                                        name="flightNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
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
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Arrival Date</label>
                                    <Controller
                                        name="arrivalDate"
                                        control={control}
                                        render={({ field }) => (
                                            <input type="date" className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            <label className="fw-bold mt-3">Handling Information</label>
                            <Controller
                                name="handlingInfo"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control" rows={3} {...field}></textarea>
                                )}
                            />
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="col-md-6">
                            <label className="fw-bold">Accounting Information</label>
                            <Controller
                                name="accountingInfo"
                                control={control}
                                render={({ field }) => (
                                    <textarea className="form-control mb-3" rows={4} {...field}></textarea>
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
                                                <input className="form-control" {...field} />
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
                                                <input className="form-control" {...field} />
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
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Declared Value for Customs</label>
                                    <Controller
                                        name="declaredCustoms"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
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
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="fw-bold">Freight Term</label>
                                    <Controller
                                        name="freightTerm"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control" {...field} />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= BLOCK 4 — PIECES / GOODS ================= */}
                    <div className="row g-3 mt-4 border-top">
                        {[
                            { name: "pieces", label: "No.of Pieces RCP", col: "2" },
                            { name: "grossWeight", label: "Gross Weight", col: "2" },
                            { name: "kgLb", label: "Kg/lb", col: "1" },
                            { name: "rateClass", label: "Rate class", col: "2" },
                            { name: "chargeableWeight", label: "Chargeable Weight", col: "2" },
                            { name: "rateCharge", label: "Rate / Charge", col: "2" },
                        ].map((f, i) => (
                            <div className={`col-md-${f.col}`} key={i}>
                                <label className="fw-bold small">{f.label}</label>
                                <Controller
                                    name={f.name}
                                    control={control}
                                    render={({ field }) => (
                                        <input className="form-control" {...field} />
                                    )}
                                />
                            </div>
                        ))}

                        <div className="col-md-1 d-flex align-items-center">
                            <Controller
                                name="arranged"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <input
                                            type="checkbox"
                                            className="me-2"
                                            checked={field.value || false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                        AS
                                    </>
                                )}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="fw-bold small">Total</label>
                            <Controller
                                name="totalCharge"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control" {...field} />
                                )}
                            />
                        </div>
                    </div>

                    <div className="mt-3 border-top">
                        <label className="fw-bold">
                            Nature and Quality of Goods
                        </label>
                        <Controller
                            name="natureGoods"
                            control={control}
                            render={({ field }) => (
                                <textarea className="form-control" rows={3} {...field}></textarea>
                            )}
                        />
                    </div>

                    {/* ================= BLOCK 5 — CHARGES ================= */}
                    <div className="row g-4 mt-4">

                        {/* Weight Charge */}
                        <div className="col-md-6">
                            <label className="fw-bold">Weight Charge</label>
                            <div className="row g-2">
                                {[
                                    { name: "weightPrepaid", label: "Prepaid" },
                                    { name: "weightCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Valuation Charge */}
                        <div className="col-md-6">
                            <label className="fw-bold">Valuation Charge</label>
                            <div className="row g-2">
                                {[
                                    { name: "valuationPrepaid", label: "Prepaid" },
                                    { name: "valuationCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tax */}
                        <div className="col-md-6">
                            <label className="fw-bold">Tax</label>
                            <div className="row g-2">
                                {[
                                    { name: "taxPrepaid", label: "Prepaid" },
                                    { name: "taxCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Charges Due Agent */}
                        <div className="col-md-6">
                            <label className="fw-bold">Total other Charges Due Agent</label>
                            <div className="row g-2">
                                {[
                                    { name: "agentPrepaid", label: "Prepaid" },
                                    { name: "agentCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Charges Due Carrier */}
                        <div className="col-md-6">
                            <label className="fw-bold">Total other Charges Due Carrier</label>
                            <div className="row g-2">
                                {[
                                    { name: "carrierPrepaid", label: "Prepaid" },
                                    { name: "carrierCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="col-md-6">
                            <label className="fw-bold">Total</label>
                            <div className="row g-2">
                                {[
                                    { name: "totalPrepaid", label: "Prepaid" },
                                    { name: "totalCollect", label: "Collect" },
                                ].map((f, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="small fw-bold">{f.label}</label>
                                        <Controller
                                            name={f.name}
                                            control={control}
                                            render={({ field }) => (
                                                <input className="form-control" {...field} />
                                            )}
                                        />
                                    </div>
                                ))}
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
                                    <input type="date" className="form-control" {...field} />
                                )}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="fw-bold">Place at</label>
                            <Controller
                                name="placeAt"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control" {...field} />
                                )}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="fw-bold">Signature of issuing Carrier</label>
                            <Controller
                                name="signature"
                                control={control}
                                render={({ field }) => (
                                    <input className="form-control" {...field} />
                                )}
                            />
                        </div>
                    </div>

                </fieldset>
            </form>

        </>
    );
};

export default CreateMasterAirwayBillOut;
