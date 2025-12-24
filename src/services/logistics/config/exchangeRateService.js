import { logisticsApi } from "../../../lib/httpClient";

/**
 * Exchange Rate Service
 * Uses logisticsApi with /config/exchange-rate routes
 */

export const getExchangeRates = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/config/exchange-rate/list", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        throw error;
    }
};

export const getLatestExchangeRates = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/config/exchange-rate/latest", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching latest exchange rates:", error);
        throw error;
    }
};

export const createExchangeRate = async (data) => {
    try {
        const response = await logisticsApi.post("/config/exchange-rate", data);
        return response.data;
    } catch (error) {
        console.error("Error creating exchange rate:", error);
        throw error;
    }
};

export const bulkImportExchangeRates = async (data) => {
    try {
        const response = await logisticsApi.post("/config/exchange-rate/bulk-import", data);
        return response.data;
    } catch (error) {
        console.error("Error bulk importing exchange rates:", error);
        throw error;
    }
};

export const updateExchangeRate = async (rateId, data) => {
    try {
        const response = await logisticsApi.put(`/config/exchange-rate/${rateId}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating exchange rate ${rateId}:`, error);
        throw error;
    }
};

export const deleteExchangeRate = async (rateId) => {
    try {
        const response = await logisticsApi.delete(`/config/exchange-rate/${rateId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting exchange rate ${rateId}:`, error);
        throw error;
    }
};

