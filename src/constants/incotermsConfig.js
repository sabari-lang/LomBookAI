/**
 * Incoterms Configuration
 * Single source of truth for all incoterm-related field mappings
 * 
 * Each incoterm defines:
 * - freightTerm: "FREIGHT PREPAID" or "FREIGHT COLLECT"
 * - wtvalCode: "P" (Prepaid) or "C" (Collect)
 * - otherCode: "P" (Prepaid) or "C" (Collect)
 * - mandatoryFields: Array of field names that must be filled for this incoterm
 */

export const INCOTERMS_CONFIG = {
  "CIF": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: [],
  },
  "C & F": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: [],
  },
  "CAF": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: [],
  },
  "CFR": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: [],
  },
  "CPT": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: ["airportDestination", "arrivalDate"],
  },
  "DAP": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: ["airportDestination", "arrivalDate"],
  },
  "DDP": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: ["airportDestination", "arrivalDate"],
  },
  "DDU": {
    freightTerm: "FREIGHT PREPAID",
    wtvalCode: "P",
    otherCode: "P",
    mandatoryFields: ["airportDestination", "arrivalDate"],
  },
  "EXW": {
    freightTerm: "FREIGHT COLLECT",
    wtvalCode: "C",
    otherCode: "C",
    mandatoryFields: ["airportDeparture"],
  },
  "FAS": {
    freightTerm: "FREIGHT COLLECT",
    wtvalCode: "C",
    otherCode: "C",
    mandatoryFields: [],
  },
  "FCA": {
    freightTerm: "FREIGHT COLLECT",
    wtvalCode: "C",
    otherCode: "C",
    mandatoryFields: ["airportDeparture"],
  },
  "FOB": {
    freightTerm: "FREIGHT COLLECT",
    wtvalCode: "C",
    otherCode: "C",
    mandatoryFields: ["airportDeparture"],
  },
};

/**
 * Global defaults that apply to all incoterms
 */
export const INCOTERMS_DEFAULTS = {
  declaredCarriage: "N.V.D",
  declaredCustoms: "NVC",
  insurance: "NIL",
  placeAt: "CHENNAI",
  signature: "LOM TECHNOLOGY",
};

