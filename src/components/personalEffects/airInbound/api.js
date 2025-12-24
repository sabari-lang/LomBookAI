import { logisticsApi } from "../../../lib/httpClient";

// Get all Personal Effects Air Inbound Jobs (GET)
export const getPEAirInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/pe/air-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Inbound Jobs:", error);
        return null;
    }
};

export const getPEAirInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/pe/air-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Inbound Closed Jobs:", error);
        return null;
    }
};

// Get single PE Air Inbound Job by ID (GET)
export const getPEAirInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/pe/air-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE Air Inbound Job with ID ${id}:`, error);
        return null;
    }
};

// Create new PE Air Inbound Job (POST)
export const createPEAirInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/pe/air-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating PE Air Inbound Job:", error);
        throw error;
    }
};

// Update PE Air Inbound Job (PUT)
export const updatePEAirInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/pe/air-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating PE Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

// Delete PE Air Inbound Job (DELETE)
export const deletePEAirInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/pe/air-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Air Inbound Job ${jobNo}:`, error);
        return null;
    }
};

