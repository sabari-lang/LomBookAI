import { logisticsApi } from "../../lib/httpClient";

// Personal Effects Ocean Outbound API Service
// All endpoints use /personal-effects/ocean-outbound/ prefix

export const getPEOceanOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/ocean-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Ocean Outbound Jobs:", error);
        return null;
    }
};

export const getPEOceanOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/ocean-outbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Ocean Outbound Closed Jobs:", error);
        return null;
    }
};

export const deletePEOceanOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/personal-effects/ocean-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Ocean Outbound Job ${jobNo}:`, error);
        return null;
    }
};

// Note: Add other PE Ocean Outbound endpoints as needed following the same pattern
