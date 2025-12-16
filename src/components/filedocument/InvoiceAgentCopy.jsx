// Invoiceagent.jsx — resilient analyze+result flow
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";




import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    clearInvoices,
    selectAllInvoices,
    upsertManyInvoices,
} from "../redux/invoiceslice/InvoiceSlice";
import { createInvoice } from "./api";
// import {  } from "./api";

// Import job creation modals
import JobCreationAirInbound from "../logisticsservices/bl/airinbound/JobCreation";
import JobCreationAirOutbound from "../logisticsservices/bl/airoutbound/JobCreation";
import JobCreationSeaInbound from "../logisticsservices/bl/oceaninbound/JobCreationSeaInbound";
import JobCreationSeaOutbound from "../logisticsservices/bl/oceanoutbound/JobCreationSeaOutbound";

/** CONFIG */

// const ANALYZE_URL =
//   "https://prod-15.eastus.logic.azure.com:443/workflows/e32830c931124b5f9f1f7800af11b46d/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=dvj6xQ3Z773pS3DFwWQ3U8gPNGfsJh9S9D3x5FCPedA";


// changing to 

const ANALYZE_URL =
    "https://prod-15.eastus.logic.azure.com:443/workflows/e32830c931124b5f9f1f7800af11b46d/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=dvj6xQ3Z773pS3DFwWQ3U8gPNGfsJh9S9D3x5FCPedA";






const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150;

const ALLOWED_TYPES = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
    "image/tif",
]);
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

const BATCH_CONCURRENCY = 5;

function bytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function classNames(...xs) {
    return xs.filter(Boolean).join(" ");
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const s =
                typeof reader.result === "string"
                    ? reader.result.replace(/^data:[^;]+;base64,/, "")
                    : "";
            resolve(s);
        };
        reader.onerror = () =>
            reject(reader.error || new Error("File read failed"));
        reader.readAsDataURL(file);
    });
}
async function runWithLimit(items, limit, worker) {
    const out = Array(items.length);
    let i = 0;
    const runners = new Array(Math.min(limit, items.length))
        .fill(0)
        .map(async () => {
            while (i < items.length) {
                const idx = i++;
                out[idx] = await worker(items[idx], idx);
            }
        });
    await Promise.all(runners);
    return out;
}

const pick = (o, k, def = "—") =>
    o && o[k] != null && o[k] !== "" ? o[k] : def;

/* ----------------------------- NEW HELPERS ----------------------------- */
function fv(field, fallback = "") {
    if (!field) return fallback;
    if ("valueString" in field) return field.valueString ?? fallback;
    if ("valueNumber" in field) return field.valueNumber ?? fallback;
    if ("valueDate" in field) return field.valueDate ?? fallback;
    if ("valueCurrency" in field)
        return Number(field.valueCurrency?.amount ?? fallback);
    if ("value" in field) return field.value ?? fallback;
    return field.content ?? fallback;
}
const num = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

// 🔧 CHANGED: robust HSN/HSN-SAC extractor
const HSN_KEYS = [
    "HSN",
    "HSNCode",
    "HSN_Code",
    "HSN/SAC",
    "HSN_SAC",
    "HSNSAC",
    "HSN SAC",
    "HSN-SAC",
    "SAC",
    "SACCode",
    "HSNCodeNo",
    "HSNCodeNumber",
];
function extractHSNFromItem(valueObject) {
    if (!valueObject || typeof valueObject !== "object") return "";
    for (const key of HSN_KEYS) {
        if (key in valueObject) {
            const raw = String(fv(valueObject[key], "")).trim();
            if (raw) {
                const m = raw.match(/\b\d{4,8}\b/);
                return (m && m[0]) || raw;
            }
        }
    }
    const maybeInDesc = String(
        fv(valueObject.Description, fv(valueObject.ITEMS, ""))
    );
    const mm = maybeInDesc.match(/\b(HSN|SAC)[^\d]*(\d{4,8})\b/i);
    if (mm && mm[2]) return mm[2];
    return "";
}

// 🔧 CHANGED: extract percent/amount for CGST/SGST/IGST/GST
const PCT_KEYS = (prefix) => [
    `${prefix}`,
    `${prefix}%`,
    `${prefix}Percent`,
    `${prefix}_Percent`,
    `${prefix}Rate`,
    `${prefix}_Rate`,
    `${prefix}Pct`,
    `${prefix}_Pct`,
];
const AMT_KEYS = (prefix) => [
    `${prefix}Amount`,
    `${prefix}_Amount`,
    `${prefix}Amt`,
    `${prefix}_Amt`,
    `${prefix}Val`,
];

function pickFirst(obj, keys, fallback = undefined) {
    for (const k of keys) {
        if (k in obj) {
            const v = fv(obj[k], fallback);
            if (v !== undefined && v !== null && v !== "") return v;
        }
    }
    return fallback;
}

/**
 * Normalize line item tax:
 * - gstPercent: overall tax % (existing behaviour preserved)
 * - cgst/sgst/igst percentages & amounts when present
 * - taxAmount: sum of amounts; computed from % if missing
 */
function extractTaxesFromItem(o, lineBase) {
    const cgstPercent = num(pickFirst(o, PCT_KEYS("CGST")), NaN);
    const sgstPercent = num(pickFirst(o, PCT_KEYS("SGST")), NaN);
    const igstPercent = num(pickFirst(o, PCT_KEYS("IGST")), NaN);

    const cgstAmountRaw = pickFirst(o, AMT_KEYS("CGST"));
    const sgstAmountRaw = pickFirst(o, AMT_KEYS("SGST"));
    const igstAmountRaw = pickFirst(o, AMT_KEYS("IGST"));

    const cgstAmount = num(
        cgstAmountRaw,
        Number.isFinite(cgstPercent) ? (lineBase * cgstPercent) / 100 : 0
    );
    const sgstAmount = num(
        sgstAmountRaw,
        Number.isFinite(sgstPercent) ? (lineBase * sgstPercent) / 100 : 0
    );
    const igstAmount = num(
        igstAmountRaw,
        Number.isFinite(igstPercent) ? (lineBase * igstPercent) / 100 : 0
    );

    // existing "gst" (overall %) logic:
    let gstPercent = num(pickFirst(o, PCT_KEYS("GST")), NaN);
    if (!Number.isFinite(gstPercent)) {
        const sumPct =
            (Number.isFinite(cgstPercent) ? cgstPercent : 0) +
            (Number.isFinite(sgstPercent) ? sgstPercent : 0) +
            (Number.isFinite(igstPercent) ? igstPercent : 0);
        gstPercent = sumPct > 0 ? sumPct : NaN;
    }

    const taxAmount =
        num(cgstAmount, 0) + num(sgstAmount, 0) + num(igstAmount, 0) ||
        (Number.isFinite(gstPercent) ? (lineBase * gstPercent) / 100 : 0);

    return {
        gstPercent: Number.isFinite(gstPercent) ? gstPercent : 0,
        cgstPercent: Number.isFinite(cgstPercent) ? cgstPercent : 0,
        sgstPercent: Number.isFinite(sgstPercent) ? sgstPercent : 0,
        igstPercent: Number.isFinite(igstPercent) ? igstPercent : 0,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
    };
}

/* ----------------------------- NORMALIZER ----------------------------- */
// 🔧 CHANGED: preserve existing behaviour and add HSN + detailed tax
function normalizeFromFR(sourceFile, fr) {
    const status = fr?.status || "Unknown";
    const doc = fr?.analyzeResult?.documents?.[0] || {};
    const f = doc?.fields || {};

    const lineItems = (f.Items?.valueArray || []).map((it) => {
        const o = it?.valueObject || {};

        const quantity = num(fv(o.Quantity, 0), 0);
        const unitPrice = num(fv(o.UnitPrice, 0), 0);
        const amount = num(fv(o.Amount, 0), quantity * unitPrice);
        const lineBase = amount || quantity * unitPrice;

        const {
            gstPercent,
            cgstPercent,
            sgstPercent,
            igstPercent,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
        } = extractTaxesFromItem(o, lineBase);

        const hsnCode = extractHSNFromItem(o);

        return {
            ITEMS: fv(o.ITEMS, ""),
            descriptionOfGoods: fv(o.Description, ""),
            quantity,
            unitPrice,
            amount,
            gst: gstPercent, // ⬅️ kept as before
            // 🔧 CHANGED: extra fields (non-breaking)
            hsnCode,
            cgstPercent,
            sgstPercent,
            igstPercent,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
        };
    });

    // 🔧 CHANGED: capture header-level totals if present
    const subTotal = num(fv(f.SubTotal, 0), 0);
    const totalTax = num(fv(f.TotalTax, 0), 0);

    return {
        sourceFile,
        operationStatus: status === "succeeded" ? "Success" : status,
        invoice: {
            invoiceNumber: fv(f.InvoiceId, ""),
            vendorName: fv(f.VendorName, fv(f.BillingAddressRecipient, "")),
            vendorAddress: fv(f.VendorAddress, ""),
            invoiceDate: fv(f.InvoiceDate, ""),
            dueDate: fv(f.DueDate, ""),
            invoiceTotal: num(fv(f.InvoiceTotal, 0), 0),
            amountDue: num(fv(f.AmountDue, 0), 0),
            currency:
                f.InvoiceTotal?.valueCurrency?.currencyCode ||
                f.AmountDue?.valueCurrency?.currencyCode ||
                "",
            subTotal,
            totalTax,
            lineItems,
        },
        raw: fr,
    };
}
/* ---------------------------------------------------------------------- */

async function pollResultUrl(resultUrl) {
    let attempts = 0;
    while (true) {
        const token = sessionStorage.getItem("token");
        const r = await fetch(resultUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!r.ok) throw new Error(`Result ${r.status}`);
        const data = await r.json();
        if (data.status === "succeeded" || data.status === "failed") return data;
        attempts++;
        if (attempts > MAX_POLL_ATTEMPTS)
            throw new Error("Timed out waiting for result");
        await new Promise((s) => setTimeout(s, POLL_INTERVAL_MS));
    }
}

// 🔧 CHANGED: include detailed tax fields in payload (gst kept)
function mapResultToApiPayload(flowItem) {
    const inv = (flowItem && flowItem?.raw?.invoice) || {};
    const li = Array.isArray(inv.lineItems) ? inv.lineItems : [];
    return {
        invoiceName: inv.invoiceNumber || flowItem?.sourceFile || "",
        vendorName: inv.vendorName || "",
        invoiceNumber: inv.invoiceNumber || "",
        createdAt: inv.invoiceDate || new Date().toISOString(),
        status: flowItem?.operationStatus || "Pending",
        total: Number(inv.invoiceTotal ?? 0),
        currency: inv.currency || "",
        gst: Number(inv.tax ?? inv.gst ?? 0),
        subTotal: Number(inv.subTotal ?? 0), // 🔧 CHANGED
        totalTax: Number(inv.totalTax ?? 0), // 🔧 CHANGED
        lineItems: li.map((it) => ({
            description: it.descriptionOfGoods ?? it.description ?? "",
            quantity: Number(it.quantity ?? 0),
            unitPrice: Number(it.unitPrice ?? 0),
            lineTotal: Number(
                it.amount ?? Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0)
            ),
            gst: Number(it.gst ?? 0), // kept
            // 🔧 CHANGED: extra tax details
            hsnCode: it.hsnCode || it.hsn || it.hsn_sac || "",
            cgstPercent: Number(it.cgstPercent ?? 0),
            sgstPercent: Number(it.sgstPercent ?? 0),
            igstPercent: Number(it.igstPercent ?? 0),
            cgstAmount: Number(it.cgstAmount ?? 0),
            sgstAmount: Number(it.sgstAmount ?? 0),
            igstAmount: Number(it.igstAmount ?? 0),
            taxAmount: Number(it.taxAmount ?? 0),
        })),
    };
}

const sameById = (a = [], b = []) =>
    a.length === b.length && a.every((x, i) => x.id === b[i]?.id);

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

export default function InvoiceAgent() {
    const [files, setFiles] = useState([]);
    const [flowUrl, setFlowUrl] = useState(ANALYZE_URL);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
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

    const dispatch = useDispatch();
    const invoices = useSelector(selectAllInvoices);

    const onPick = (e) => {
        const picked = Array.from(e.target.files || []);
        validateAndSet(picked);
        e.currentTarget.value = "";
    };
    const onDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const picked = Array.from(e.dataTransfer?.files || []);
        validateAndSet(picked);
    }, []);
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    function validateAndSet(list) {
        setError("");
        const valid = [];
        for (const f of list) {
            if (!ALLOWED_TYPES.has(f.type)) {
                alert(`Unsupported type: ${f.type || "(unknown)"} for "${f.name}"`);
                continue;
            }
            if (f.size > MAX_BYTES) {
                alert(
                    `"${f.name}" is too large (${(f.size / 1024 / 1024).toFixed(
                        2
                    )} MB). Max allowed is 1 MB.`
                );
                continue;
            }
            valid.push(f);
        }
        setFiles((prev) => [...prev, ...valid]);
    }
    const removeFile = (idx) =>
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    const clearAll = () => {
        setFiles([]);
        setResponses([]);
        setRaw("");
        setError("");
        setExpanded({});
        setRowSubmitting({});
        dispatch(clearInvoices());
    };

    const submitBatch = async () => {
        if (!flowUrl) return setError("Analyze URL is required.");
        if (files?.length === 0)
            return setError("Please add at least one PDF/image.");
        setSubmitting(true);
        setError("");
        setResponses([]);
        setRaw("");
        try {
            const fileObjs = await runWithLimit(
                files,
                BATCH_CONCURRENCY,
                async (file) => ({
                    fileName: file.name,
                    fileContent: await readFileAsBase64(file),
                    contentType: file.type || "application/octet-stream",
                })
            );
            const body = JSON.stringify({ files: fileObjs });

            const token = sessionStorage.getItem("token");
            const res = await fetch(flowUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body,
            });
            const text = await res.text();
            setRaw(text);

            const jobs = (function extractJobs(payload) {
                let v = payload;
                try {
                    v = JSON.parse(v);
                } catch { }
                if (typeof v === "string") {
                    try {
                        v = JSON.parse(v);
                    } catch { }
                }
                if (v && !Array.isArray(v) && Array.isArray(v.results)) v = v.results;
                if (
                    Array.isArray(v) &&
                    v.every((o) => o && typeof o.resultUrl === "string")
                )
                    return v;
                return null;
            })(text);

            if (!jobs) {
                if (!res.ok)
                    throw new Error(`Analyze flow error ${res.status}: ${text}`);
                throw new Error("Analyze flow did not return a valid resultUrl array.");
            }

            const finalRows = await Promise.all(
                jobs.map(async (j) => {
                    const result = await pollResultUrl(j.resultUrl);
                    return normalizeFromFR(j.fileName, result);
                })
            );
            setResponses(finalRows);
        } catch (e) {
            console.error(e);
            setError(e?.message || "Upload failed");
        } finally {
            setSubmitting(false);
        }
    };

    const makeInvoiceId = (inv, r, i) => {
        if (inv?.invoiceNumber) return String(inv.invoiceNumber).trim();
        const file = r?.sourceFile ?? "";
        const date = inv?.invoiceDate ?? "";
        const vendor = inv?.vendorName ?? "";
        const total = inv?.invoiceTotal ?? "";
        return `${file}__${date}__${vendor}__${total}`.replace(/\s+/g, "_");
    };

    const rows = useMemo(() => {
        return (responses || []).map((r, i) => {
            const inv = r?.invoice || {};
            return {
                id: makeInvoiceId(inv, r, i),
                idx: i,
                sourceFile: r?.sourceFile || "—",
                status: r?.operationStatus || "—",
                invoiceNumber: pick(inv, "invoiceNumber"),
                vendorName: pick(inv, "vendorName"),
                vendorAddress: pick(inv, "vendorAddress", ""),
                invoiceDate: pick(inv, "invoiceDate"),
                dueDate: pick(inv, "dueDate"),
                invoiceTotal: pick(inv, "invoiceTotal"),
                amountDue: pick(inv, "amountDue"),
                currency: pick(inv, "currency", ""),
                raw: r,
            };
        });
    }, [responses]);

    const submitRow = async (rowIdx) => {
        try {
            setRowSubmitting((p) => ({ ...p, [rowIdx]: true }));
            const flowItem = invoices[rowIdx];
            const payload = mapResultToApiPayload(flowItem);
            // console.log("payload", flowItem);
            const saved = await createInvoice(payload);
            setResponses((prev) => {
                const cp = [...prev];
                cp[rowIdx] = { ...cp[rowIdx], apiSaved: true, apiResult: saved };
                return cp;
            });
            alert("Invoice details submitted successfully!");
            navigate("/invoiceAgentForm");
        } catch (e) {
            console.error(e);
            alert(e);
            setError(`Row ${rowIdx + 1}: ${e.message}`);
        } finally {
            setRowSubmitting((p) => ({ ...p, [rowIdx]: false }));
        }
    };

    useEffect(() => {
        if (rows?.length) {
            dispatch(upsertManyInvoices(rows));
        }
    }, [rows, dispatch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdown !== null && !event.target.closest('.dropdown')) {
                setOpenDropdown(null);
            }
        };

        if (openDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [openDropdown]);

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

    const invoiceData = invoices?.length ? invoices : rows?.length ? rows : staticInvoiceData;

    return (
        <div className="p-4 max-w-7xl mx-auto ">


            {/* header/actions */}
            <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3 tw-mb-4">
                <h2 className="tw-text-2xl tw-font-semibold">Invoice</h2>

                <div className="tw-flex tw-gap-2">
                    <button
                        className="tw-px-3 tw-py-2 tw-rounded tw-border tw-bg-white hover:tw-bg-gray-50 disabled:tw-opacity-50"
                        onClick={clearAll}
                        disabled={submitting}
                    >
                        Clear
                    </button>

                    <button
                        className="tw-px-4 tw-py-2 tw-rounded tw-bg-blue-600 tw-text-white disabled:tw-opacity-50"
                        onClick={submitBatch}
                        disabled={submitting || files?.length === 0}
                    >
                        {submitting ? "Processing..." : `Submit ${files?.length || ""} file(s)`}
                    </button>

                    <button
                        className="tw-px-4 tw-py-2 tw-rounded tw-bg-blue-600 tw-text-white disabled:tw-opacity-50"
                        onClick={() => navigate("/invoiceAgentForm")}
                    >
                        Invoice Entry
                    </button>

                    <button
                        className="tw-px-4 tw-py-2 tw-rounded tw-border tw-bg-gray-200 hover:tw-bg-gray-300"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                </div>
            </div>


            {/* endpoint input */}
            <div className="tw-mb-6 tw-border tw-rounded-xl tw-p-4" style={{ display: "none" }}>
                <div className="tw-text-base tw-font-medium tw-mb-2">Endpoint</div>
                <label htmlFor="flowUrl" className="tw-text-sm">
                    Analyze Logic App URL
                </label>
                <input
                    id="flowUrl"
                    className="tw-mt-2 tw-w-full tw-border tw-rounded tw-px-3 tw-py-2"
                    placeholder="https://prod-.../invoke?... (invoice-analyze URL)"
                    value={flowUrl}
                    onChange={(e) => setFlowUrl(e.target.value)}
                />
                <p className="tw-text-xs tw-text-gray-500 tw-mt-2">
                    This endpoint returns one resultUrl per file. The app will poll them and render the same table as before.
                </p>
            </div>

            {/* uploader */}
            <div className="tw-mb-6 tw-border tw-rounded-xl tw-p-4">
                <div className="tw-text-base tw-font-medium tw-mb-2">Upload</div>

                <div
                    ref={dropRef}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className="tw-border-2 tw-border-dashed tw-rounded-2xl tw-p-6 tw-text-center tw-transition hover:tw-bg-gray-50 tw-cursor-pointer"
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept=".pdf,image/*"
                        className="tw-hidden"
                        multiple
                        onChange={onPick}
                    />
                    <p className="tw-text-sm">
                        Drag & drop PDF/images here, or click to browse. You can add multiple files.
                    </p>
                    <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                        PDF, PNG, JPG, WEBP, TIFF • Max {bytes(MAX_BYTES)} per file
                    </p>
                </div>

                {files?.length > 0 && (
                    <div className="tw-mt-4">
                        <div className="tw-text-sm tw-font-medium tw-mb-2">Selected files</div>
                        <ul className="tw-divide-y tw-rounded tw-border">
                            {files?.map((f, i) => (
                                <li
                                    key={i}
                                    className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2"
                                >
                                    <div className="tw-min-w-0">
                                        <div className="tw-truncate tw-text-sm tw-font-medium">{f.name}</div>
                                        <div className="tw-text-xs tw-text-gray-500">
                                            {f.type || "unknown"} • {bytes(MAX_BYTES)}
                                        </div>
                                    </div>
                                    <button
                                        className="tw-text-sm tw-text-red-600 hover:tw-underline"
                                        onClick={() => removeFile(i)}
                                        disabled={submitting}
                                    >
                                        remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {error && (
                    <div className="tw-mt-4 tw-p-3 tw-rounded-lg tw-bg-red-50 tw-text-red-700 tw-text-sm">
                        {error}
                    </div>
                )}
            </div>


            {/* results table */}
            {invoiceData?.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
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
                                                {/* <button
                                                    className={classNames(
                                                        "px-2 py-1 rounded",
                                                        r.apiSaved ? "bg-green-600 text-white" : "bg-indigo-600 text-white",
                                                        "disabled:opacity-50"
                                                    )}
                                                    type="button"
                                                    onClick={() => {
                                                        const flowItem = invoices[i];
                                                        const payload = flowItem && flowItem?.raw?.invoice;
                                                        navigate("/invoiceAgentForm", { state: payload });
                                                        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                                                    }}
                                                >
                                                    Edit
                                                </button> */}
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
                                        {expanded[r.idx] && (
                                            <tr className="bg-gray-50/60">
                                                <td className="px-3 py-3" colSpan={12}>
                                                    <div className="grid lg:grid-cols-2 gap-6">
                                                        <div className="border rounded-lg overflow-hidden">
                                                            <div className="px-3 py-2 text-sm font-medium bg-white border-b">
                                                                Line items
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-left bg-white">
                                                                            <th className="px-3 py-2">ITEMS</th>
                                                                            <th className="px-3 py-2">HSN/SAC</th>
                                                                            <th className="px-3 py-2">
                                                                                Description of goods
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right">
                                                                                Qty
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right">
                                                                                Unit Price
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right">
                                                                                Amount
                                                                            </th>
                                                                            <th className="px-3 py-2 text-right">
                                                                                Tax %
                                                                            </th>
                                                                            {/* 🔧 CHANGED: show tax amount */}
                                                                            <th className="px-3 py-2 text-right">
                                                                                Tax Amt
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y">
                                                                        {(r.raw?.invoice?.lineItems || []).map(
                                                                            (li, k) => (
                                                                                <tr key={k}>
                                                                                    <td className="px-3 py-2">
                                                                                        {li.ITEMS || "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        {li.hsnCode || "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        {li.descriptionOfGoods || "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {li.quantity ?? "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {li.unitPrice ?? "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {li.amount ?? "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {Number.isFinite(li?.gst)
                                                                                            ? li.gst
                                                                                            : "—"}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {Number.isFinite(li?.taxAmount)
                                                                                            ? li.taxAmount.toFixed(2)
                                                                                            : "—"}
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        )}
                                                                        {(!r.raw?.invoice?.lineItems ||
                                                                            r.raw.invoice.lineItems.length === 0) && (
                                                                                <tr>
                                                                                    <td
                                                                                        className="px-3 py-3 text-center text-gray-500"
                                                                                        colSpan={8}
                                                                                    >
                                                                                        No line items found
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                        <div className="border rounded-lg overflow-hidden">
                                                            <div className="px-3 py-2 text-sm font-medium bg-white border-b">
                                                                Raw JSON
                                                            </div>
                                                            <textarea
                                                                className="w-full h-64 p-2 text-xs font-mono border-0"
                                                                value={JSON.stringify(r.raw, null, 2)}
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {raw && responses.length === 0 && (
                <div className="mt-6 border rounded-xl p-4">
                    <div className="text-base font-medium mb-2">Response (raw)</div>
                    <textarea
                        className="w-full h-56 p-2 text-xs font-mono border rounded"
                        readOnly
                        value={raw}
                    />
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
        </div>
    );
}
