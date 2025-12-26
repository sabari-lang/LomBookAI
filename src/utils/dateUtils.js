/**
 * Date Utilities - Single source of truth for date formatting across the app
 * 
 * Provides consistent date format conversion for API communication.
 * 
 * IMPORTANT: Check existing codebase conventions. If the backend expects dd-MM-yyyy,
 * update formatDateForApi to match. Otherwise, defaults to yyyy-MM-dd (ISO format).
 */

import moment from 'moment';

/**
 * Format a date for API submission
 * @param {Date|string|null|undefined} value - Date object, ISO string, or null
 * @returns {string|null} Formatted date string (yyyy-MM-dd) or null
 */
export const formatDateForApi = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0]; // yyyy-mm-dd
};

/**
 * Format a month picker value for API submission
 * @param {Date|string|null|undefined} month - Date object or "YYYY-MM" string
 * @returns {string|null} Formatted month string (YYYY-MM) or null
 */
export const formatMonthForApi = (month) => {
    if (!month) {
        return null;
    }

    // If it's already a string in YYYY-MM format, return as-is
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
        return month;
    }

    // If it's a string like "December, 2025", parse it
    if (typeof month === 'string' && month.includes(',')) {
        try {
            const parsed = moment(month, 'MMMM, YYYY');
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM');
            }
        } catch (e) {
            console.warn('[dateUtils] Failed to parse month:', month, e);
        }
    }

    // Try to parse with moment
    try {
        const parsed = moment(month);
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM');
        }
    } catch (e) {
        console.warn('[dateUtils] Failed to parse month with moment:', month, e);
    }

    // Fallback to native Date
    try {
        const dateObj = month instanceof Date ? month : new Date(month);
        if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
            return `${year}-${monthNum}`;
        }
    } catch (e) {
        console.warn('[dateUtils] Failed to parse month:', month, e);
    }

    return null;
};

/**
 * Parse an API date string for use in form inputs (date pickers)
 * @param {string|null|undefined} dateStr - API date string (yyyy-MM-dd) or null
 * @returns {string|null} Date string formatted for input[type="date"] (yyyy-MM-dd) or null
 */
export const parseApiDate = (dateStr) => {
    if (!dateStr) {
        return null;
    }

    // If it's already in yyyy-MM-dd format, return as-is
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // If it's in dd-MM-yyyy format, convert it
    if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    }

    // Try to parse with moment
    try {
        const parsed = moment(dateStr);
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }
    } catch (e) {
        console.warn('[dateUtils] Failed to parse API date with moment:', dateStr, e);
    }

    // Fallback to native Date
    try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.warn('[dateUtils] Failed to parse API date:', dateStr, e);
    }

    return null;
};

/**
 * Format date for display in UI (dd-MM-yyyy format)
 * @param {Date|string|null|undefined} date - Date to format
 * @returns {string} Formatted date string (dd-MM-yyyy) or empty string
 */
export const formatDateForDisplay = (date) => {
    if (!date) {
        return '';
    }

    try {
        const parsed = moment(date);
        if (parsed.isValid()) {
            return parsed.format('DD-MM-YYYY');
        }
    } catch (e) {
        console.warn('[dateUtils] Failed to format date for display:', date, e);
    }

    return '';
};

export default {
    formatDateForApi,
    formatMonthForApi,
    parseApiDate,
    formatDateForDisplay,
};

