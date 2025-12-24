/**
 * Shipment Category Mapping
 * Maps shipment terms to freight terms (PREPAID or COLLECT)
 */
export const SHIPMENT_CATEGORY = {
  PREPAID: ["CIF", "C & F", "CAF", "CFR", "CPT", "DAP", "DDP", "DDU"],
  COLLECT: ["EXW", "FAS", "FCA", "FOB"],
};

/**
 * Get freight term based on shipment value
 * @param {string} shipment - The shipment term (e.g., "CIF", "FOB", etc.)
 * @returns {string} - "FREIGHT PREPAID", "FREIGHT COLLECT", or empty string
 */
export const getFreightTerm = (shipment) => {
  if (!shipment) {
    return "";
  }

  if (SHIPMENT_CATEGORY.PREPAID.includes(shipment)) {
    return "FREIGHT PREPAID";
  } else if (SHIPMENT_CATEGORY.COLLECT.includes(shipment)) {
    return "FREIGHT COLLECT";
  }

  return "";
};
