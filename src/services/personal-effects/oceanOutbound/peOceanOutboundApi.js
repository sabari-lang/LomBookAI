import { logisticsApi } from "../../../lib/httpClient";

// ================================
//   Personal Effects (UB) Ocean Outbound API
//   Transformed from Commercial: /ocean-outbound/ -> /ub/ocean-outbound/
//   Houses: /houses/ -> /house/ (singular)
//   Ocean uses hbl instead of hawb
//   Accounting: Uses shipments/{ubId} instead of job/hbl
// ================================

// ================================
//   Job Creation (UB Ocean Outbound)
// ================================

export const getUbOceanOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Outbound Jobs:", error);
        throw error;
    }
};

export const getUbOceanOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Outbound Closed Jobs:", error);
        throw error;
    }
};

export const getUbOceanOutboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const createUbOceanOutboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ub/ocean-outbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB Ocean Outbound Job:", error);
        throw error;
    }
};

export const updateUbOceanOutboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ub/ocean-outbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Ocean Outbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const deleteUbOceanOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ub/ocean-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB Ocean Outbound Job ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbOceanOutboundJobNo = async (jobNo) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/master/validate/job-no/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Ocean Outbound Job No ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbOceanOutboundMasterNo = async (mblNo) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/master/validate/master-no/${mblNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Ocean Outbound Master No ${mblNo}:`, error);
        throw error;
    }
};

// ================================
//   CREATE HOUSE FOR UB OCEAN OUTBOUND
//   Note: UB uses /house/ (singular) not /houses/
//   Ocean uses hbl instead of hawb
// ================================

export const getUbOceanOutboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/ocean-outbound/house/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB ocean outbound houses:", error);
        throw error;
    }
};

export const getUbOceanOutboundHouseByHbl = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            console.error("Job No and HBL are required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/ocean-outbound/house/job/${jobNo}/hbl/${hbl}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB ocean outbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const createUbOceanOutboundHouse = async (jobNo, data) => {
    try {
        if (!jobNo) {
            throw new Error("Job No is required");
        }
        const response = await logisticsApi.post(`/ub/ocean-outbound/house/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB ocean outbound house:", error);
        throw error;
    }
};

export const updateUbOceanOutboundHouse = async (jobNo, hbl, data) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.put(`/ub/ocean-outbound/house/job/${jobNo}/hbl/${hbl}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB ocean outbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const deleteUbOceanOutboundHouse = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.delete(`/ub/ocean-outbound/house/job/${jobNo}/hbl/${hbl}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB ocean outbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const updateUbOceanOutboundHouseStatus = async (jobNo, hbl, payload) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-outbound/house/job/${jobNo}/hbl/${hbl}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Ocean Outbound House Status JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const validateUbOceanOutboundHouse = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-outbound/house/validate`, { params });
        return response.data;
    } catch (error) {
        console.error("Error validating UB ocean outbound house:", error);
        throw error;
    }
};

// ================================
//   PROVISIONAL ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId} instead of job/hbl
// ================================

export const getUbOceanOutboundProvisionals = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-outbound/shipments/${ubId}/provisional-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound provisional entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanOutboundProvisional = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-outbound/shipments/${ubId}/provisional-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Outbound provisional entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB provisional entries.
 */
export const updateUbOceanOutboundProvisional = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB provisional entries.
 */
export const deleteUbOceanOutboundProvisional = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbOceanOutboundCustomerAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-outbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound customer accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanOutboundCustomerAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-outbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Outbound customer accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB customer accounting entries.
 */
export const updateUbOceanOutboundCustomerAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB customer accounting entries.
 */
export const deleteUbOceanOutboundCustomerAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR VENDORS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbOceanOutboundVendorAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-outbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound vendor accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanOutboundVendorAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-outbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Outbound vendor accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB vendor accounting entries.
 */
export const updateUbOceanOutboundVendorAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB vendor accounting entries.
 */
export const deleteUbOceanOutboundVendorAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

// Get accounting entry by ID (for viewing single entry)
// Note: Backend may need ubId, but trying direct ID lookup first
export const getUbOceanOutboundCustomerAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/ocean-outbound/accounting-entries/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound customer account ID ${id}:`, error);
        return null;
    }
};

export const getUbOceanOutboundVendorAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/ocean-outbound/accounting-entries/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Outbound vendor account ID ${id}:`, error);
        return null;
    }
};

// ================================
//   JOB COSTING
// ================================

export const getUbOceanOutboundJobCosting = async (jobNo, hbl, params = {}) => {
    if (!jobNo || !hbl) {
        console.error("Job No and HBL are required for UB Ocean Outbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/ub/ocean-outbound/house/job/${jobNo}/hbl/${hbl}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Outbound job costing:", error);
        throw error;
    }
};

// ================================
//   WRAPPER FUNCTIONS (for backward compatibility with jobNo/hblNo pattern)
//   These convert jobNo/hblNo to ubId by fetching the house first
// ================================

/**
 * Get provisional entries by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} params - Query parameters
 * @returns {Promise} Provisional entries data
 */
export const getOceanOutboundProvisionals = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbOceanOutboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        // Then fetch provisionals using ubId
        return await getUbOceanOutboundProvisionals(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Outbound provisionals for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Delete provisional entry by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @returns {Promise} Deletion result
 */
export const deleteOceanOutboundProvisional = async (jobNo, hblNo) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbOceanOutboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        // Then delete using ubId (note: deleteUbOceanOutboundProvisional takes ubId only, not entry ID)
        // This deletes all provisional entries for the shipment
        return await deleteUbOceanOutboundProvisional(ubId);
    } catch (error) {
        console.error(`Error deleting Ocean Outbound provisional for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Get job costing by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} params - Query parameters
 * @returns {Promise} Job costing data
 */
export const getOceanOutboundJobCosting = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        return await getUbOceanOutboundJobCosting(jobNo, hblNo, params);
    } catch (error) {
        console.error(`Error fetching Ocean Outbound job costing for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Get customer accounts by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} params - Query parameters
 * @returns {Promise} Customer accounts data
 */
export const getOceanOutboundCustomerAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbOceanOutboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        // Then fetch customer accounts using ubId
        return await getUbOceanOutboundCustomerAccounts(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Outbound customer accounts for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Get vendor accounts by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} params - Query parameters
 * @returns {Promise} Vendor accounts data
 */
export const getOceanOutboundVendorAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbOceanOutboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        // Then fetch vendor accounts using ubId
        return await getUbOceanOutboundVendorAccounts(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Outbound vendor accounts for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

