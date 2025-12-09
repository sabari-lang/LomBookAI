// WarehouseEntry.jsx
import React from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";

const WarehouseEntry = () => {

    const { control, handleSubmit } = useForm({
        defaultValues: {
            // HEADER SECTION
            voucherType: "",
            voucherNo: "",
            voucherDate: "",
            baseCurrency: "INR",

            partyName: "",
            partyAddress: "",
            isSez: "",
            state: "",
            country: "",
            gstin: "",
            tel: "",
            fax: "",
            status: "Accounting Entry (Approved)",
            jobNo: "",

            placeSupplyName: "",
            placeSupplyAddress: "",

            // SPECIAL 4-COLUMN SECTION
            period: "",
            shipment: "",
            customerInvoiceNo: "",
            hblNo: "",
            NoPallet: "",
            noBox: "",
            totalNoBox: "",
            remark: "",

            // TABLE
            items: [
                {
                    description: "",
                    units: "BOX",
                    currency: "INR",
                    sac: "",
                    qty: "",
                    amount: "",
                    exRate: "1",
                    amountInr: "",
                    gstPer: "",
                    cgst: "",
                    sgst: "",
                    igst: "",
                    total: ""
                }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const onSubmit = (data) => {
        console.log("Warehouse Entry Submit:", data);
    };

    const labelStyle = { fontWeight: 600, fontSize: "14px" };

    return (
        <div
            className="modal fade"
            id="warehouseEntryModalSeaIn"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content" style={{ maxHeight: "95vh", overflowY: "auto" }}>

                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Warehouse Entry</h5>
                        <button className="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* BODY */}
                        <div className="modal-body" >

                            {/* VOUCHER ROW */}
                            <div className="row g-3">
                                {/* Voucher Type */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>Voucher Type</label>
                                    <Controller
                                        name="voucherType"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option value="">-- Select --</option>
                                                <option value="Warehouse">Warehouse</option>
                                                <option value="Storage">Storage</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                {/* Voucher No */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>Voucher No</label>
                                    <Controller
                                        name="voucherNo"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                {/* Voucher Date */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>Voucher Date</label>
                                    <Controller
                                        name="voucherDate"
                                        control={control}
                                        render={({ field }) => <input type="date" className="form-control" {...field} />}
                                    />
                                </div>

                                {/* Base Currency */}
                                <div className="col-md-3">
                                    <label style={labelStyle}>Base Currency</label>
                                    <Controller
                                        name="baseCurrency"
                                        control={control}
                                        render={({ field }) => (
                                            <select className="form-select" {...field}>
                                                <option>INR</option>
                                                <option>USD</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* PARTY NAME */}
                            <div className="mt-3">
                                <label style={labelStyle}>Party Name</label>
                                <Controller
                                    name="partyName"
                                    control={control}
                                    render={({ field }) => <input className="form-control" {...field} />}
                                />
                            </div>

                            {/* PARTY ADDRESS */}
                            <div className="mt-3">
                                <label style={labelStyle}>Party Address</label>
                                <Controller
                                    name="partyAddress"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea rows={2} className="form-control" {...field}></textarea>
                                    )}
                                />
                            </div>

                            {/* ROW 2: SEZ, STATE, COUNTRY, GST */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                    <label style={labelStyle}>Is SEZ</label>
                                    <Controller
                                        name="isSez"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>State</label>
                                    <Controller
                                        name="state"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Country</label>
                                    <Controller
                                        name="country"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>GSTIN</label>
                                    <Controller
                                        name="gstin"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>
                            </div>

                            {/* TEL FAX STATUS JOBNO */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-3">
                                    <label style={labelStyle}>TEL</label>
                                    <Controller
                                        name="tel"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>FAX</label>
                                    <Controller
                                        name="fax"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Status</label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label style={labelStyle}>Job No</label>
                                    <Controller
                                        name="jobNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* PLACES OF SUPPLY */}
                            <div className="row g-3 mt-3">
                                <div className="col-md-6">
                                    <label style={labelStyle}>Place of Supply Name</label>
                                    <Controller
                                        name="placeSupplyName"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label style={labelStyle}>Place of Supply Address</label>
                                    <Controller
                                        name="placeSupplyAddress"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea rows={2} className="form-control" {...field}></textarea>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* ===================================== */}
                            {/* EXACT 4-COLUMN SECTION FROM SCREENSHOT */}
                            {/* ===================================== */}

                            {/* PERIOD + SHIPMENT */}
                            <div className="row g-3 mt-4">

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">Period</label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="period"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">Shipment</label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="shipment"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* INVOICE + HBL */}
                            <div className="row g-3 mt-3">

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">
                                        Customer Invoice No
                                    </label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="customerInvoiceNo"
                                        control={control}
                                        render={({ field }) => <input className="form-control" {...field} />}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">HBL No</label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="hblNo"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>

                            </div>

                            {/* Pallet + Box */}
                            <div className="row g-3 mt-3">

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">Nos of Pallet</label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="NoPallet"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">Nos of Box</label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="noBox"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>

                            </div>

                            {/* Total Box */}
                            <div className="row g-3 mt-3">

                                <div className="col-md-3">
                                    <label className="form-control bg-light fw-semibold">
                                        Total Nos of Box
                                    </label>
                                </div>

                                <div className="col-md-3">
                                    <Controller
                                        name="totalNoBox"
                                        control={control}
                                        render={({ field }) => (
                                            <input className="form-control bg-light" readOnly {...field} />
                                        )}
                                    />
                                </div>

                            </div>

                            {/* Remarks */}
                            <div className="mt-3">
                                <label style={labelStyle}>Remarks</label>
                                <Controller
                                    name="remark"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea className="form-control" rows={3} {...field}></textarea>
                                    )}
                                />
                            </div>

                            {/* TABLE SECTION */}
                            <h6 className="fw-bold mt-4">Items</h6>

                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Units</th>
                                        <th>CUR</th>
                                        <th>SAC</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                        <th>Ex Rate</th>
                                        <th>Amount INR</th>
                                        <th>GST%</th>
                                        <th>CGST</th>
                                        <th>SGST</th>
                                        <th>IGST</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {fields.map((item, index) => (
                                        <tr key={item.id}>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.description`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.units`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select className="form-select" {...field}>
                                                            <option>BOX</option>
                                                            <option>PCS</option>
                                                        </select>
                                                    )}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.currency`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select className="form-select" {...field}>
                                                            <option>INR</option>
                                                            <option>USD</option>
                                                        </select>
                                                    )}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.sac`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.qty`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.amount`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.exRate`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.amountInr`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.gstPer`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.cgst`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.sgst`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.igst`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <Controller
                                                    name={`items.${index}.total`}
                                                    control={control}
                                                    render={({ field }) => <input className="form-control" {...field} />}
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => remove(index)}
                                                >
                                                    -
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                    append({
                                        description: "",
                                        units: "BOX",
                                        currency: "INR",
                                        sac: "",
                                        qty: "",
                                        amount: "",
                                        exRate: "1",
                                        amountInr: "",
                                        gstPer: "",
                                        cgst: "",
                                        sgst: "",
                                        igst: "",
                                        total: ""
                                    })
                                }
                            >
                                + Add Row
                            </button>

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
                                Save
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
};

export default WarehouseEntry;
