/**
 * Quotation Management API
 * Handles all API calls for Quotation Management (N) and (O)
 */

import { api } from "../../../lib/httpClient";
import { toApiYYYYMMDD } from "../utils/dateFormat";

/**
 * List quotations with pagination and search
 * @param {Object} params - { mode, page, pageSize, search }
 * @returns {Promise} API response
 */
export const listQuotations = async (params = {}) => {
    try {
        // TODO: Adjust endpoint if backend differs
        // If backend supports mode param, send it; otherwise keep as query param
        const response = await api.get("/api/quotation/list", {
            params: {
                mode: params.mode || "N", // Default to "N" if not specified
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                search: params.search || "",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching quotations:", error);
        throw error;
    }
};

/**
 * Create a new quotation
 * @param {Object} params - { mode, payload }
 * @returns {Promise} API response
 */
export const createQuotation = async ({ mode, payload }) => {
    try {
        // Normalize dates to API format
        const normalizedPayload = {
            ...payload,
            quotationDate: toApiYYYYMMDD(payload.quotationDate),
            expiryDate: toApiYYYYMMDD(payload.expiryDate),
        };
        
        // TODO: Adjust endpoint if backend differs
        const response = await api.post("/api/quotation/create", {
            ...normalizedPayload,
            mode: mode || "N", // Include mode in payload if backend expects it
        });
        return response.data;
    } catch (error) {
        console.error("Error creating quotation:", error);
        throw error;
    }
};

/**
 * Get quotation details by ID
 * @param {Object} params - { qid }
 * @returns {Promise} API response
 */
export const getQuotationDetails = async ({ qid }) => {
    try {
        // TODO: Adjust endpoint if backend differs
        const response = await api.get(`/api/quotation/${qid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching quotation details:", error);
        throw error;
    }
};

/**
 * Update quotation
 * @param {Object} params - { qid, payload }
 * @returns {Promise} API response
 */
export const updateQuotation = async ({ qid, payload }) => {
    try {
        // Normalize dates to API format
        const normalizedPayload = {
            ...payload,
            quotationDate: toApiYYYYMMDD(payload.quotationDate),
            expiryDate: toApiYYYYMMDD(payload.expiryDate),
        };
        
        // TODO: Adjust endpoint if backend differs
        const response = await api.patch(`/api/quotation/${qid}`, normalizedPayload);
        return response.data;
    } catch (error) {
        console.error("Error updating quotation:", error);
        throw error;
    }
};

/**
 * Delete quotation
 * @param {Object} params - { qid }
 * @returns {Promise} API response
 */
export const deleteQuotation = async ({ qid }) => {
    try {
        // TODO: Adjust endpoint if backend differs
        const response = await api.delete(`/api/quotation/${qid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting quotation:", error);
        throw error;
    }
};

/**
 * Search customers (autocomplete)
 * @param {Object} params - { q }
 * @returns {Promise} API response
 */
export const searchCustomers = async ({ q }) => {
    try {
        // TODO: Adjust endpoint if backend differs
        const response = await api.get("/api/customer/search", {
            params: { q: q || "" },
        });
        return response.data;
    } catch (error) {
        console.error("Error searching customers:", error);
        throw error;
    }
};

/**
 * Get sales persons list
 * @returns {Promise} API response
 */
export const getSalesPersons = async () => {
    try {
        // TODO: Adjust endpoint if backend differs
        const response = await api.get("/api/user/sales-persons");
        return response.data;
    } catch (error) {
        console.error("Error fetching sales persons:", error);
        throw error;
    }
};

/**
 * Upload quotation file
 * @param {Object} params - { qid, file }
 * @returns {Promise} API response
 */
export const uploadQuotationFile = async ({ qid, file }) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        
        // TODO: Adjust endpoint if backend differs
        const response = await api.post(`/api/quotation/${qid}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

