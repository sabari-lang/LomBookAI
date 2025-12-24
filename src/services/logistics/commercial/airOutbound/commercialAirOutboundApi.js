import { logisticsApi } from "../../../../lib/httpClient";

/**
 * Commercial Air Outbound API
 * Barrel export for all Air Outbound commercial logistics operations
 * Uses composite routes: job/{jobNo}/hawb/{hawb}/...
 * NOTE: Arrival Notice is NOT supported for Air Outbound
 */

// ================================
//   Job Creation (Air Outbound)
// ================================

export const getAirOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/air-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Jobs:", error);
        return null;
    }
};

export const getAirOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/air-outbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Closed Jobs:", error);
        return null;
    }
};

export const getAirOutboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/air-outbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Air Outbound Job ID ${id}:`, error);
        return null;
    }
};

export const createAirOutboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/air-outbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Air Outbound Job:", error);
        throw error;
    }
};

export const updateAirOutboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/air-outbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Air Outbound Job ID ${id}:`, error);
        throw error;
    }
};

export const deleteAirOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/air-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Outbound Job ${jobNo}:`, error);
        return null;
    }
};

// ================================
//   House Management (Air Outbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}
// ================================

export const getAirOutboundHouses = async (jobNo, params = {}) => {
    try {
        const response = await logisticsApi.get(`/air-outbound/houses/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Houses:", error);
        return null;
    }
};

// NOTE: Removed getAirOutboundHouseById - backend doesn't support /houses/{id}

export const createAirOutboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(`/air-outbound/houses/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Air Outbound House:", error);
        throw error;
    }
};

export const updateAirOutboundHouse = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating Outbound House JOB ${jobNo} HAWB ${hawbNo}:`, error);
        throw error;
    }
};

export const deleteAirOutboundHouse = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for deleting air outbound house");
            return null;
        }
        const response = await logisticsApi.delete(`/air-outbound/houses/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Outbound House JOB ${jobNo} HAWB ${hawb}:`, error);
        return null;
    }
};

export const updateAirOutboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.post(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating Air Outbound House Status JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// ================================
//   Provisional Entry (Air Outbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/provisional
// ================================

export const getAirOutboundProvisionals = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for Air Outbound Provisional");
            return null;
        }
        const url = `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.get(url, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Provisional Entries:", error);
        return null;
    }
};

// NOTE: Removed getAirOutboundProvisionalById - backend doesn't support /houses/provisional/{id}

export const createAirOutboundProvisional = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Air Outbound Provisional:", error);
        throw error;
    }
};

export const updateAirOutboundProvisional = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Air Outbound Provisional:", error);
        throw error;
    }
};

export const deleteAirOutboundProvisional = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("jobNo and hawb are required for deleting Air Outbound provisionals");
        }
        const url = `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.delete(url);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Outbound provisional (jobNo: ${jobNo}, hawb: ${hawb}):`, error);
        throw error;
    }
};

// ================================
//   Customer Accounting (Air Outbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/customer-accounting-entry
// ================================

export const getAirOutboundCustomerAccounts = async (jobNo, hawbNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/customer-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Customer Accounts:", error);
        throw error;
    }
};

// NOTE: Removed getAirOutboundCustomerAccountById - backend doesn't support /houses/accounting/customer/{id}

export const createAirOutboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Air Outbound Customer Accounting:", error);
        throw error;
    }
};

export const updateAirOutboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Air Outbound Customer Accounting:", error);
        throw error;
    }
};

export const deleteAirOutboundCustomerAccount = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting Air Outbound Customer Accounting:", error);
        throw error;
    }
};

// ================================
//   Vendor Accounting (Air Outbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/accounting/vendor-accounting-entry
// ================================

export const getAirOutboundVendorAccounts = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Vendor Accounts:", error);
        return null;
    }
};

export const getAirOutboundVendorAccountsDetailed = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry/detailed`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Air Outbound Vendor Detailed Accounts:", error);
        return null;
    }
};

// NOTE: Removed getAirOutboundVendorAccountById - backend doesn't support /houses/accounting/vendor/{id}

export const createAirOutboundVendorAccount = async (jobNo, hawbNo, payload) => {
    try {
        const response = await logisticsApi.post(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Air Outbound Vendor Accounting:", error);
        throw error;
    }
};

export const updateAirOutboundVendorAccount = async (jobNo, hawbNo, payload) => {
    try {
        const response = await logisticsApi.put(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Air Outbound Vendor Accounting:", error);
        throw error;
    }
};

export const deleteAirOutboundVendorAccount = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("jobNo and hawb are required for deleting Air Outbound vendor accounting");
        }
        const response = await logisticsApi.delete(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Outbound Vendor Account (jobNo: ${jobNo}, hawb: ${hawb}):`, error);
        throw error;
    }
};

// ================================
//   Job Costing (Air Outbound)
//   Uses composite routes: job/{jobNo}/hawb/{hawb}/job-costing
// ================================

export const getAirOutboundJobCosting = async (jobNo, hawb, params = {}) => {
    if (!jobNo || !hawb) {
        console.error("Job No and HAWB are required for Air Outbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/air-outbound/houses/job/${jobNo}/hawb/${hawb}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching air outbound job costing:", error);
        return null;
    }
};

// NOTE: Arrival Notice is NOT supported for Air Outbound (commented out in original)

// Alias for backward compatibility
export const updateAirOutboundStatus = updateAirOutboundHouseStatus;

