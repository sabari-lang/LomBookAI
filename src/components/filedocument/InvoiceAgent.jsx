import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobCreationAirInbound from "../logisticsservices/bl/airinbound/JobCreation";
import JobCreationAirOutbound from "../logisticsservices/bl/airoutbound/JobCreation";
import JobCreationSeaInbound from "../logisticsservices/bl/oceaninbound/JobCreationSeaInbound";
import JobCreationSeaOutbound from "../logisticsservices/bl/oceanoutbound/JobCreationSeaOutbound";
import { notifyInfo, notifyError } from "../../utils/notifications";

const API_URL = "https://ocr.lomtech.ai/analyze";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
  "image/tif",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const pick = (v, def = "—") => (v === null || v === undefined || v === "" ? def : v);

const openBootstrapModalById = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const bs = window.bootstrap;
  if (bs?.Modal) {
    const modal = bs.Modal.getInstance(el) || new bs.Modal(el);
    modal.show();
  } else if (window.$) {
    window.$(el).modal("show");
  }
};

// Schema keys your UI expects from OCR analyze
const JOB_KEYS = [
  "jobNo",
  "blType",
  "mblNo",
  "shipperName",
  "shipperAddress",
  "consigneeName",
  "consigneeAddress",
  "notifyName",
  "notifyAddress",
  "portLoading",
  "portDischarge",
  "placeDelivery",
  "finalDestination",
  "vesselName",
  "voy",
  "package",
  "grossWeight",
  "measurement",
  "freightTerm",
  "dateOfIssue",
];

function toSchemaJobCreation(jc) {
  const obj = jc && typeof jc === "object" ? jc : {};
  const out = {};
  for (const k of JOB_KEYS) out[k] = obj[k] ?? null;

  if (out.measurement === 0) out.measurement = null;
  return out;
}

function coerceVal(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || s === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/**
 * Extract schema fields from debug.model_preview, even if JSON is truncated.
 */
function extractJobCreationFromModelPreview(previewText) {
  if (!previewText || typeof previewText !== "string") return null;

  // First, attempt to parse full JSON and return jobCreation if present
  try {
    const parsed = JSON.parse(previewText);
    if (parsed && typeof parsed === "object" && parsed.jobCreation && typeof parsed.jobCreation === "object") {
      return parsed.jobCreation;
    }
  } catch (e) {
    // ignore parse errors and fallback to regex salvage
  }

  // Fallback: existing regex-based salvage limited to JOB_KEYS
  const jc = {};
  let foundAny = false;

  for (const k of JOB_KEYS) {
    const re = new RegExp(`"${k}"\\s*:\\s*(null|-?\\d+(?:\\.\\d+)?|"[^"]*")`, "i");
    const m = previewText.match(re);

    if (!m) {
      jc[k] = null;
      continue;
    }

    let raw = m[1];
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    jc[k] = coerceVal(raw);
    foundAny = true;
  }

  if (!foundAny) return null;
  if (jc.measurement === 0) jc.measurement = null;
  return jc;
}

function normalizeAnalyzeResponse(apiJson) {
  if (!apiJson || typeof apiJson !== "object") {
    return { ok: false, jobCreation: null, rawText: "", meta: {}, debug: null, error: "Bad response" };
  }

  const preview = apiJson?.debug?.model_preview;
  const previewJobCreation = extractJobCreationFromModelPreview(preview);

  if (apiJson.jobCreation && typeof apiJson.jobCreation === "object") {
    const merged = previewJobCreation
      ? { ...apiJson.jobCreation, ...previewJobCreation }
      : apiJson.jobCreation;
    return {
      ok: true,
      jobCreation: toSchemaJobCreation(merged),
      rawText: JSON.stringify(apiJson, null, 2),
      meta: apiJson.meta || {},
      debug: apiJson.debug || null,
      error: apiJson.error || null,
    };
  }

  const salvaged = previewJobCreation;

  if (salvaged) {
    return {
      ok: true,
      jobCreation: toSchemaJobCreation(salvaged),
      rawText: JSON.stringify(apiJson, null, 2),
      meta: apiJson.meta || {},
      debug: apiJson.debug || null,
      error: apiJson.error || null,
    };
  }

  return {
    ok: false,
    jobCreation: null,
    rawText: JSON.stringify(apiJson, null, 2),
    meta: apiJson.meta || {},
    debug: apiJson.debug || null,
    error: apiJson.error || "Unknown error",
  };
}

/** ---------------------------------------------------------------------
 *  IMPORTANT: Conversion mappers (InvoiceAgentCopy.jsx style)
 *  - Forms expect string inputs, so we cast to string.
 *  - We only map what we actually have from OCR schema.
 *  - No business logic changes inside job creation modules.
 * --------------------------------------------------------------------- */
const s = (v) => (v === null || v === undefined ? "" : String(v));

function mapSchemaToAirInboundEditData(jc) {
  const x = jc || {};
  return {
    jobNo: s(x.jobNo),
    blType: s(x.blType || "Master B/L"),

    mawbNo: s(x.mblNo),
    airWayBill: s(x.mblNo),

    shipperName: s(x.shipperName),
    shipperAddress: s(x.shipperAddress),

    consigneeName: s(x.consigneeName),
    consigneeAddress: s(x.consigneeAddress),

    notifyName: s(x.notifyName),
    notifyAddress: s(x.notifyAddress),

    airportDeparture: s(x.portLoading || x.departurePort),
    airportDestination: s(x.portDischarge || x.arrivalPort),

    pieces: s(x.package),
    grossWeight: s(x.grossWeight),

    freightTerm: s(x.freightTerm),
    departureDate: s(x.dateOfIssue || x.flightDate),

    // DO NOT number-convert these (must remain strings)
    wtvalPP: s(""),
    coll1: s(""),
    otherPP: s(""),
    coll2: s(""),
    declaredCarriage: s("N.V.D"),
    declaredCustoms: s("NVC"),
    insurance: s("NIL"),
  };
}

function mapSchemaToAirOutboundEditData(jc) {
  const x = jc || {};
  return {
    jobNo: s(x.jobNo),
    blType: s(x.blType || "Master B/L"),

    mawbNo: s(x.mblNo),
    airWayBill: s(x.mblNo),

    shipperName: s(x.shipperName),
    shipperAddress: s(x.shipperAddress),

    consigneeName: s(x.consigneeName),
    consigneeAddress: s(x.consigneeAddress),

    notifyName: s(x.notifyName),
    notifyAddress: s(x.notifyAddress),

    airportDeparture: s(x.portLoading || x.departurePort),
    airportDestination: s(x.portDischarge || x.arrivalPort),

    pieces: s(x.package),
    grossWeight: s(x.grossWeight),

    freightTerm: s(x.freightTerm),
    departureDate: s(x.dateOfIssue || x.flightDate),

    // DO NOT number-convert these (must remain strings)
    wtvalPP: s(""),
    coll1: s(""),
    otherPP: s(""),
    coll2: s(""),
    declaredCarriage: s("N.V.D"),
    declaredCustoms: s("NVC"),
    insurance: s("NIL"),
  };
}

function mapSchemaToSeaInboundEditData(jc) {
  const x = jc || {};
  return {
    jobNo: s(x.jobNo),
    blType: s(x.blType || "Master B/L"),
    mblNo: s(x.mblNo),
    hblNo: s(x.hblNo),
    shipperName: s(x.shipperName),
    shipperAddress: s(x.shipperAddress),
    consigneeName: s(x.consigneeName),
    consigneeAddress: s(x.consigneeAddress),
    notifyName: s(x.notifyName),
    notifyAddress: s(x.notifyAddress),
    portLoading: s(x.portLoading || x.departurePort),
    portDischarge: s(x.portDischarge || x.arrivalPort),
    placeDelivery: s(x.placeDelivery),
    finalDestination: s(x.finalDestination),
    vesselName: s(x.vesselName),
    voy: s(x.voy),
    package: s(x.package),
    grossWeight: s(x.grossWeight),
    measurement: s(x.measurement),
    freightTerm: s(x.freightTerm),
    dateOfIssue: s(x.dateOfIssue),
  };
}

function mapSchemaToSeaOutboundEditData(jc) {
  const x = jc || {};
  return {
    jobNo: s(x.jobNo),
    blType: s(x.blType || "Master B/L"),
    mblNo: s(x.mblNo),
    hblNo: s(x.hblNo),
    shipperName: s(x.shipperName),
    shipperAddress: s(x.shipperAddress),
    consigneeName: s(x.consigneeName),
    consigneeAddress: s(x.consigneeAddress),
    notifyName: s(x.notifyName),
    notifyAddress: s(x.notifyAddress),
    portLoading: s(x.portLoading || x.departurePort),
    portDischarge: s(x.portDischarge || x.arrivalPort),
    placeDelivery: s(x.placeDelivery),
    finalDestination: s(x.finalDestination),
    vesselName: s(x.vesselName),
    voy: s(x.voy),
    package: s(x.package),
    grossWeight: s(x.grossWeight),
    measurement: s(x.measurement),
    freightTerm: s(x.freightTerm),
    dateOfIssue: s(x.dateOfIssue),
  };
}

export default function InvoiceAgent() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropRef = useRef(null);

  const validateAndSet = (list) => {
    setError("");
    const valid = [];
    for (const f of list) {
      if (!ALLOWED_TYPES.has(f.type)) {
        notifyError(`Invalid file type for "${f.name}". Allowed: PDF / PNG / JPG / WEBP / TIFF`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        notifyError(`"${f.name}" is too large (${bytes(f.size)}). Max allowed is ${bytes(MAX_BYTES)}.`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
  };

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

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setExpanded({});
    setError("");
  };

  async function analyzeOneFile(file) {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("debug", "true");

    const res = await fetch(API_URL, { method: "POST", body: form });
    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${res.status}). First 200 chars: ${text.slice(0, 200)}`);
    }

    const norm = normalizeAnalyzeResponse(json);

    return {
      fileName: file.name,
      contentType: file.type,
      ok: norm.ok,
      status: norm.ok ? "Success" : "Failed",
      jobCreation: norm.jobCreation,
      rawText: norm.rawText,
      httpStatus: res.status,
      meta: norm.meta,
      debug: norm.debug,
      backendError: norm.error,
    };
  }

  const submitBatch = async () => {
    if (!files.length) return setError("Please add at least one PDF/image.");

    setSubmitting(true);
    setError("");
    setResults([]);

    try {
      const out = [];
      for (const f of files) {
        // eslint-disable-next-line no-await-in-loop
        const one = await analyzeOneFile(f);
        out.push(one);
        setResults([...out]);
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Analyze failed");
    } finally {
      setSubmitting(false);
    }
  };

  const JOB_TABLE_FIELDS = [
    "jobNo",
    "blType",
    "mblNo",
    "shipperName",
    "consigneeName",
    "portLoading",
    "portDischarge",
    "package",
    "grossWeight",
    "freightTerm",
    "dateOfIssue",
  ];

  const rows = useMemo(() => {
    return (results || []).map((r, idx) => {
      const jc = r.jobCreation || {};
      const row = {
        id: `${idx}__${r.fileName}`,
        idx,
        fileName: r.fileName,
        status: r.status,
        raw: r,
      };
      JOB_TABLE_FIELDS.forEach((field) => {
        row[field] = pick(jc[field]);
      });
      return row;
    });
  }, [results]);

  console.log(rows);

  // --- Modal states (InvoiceAgentCopy.jsx style) ---
  const [editDataAirInbound, setEditDataAirInbound] = useState(null);

  // Outbound/Sea are Bootstrap modal components always mounted (like InvoiceAgentCopy.jsx)
  const [editDataAirOutbound, setEditDataAirOutbound] = useState(null);
  const [editDataSeaInbound, setEditDataSeaInbound] = useState(null);
  const [editDataSeaOutbound, setEditDataSeaOutbound] = useState(null);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3 tw-mb-4">
        <h2 className="tw-text-2xl tw-font-semibold">Invoice Agent (Analyze → Convert)</h2>

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
            disabled={submitting || files.length === 0}
          >
            {submitting ? "Processing..." : `Submit ${files.length || ""} file(s)`}
          </button>
        </div>
      </div>

      {/* Uploader */}
      <div className="tw-mb-6 tw-border tw-rounded-xl tw-p-4">
        <div className="tw-text-base tw-font-medium tw-mb-2">Upload</div>

        <div
          ref={dropRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="tw-border-2 tw-border-dashed tw-rounded-2xl tw-p-6 tw-text-center tw-transition hover:tw-bg-gray-50 tw-cursor-pointer"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input id="file-input" type="file" accept=".pdf,image/*" className="tw-hidden" multiple onChange={onPick} />
          <p className="tw-text-sm">Drag & drop PDF/images here, or click to browse. You can add multiple files.</p>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            PDF, PNG, JPG, WEBP, TIFF • Max {bytes(MAX_BYTES)} per file
          </p>
        </div>

        {files.length > 0 && (
          <div className="tw-mt-4">
            <div className="tw-text-sm tw-font-medium tw-mb-2">Selected files</div>
            <ul className="tw-divide-y tw-rounded tw-border">
              {files.map((f, i) => (
                <li key={i} className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2">
                  <div className="tw-min-w-0">
                    <div className="tw-truncate tw-text-sm tw-font-medium">{f.name}</div>
                    <div className="tw-text-xs tw-text-gray-500">
                      {f.type || "unknown"} • {bytes(f.size)}
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

        {error && <div className="tw-mt-4 tw-p-3 tw-rounded-lg tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>}
      </div>

      {/* Results */}
      {rows.length > 0 && (
        <div className="tw-border tw-rounded-xl tw-overflow-hidden" style={{ minHeight: "50vh" }}>
          <div className="tw-overflow-x-auto" style={{ minHeight: "50vh" }}>
            <table className="tw-min-w-full tw-text-sm">
              <thead className="tw-bg-gray-50">
                <tr className="tw-text-left">
                  <th className="tw-px-3 tw-py-2">Actions</th>
                  <th className="tw-px-3 tw-py-2">#</th>
                  <th className="tw-px-3 tw-py-2">File</th>
                  <th className="tw-px-3 tw-py-2">Status</th>
                  {JOB_TABLE_FIELDS.map((field) => (
                    <th key={field} className="tw-px-3 tw-py-2">
                      {field}
                    </th>
                  ))}
                  <th className="tw-px-3 tw-py-2 tw-text-center">Details</th>
                </tr>
              </thead>

              <tbody className="tw-divide-y">
                {rows.map((r, i) => (
                  <React.Fragment key={r.id}>
                    <tr className="hover:tw-bg-gray-50">
                      <td className="tw-px-3 tw-py-2">
                        <div className="dropdown d-inline-block" style={{ position: "relative" }}>
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
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                zIndex: 1000,
                                display: "block",
                                minWidth: "240px",
                                maxWidth: "360px",
                                whiteSpace: "normal",
                              }}
                            >
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdown(null);
                                  console.log("AirInbound convert payload:", r?.raw?.jobCreation);
                                    const mapped = mapSchemaToAirInboundEditData(r.raw?.jobCreation || null);
                                    setEditDataAirInbound(mapped);
                                  setTimeout(() => openBootstrapModalById("createInboundJobcreationModal"), 0);
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
                                    const mapped = mapSchemaToAirOutboundEditData(r.raw?.jobCreation || null);
                                    setEditDataAirOutbound(mapped);
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
                                const mapped = mapSchemaToSeaInboundEditData(r.raw?.jobCreation || null);
                                setEditDataSeaInbound(mapped);
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
                                const mapped = mapSchemaToSeaOutboundEditData(r.raw?.jobCreation || null);
                                setEditDataSeaOutbound(mapped);
                                  }}
                                >
                                  Convert to sea-outbound job creation
                                </button>
                              </li>

                              {/* Temporarily hidden convert options */}
                              {/* <li>
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
                              </li> */}
                            </ul>
                          )}
                        </div>
                      </td>

                      <td className="tw-px-3 tw-py-2">{i + 1}</td>

                      <td className="tw-px-3 tw-py-2 tw-truncate tw-max-w-[240px]" title={r.fileName}>
                        {r.fileName}
                      </td>

                      <td
                        className={classNames(
                          "tw-px-3 tw-py-2",
                          r.status === "Success" ? "tw-text-green-600" : "tw-text-red-600"
                        )}
                      >
                        {r.status}
                      </td>

                      {JOB_TABLE_FIELDS.map((field) => (
                        <td key={field} className="tw-px-3 tw-py-2">
                          {r[field]}
                        </td>
                      ))}

                      <td className="tw-px-3 tw-py-2 tw-text-center">
                        <button
                          className="tw-px-2 tw-py-1 tw-rounded tw-border tw-bg-white hover:tw-bg-gray-50"
                          onClick={() => setExpanded((p) => ({ ...p, [r.idx]: !p[r.idx] }))}
                          type="button"
                        >
                          {expanded[r.idx] ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {expanded[r.idx] && (
                      <tr className="tw-bg-gray-50/60">
                        <td className="tw-px-3 tw-py-3" colSpan={4 + JOB_TABLE_FIELDS.length + 1}>
                          <div className="tw-grid lg:tw-grid-cols-2 tw-gap-6">
                            <div className="tw-border tw-rounded-lg tw-overflow-hidden">
                              <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-bg-white tw-border-b">
                                jobCreation (schema)
                              </div>
                              <pre className="tw-text-xs tw-p-3 tw-overflow-auto tw-max-h-[360px]">
                                {JSON.stringify(r.raw?.jobCreation ?? null, null, 2)}
                              </pre>
                            </div>

                            <div className="tw-border tw-rounded-lg tw-overflow-hidden">
                              <div className="tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-bg-white tw-border-b">
                                Backend response (debug)
                              </div>
                              <textarea
                                className="tw-w-full tw-h-64 tw-p-2 tw-text-xs tw-font-mono tw-border-0"
                                value={r.raw?.rawText || ""}
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

      {/* BOOTSTRAP MODALS — always mounted (like InvoiceAgentCopy.jsx) */}
      <JobCreationAirInbound editData={editDataAirInbound ?? {}} setEditData={setEditDataAirInbound} />
      <JobCreationAirOutbound editData={editDataAirOutbound ?? {}} setEditData={setEditDataAirOutbound} />
      <JobCreationSeaInbound editData={editDataSeaInbound ?? {}} setEditData={setEditDataSeaInbound} />
      <JobCreationSeaOutbound editData={editDataSeaOutbound ?? {}} setEditData={setEditDataSeaOutbound} />
    </div>
  );
}
