/**
 * Date Formatting Utilities for Quotation Management
 * Converts between UI format (DD-MM-YYYY) and API format (YYYY-MM-DD)
 */

/**
 * Convert date to UI format (DD-MM-YYYY)
 * @param {Date|string|null|undefined} date - Date object, ISO string, or null
 * @returns {string} Formatted date string (DD-MM-YYYY) or empty string
 */
export const toUiDDMMYYYY = (date) => {
    if (!date) return "";
    
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return "";
        
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.warn('[dateFormat] Failed to format date:', date, e);
        return "";
    }
};

/**
 * Convert date to API format (YYYY-MM-DD)
 * @param {Date|string|null|undefined} date - Date object, ISO string, or null
 * @returns {string|null} Formatted date string (YYYY-MM-DD) or null
 */
export const toApiYYYYMMDD = (date) => {
    if (!date) return null;
    
    // If already in YYYY-MM-DD format, return as-is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    
    // If in DD-MM-YYYY format, convert it
    if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [day, month, year] = date.split('-');
        return `${year}-${month}-${day}`;
    }
    
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return null;
        
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.warn('[dateFormat] Failed to convert date to API format:', date, e);
        return null;
    }
};

