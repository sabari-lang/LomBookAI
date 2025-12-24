import { logisticsApi } from "../../../../lib/httpClient";

/**
 * Commercial Air Inbound API
 * Barrel export for all Air Inbound commercial logistics operations
 * Uses composite routes: job/{jobNo}/hawb/{hawb}/...
 */

// ================================
//   Job Creation (Air Inbound)
// ================================

export const getAirInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/air-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Inbound Jobs:", error);
        return null;
    }
};

export const getAirInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/air-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Inbound Closed Jobs:", error);
        return null;
    }
};

export const getAirInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/air-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Air Inbound Job with ID ${id}:`, error);
        return null;
    }
};

export const createAirInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/air-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Air Inbound Job:", error);
        throw error;
    }
};

export const updateAirInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/air-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const deleteAirInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/air-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Inbound Job ${jobNo}:`, error);
        return null;
    }
};

// ================================
//   House Management (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}
// ================================

export const getAirInboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/air-inbound/houses/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching air inbound houses:", error);
        return null;
    }
};

// NOTE: Removed getAirInboundHouseById - backend doesn't support /houses/{id}
// Use getAirInboundHouses(jobNo) and filter by hawb instead

export const createAirInboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(`/air-inbound/houses/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating air inbound house:", error);
        throw error;
    }
};

export const updateAirInboundHouse = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(`/air-inbound/houses/job/${jobNo}/hawb/${hawb}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating air inbound house ${hawb}:`, error);
        throw error;
    }
};

export const deleteAirInboundHouse = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for deleting air inbound house");
            return null;
        }
        const response = await logisticsApi.delete(`/air-inbound/houses/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting air inbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        return null;
    }
};

export const updateAirInboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.post(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating Air Inbound House Status JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// ================================
//   Provisional Entry (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/provisional
// ================================

export const getAirInboundProvisionals = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required");
            return null;
        }
        const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.get(url, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching provisional entries:", error);
        return null;
    }
};

// NOTE: Removed getAirInboundProvisionalById - backend doesn't support /houses/provisional/{id}

export const createAirInboundProvisional = async (jobNo, hawb, data) => {
    try {
        const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.post(url, data);
        return response.data;
    } catch (error) {
        console.error("Error creating provisional entry:", error);
        throw error;
    }
};

export const updateAirInboundProvisional = async (jobNo, hawb, data) => {
    try {
        const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.put(url, data);
        return response.data;
    } catch (error) {
        console.error("Error updating provisional entry:", error);
        throw error;
    }
};

export const deleteAirInboundProvisional = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("jobNo and hawb are required for deleting Air Inbound provisionals");
        }
        const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.delete(url);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Inbound provisional (jobNo: ${jobNo}, hawb: ${hawb}):`, error);
        throw error;
    }
};

// ================================
//   Customer Accounting (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/customer-accounting-entry
// ================================

export const getAirInboundCustomerAccounts = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) return null;
        const response = await logisticsApi.get(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching customer accounting entries:", error);
        return null;
    }
};

// NOTE: Removed getAirInboundCustomerAccountById - backend doesn't support /houses/accounting/customer/{id}
// Use getAirInboundCustomerAccounts and filter, or use detailed endpoint if available

export const createAirInboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating customer accounting entry:", error);
        throw error;
    }
};

export const updateAirInboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating customer accounting entry:", error);
        throw error;
    }
};

export const deleteAirInboundCustomerAccount = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting customer accounting entry:", error);
        throw error;
    }
};

// ================================
//   Vendor Accounting (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/vendor-accounting-entry
// ================================

export const getAirInboundVendorAccounts = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching vendor accounting entries:", error);
        return null;
    }
};

// NOTE: Removed getAirInboundVendorAccountById - backend doesn't support /houses/accounting/vendor/{id}
// Use getAirInboundVendorAccounts and filter, or use detailed endpoint if available

export const createAirInboundVendorAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating vendor accounting entry:", error);
        throw error;
    }
};

export const updateAirInboundVendorAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating vendor accounting entry:", error);
        throw error;
    }
};

export const deleteAirInboundVendorAccount = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting vendor accounting entry:", error);
        throw error;
    }
};

// ================================
//   Arrival Notice (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/arrival-notice
// ================================

export const getAirInboundArrivalNotices = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching arrival notices:", error);
        return null;
    }
};

export const createAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating arrival notice:", error);
        throw error;
    }
};

export const updateAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating arrival notice:", error);
        throw error;
    }
};

export const deleteAirInboundArrivalNotice = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting arrival notice:", error);
        return null;
    }
};

// ================================
//   Job Costing (Air Inbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/job-costing
// ================================

export const getAirInboundJobCosting = async (jobNo, hawb, params = {}) => {
    if (!jobNo || !hawb) {
        console.error("Job No and HAWB are required for Air Inbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching job costing:", error);
        return null;
    }
};

// Alias for backward compatibility
export const updateAirInboundStatus = updateAirInboundHouseStatus;

