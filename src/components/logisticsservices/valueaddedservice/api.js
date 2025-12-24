import { logisticsApi } from "../../../lib/httpClient";

/**
 * Value Added Service (VAS) API
 * Uses logisticsApi with /vas routes (not /value-added-service)
 */

// Get all Value Added Services (GET)
export const getValueAddedServices = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/vas", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Value Added Services:", error);
        throw error;
    }
};

// Get single Value Added Service by ID (GET)
export const getValueAddedServiceById = async (id) => {
    try {
        const response = await logisticsApi.get(`/vas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Value Added Service with ID ${id}:`, error);
        throw error;
    }
};

// Create new Value Added Service (POST)
export const createValueAddedService = async (data) => {
    try {
        const response = await logisticsApi.post("/vas", data);
        return response.data;
    } catch (error) {
        console.error("Error creating Value Added Service:", error);
        throw error;
    }
};

// Update Value Added Service (PUT)
export const updateValueAddedService = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/vas/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Value Added Service with ID ${id}:`, error);
        throw error;
    }
};

// Delete Value Added Service (DELETE)
export const deleteValueAddedService = async (id) => {
    try {
        const response = await logisticsApi.delete(`/vas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Value Added Service with ID ${id}:`, error);
        throw error;
    }
};

// Get VAS Provisional Entries
export const getVasProvisionalEntries = async (vasId, params = {}) => {
    try {
        const response = await logisticsApi.get(`/vas/${vasId}/provisional-entries`, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching VAS provisional entries for ${vasId}:`, error);
        throw error;
    }
};

// Create VAS Provisional Entry
export const createVasProvisionalEntry = async (vasId, data) => {
    try {
        const response = await logisticsApi.post(`/vas/${vasId}/provisional-entries`, data);
        return response.data;
    } catch (error) {
        console.error(`Error creating VAS provisional entry for ${vasId}:`, error);
        throw error;
    }
};

// Get VAS Accounting Entries
export const getVasAccountingEntries = async (vasId, params = {}) => {
    try {
        const response = await logisticsApi.get(`/vas/${vasId}/accounting-entries`, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching VAS accounting entries for ${vasId}:`, error);
        throw error;
    }
};

// Create VAS Accounting Entry
export const createVasAccountingEntry = async (vasId, data) => {
    try {
        const response = await logisticsApi.post(`/vas/${vasId}/accounting-entries`, data);
        return response.data;
    } catch (error) {
        console.error(`Error creating VAS accounting entry for ${vasId}:`, error);
        throw error;
    }
};

