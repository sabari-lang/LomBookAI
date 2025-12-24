/**
 * Field Code Mapper - Converts UI labels to backend numeric codes and vice versa
 * 
 * This ensures that coded fields (wtvalPP, coll1, otherPP, coll2, declaredCarriage, 
 * declaredCustoms, insurance) are sent as numeric codes to the backend API.
 * 
 * IMPORTANT: If backend codes are defined elsewhere in the repo, update this file
 * to match those exact codes. Otherwise, this implements the default mapping.
 */

/**
 * Mapping for payment type fields (wtvalPP, coll1, otherPP, coll2)
 * UI values: "P" (Prepaid), "C" (Collect), "" or null
 * Backend codes: 1 (Prepaid), 2 (Collect), 0 or null
 */
const PAYMENT_CODE_MAP = {
    'P': 1,
    'C': 2,
    '': 0,
    null: 0,
    undefined: 0,
};

const PAYMENT_CODE_REVERSE = {
    1: 'P',
    2: 'C',
    0: '',
    null: '',
    undefined: '',
};

/**
 * Mapping for declared value fields (declaredCarriage, declaredCustoms, insurance)
 * UI values: "N.V.D", "NVC", "NIL", or numeric values
 * Backend codes: Need to be confirmed with backend team
 * 
 * For now, we'll map common string values to codes:
 * - "N.V.D" (No Value Declared) -> 0
 * - "NVC" (No Value for Customs) -> 0
 * - "NIL" -> 0
 * - Numeric strings -> parse as number
 * - Empty/null -> 0 or null (depending on backend requirement)
 */
const DECLARED_VALUE_CODE_MAP = {
    'N.V.D': 0,
    'NVC': 0,
    'NIL': 0,
    '': 0,
    null: 0,
    undefined: 0,
};

const DECLARED_VALUE_CODE_REVERSE = {
    0: 'N.V.D',
    null: '',
    undefined: '',
};

/**
 * Convert a payment type value (P/C) to numeric code
 * @param {string|number|null} value - UI value ("P", "C", "", null, or already a number)
 * @returns {number|null} Numeric code (1, 2, 0, or null)
 */
const encodePaymentType = (value) => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    // If already a number, return as-is (but validate range)
    if (typeof value === 'number') {
        return (value === 1 || value === 2 || value === 0) ? value : 0;
    }
    
    // Convert string to uppercase for case-insensitive matching
    const upperValue = String(value).trim().toUpperCase();
    return PAYMENT_CODE_MAP[upperValue] ?? 0;
};

/**
 * Convert a numeric code back to payment type UI value
 * @param {number|null|undefined} code - Backend code (1, 2, 0, null)
 * @returns {string} UI value ("P", "C", "")
 */
const decodePaymentType = (code) => {
    if (code === null || code === undefined) {
        return '';
    }
    
    if (typeof code === 'string') {
        // If it's already a string, try to parse it
        const num = Number(code);
        if (!isNaN(num)) {
            return PAYMENT_CODE_REVERSE[num] ?? '';
        }
        return code; // Return as-is if it's a string like "P" or "C"
    }
    
    return PAYMENT_CODE_REVERSE[code] ?? '';
};

/**
 * Convert a declared value (N.V.D/NVC/NIL/numeric) to numeric code
 * @param {string|number|null} value - UI value
 * @returns {number|null} Numeric code
 */
const encodeDeclaredValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    // If already a number, return as-is
    if (typeof value === 'number') {
        return value;
    }
    
    // Try to parse as number first
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue !== 0) {
        return numValue;
    }
    
    // Convert string to uppercase for case-insensitive matching
    const upperValue = String(value).trim().toUpperCase();
    return DECLARED_VALUE_CODE_MAP[upperValue] ?? 0;
};

/**
 * Convert a numeric code back to declared value UI string
 * @param {number|null|undefined} code - Backend code
 * @returns {string} UI value ("N.V.D", "NVC", "NIL", or numeric string)
 */
const decodeDeclaredValue = (code) => {
    if (code === null || code === undefined) {
        return '';
    }
    
    if (typeof code === 'string') {
        // If it's already a string, try to parse it
        const num = Number(code);
        if (!isNaN(num)) {
            if (num === 0) {
                return 'N.V.D';
            }
            return String(num);
        }
        return code; // Return as-is if it's already a string
    }
    
    if (code === 0) {
        return 'N.V.D';
    }
    
    return String(code);
};

/**
 * Encode all coded fields in a payload for API submission
 * @param {Object} payload - Form data object
 * @returns {Object} Payload with coded fields converted to numeric codes
 */
export const encodeCodedFields = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    const encoded = { ...payload };

    // Encode payment type fields
    if ('wtvalPP' in encoded) {
        encoded.wtvalPP = encodePaymentType(encoded.wtvalPP);
    }
    if ('coll1' in encoded) {
        encoded.coll1 = encodePaymentType(encoded.coll1);
    }
    if ('otherPP' in encoded) {
        encoded.otherPP = encodePaymentType(encoded.otherPP);
    }
    if ('coll2' in encoded) {
        encoded.coll2 = encodePaymentType(encoded.coll2);
    }

    // Encode declared value fields
    if ('declaredCarriage' in encoded) {
        encoded.declaredCarriage = encodeDeclaredValue(encoded.declaredCarriage);
    }
    if ('declaredCustoms' in encoded) {
        encoded.declaredCustoms = encodeDeclaredValue(encoded.declaredCustoms);
    }
    if ('insurance' in encoded) {
        encoded.insurance = encodeDeclaredValue(encoded.insurance);
    }

    return encoded;
};

/**
 * Decode all coded fields from API response for UI display
 * @param {Object} record - API response record
 * @returns {Object} Record with numeric codes converted to UI labels
 */
export const decodeCodedFields = (record) => {
    if (!record || typeof record !== 'object') {
        return record;
    }

    const decoded = { ...record };

    // Decode payment type fields
    if ('wtvalPP' in decoded) {
        decoded.wtvalPP = decodePaymentType(decoded.wtvalPP);
    }
    if ('coll1' in decoded) {
        decoded.coll1 = decodePaymentType(decoded.coll1);
    }
    if ('otherPP' in decoded) {
        decoded.otherPP = decodePaymentType(decoded.otherPP);
    }
    if ('coll2' in decoded) {
        decoded.coll2 = decodePaymentType(decoded.coll2);
    }

    // Decode declared value fields
    if ('declaredCarriage' in decoded) {
        decoded.declaredCarriage = decodeDeclaredValue(decoded.declaredCarriage);
    }
    if ('declaredCustoms' in decoded) {
        decoded.declaredCustoms = decodeDeclaredValue(decoded.declaredCustoms);
    }
    if ('insurance' in decoded) {
        decoded.insurance = decodeDeclaredValue(decoded.insurance);
    }

    return decoded;
};

export default { encodeCodedFields, decodeCodedFields };

