import React from "react";

const AccountingEntryVendorInvoiceSeaOut = () => {
    return (
        <div className="container-fluid mt-3" style={{ fontSize: "14px" }}>

            {/* GREEN HEADER BAR */}
            <div
                className="d-flex justify-content-between align-items-center p-2 px-3"
                style={{
                    background: "#1f8f29",
                    color: "#ffffff",
                    borderRadius: "4px",
                }}
            >
                <h6 className="m-0 fw-normal">Accounting Entry Details</h6>

                <button
                    className="btn btn-primary btn-sm px-3"
                    onClick={() => window.open("/print-vendor-purchase", "_blank")}
                >
                    Print
                </button>

            </div>

            {/* TOP PARTY DETAILS */}
            <div className="mt-3">
                <div className="row">
                    <div className="col-md-8">
                        <p>
                            <strong>To</strong>&nbsp;&nbsp; A.V. TRAILERS
                        </p>
                        <p>
                            <strong>Address</strong>&nbsp;&nbsp;
                            5, IYPASSI STREET, BALAMURUGAN NAGAR, ALAPAKKAM, PORUR TAMIL NADU INDIA
                        </p>
                        <p>
                            <strong>Attn</strong>
                        </p>
                    </div>

                    <div className="col-md-4">
                        <p><strong>Gstin</strong></p>
                        <p>
                            <strong>Tel/Fax</strong>&nbsp;&nbsp; 9952993449/
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            {/* MAIN DETAILS TABLE */}
            <div className="table-responsive">
                <table
                    className="table table-sm"
                    style={{
                        border: "1px solid #dcdcdc",
                    }}
                >
                    <tbody>

                        <tr style={{ borderBottom: "1px solid #dcdcdc" }}>
                            <th style={{ width: "220px", background: "#f2f2f2" }}>Job No / Ref No</th>
                            <td>SE9008</td>
                            <th style={{ width: "220px", background: "#f2f2f2" }}>Voucher Date</th>
                            <td>2025-11-18</td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>M.B/L No</th>
                            <td>SI250116</td>
                            <th style={{ background: "#f2f2f2" }}>Voucher No</th>
                            <td>7630 AV</td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>H.B/L No</th>
                            <td>LOMS17166</td>
                            <th style={{ background: "#f2f2f2" }}>E.T.D</th>
                            <td>0000-00-00</td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Shipper</th>
                            <td>MMD HEAVY MECHINERY (INDIA) PRAIVATE LIMITED</td>
                            <th style={{ background: "#f2f2f2" }}>E.T.A</th>
                            <td>0000-00-00</td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Consignee</th>
                            <td>MMD AUTRALIA (WEST) PTY. LTD</td>
                            <th style={{ background: "#f2f2f2" }}>Port of loading</th>
                            <td></td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Vessel Name / Voy</th>
                            <td>/</td>
                            <th style={{ background: "#f2f2f2" }}>Place of Destination</th>
                            <td></td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Package / Grossweight</th>
                            <td>/</td>
                            <th style={{ background: "#f2f2f2" }}>Measurement</th>
                            <td></td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Be No</th>
                            <td>6979171</td>
                            <th style={{ background: "#f2f2f2" }}>Be Date</th>
                            <td>2025-11-14</td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Invoice Value</th>
                            <td></td>
                            <th style={{ background: "#f2f2f2" }}>Assessable Value</th>
                            <td></td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Shipper Invoice No</th>
                            <td></td>
                            <th style={{ background: "#f2f2f2" }}>Shipper Invoice Date</th>
                            <td></td>
                        </tr>

                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <th style={{ background: "#f2f2f2" }}>Shipper Invoice Amount</th>
                            <td></td>
                            <th style={{ background: "#f2f2f2" }}>Container</th>
                            <td>/ 1X20 HC</td>
                        </tr>

                        <tr>
                            <th style={{ background: "#f2f2f2" }}>Incoterms</th>
                            <td></td>
                            <th style={{ background: "#f2f2f2" }}></th>
                            <td></td>
                        </tr>

                    </tbody>
                </table>
            </div>

            {/* CHARGES TABLE */}
            <div className="table-responsive mt-3">
                <table
                    className="table table-sm"
                    style={{
                        border: "1px solid #dcdcdc",
                    }}
                >
                    <thead>
                        <tr
                            className="fw-bold"
                            style={{
                                background: "#f2f2f2",
                                borderBottom: "1px solid #dcdcdc",
                            }}
                        >
                            <th>Code</th>
                            <th>Description</th>
                            <th>SAC</th>
                            <th>Currency</th>
                            <th>Per</th>
                            <th>Amount</th>
                            <th>Ex.Rate</th>
                            <th>Amount in INR</th>
                            <th>GST %</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>IGST</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* ROW 1 */}
                        <tr style={{ borderBottom: "1px solid #e6e6e6" }}>
                            <td>TRAN</td>
                            <td>TRANSPORT CHARGES NON TAXABLE</td>
                            <td>996791</td>
                            <td>INR</td>
                            <td>BL</td>
                            <td>6800.00</td>
                            <td>1.00</td>
                            <td>6800.00</td>
                            <td>0</td>
                            <td>0.00</td>
                            <td>0.00</td>
                            <td>0.00</td>
                        </tr>

                        {/* SUBTOTAL ROW */}
                        <tr
                            className="fw-bold"
                            style={{
                                background: "#efefef",
                                borderTop: "1px solid #dcdcdc",
                            }}
                        >
                            <td colSpan={7}></td>
                            <td>Subtotal</td>
                            <td>6,800.00</td>
                            <td>0.00</td>
                            <td>0.00</td>
                            <td>0.00</td>
                        </tr>

                        {/* TOTAL ROW */}
                        <tr className="fw-bold">
                            <td colSpan={10}></td>
                            <td>Total</td>
                            <td>INR 6,800.00</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* FOOTER DETAILS */}
            <div className="mt-4">

                <p className="fw-bold mb-2">Remarks</p>

                <div className="row">
                    <div className="col-md-4">
                        <p><strong>Created by</strong> &nbsp; SAJITHA</p>
                    </div>
                    <div className="col-md-4">
                        <p><strong>Created On</strong> &nbsp; 2025-11-18</p>
                    </div>
                </div>

                <div className="row mt-2">
                    <div className="col-md-4">
                        <p className="fw-bold">Cancelled Remarks</p>
                    </div>
                    <div className="col-md-4">
                        <p className="fw-bold">Cancelled by</p>
                    </div>
                    <div className="col-md-4">
                        <p className="fw-bold">Cancelled On</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AccountingEntryVendorInvoiceSeaOut;
