// AirInboundJobFromInvoice.jsx
// Front-end for FastAPI invoice analyzer -> AIR INBOUND JOB fields

import React, { useRef, useState } from "react";

import JobCreationAirInbound from "../logisticsservices/bl/airinbound/JobCreation";
import JobCreationAirOutbound from "../logisticsservices/bl/airoutbound/JobCreation";
import JobCreationSeaInbound from "../logisticsservices/bl/oceaninbound/JobCreationSeaInbound";
import JobCreationSeaOutbound from "../logisticsservices/bl/oceanoutbound/JobCreationSeaOutbound";
import { useNavigate } from "react-router-dom";


/** CONFIG **************************************************************/

const ANALYZE_URL = "http://localhost:8500/analyze";

const ALLOWED_TYPES = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
    "image/tif",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** JOB INITIAL VALUES **************************************************/

const initialJobValues = {
    jobNo: "",
    blType: "Master B/L",
    consol: "Consol",
    importType: "Import",
    mawbNo: "",
    shipment: "",
    status: "Open",
    branch: "HEAD OFFICE",

    shipperName: "",
    shipperAddress: "",
    airWayBill: "",
    agentAddress: "",

    // IMPORTANT: no LOM defaults any more
    consigneeName: "",
    consigneeAddress: "",

    notifyName: "",
    notifyAddress: "",

    issuingAgent: "",
    iataCode: "",
    accountNo: "",
    airportDeparture: "",
    to1: "",
    by1: "",

    airportDestination: "",
    flightNo: "",
    departureDate: "",
    arrivalDate: "",
    handlingInfo: "",

    accountingInfo: "",
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

    declaredCarriage: "N.V.D",
    declaredCustoms: "NVC",
    insurance: "NIL",
    freightTerm: "",

    pieces: "",
    grossWeight: "",
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: "",
    rateCharge: "",
    arranged: false,
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
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",
};

/** HELPERS *************************************************************/

function bytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function classNames(...xs) {
    return xs.filter(Boolean).join(" ");
}

/** ---- SMALL HELPERS ---- **/

const safe = (v) =>
    v === null || v === undefined ? "" : String(v).trim();

/**
 * Try to salvage JSON from result.raw even if there is trailing garbage.
 */
function safeParseInvoiceRaw(raw) {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw !== "string") return null;

    let candidate = raw.trim();
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    candidate = candidate.slice(firstBrace, lastBrace + 1);

    // try a light cleanup for trailing commas: ",}" or ",]"
    candidate = candidate.replace(/,(\s*[}\]])/g, "$1");

    try {
        return JSON.parse(candidate);
    } catch (e) {
        console.error("safeParseInvoiceRaw: JSON.parse failed", e, candidate);
        return null;
    }
}

/**
 * Normalize all the different shapes we have seen into a single "doc" object:
 *
 * 1) parsed = { vendor, buyer, invoice, shipping, freight, customs }
 * 2) parsed = { invoice: { vendor, buyer, invoice_details, shipping_details, ... } }
 * 3) parsed = { invoice: { vendor, buyer, invoice_id, issue_date, ... } }
 */
function normalizeDoc(invoiceWrapper) {
    if (!invoiceWrapper || typeof invoiceWrapper !== "object") return null;

    // Case 2/3: everything is inside invoice, and wrapper itself has no vendor/buyer
    if (
        invoiceWrapper.invoice &&
        !invoiceWrapper.vendor &&
        !invoiceWrapper.buyer &&
        typeof invoiceWrapper.invoice === "object"
    ) {
        return invoiceWrapper.invoice;
    }

    // Case 1: vendor/buyer/etc are already at top level
    return invoiceWrapper;
}

/**
 * Main mapping: DOCUMENT JSON -> Job form values.
 */
function mapInvoiceToJobFromRaw(initial, invoiceWrapper) {
    const doc = normalizeDoc(invoiceWrapper);
    if (!doc) return initial;

    // ---- Parties ----
    const vendor = doc.vendor || {}; // usually the forwarder / LOM or exporter
    const buyer = doc.buyer || {}; // usually importer / customer

    // Some JSONs have "shipping_details", some "shipping", some only "freight"
    const shipping = doc.shipping_details || doc.shipping || {};
    const freight = doc.freight || doc.shipping_details || {};
    const shippingWeight =
        doc.shipping_weight || shipping.shipping_weight || {};
    const shippingDims =
        doc.shipping_dimensions || shipping.shipping_dimensions || {};

    // ---- Invoice section ----
    const invSection =
        doc.invoice ||
        doc.invoice_details ||
        {
            invoice_id: doc.invoice_id,
            invoice_no: doc.invoice_no,
            invoice_number: doc.invoice_number,
            issue_date: doc.issue_date,
            due_date: doc.due_date,
            currency: doc.currency,
            amount: doc.amount,
            subtotal: doc.subtotal,
            tax: doc.tax,
            total: doc.total,
        };

    const jobNo =
        invSection.invoice_id ||
        invSection.invoice_no ||
        invSection.invoice_number ||
        "";

    // Currency
    const currency =
        invSection.currency || freight.currency || doc.currency || "";

    // Total charge
    const totalCharge =
        invSection.total ??
        invSection.amount ??
        freight.freight_amount ??
        freight.amount ??
        (typeof invSection.amount === "object"
            ? invSection.amount.total ?? invSection.amount.subtotal
            : undefined) ??
        "";

    // Dates (for invoice-style docs these are the only dates we have)
    const departureDate =
        invSection.issue_date || doc.issue_date || "";
    const arrivalDate =
        invSection.due_date || doc.due_date || "";

    // Freight term / Incoterms
    const freightTerm =
        freight.incoterms ||
        doc.shipping_terms ||
        shipping.freight_term ||
        "";

    // MAWB / AWB if ever present
    const mawb =
        doc.mawb_no ||
        freight.mawb_no ||
        shipping.mawb_no ||
        doc.awb_no ||
        doc.air_waybill_no ||
        doc.airway_bill_no ||
        "";

    // Airports / ports
    const airportDeparture =
        freight.origin || doc.shipping_port || shipping.origin || "";
    const airportDestination =
        freight.destination || shipping.destination || "";

    // Weight & pieces
    const grossWeight =
        freight.gross_weight ??
        shipping.gross_weight ??
        shippingWeight.gross_weight ??
        "";
    const pieces =
        freight.packages ??
        shipping.packages ??
        shippingDims.pieces ??
        "";

    // ---- Shipper / Consignee / Notify logic (for these types of docs) ----
    // For your newest JSON:
    //   vendor  = LOM LOGISTICS INDIA PRIVATE LIMITED (your office)
    //   buyer   = DAEWON KANG UP CO LTD (customer)
    //   shipping.shipper = LOM LOGISTICS INDIA PRIVATE LIMITED (same as vendor)
    //
    // So:
    //   shipperName   = shipping.shipper || vendor.name
    //   consigneeName = buyer.name
    //   notify        = consignee
    const shipperName = shipping.shipper || vendor.name || "";
    const shipperAddress =
        shipping.shipper_address || vendor.address || "";

    const consigneeName = buyer.name || "";
    const consigneeAddress = buyer.address || "";

    const notifyName = consigneeName;
    const notifyAddress = consigneeAddress;

    // ---- Map into job object ----
    return {
        ...initial,

        jobNo: safe(jobNo),
        mawbNo: safe(mawb),
        airWayBill: safe(mawb),

        shipperName: safe(shipperName),
        shipperAddress: safe(shipperAddress),

        consigneeName: safe(consigneeName),
        consigneeAddress: safe(consigneeAddress),

        notifyName: safe(notifyName),
        notifyAddress: safe(notifyAddress),

        // vendor is your own address -> agentAddress
        agentAddress: safe(vendor.address),

        currency: safe(currency),
        totalCharge: safe(totalCharge),

        departureDate: safe(departureDate),
        arrivalDate: safe(arrivalDate),

        freightTerm: safe(freightTerm),

        airportDeparture: safe(airportDeparture),
        airportDestination: safe(airportDestination),

        flightNo: safe(
            freight.flight_no || shipping.flight_no || doc.flight_no || ""
        ),

        pieces: safe(pieces),
        grossWeight: safe(grossWeight),
    };
}

/** MAIN COMPONENT ******************************************************/
// Static default data for job creation conversions
const defaultAirInboundData = {
    jobNo: "JOB-AI-001",
    blType: "Master B/L",
    consol: "Consol",
    importType: "Import",
    mawbNo: "MAWB12345",
    shipment: "CIF",
    status: "Open",
    branch: "HEAD OFFICE",
    shipperName: "ABC GLOBAL EXPORTS LTD",
    shipperAddress: "123 EXPORT STREET\nSUITE 500, BUSINESS DISTRICT\nSINGAPORE 018956\nTEL: +65 6123 4567",
    airWayBill: "AWB-SGP-789456",
    agentAddress: "LOM LOGISTICS SINGAPORE\n45 CHANGI AIRPORT ROAD\nSINGAPORE 819642",
    consigneeName: "LOM LOGISTICS INDIA PVT LTD",
    consigneeAddress: "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA\nTEL: 044 66455913 FAX: 044 66455913",
    notifyName: "LOM LOGISTICS INDIA PVT LTD",
    notifyAddress: "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA",
    issuingAgent: "LOM LOGISTICS SINGAPORE",
    iataCode: "LOM-SGP",
    accountNo: "ACC-12345",
    airportDeparture: "SIN - SINGAPORE",
    to1: "MAA",
    by1: "SINGAPORE AIRLINES",
    airportDestination: "MAA - CHENNAI",
    flightNo: "SQ-678",
    departureDate: "2025-02-01",
    arrivalDate: "2025-02-02",
    handlingInfo: "HANDLE WITH CARE\nPERISHABLE GOODS",
    accountingInfo: "FREIGHT PREPAID\nCHARGES COLLECT",
    currency: "USD",
    code: "PP",
    wtvalPP: "150.00",
    coll1: "50.00",
    otherPP: "25.00",
    coll2: "30.00",
    rto1: "MAA",
    rby1: "SG",
    rto2: "BOM",
    rby2: "AI",
    declaredCarriage: "N.V.D",
    declaredCustoms: "NVC",
    insurance: "NIL",
    freightTerm: "PREPAID",
    pieces: "10",
    grossWeight: "250.50",
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: "300.00",
    rateCharge: "5.50",
    arranged: false,
    totalCharge: "1650.00",
    natureGoods: "ELECTRONIC COMPONENTS\nPACKED IN CARTONS",
    weightPrepaid: "1500.00",
    weightCollect: "150.00",
    valuationPrepaid: "50.00",
    valuationCollect: "0.00",
    taxPrepaid: "0.00",
    taxCollect: "0.00",
    agentPrepaid: "25.00",
    agentCollect: "30.00",
    carrierPrepaid: "0.00",
    carrierCollect: "0.00",
    totalPrepaid: "1575.00",
    totalCollect: "180.00",
    executedDate: "2025-02-01",
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",
};

const defaultAirOutboundData = {
    jobNo: "JOB-AO-001",
    blType: "Master B/L",
    consol: "Consol",
    exportType: "Export",
    mawbNo: "MAWB67890",
    shipment: "FOB",
    status: "Open",
    branch: "HEAD OFFICE",
    shipperName: "LOM LOGISTICS INDIA PVT LTD",
    shipperAddress: "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA\nTEL: 044 66455913 FAX: 044 66455913",
    airWayBill: "AWB-IND-456789",
    consigneeName: "XYZ INTERNATIONAL IMPORTS INC",
    consigneeAddress: "789 IMPORT AVENUE\nFLOOR 12, TRADE CENTER\nNEW YORK, NY 10001, USA\nTEL: +1 212 555 7890",
    notifyName: "XYZ INTERNATIONAL IMPORTS INC",
    notifyAddress: "789 IMPORT AVENUE\nFLOOR 12, TRADE CENTER\nNEW YORK, NY 10001, USA",
    issuingAgent: "LOM LOGISTICS INDIA PVT LTD",
    iataCode: "LOM-IND",
    accountNo: "ACC-67890",
    airportDeparture: "MAA - CHENNAI",
    to1: "JFK",
    by1: "AIR INDIA",
    airportDestination: "JFK - NEW YORK",
    flightNo: "AI-102",
    departureDate: "2025-02-01",
    arrivalDate: "2025-02-02",
    handlingInfo: "FRAGILE\nEXPORT PACKAGING",
    accountingInfo: "FREIGHT COLLECT\nCHARGES PREPAID",
    currency: "USD",
    code: "CC",
    wtvalPP: "0.00",
    coll1: "200.00",
    otherPP: "0.00",
    coll2: "75.00",
    rto1: "JFK",
    rby1: "AI",
    rto2: "LAX",
    rby2: "UA",
    declaredCarriage: "N.V.D",
    declaredCustoms: "NVC",
    insurance: "NIL",
    freightTerm: "COLLECT",
    pieces: "20",
    grossWeight: "450.75",
    kgLb: "KG",
    rateClass: "Q",
    chargeableWeight: "500.00",
    rateCharge: "6.25",
    arranged: false,
    totalCharge: "3125.00",
    natureGoods: "TEXTILE PRODUCTS\nGARMENTS PACKED IN CARTONS",
    weightPrepaid: "0.00",
    weightCollect: "2750.00",
    valuationPrepaid: "0.00",
    valuationCollect: "0.00",
    taxPrepaid: "0.00",
    taxCollect: "0.00",
    agentPrepaid: "0.00",
    agentCollect: "200.00",
    carrierPrepaid: "0.00",
    carrierCollect: "175.00",
    totalPrepaid: "0.00",
    totalCollect: "3125.00",
    executedDate: "2025-02-01",
    placeAt: "CHENNAI",
    signature: "LOM TECHNOLOGY",
};

const defaultSeaInboundData = {
    jobNo: "JOB-SI-001",
    blType: "Master B/L",
    consol: "Consol",
    mblNo: "MBL12345",
    shipment: "CIF",
    status: "Open",
    branch: "HEAD OFFICE",
    shipperName: "SEA EXPORTS GMBH",
    shipperAddress: "456 HARBOR STREET\nPORT OF HAMBURG\nHAMBURG 20459, GERMANY\nTEL: +49 40 1234 5678",
    consigneeName: "LOM LOGISTICS INDIA PVT LTD",
    consigneeAddress: "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA\nTEL: 044 66455913 FAX: 044 66455913",
    notifyName: "LOM LOGISTICS INDIA PVT LTD",
    notifyAddress: "NO.151, VILLAGE ROAD, 7TH FLOOR,\nGEE GEE EMERALD BUILDING, NUNGAMBAKKAM,\nCHENNAI - 600034 , TAMILNADU- INDIA",
    onBoardDate: "2025-02-01",
    arrivalDate: "2025-02-15",
    precarriageBy: "N.A",
    portDischarge: "CHENNAI PORT",
    freightTerm: "PREPAID",
    shippingTerm: "DOOR TO DOOR",
    blNo: "BL-SI-12345",
    blText: "TO ORDER",
    forDeliveryApplyTo: "LOM LOGISTICS INDIA PVT LTD",
    forDeliveryApplyTo2: "CHENNAI",
    placeReceipt: "HAMBURG, GERMANY",
    portLoading: "HAMBURG PORT",
    placeDelivery: "CHENNAI",
    finalDestination: "CHENNAI",
    vesselName: "MV OCEAN STAR",
    voy: "V-123",
    callSign: "CALL-ABC",
    package: "100",
    unitPkg: "BALES",
    grossWeight: "15000.00",
    unitWeight: "Kgs",
    measurement: "45.50",
    unitCbm: "CBM",
    containers: [
        {
            containerNo: "CONTAINER-1234567",
            size: "20 HC",
            term: "CFS/CFS",
            wgt: "15000.00",
            pkg: "100",
            sealNo: "SEAL-789",
        },
    ],
    markNumbers: "MK-001/MK-002/MK-003",
    descShort: '"SAID TO CONTAIN"',
    descLong: "MACHINERY PARTS AND EQUIPMENT\nPACKED IN WOODEN CRATES",
    freightPayable: "AT DESTINATION",
    originalBL: "3",
    place: "CHENNAI",
    dateOfIssue: "2025-02-01",
};

const defaultSeaOutboundData = {
    jobNo: "JOB-SO-001",
    mblNo: "MBL67890",
    blType: "Master B/L",
    consol: "Consol",
    shipment: "FOB",
    status: "Open",
    branch: "HEAD OFFICE",
    shipperName: "INDIA EXPORTS PVT LTD",
    shipperAddress: "789 EXPORT ZONE\nINDUSTRIAL AREA\nMUMBAI 400001, INDIA\nTEL: +91 22 2345 6789",
    consigneeName: "AMERICAN IMPORT COMPANY LLC",
    consigneeAddress: "321 CARGO BOULEVARD\nSUITE 200, PORT AREA\nLOS ANGELES, CA 90001, USA\nTEL: +1 310 555 3210",
    notifyName: "AMERICAN IMPORT COMPANY LLC",
    notifyAddress: "321 CARGO BOULEVARD\nSUITE 200, PORT AREA\nLOS ANGELES, CA 90001, USA",
    onBoardDate: "2025-02-01",
    arrivalDate: "2025-02-15",
    precarriageBy: "N.A",
    portDischarge: "LOS ANGELES PORT",
    freightTerm: "COLLECT",
    shippingTerm: "CY TO CY",
    blNo: "BL-SO-67890",
    blText: "TO ORDER",
    forDeliveryApplyTo: "AMERICAN IMPORT COMPANY LLC",
    forDeliveryApplyTo2: "LOS ANGELES",
    placeReceipt: "MUMBAI, INDIA",
    portLoading: "MUMBAI PORT",
    placeDelivery: "LOS ANGELES",
    finalDestination: "LOS ANGELES",
    vesselName: "MV PACIFIC EXPRESS",
    voy: "V-456",
    callSign: "CALL-XYZ",
    package: "200",
    unitPkg: "BALES",
    grossWeight: "25000.00",
    unitWeight: "Kgs",
    measurement: "75.25",
    unitCbm: "CBM",
    containers: [
        {
            containerNo: "CONTAINER-7654321",
            size: "40 HC",
            term: "CY/CY",
            wgt: "25000.00",
            pkg: "200",
            sealNo: "SEAL-456",
        },
    ],
    markNumbers: "EXP-001/EXP-002/EXP-003",
    descShort: '"SAID TO CONTAIN"',
    descLong: "TEXTILE PRODUCTS AND GARMENTS\nPACKED IN CARTONS",
    freightPayable: "AT ORIGIN",
    originalBL: "3",
    place: "CHENNAI",
    dateOfIssue: "2025-02-01",
};

export default function AirInboundJobFromInvoice() {
    const [file, setFile] = useState(null);
    const [jobValues, setJobValues] = useState(initialJobValues);
    const [rawResponse, setRawResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [parseStatus, setParseStatus] = useState("");

    const [files, setFiles] = useState([]);
    const [flowUrl, setFlowUrl] = useState(ANALYZE_URL);
    const [submitting, setSubmitting] = useState(false);

    const [responses, setResponses] = useState([]);
    const [raw, setRaw] = useState("");
    const [expanded, setExpanded] = useState({});
    const [rowSubmitting, setRowSubmitting] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showAirInboundModal, setShowAirInboundModal] = useState(false);
    const [editDataAirInbound, setEditDataAirInbound] = useState(null);
    const [editDataAirOutbound, setEditDataAirOutbound] = useState(null);
    const [editDataSeaInbound, setEditDataSeaInbound] = useState(null);
    const [editDataSeaOutbound, setEditDataSeaOutbound] = useState(null);
    const navigate = useNavigate();
    const dropRef = useRef(null);





    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) {
            setFile(null);
            return;
        }

        if (!ALLOWED_TYPES.has(f.type)) {
            alert(`Unsupported type: ${f.type || "(unknown)"} for "${f.name}"`);
            return;
        }
        if (f.size > MAX_BYTES) {
            alert(
                `"${f.name}" is too large (${bytes(
                    f.size
                )}). Max allowed is ${bytes(MAX_BYTES)}.`
            );
            return;
        }

        setFile(f);
        setError("");
        setParseStatus("");
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select a PDF or image.");
            return;
        }

        setLoading(true);
        setError("");
        setRawResponse("");
        setParseStatus("");

        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch(ANALYZE_URL, {
                method: "POST",
                body: fd,
            });

            const text = await res.text();
            setRawResponse(text);
            console.log("FastAPI /analyze raw response:", text);

            if (!res.ok) {
                throw new Error(`API error ${res.status}: ${text}`);
            }

            // 1) Parse top-level JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to JSON.parse whole response", e);
                setParseStatus("❌ Failed to parse top-level JSON");
                return;
            }

            const result = data.result || {};
            let invoiceObj = result.parsed;

            // 2) If parsed is null, salvage from result.raw
            if (!invoiceObj) {
                const salvaged = safeParseInvoiceRaw(result.raw);
                if (!salvaged) {
                    setParseStatus("❌ Failed to parse result.raw as JSON");
                    return;
                }
                invoiceObj = salvaged;
                setParseStatus("✅ Parsed invoice from result.raw");
            } else {
                setParseStatus("✅ Used result.parsed");
            }

            console.log("Parsed invoiceObj:", invoiceObj);
            const mappedJob = mapInvoiceToJobFromRaw(
                initialJobValues,
                invoiceObj
            );
            setJobValues(mappedJob);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to analyze file");
        } finally {
            setLoading(false);
        }
    };

    const requiredFields = [
        "jobNo",
        "blType",
        "consol",
        "importType",
        "status",
        "branch",
        "mawbNo",
        "airWayBill",

        "shipperName",
        "shipperAddress",
        "consigneeName",
        "consigneeAddress",
        "notifyName",
        "notifyAddress",

        "currency",
        "totalCharge",
        "departureDate",
        "arrivalDate",
        "freightTerm",
    ];




    const staticInvoiceData = [
        {
            id: "static-1",
            idx: 0,
            sourceFile: "SampleInvoice.pdf",
            status: "Success",
            invoiceNumber: "INV-001",
            vendorName: "Demo Vendor",
            vendorAddress: "123 Demo Street",
            invoiceDate: "2025-12-01",
            dueDate: "2025-12-15",
            invoiceTotal: 1000,
            amountDue: 0,
            currency: "INR",
            raw: {
                invoice: {
                    lineItems: [
                        {
                            ITEMS: "Item 1",
                            hsnCode: "1234",
                            descriptionOfGoods: "Demo Product",
                            quantity: 2,
                            unitPrice: 500,
                            amount: 1000,
                            gst: 18,
                            taxAmount: 180,
                        },
                    ],
                },
            },
        },
    ];
    const invoices = [];
    const invoiceData = staticInvoiceData;

    return (
        <>
            <div
                style={{
                    padding: "1.5rem",
                    maxWidth: 1200,
                    margin: "0 auto",
                    fontFamily:
                        "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.6rem",
                        fontWeight: 600,
                        marginBottom: "0.5rem",
                    }}
                >
                    Job Creation – Air Inbound (Invoice → Job Auto-Fill)
                </h2>
                <p style={{ marginBottom: "1.5rem", color: "#4b5563", fontSize: 14 }}>
                    Upload an invoice PDF or image. It will be sent to{" "}
                    <code>{ANALYZE_URL}</code>, parsed from <code>result.raw</code>, and
                    mapped into your Air Inbound job fields.
                </p>

                {/* Upload card */}
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                        background: "#f9fafb",
                    }}
                >
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Upload invoice</div>
                    <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        style={{ marginBottom: 8 }}
                    />
                    {file && (
                        <div
                            style={{
                                fontSize: 12,
                                color: "#6b7280",
                                marginBottom: 8,
                            }}
                        >
                            Selected: <strong>{file.name}</strong> ({bytes(file.size)})
                        </div>
                    )}
                    <button
                        onClick={handleAnalyze}
                        disabled={!file || loading}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: "#2563eb",
                            color: "white",
                            fontSize: 14,
                            cursor: !file || loading ? "not-allowed" : "pointer",
                            opacity: !file || loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "Analyzing..." : "Analyze & Fill Job"}
                    </button>

                    {parseStatus && (
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: parseStatus.startsWith("✅")
                                    ? "#15803d"
                                    : "#b91c1c",
                            }}
                        >
                            {parseStatus}
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                marginTop: 8,
                                padding: 10,
                                borderRadius: 8,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* Required fields table */}
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        overflow: "hidden",
                        marginBottom: 16,
                        background: "white",
                    }}
                >
                    <div
                        style={{
                            padding: 10,
                            fontWeight: 500,
                            background: "#f3f4f6",
                            borderBottom: "1px solid #e5e7eb",
                        }}
                    >
                        Auto-filled Required Job Fields
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                fontSize: 14,
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr style={{ background: "#f9fafb" }}>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "8px 10px",
                                            borderBottom: "1px solid #e5e7eb",
                                        }}
                                    >
                                        Field
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "8px 10px",
                                            borderBottom: "1px solid #e5e7eb",
                                        }}
                                    >
                                        Value (from invoice)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {requiredFields.map((field) => (
                                    <tr
                                        key={field}
                                        style={{ borderTop: "1px solid #f3f4f6" }}
                                    >
                                        <td
                                            style={{
                                                padding: "6px 10px",
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                                background: "#ffffff",
                                            }}
                                        >
                                            {field}
                                        </td>
                                        <td
                                            style={{
                                                padding: "6px 10px",
                                                whiteSpace: "pre-wrap",
                                                background: "#ffffff",
                                            }}
                                        >
                                            {String(jobValues[field] ?? "")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Raw response for debugging */}
                {rawResponse && (
                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 12,
                            background: "#f9fafb",
                        }}
                    >
                        <div style={{ fontWeight: 500, marginBottom: 8 }}>
                            Raw response
                        </div>
                        <textarea
                            style={{
                                width: "100%",
                                height: 220,
                                fontFamily: "Menlo, monospace",
                                fontSize: 12,
                                padding: 8,
                                borderRadius: 8,
                                border: "1px solid #d1d5db",
                            }}
                            readOnly
                            value={rawResponse}
                        />
                    </div>
                )}
            </div>



            {/* results table */}
            {invoiceData?.length > 0 && (
                <div className="border rounded-xl overflow-hidden mx-2">
                    <div
                        className="table-responsive"
                        style={{
                            minHeight: "60vh",
                            maxHeight: "60vh",
                            overflowY: "auto",
                        }}
                    >
                        <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                                <tr >
                                    <th className="px-3 py-2 text-left">Actions</th>
                                    <th className="px-3 py-2">#</th>
                                    <th className="px-3 py-2">File</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Invoice #</th>
                                    <th className="px-3 py-2">Vendor</th>
                                    <th className="px-3 py-2">Vendor Address</th>
                                    <th className="px-3 py-2">Invoice Date</th>
                                    <th className="px-3 py-2">Due Date</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                    <th className="px-3 py-2 text-right">Amount Due</th>
                                    <th className="px-3 py-2 text-center">Line Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData?.map((r, i) => (
                                    <React.Fragment key={i}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-left">

                                                <div className="dropdown d-inline-block ms-2" style={{ position: 'relative' }}>
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm dropdown-toggle"
                                                        type="button"
                                                        onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                                                        aria-expanded={openDropdown === i}
                                                    >
                                                        Convert
                                                    </button>
                                                    {openDropdown === i && (
                                                        <ul
                                                            className="dropdown-menu show"
                                                            style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                zIndex: 1000,
                                                                display: 'block',
                                                                minWidth: '200px'
                                                            }}
                                                        >

                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        setEditDataAirInbound(defaultAirInboundData);
                                                                        setShowAirInboundModal(true);
                                                                    }}
                                                                >
                                                                    Convert to air-inbound job creation
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#createOutboundJobcreationModal"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        setEditDataAirOutbound(defaultAirOutboundData);
                                                                    }}
                                                                >
                                                                    Convert to air-outbound job creation
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#seainCreateJobModal"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        setEditDataSeaInbound(defaultSeaInboundData);
                                                                    }}
                                                                >
                                                                    Convert to sea-inbound job creation
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#seaoutCreateJobModal"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        setEditDataSeaOutbound(defaultSeaOutboundData);
                                                                    }}
                                                                >
                                                                    Convert to sea-outbound job creation
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        navigate("/sales-invoice", { state: { invoiceData: r } });
                                                                    }}
                                                                >
                                                                    Convert to Sales
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        navigate("/purchases", { state: { invoiceData: r } });
                                                                    }}
                                                                >
                                                                    Purchase
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{i + 1}</td>
                                            <td
                                                className="px-3 py-2 truncate max-w-[260px]"
                                                title={r.sourceFile}
                                            >
                                                {r.sourceFile}
                                            </td>
                                            <td
                                                className={classNames(
                                                    "px-3 py-2",
                                                    r.status === "Success"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                )}
                                            >
                                                {r.status}
                                            </td>
                                            <td className="px-3 py-2">{r.invoiceNumber}</td>
                                            <td className="px-3 py-2">{r.vendorName}</td>
                                            <td className="px-3 py-2">{r.vendorAddress}</td>
                                            <td className="px-3 py-2">{r.invoiceDate}</td>
                                            <td className="px-3 py-2">{r.dueDate}</td>
                                            <td className="px-3 py-2 text-right">
                                                {r.invoiceTotal} {r.currency}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {r.amountDue} {r.currency}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {r.raw?.invoice?.lineItems?.length ?? 0}
                                            </td>
                                        </tr>

                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* Job Creation Modals */}
            {/* Air Inbound Modal - Custom Modal (conditional rendering like AirInboundComp) */}
            {showAirInboundModal && (
                <JobCreationAirInbound
                    onClose={() => {
                        setShowAirInboundModal(false);
                        setEditDataAirInbound(null);
                    }}
                    editData={editDataAirInbound}
                    setEditData={setEditDataAirInbound}
                />
            )}

            {/* Air Outbound Modal - Bootstrap (always in DOM like AirOutboundComp) */}
            <JobCreationAirOutbound
                editData={editDataAirOutbound ?? {}}
                setEditData={setEditDataAirOutbound}
            />

            {/* Sea Inbound Modal - Bootstrap (always in DOM like OceanInboundComp) */}
            <JobCreationSeaInbound
                editData={editDataSeaInbound ?? {}}
                setEditData={setEditDataSeaInbound}
            />

            {/* Sea Outbound Modal - Bootstrap (always in DOM like OceanOutboundComp) */}
            <JobCreationSeaOutbound
                editData={editDataSeaOutbound ?? {}}
                setEditData={setEditDataSeaOutbound}
            />
        </>
    );
}
