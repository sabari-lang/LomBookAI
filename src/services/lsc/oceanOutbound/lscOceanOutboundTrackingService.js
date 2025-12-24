import { logisticsApi } from "../../../lib/httpClient";

export const getLscOceanOutboundTracking = async (params = {}) => {
    const response = await logisticsApi.get(`/lsc/ocean-outbound/tracking`, { params });
    return response.data;
};

export const getLscOceanOutboundTrackingById = async (id) => {
    const response = await logisticsApi.get(`/lsc/ocean-outbound/tracking/${id}`);
    return response.data;
};

export const createLscOceanOutboundTracking = async (data) => {
    const response = await logisticsApi.post(`/lsc/ocean-outbound/tracking`, data);
    return response.data;
};

export const updateLscOceanOutboundTracking = async (id, data) => {
    const response = await logisticsApi.put(`/lsc/ocean-outbound/tracking/${id}`, data);
    return response.data;
};

export const deleteLscOceanOutboundTracking = async (id) => {
    const response = await logisticsApi.delete(`/lsc/ocean-outbound/tracking/${id}`);
    return response.data;
};

