import { logisticsApi } from "../../../lib/httpClient";

// ================================
//   LSC Air Inbound Tracking APIs
// ================================

// Get all LSC Air Inbound Tracking Jobs (GET)
export const getLscAirInboundTracking = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/lsc/air-inbound/tracking`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching LSC Air Inbound Tracking:", error);
        throw error;
    }
};

// Get single LSC Air Inbound Tracking by ID (GET)
export const getLscAirInboundTrackingById = async (id) => {
    try {
        const response = await logisticsApi.get(`/lsc/air-inbound/tracking/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching LSC Air Inbound Tracking with ID ${id}:`, error);
        throw error;
    }
};

// Create new LSC Air Inbound Tracking (POST)
export const createLscAirInboundTracking = async (data) => {
    try {
        const response = await logisticsApi.post(`/lsc/air-inbound/tracking`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating LSC Air Inbound Tracking:", error);
        throw error;
    }
};

// Update LSC Air Inbound Tracking (PUT)
export const updateLscAirInboundTracking = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/lsc/air-inbound/tracking/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating LSC Air Inbound Tracking with ID ${id}:`, error);
        throw error;
    }
};

// Delete LSC Air Inbound Tracking (DELETE)
export const deleteLscAirInboundTracking = async (id) => {
    try {
        const response = await logisticsApi.delete(`/lsc/air-inbound/tracking/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting LSC Air Inbound Tracking with ID ${id}:`, error);
        throw error;
    }
};

