import { logisticsApi } from "../../../lib/httpClient";

export const getLscOceanInboundTracking = async (params = {}) => {
    const response = await logisticsApi.get(`/lsc/ocean-inbound/tracking`, { params });
    return response.data;
};

export const getLscOceanInboundTrackingById = async (id) => {
    const response = await logisticsApi.get(`/lsc/ocean-inbound/tracking/${id}`);
    return response.data;
};

export const createLscOceanInboundTracking = async (data) => {
    const response = await logisticsApi.post(`/lsc/ocean-inbound/tracking`, data);
    return response.data;
};

export const updateLscOceanInboundTracking = async (id, data) => {
    const response = await logisticsApi.put(`/lsc/ocean-inbound/tracking/${id}`, data);
    return response.data;
};

export const deleteLscOceanInboundTracking = async (id) => {
    const response = await logisticsApi.delete(`/lsc/ocean-inbound/tracking/${id}`);
    return response.data;
};

