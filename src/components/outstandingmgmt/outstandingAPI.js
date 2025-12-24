/**
 * Outstanding Management API Wrapper
 * 
 * Provides functions for all Outstanding MGMT endpoints:
 * - Ledger Outstanding
 * - Outstanding Summary
 * - Summary Report
 * - Summary SAC Report
 * - Party wise Summary Report
 * - Invoice Tracking
 * - Opening Balances
 * 
 * All functions use consistent filter normalization and date formatting.
 */

import { api } from "../../lib/httpClient";
import { formatDateForApi, formatMonthForApi } from "../../utils/dateUtils";

/**
 * Normalize filters for API submission
 * Ensures dates are in correct format and required fields are present
 */
const normalizeFilters = (filters) => {
    const normalized = { ...filters };

    // Normalize date fields
    if (normalized.fromDate) {
        normalized.fromDate = formatDateForApi(normalized.fromDate);
    }
    if (normalized.toDate) {
        normalized.toDate = formatDateForApi(normalized.toDate);
    }
    if (normalized.fromMonth) {
        normalized.fromMonth = formatMonthForApi(normalized.fromMonth);
    }
    if (normalized.toMonth) {
        normalized.toMonth = formatMonthForApi(normalized.toMonth);
    }
    if (normalized.asOnDate) {
        normalized.asOnDate = formatDateForApi(normalized.asOnDate);
    }

    // Trim string fields
    Object.keys(normalized).forEach(key => {
        if (typeof normalized[key] === 'string') {
            normalized[key] = normalized[key].trim();
            if (normalized[key] === '') {
                normalized[key] = null;
            }
        }
    });

    return normalized;
};

/**
 * Get Ledger Outstanding Report
 * @param {Object} filters - { partyName, fromDate, toDate }
 * @returns {Promise} API response
 */
export const getLedgerOutstanding = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields
    if (!normalized.partyName || !normalized.fromDate || !normalized.toDate) {
        throw new Error("Party Name, From Date, and To Date are required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/ledger', { params: normalized });
    // return response.data;
    
    // Placeholder - replace with actual API call
    console.warn('[outstandingAPI] getLedgerOutstanding - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Get Outstanding Summary Report
 * @param {Object} filters - { toDate }
 * @returns {Promise} API response
 */
export const getOutstandingSummary = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields
    if (!normalized.toDate) {
        throw new Error("To Date is required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/summary', { params: normalized });
    // return response.data;
    
    console.warn('[outstandingAPI] getOutstandingSummary - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Get Summary Report
 * @param {Object} filters - { fromMonth, toMonth }
 * @returns {Promise} API response
 */
export const getSummaryReport = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields
    if (!normalized.fromMonth || !normalized.toMonth) {
        throw new Error("From Month and To Month are required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/summary-report', { params: normalized });
    // return response.data;
    
    console.warn('[outstandingAPI] getSummaryReport - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Get Summary SAC Report
 * @param {Object} filters - { fromMonth, toMonth }
 * @returns {Promise} API response
 */
export const getSACSummary = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields
    if (!normalized.fromMonth || !normalized.toMonth) {
        throw new Error("From Month and To Month are required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/sac-summary', { params: normalized });
    // return response.data;
    
    console.warn('[outstandingAPI] getSACSummary - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Get Party Wise Summary Report
 * @param {Object} filters - { fromMonth, toMonth }
 * @returns {Promise} API response
 */
export const getPartyWiseSummary = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields
    if (!normalized.fromMonth || !normalized.toMonth) {
        throw new Error("From Month and To Month are required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/party-wise', { params: normalized });
    // return response.data;
    
    console.warn('[outstandingAPI] getPartyWiseSummary - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Get Invoice Tracking Report
 * @param {string} invoiceNo - Invoice number
 * @returns {Promise} API response
 */
export const getInvoiceTracking = async (invoiceNo) => {
    if (!invoiceNo || !invoiceNo.trim()) {
        throw new Error("Invoice number is required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get(`/outstanding/invoice-tracking/${encodeURIComponent(invoiceNo.trim())}`);
    // return response.data;
    
    console.warn('[outstandingAPI] getInvoiceTracking - Using placeholder. Replace with actual endpoint.');
    return { invoiceDetails: [], references: [] };
};

/**
 * Get Opening Balances
 * @param {Object} filters - { asOnDate, ... }
 * @returns {Promise} API response
 */
export const getOpeningBalances = async (filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // Validate required fields (at least asOnDate)
    if (!normalized.asOnDate) {
        throw new Error("As On Date is required");
    }

    // TODO: Replace with actual backend endpoint
    // const response = await api.get('/outstanding/opening-balances', { params: normalized });
    // return response.data;
    
    console.warn('[outstandingAPI] getOpeningBalances - Using placeholder. Replace with actual endpoint.');
    return { data: [], total: 0 };
};

/**
 * Download CSV file for any outstanding report
 * @param {string} endpoint - API endpoint (e.g., '/outstanding/ledger')
 * @param {Object} filters - Filter parameters
 * @returns {Promise} Blob response
 */
export const downloadCsv = async (endpoint, filters = {}) => {
    const normalized = normalizeFilters(filters);
    
    // TODO: Replace with actual backend endpoint
    // const response = await api.get(`${endpoint}/download`, {
    //     params: normalized,
    //     responseType: 'blob'
    // });
    // return response.data;
    
    console.warn('[outstandingAPI] downloadCsv - Using placeholder. Replace with actual endpoint.');
    throw new Error("CSV download not yet implemented");
};

/**
 * Get URL for viewing report (opens in new window/tab)
 * @param {string} endpoint - API endpoint
 * @param {Object} filters - Filter parameters
 * @returns {string} Report URL
 */
export const viewReportUrl = (endpoint, filters = {}) => {
    const normalized = normalizeFilters(filters);
    const params = new URLSearchParams();
    
    Object.keys(normalized).forEach(key => {
        if (normalized[key] !== null && normalized[key] !== undefined && normalized[key] !== '') {
            params.append(key, normalized[key]);
        }
    });
    
    // TODO: Replace with actual report URL base
    const baseUrl = '/api/reports'; // Update with actual base URL
    return `${baseUrl}${endpoint}?${params.toString()}`;
};

export default {
    getLedgerOutstanding,
    getOutstandingSummary,
    getSummaryReport,
    getSACSummary,
    getPartyWiseSummary,
    getInvoiceTracking,
    getOpeningBalances,
    downloadCsv,
    viewReportUrl,
};

