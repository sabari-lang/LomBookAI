import { logisticsApi } from "../../../lib/httpClient";

// ================================
//   Personal Effects (UB) Air Inbound API
//   Transformed from Commercial: /air-inbound/ -> /ub/air-inbound/
//   Houses: /houses/ -> /house/ (singular)
//   Accounting: Uses shipments/{ubId} instead of job/hawb
// ================================

// ================================
//   Job Creation (UB Air Inbound)
// ================================

// Get all UB Air Inbound Jobs (GET)
export const getUbAirInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Inbound Jobs:", error);
        throw error;
    }
};

export const getUbAirInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Inbound Closed Jobs:", error);
        throw error;
    }
};

// Get single UB Air Inbound Job by ID (GET)
export const getUbAirInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

// Create new UB Air Inbound Job (POST)
export const createUbAirInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ub/air-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB Air Inbound Job:", error);
        throw error;
    }
};

// Update UB Air Inbound Job (PUT)
export const updateUbAirInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ub/air-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

// Delete UB Air Inbound Job (DELETE)
export const deleteUbAirInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ub/air-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB Air Inbound Job ${jobNo}:`, error);
        throw error;
    }
};

// Validate Job No
export const validateUbAirInboundJobNo = async (jobNo) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/master/validate/job-no/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Air Inbound Job No ${jobNo}:`, error);
        throw error;
    }
};

// Validate Master No (MAWB)
export const validateUbAirInboundMasterNo = async (mawbNo) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/master/validate/master-no/${mawbNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Air Inbound Master No ${mawbNo}:`, error);
        throw error;
    }
};

// ================================
//   CREATE HOUSE FOR UB AIR INBOUND
//   Note: UB uses /house/ (singular) not /houses/
// ================================

// Get all Houses by Job No (with pagination params)
export const getUbAirInboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/air-inbound/house/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB air inbound houses:", error);
        throw error;
    }
};

// Get House by Job No and HAWB
export const getUbAirInboundHouseByHawb = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB air inbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// Create House
export const createUbAirInboundHouse = async (jobNo, data) => {
    try {
        if (!jobNo) {
            throw new Error("Job No is required");
        }
        const response = await logisticsApi.post(`/ub/air-inbound/house/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB air inbound house:", error);
        throw error;
    }
};

// Update House
export const updateUbAirInboundHouse = async (jobNo, hawb, data) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.put(`/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB air inbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// Delete House
export const deleteUbAirInboundHouse = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.delete(`/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB air inbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// Update House Status
export const updateUbAirInboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.post(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Air Inbound House Status JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

// Validate House
export const validateUbAirInboundHouse = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/air-inbound/house/validate`, { params });
        return response.data;
    } catch (error) {
        console.error("Error validating UB air inbound house:", error);
        throw error;
    }
};

// ================================
//   PROVISIONAL ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId} instead of job/hawb
// ================================

// Get All Provisional Entries for a shipment (by ubId)
export const getUbAirInboundProvisionals = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-inbound/shipments/${ubId}/provisional-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound provisional entries for ubId ${ubId}:`, error);
        throw error;
    }
};

// Create Provisional Entry
export const createUbAirInboundProvisional = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-inbound/shipments/${ubId}/provisional-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Inbound provisional entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB provisional entries.
 */
export const updateUbAirInboundProvisional = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB provisional entries.
 */
export const deleteUbAirInboundProvisional = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbAirInboundCustomerAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-inbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound customer accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbAirInboundCustomerAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-inbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Inbound customer accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB customer accounting entries.
 */
export const updateUbAirInboundCustomerAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB customer accounting entries.
 */
export const deleteUbAirInboundCustomerAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR VENDORS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbAirInboundVendorAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/air-inbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound vendor accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbAirInboundVendorAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/air-inbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Air Inbound vendor accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB vendor accounting entries.
 */
export const updateUbAirInboundVendorAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB vendor accounting entries.
 */
export const deleteUbAirInboundVendorAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

// Get accounting entry by ID (for viewing single entry)
export const getUbAirInboundCustomerAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/air-inbound/accounting-entries/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound customer account ID ${id}:`, error);
        return null;
    }
};

export const getUbAirInboundVendorAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/air-inbound/accounting-entries/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Air Inbound vendor account ID ${id}:`, error);
        return null;
    }
};

// ================================
//   ARRIVAL NOTICE
// ================================

export const getUbAirInboundArrivalNotices = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Inbound arrival notices:", error);
        throw error;
    }
};

export const createUbAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating UB Air Inbound arrival notice:", error);
        throw error;
    }
};

export const updateUbAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating UB Air Inbound arrival notice:", error);
        throw error;
    }
};

export const deleteUbAirInboundArrivalNotice = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/arrival-notice`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting UB Air Inbound arrival notice:", error);
        throw error;
    }
};

// ================================
//   JOB COSTING
// ================================

export const getUbAirInboundJobCosting = async (jobNo, hawb, params = {}) => {
    if (!jobNo || !hawb) {
        console.error("Job No and HAWB are required for UB Air Inbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/ub/air-inbound/house/job/${jobNo}/hawb/${hawb}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Air Inbound job costing:", error);
        throw error;
    }
};

// ================================
//   ALIASES FOR COMPATIBILITY
//   Non-Ub function names for backward compatibility
// ================================

// Job Creation aliases
export const createAirInboundJob = createUbAirInboundJob;
export const updateAirInboundJob = updateUbAirInboundJob;

// Arrival Notice aliases
export const getAirInboundArrivalNotices = getUbAirInboundArrivalNotices;
export const createAirInboundArrivalNotice = createUbAirInboundArrivalNotice;
export const updateAirInboundArrivalNotice = updateUbAirInboundArrivalNotice;
export const deleteAirInboundArrivalNotice = deleteUbAirInboundArrivalNotice;

// Accounting Entry aliases
export const createAirInboundCustomerAccount = createUbAirInboundCustomerAccount;
export const updateAirInboundCustomerAccount = updateUbAirInboundCustomerAccount;
export const createAirInboundVendorAccount = createUbAirInboundVendorAccount;
export const updateAirInboundVendorAccount = updateUbAirInboundVendorAccount;

