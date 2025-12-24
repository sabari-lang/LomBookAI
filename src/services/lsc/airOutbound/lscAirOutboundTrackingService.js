import { logisticsApi } from "../../../lib/httpClient";

export const getLscAirOutboundTracking = async (params = {}) => {
    const response = await logisticsApi.get(`/lsc/air-outbound/tracking`, { params });
    return response.data;
};

export const getLscAirOutboundTrackingById = async (id) => {
    const response = await logisticsApi.get(`/lsc/air-outbound/tracking/${id}`);
    return response.data;
};

export const createLscAirOutboundTracking = async (data) => {
    const response = await logisticsApi.post(`/lsc/air-outbound/tracking`, data);
    return response.data;
};

export const updateLscAirOutboundTracking = async (id, data) => {
    const response = await logisticsApi.put(`/lsc/air-outbound/tracking/${id}`, data);
    return response.data;
};

export const deleteLscAirOutboundTracking = async (id) => {
    const response = await logisticsApi.delete(`/lsc/air-outbound/tracking/${id}`);
    return response.data;
};

