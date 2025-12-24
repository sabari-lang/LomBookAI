import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";

import { toWords } from "number-to-words";

import html2pdf from "html2pdf.js";
import { useAppBack } from "../../hooks/useAppBack";

const InvoiceDownload = () => {
    const { state } = useLocation();
    const { goBack } = useAppBack();

    const InvoiceData = state || {};

    const InvoiceDataTOCamel = {
        id: state?.Id,
        invoiceName: state?.InvoiceName,
        vendorName: state?.VendorName,
        vendorAddress: state?.VendorAddress,
        invoiceNumber: state?.InvoiceNumber,
        createdAt: state?.CreatedAt,
        ewayBillDate: state?.EwayBillDate,
        referenceDate: state?.ReferenceDate,
        buyersOrderDate: state?.BuyersOrderDate,
        deliveryNoteDate: state?.DeliveryNoteDate,
        dueDate: state?.DueDate,
        currency: state?.Currency,
        gst: state?.Gst,
        total: state?.Total,
        status: state?.Status,
        lineItems: state?.LineItems,
        paymentMode: state?.PaymentMode,
        vehicleNo: state?.VehicleNo,
        destination: state?.Destination,
        paymentTerms: state?.PaymentTerms,
        vendorGst: state?.VendorGst,
        po: state?.Po,
        vendorEmail: state?.VendorEmail,
        vendorPhone: state?.VendorPhone,
        vendorState: state?.VendorState,
        vendorStateCode: state?.VendorStateCode,
        bankDetails: state?.BankDetails,
        customerName: state?.CustomerName,
        customerGst: state?.CustomerGST,
        billingAddress: state?.BillingAddress,
        shippingAddress: state?.ShippingAddress,
        state: state?.State,
        placeOfSupply: state?.PlaceOfSupply,
        placeOfSupplyCode: state?.PlaceOfSupplyCode,
        eWayBillNo: state?.EWayBillNo,
        deliveryNote: state?.DeliveryNote,
        referenceNo: state?.ReferenceNo,
        buyersOrderNo: state?.BuyersOrderNo,
        dispatchDocNo: state?.DispatchDocNo,
        dispatchedThrough: state?.DispatchedThrough,
        billOfLadingNo: state?.BillOfLadingNo,
        termsOfDelivery: state?.TermsOfDelivery,
        companyPan: state?.CompanyPAN,
        declaration: state?.Declaration,
        authorisedSignatory: state?.AuthorisedSignatory,
        notes: state?.Notes,
        subtotal: state?.Subtotal,
        taxTotal: state?.TaxTotal,
        discountTotal: state?.DiscountTotal,
        createdAtUtc: state?.CreatedAtUtc,
        updatedAtUtc: state?.UpdatedAtUtc,
    };

    // console.log("Invoice Data:", InvoiceData);

    const ContainerRef = useRef(null);

    const PageMarginMM = 5; // same margin you pass to html2pdf
    const ContainerStyle = {
        width: "210mm", // A4 width
        minHeight: "287mm", // 297 - (5 top + 5 bottom) = 287mm
        padding: `${PageMarginMM}mm`,
        margin: "auto",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        fontSize: "11px",
        fontFamily: "Arial, sans-serif",
        color: "#000",
        overflow: "visible",
    };
    // First, compute totals before returning JSX
    const TotalQty = InvoiceData?.LineItems?.reduce((Sum, Item) => {
        const Qty = parseFloat(Item?.Qty) || 0;
        return Sum + Qty;
    }, 0);

    const TotalAmount = InvoiceData?.LineItems?.reduce((Sum, Item) => {
        const Qty = parseFloat(Item?.Qty) || 0;
        const UnitPrice = parseFloat(Item?.UnitPrice) || 0;
        return Sum + Qty * UnitPrice;
    }, 0);

    const TotalAmountInWords = TotalAmount
        ? `INR ${toWords(TotalAmount).replace(/,/g, "")}`
        : "-";

    // HSN CODE BREAKUP
    const HsnSummary = InvoiceData?.LineItems?.reduce((Acc, Item) => {
        const Hsn = Item.HsnSac || "-";
        const TaxableValue =
            parseFloat(Item.TotalAmount) ||
            (parseFloat(Item.Qty) || 0) * (parseFloat(Item.UnitPrice) || 0);
        const Cgst = parseFloat(Item.Cgst) || 0;
        const Sgst = parseFloat(Item.Sgst) || 0;

        if (!Acc[Hsn]) {
            Acc[Hsn] = { TaxableValue: 0, Cgst: 0, Sgst: 0 };
        }

        Acc[Hsn].TaxableValue += TaxableValue;
        Acc[Hsn].Cgst += Cgst;
        Acc[Hsn].Sgst += Sgst;

        return Acc;
    }, {});

    // Safe calculation of TotalSummary
    const TotalSummary = Object.values(HsnSummary || {}).reduce(
        (Totals, Item) => {
            Totals.TaxableValue += Number(Item.TaxableValue) || 0;
            Totals.Cgst += Number(Item.Cgst) || 0;
            Totals.Sgst += Number(Item.Sgst) || 0;
            return Totals;
        },
        { TaxableValue: 0, Cgst: 0, Sgst: 0 }
    );

    const DownloadPDF = () => {
        if (!ContainerRef.current) return;

        const Opt = {
            margin: 1, // must match the CSS math above
            filename: "invoice.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 2, // crisp without huge files
                useCORS: true,
                letterRendering: true,
            },
            // jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            jsPDF: { unit: "mm", format: [210, 400], orientation: "portrait" },

            // Use CSS-driven page breaks & avoid splitting where possible
            pagebreak: {
                mode: ["css", "legacy"],
                avoid: ["tr", "td", "th", ".avoid-break"], // try hard not to split tables/blocks
                // you can force a break by adding class="page-break" in the markup
            },
        };

        html2pdf().set(Opt).from(ContainerRef.current).save();
    };

    let TotalTaxAmountInWords;
    let TotalSgst = 0;
    let TotalCgst = 0;
    let TotalTaxPrice = 0;
    let SumOfTaxAmount = 0;
    return (
        <>
            <div className="container p-3">
                <div style={ContainerStyle} id="invoice-container" ref={ContainerRef}>
                    <h5 className="text-center mb-3">Tax Invoice</h5>

                    <table className="table  invoice-agent-table m-0">
                        <tbody>
                            <tr>
                                <td rowSpan="4" style={{ width: "40%" }}>
                                    <div className="company-info">
                                        <strong>{InvoiceData?.VendorName}</strong>
                                        {InvoiceData?.VendorAddress || ""}
                                        <br />
                                        GSTIN/UIN: <b>{InvoiceData?.VendorGst}</b>
                                        <br />
                                    </div>
                                </td>
                                <td style={{ width: "30%" }}>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <span>Invoice No.</span>
                                            <br />
                                            <strong>{InvoiceData?.InvoiceNumber || ""}</strong>
                                        </div>
                                        <div>
                                            <span>e-Way Bill No.</span>
                                            <br />
                                            <strong>
                                                {InvoiceData.EWayBillNo || "511870077347"}
                                            </strong>
                                        </div>
                                    </div>
                                </td>

                                <td style={{ width: "30%" }}>
                                    <div className="d-flex flex-column">
                                        <span>Dated</span>

                                        <strong>
                                            {InvoiceData?.EwayBillDate
                                                ? moment(InvoiceData?.EwayBillDate).format("DD-MM-YYYY")
                                                : ""}
                                        </strong>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ width: "30%" }}>
                                    {" "}
                                    <span> Delivery Note</span>
                                    <br />
                                    <strong>{InvoiceData?.DeliveryNote || ""}</strong>
                                </td>
                                <td style={{ width: "30%" }}>
                                    <span> Mode/Terms of Payment</span>
                                    <br />
                                    <strong>{InvoiceData?.PaymentTerms || ""} Days</strong>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span>Reference No. & Date</span>
                                    <br />
                                    <strong>
                                        {InvoiceData?.Po && InvoiceData?.ReferenceDate
                                            ? `${InvoiceData?.Po} / ${InvoiceData?.ReferenceDate}`
                                            : "-"}
                                    </strong>
                                </td>

                                <td>
                                    <span>Other References</span>
                                    <br />
                                    <strong>{InvoiceData?.ReferenceNo || "-"} </strong>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span> Buyer's Order No.</span>
                                    <br />
                                    <strong>{InvoiceData?.BuyersOrderNo || "-"} </strong>
                                </td>
                                <td>
                                    <span>Dated</span>
                                    <br />
                                    <strong>
                                        {InvoiceData?.BuyersOrderDate
                                            ? moment(InvoiceData?.BuyersOrderDate).format(
                                                "DD-MM-YYYY"
                                            )
                                            : ""}
                                    </strong>
                                </td>
                            </tr>
                            <tr>
                                <td rowSpan="4">
                                    <span>Consignee (Ship to)</span>
                                    <br />
                                    <strong>{InvoiceData?.VendorName}</strong>
                                    <br />
                                    {InvoiceData?.VendorAddress || ""}
                                    <br />
                                    GSTIN/UIN: {InvoiceData.CompanyGSTIN || "33AAJCM9059K1ZY"}
                                </td>
                                <td>
                                    <span> Dispatch Doc No.</span>
                                    <br />
                                    <strong>{InvoiceData?.DispatchDocNo || "-"} </strong>
                                </td>
                                <td>
                                    {" "}
                                    <span> Delivery Note Date</span>
                                    <br />
                                    <strong>{InvoiceData?.DeliveryNoteDate || "-"} </strong>
                                    <br />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {" "}
                                    <span> Dispatched through</span>
                                    <br />
                                    <strong>{InvoiceData?.DispatchedThrough || "-"} </strong>
                                </td>
                                <td>
                                    {" "}
                                    <span>Destination</span>
                                    <br />
                                    <strong>{InvoiceData?.Destination || "-"} </strong>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {" "}
                                    <span> Bill of Lading/LR-RR No.</span>
                                    <br />
                                    <strong>{InvoiceData?.BillOfLadingNo || "-"} </strong>
                                </td>
                                <td>
                                    {" "}
                                    <span> Motor Vehicle No.</span>
                                    <br />
                                    <strong>{InvoiceData?.VehicleNo || "-"} </strong>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="2">
                                    {" "}
                                    <span> Terms of Delivery</span>
                                    <br />
                                    <strong>{InvoiceData?.TermsOfDelivery || "-"} </strong>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="3" style={{ borderBottom: "none" }}>
                                    <span>Buyer (Bill to)</span>
                                    <br />
                                    <strong>{InvoiceData?.VendorName}</strong>
                                    <br />

                                    {InvoiceData?.VendorAddress || ""}
                                    <br />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="table invoice-agent-product-table m-0">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>No. & Kind of Pkgs.</th>
                                <th>Description of Goods</th>
                                <th>HSN/SAC</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>per</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {InvoiceData?.LineItems?.map((Data, Index) => (
                                <tr key={Index}>
                                    <td className="invoice-agent-product-table-data">
                                        {Index + 1}
                                    </td>
                                    {/* <td className="invoice-agent-product-table-data">{`${
                    Data?.NoOfKindBags || "-"
                  } X ${Data?.Qty} NOS`}</td> */}
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.Qty} NOS
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.Description || "-"}
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.HsnSac || "-"}
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        <b>{`${Data?.Qty || "-"} ${Data?.Unit || ""}`}</b>
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.UnitPrice || "-"}
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.Unit || "-"}
                                    </td>
                                    <td className="invoice-agent-product-table-data">
                                        {Data?.TotalAmount ||
                                            (
                                                (parseFloat(Data?.Qty) || 0) *
                                                (parseFloat(Data?.UnitPrice) || 0)
                                            ).toFixed(2)}
                                    </td>
                                </tr>
                            ))}

                            {/* Totals Row */}
                            <tr>
                                <td
                                    colSpan="4"
                                    className="text-end"
                                    style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}
                                >
                                    <strong>Total</strong>
                                </td>
                                <td style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}>
                                    <strong>{TotalQty}</strong>
                                </td>
                                <td style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}></td>
                                <td style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}></td>
                                <td style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}>
                                    <strong>{(TotalAmount ?? 0).toFixed(2)}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td
                                    colSpan="8"
                                    style={{ borderTop: " 1px solid rgb(0 0 0 / 60%)" }}
                                >
                                    <strong>Amount Chargeable (in words)</strong>
                                    <br />
                                    {TotalAmountInWords}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table className="table invoice-agent-product-table m-0">
                        <thead>
                            <tr>
                                <th rowSpan="2"> HSN/SAC</th>
                                <th rowSpan="2">Taxable Value</th>
                                <th colSpan="2">CGST</th>
                                <th colSpan="2">SGST</th>
                                <th rowSpan="2">Total Tax Amout</th>
                            </tr>
                            <tr>
                                <th>Rate</th>
                                <th>Amount</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(HsnSummary || {}).map(([Hsn, Values], Index) => {
                                const TaxRate = Number(Values.TaxRate) || 18;
                                const CgstRate = (TaxRate / 2).toFixed(2);
                                const SgstRate = (TaxRate / 2).toFixed(2);

                                const TaxableValue = Number(Values.TaxableValue) || 0;
                                const CgstAmt = (TaxableValue * TaxRate) / 200;
                                const SgstAmt = (TaxableValue * TaxRate) / 200;
                                const TotalTaxAmt = CgstAmt + SgstAmt;
                                const GrandTotal = TaxableValue + TotalTaxAmt;

                                TotalTaxAmountInWords = GrandTotal
                                    ? `INR ${toWords(GrandTotal).replace(/,/g, "")}`
                                    : "-";

                                TotalSgst += SgstAmt;
                                TotalCgst += CgstAmt;
                                SumOfTaxAmount += TotalTaxAmt;
                                TotalTaxPrice += GrandTotal;

                                return (
                                    <tr key={Index}>
                                        <td>{Hsn}</td>
                                        <td>{TaxableValue.toFixed(2)}</td>
                                        <td>{CgstRate}%</td>
                                        <td>{CgstAmt.toFixed(2)}</td>
                                        <td>{SgstRate}%</td>
                                        <td>{SgstAmt.toFixed(2)}</td>
                                        <td>{TotalTaxAmt.toFixed(2)}</td>
                                    </tr>
                                );
                            })}

                            <tr>
                                <td>
                                    <strong>Total</strong>
                                </td>
                                <td>
                                    <strong>{TotalSummary.TaxableValue.toFixed(2)}</strong>
                                </td>
                                <td></td>
                                <td>
                                    <strong>{TotalSgst.toFixed(2)}</strong>
                                </td>
                                <td></td>
                                <td>
                                    <strong>{TotalCgst.toFixed(2)}</strong>
                                </td>
                                <td>
                                    <strong>
                                        {/* {(TotalSummary.Cgst + TotalSummary.Sgst).toFixed(2)} */}
                                        {SumOfTaxAmount.toFixed(2)}
                                    </strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="table invoice-agent-table m-0">
                        <tbody>
                            <tr>
                                <td colSpan="">
                                    Tax Amount (in words) : <b>{TotalTaxAmountInWords}</b>
                                </td>
                                <td>
                                    <b>{TotalTaxPrice}</b>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Company's PAN : &nbsp; &nbsp;&nbsp; {InvoiceData?.CompanyPAN}
                                </td>
                                <td rowSpan="3">
                                    <p>for {InvoiceData?.VendorName}</p>
                                    <span>Authorised Signatory</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="border-0">Declaration</td>
                            </tr>
                            <tr>
                                <td>
                                    We declare that this invoice shows the actual price of the
                                    goods{" "}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="d-flex justify-content-center align-items-center gap-3 my-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => goBack()}
                        aria-label="Go back"
                    >
                        ← BACK
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                            navigate("/invoiceAgentForm", { state: InvoiceDataTOCamel })
                        }
                    >
                        EDIT
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={DownloadPDF}
                    >
                        DOWNLOAD
                    </button>
                </div>
            </div>
        </>
    );
};

export default InvoiceDownload;
