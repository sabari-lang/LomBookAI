import { logisticsApi } from "../../../lib/httpClient";

/**
 * Currency Service
 * Uses logisticsApi with /config/currency routes
 */

export const getCurrencies = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/config/currency/list", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching currencies:", error);
        throw error;
    }
};

export const getCurrencyByCode = async (code) => {
    try {
        const response = await logisticsApi.get(`/config/currency/${code}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching currency ${code}:`, error);
        throw error;
    }
};

export const createCurrency = async (data) => {
    try {
        const response = await logisticsApi.post("/config/currency", data);
        return response.data;
    } catch (error) {
        console.error("Error creating currency:", error);
        throw error;
    }
};

export const updateCurrency = async (code, data) => {
    try {
        const response = await logisticsApi.put(`/config/currency/${code}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating currency ${code}:`, error);
        throw error;
    }
};

export const deleteCurrency = async (code) => {
    try {
        const response = await logisticsApi.delete(`/config/currency/${code}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting currency ${code}:`, error);
        throw error;
    }
};

