import { logisticsApi } from "../../lib/httpClient";

// Personal Effects Ocean Inbound API Service
// All endpoints use /personal-effects/ocean-inbound/ prefix

export const getPEOceanInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/ocean-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Ocean Inbound Jobs:", error);
        return null;
    }
};

export const getPEOceanInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/ocean-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Ocean Inbound Closed Jobs:", error);
        return null;
    }
};

export const deletePEOceanInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/personal-effects/ocean-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Ocean Inbound Job ${jobNo}:`, error);
        return null;
    }
};

// Note: Add other PE Ocean Inbound endpoints as needed following the same pattern
