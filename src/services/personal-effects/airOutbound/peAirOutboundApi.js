import { logisticsApi } from "../../../lib/httpClient";

// ================================
//   Personal Effects (UB) Air Outbound API
//   Transformed from Commercial: /air-outbound/ -> /ub/air-outbound/
//   Houses: /houses/ -> /house/ (singular)
//   Accounting: Uses shipments/{ubId} instead of job/hawb
// ================================

// ================================
//   Job Creation (UB Air Outbound)
// ================================

export const getUbAirOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Outbound Jobs:", error);
        throw error;
    }
};

export const getUbAirOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Outbound Closed Jobs:", error);
        throw error;
    }
};

export const getUbAirOutboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const createUbAirOutboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ub/air-outbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB Air Outbound Job:", error);
        throw error;
    }
};

export const updateUbAirOutboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ub/air-outbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Air Outbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const deleteUbAirOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ub/air-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB Air Outbound Job ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbAirOutboundJobNo = async (jobNo) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/master/validate/job-no/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Air Outbound Job No ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbAirOutboundMasterNo = async (mawbNo) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/master/validate/master-no/${mawbNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Air Outbound Master No ${mawbNo}:`, error);
        throw error;
    }
};

// ================================
//   CREATE HOUSE FOR UB AIR OUTBOUND
//   Note: UB uses /house/ (singular) not /houses/
// ================================

export const getUbAirOutboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/air-outbound/house/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB air outbound houses:", error);
        throw error;
    }
};

export const getUbAirOutboundHouseByHawb = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/air-outbound/house/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB air outbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const createUbAirOutboundHouse = async (jobNo, data) => {
    try {
        if (!jobNo) {
            throw new Error("Job No is required");
        }
        const response = await logisticsApi.post(`/ub/air-outbound/house/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB air outbound house:", error);
        throw error;
    }
};

export const updateUbAirOutboundHouse = async (jobNo, hawb, data) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.put(`/ub/air-outbound/house/job/${jobNo}/hawb/${hawb}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB air outbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const deleteUbAirOutboundHouse = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.delete(`/ub/air-outbound/house/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB air outbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const updateUbAirOutboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.post(
            `/ub/air-outbound/house/job/${jobNo}/hawb/${hawb}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Air Outbound House Status JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const validateUbAirOutboundHouse = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-outbound/house/validate`, { params });
        return response.data;
    } catch (error) {
        console.error("Error validating UB air outbound house:", error);
        throw error;
    }
};

// ================================
//   PROVISIONAL ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId} instead of job/hawb
// ================================

export const getUbAirOutboundProvisionals = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-outbound/shipments/${ubId}/provisional-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound provisional entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbAirOutboundProvisional = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-outbound/shipments/${ubId}/provisional-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Outbound provisional entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB provisional entries.
 */
export const updateUbAirOutboundProvisional = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB provisional entries.
 */
export const deleteUbAirOutboundProvisional = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbAirOutboundCustomerAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-outbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound customer accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbAirOutboundCustomerAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-outbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Outbound customer accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB customer accounting entries.
 */
export const updateUbAirOutboundCustomerAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB customer accounting entries.
 */
export const deleteUbAirOutboundCustomerAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR VENDORS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbAirOutboundVendorAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-outbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound vendor accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbAirOutboundVendorAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-outbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Outbound vendor accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB vendor accounting entries.
 */
export const updateUbAirOutboundVendorAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB vendor accounting entries.
 */
export const deleteUbAirOutboundVendorAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

// Get accounting entry by ID (for viewing single entry)
export const getUbAirOutboundCustomerAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/air-outbound/accounting-entries/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound customer account ID ${id}:`, error);
        return null;
    }
};

export const getUbAirOutboundVendorAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/air-outbound/accounting-entries/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Outbound vendor account ID ${id}:`, error);
        return null;
    }
};

// ================================
//   JOB COSTING
// ================================

// ================================
//   WRAPPER FUNCTIONS (for backward compatibility with jobNo/hawb pattern)
//   These convert jobNo/hawb to ubId by fetching the house first
// ================================

/**
 * Get provisional entries by jobNo and hawb (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hawb - House airway bill number
 * @param {object} params - Query parameters
 * @returns {Promise} Provisional entries data
 */
export const getAirOutboundProvisionals = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbAirOutboundHouseByHawb(jobNo, hawb);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HAWB ${hawb}`);
        }
        const ubId = house.id;
        // Then fetch provisionals using ubId
        return await getUbAirOutboundProvisionals(ubId, params);
    } catch (error) {
        console.error(`Error fetching Air Outbound provisionals for Job ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

/**
 * Delete provisional entry by jobNo and hawb (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hawb - House airway bill number
 * @returns {Promise} Deletion result
 */
export const deleteAirOutboundProvisional = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbAirOutboundHouseByHawb(jobNo, hawb);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HAWB ${hawb}`);
        }
        const ubId = house.id;
        // Then delete using ubId
        return await deleteUbAirOutboundProvisional(ubId);
    } catch (error) {
        console.error(`Error deleting Air Outbound provisional for Job ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const getUbAirOutboundJobCosting = async (jobNo, hawb, params = {}) => {
    if (!jobNo || !hawb) {
        console.error("Job No and HAWB are required for UB Air Outbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/ub/air-outbound/house/job/${jobNo}/hawb/${hawb}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Outbound job costing:", error);
        throw error;
    }
};

// ================================
//   ALIASES FOR COMPATIBILITY
//   Non-Ub function names for backward compatibility
// ================================

// Job Creation aliases
export const createAirOutboundJob = createUbAirOutboundJob;
export const updateAirOutboundJob = updateUbAirOutboundJob;

// Job Costing and Accounting aliases
export const getAirOutboundJobCosting = getUbAirOutboundJobCosting;
export const getAirOutboundCustomerAccounts = getUbAirOutboundCustomerAccounts;
export const getAirOutboundVendorAccounts = getUbAirOutboundVendorAccounts;

