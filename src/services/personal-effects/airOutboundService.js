import { logisticsApi } from "../../lib/httpClient";

// Personal Effects Air Outbound API Service
// All endpoints use /personal-effects/air-outbound/ prefix

export const getPEAirOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Outbound Jobs:", error);
        return null;
    }
};

export const getPEAirOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-outbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Outbound Closed Jobs:", error);
        return null;
    }
};

export const deletePEAirOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/personal-effects/air-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Air Outbound Job ${jobNo}:`, error);
        return null;
    }
};

// Note: Add other PE Air Outbound endpoints as needed following the same pattern
