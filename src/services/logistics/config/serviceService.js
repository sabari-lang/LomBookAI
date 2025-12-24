import { logisticsApi } from "../../../lib/httpClient";

/**
 * Service Code Service
 * Uses logisticsApi with /config/service routes
 */

export const getServices = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/config/service/list", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};

export const getActiveServices = async (params = {}) => {
    try {
        const response = await logisticsApi.get("/config/service/active", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching active services:", error);
        throw error;
    }
};

export const getServiceByCode = async (serviceCode) => {
    try {
        const response = await logisticsApi.get(`/config/service/${serviceCode}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching service ${serviceCode}:`, error);
        throw error;
    }
};

export const createService = async (data) => {
    try {
        const response = await logisticsApi.post("/config/service", data);
        return response.data;
    } catch (error) {
        console.error("Error creating service:", error);
        throw error;
    }
};

export const updateService = async (serviceCode, data) => {
    try {
        const response = await logisticsApi.put(`/config/service/${serviceCode}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating service ${serviceCode}:`, error);
        throw error;
    }
};

export const deleteService = async (serviceCode) => {
    try {
        const response = await logisticsApi.delete(`/config/service/${serviceCode}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting service ${serviceCode}:`, error);
        throw error;
    }
};

// Legacy aliases for backward compatibility
export const getServiceCodes = getServices;
export const createServiceCode = createService;
export const updateServiceCode = updateService;
export const deleteServiceCode = deleteService;

