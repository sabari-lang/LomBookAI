import { logisticsApi } from "../../../lib/httpClient";

// ================================
//   Personal Effects (UB) Ocean Inbound API
//   Transformed from Commercial: /ocean-inbound/ -> /ub/ocean-inbound/
//   Houses: /houses/ -> /house/ (singular)
//   Ocean uses hbl instead of hawb
//   Accounting: Uses shipments/{ubId} instead of job/hbl
// ================================

// ================================
//   Job Creation (UB Ocean Inbound)
// ================================

export const getUbOceanInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Inbound Jobs:", error);
        throw error;
    }
};

export const getUbOceanInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Inbound Closed Jobs:", error);
        throw error;
    }
};

export const getUbOceanInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const createUbOceanInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ub/ocean-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB Ocean Inbound Job:", error);
        throw error;
    }
};

export const updateUbOceanInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ub/ocean-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Ocean Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const deleteUbOceanInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ub/ocean-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB Ocean Inbound Job ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbOceanInboundJobNo = async (jobNo) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/master/validate/job-no/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Ocean Inbound Job No ${jobNo}:`, error);
        throw error;
    }
};

export const validateUbOceanInboundMasterNo = async (mblNo) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/master/validate/master-no/${mblNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error validating UB Ocean Inbound Master No ${mblNo}:`, error);
        throw error;
    }
};

// ================================
//   CREATE HOUSE FOR UB OCEAN INBOUND
//   Note: UB uses /house/ (singular) not /houses/
//   ⚠️ TODO: Verify with backend - requirement states UB ocean should use hawb (not hbl)
//   Current implementation uses hbl - needs backend controller verification
// ================================

export const getUbOceanInboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/ocean-inbound/house/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching UB ocean inbound houses:", error);
        throw error;
    }
};

export const getUbOceanInboundHouseByHbl = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            console.error("Job No and HBL are required");
            return null;
        }
        const response = await logisticsApi.get(`/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB ocean inbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const createUbOceanInboundHouse = async (jobNo, data) => {
    try {
        if (!jobNo) {
            throw new Error("Job No is required");
        }
        const response = await logisticsApi.post(`/ub/ocean-inbound/house/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating UB ocean inbound house:", error);
        throw error;
    }
};

export const updateUbOceanInboundHouse = async (jobNo, hbl, data) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.put(`/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating UB ocean inbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const deleteUbOceanInboundHouse = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.delete(`/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting UB ocean inbound house JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const updateUbOceanInboundHouseStatus = async (jobNo, hbl, payload) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("Job No and HBL are required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating UB Ocean Inbound House Status JOB ${jobNo} HBL ${hbl}:`, error);
        throw error;
    }
};

export const validateUbOceanInboundHouse = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ub/ocean-inbound/house/validate`, { params });
        return response.data;
    } catch (error) {
        console.error("Error validating UB ocean inbound house:", error);
        throw error;
    }
};

// ================================
//   PROVISIONAL ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId} instead of job/hbl
// ================================

export const getUbOceanInboundProvisionals = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-inbound/shipments/${ubId}/provisional-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound provisional entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanInboundProvisional = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-inbound/shipments/${ubId}/provisional-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Inbound provisional entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB provisional entries.
 */
export const updateUbOceanInboundProvisional = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB provisional entries.
 */
export const deleteUbOceanInboundProvisional = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB provisional entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR CUSTOMERS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbOceanInboundCustomerAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-inbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound customer accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanInboundCustomerAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-inbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Inbound customer accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB customer accounting entries.
 */
export const updateUbOceanInboundCustomerAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB customer accounting entries.
 */
export const deleteUbOceanInboundCustomerAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB customer accounting entries. Only GET and POST are supported.");
};

// ================================
//   ACCOUNTING ENTRY FOR VENDORS
//   Note: UB accounting uses shipments/{ubId}
// ================================

export const getUbOceanInboundVendorAccounts = async (ubId, params = {}) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.get(
            `/ub/ocean-inbound/shipments/${ubId}/accounting-entries`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound vendor accounting entries for ubId ${ubId}:`, error);
        throw error;
    }
};

export const createUbOceanInboundVendorAccount = async (ubId, data) => {
    try {
        if (!ubId) {
            throw new Error("ubId is required");
        }
        const response = await logisticsApi.post(
            `/ub/ocean-inbound/shipments/${ubId}/accounting-entries`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating UB Ocean Inbound vendor accounting entry for ubId ${ubId}:`, error);
        throw error;
    }
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Update operations are not available for UB vendor accounting entries.
 */
export const updateUbOceanInboundVendorAccount = async (ubId, data) => {
    throw new Error("Update operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

/**
 * ⚠️ NOT SUPPORTED BY BACKEND
 * UB accounting endpoints only support GET and POST operations.
 * Delete operations are not available for UB vendor accounting entries.
 */
export const deleteUbOceanInboundVendorAccount = async (ubId) => {
    throw new Error("Delete operation is not supported by backend for UB vendor accounting entries. Only GET and POST are supported.");
};

// Get vendor account by ID (for view/details pages)
export const getUbOceanInboundVendorAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/ocean-inbound/accounting-entries/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound vendor account ID ${id}:`, error);
        return null;
    }
};

// Get customer account by ID (for view/details pages)
export const getUbOceanInboundCustomerAccountById = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // Try direct lookup endpoint (similar to Commercial pattern)
        const response = await logisticsApi.get(`/ub/ocean-inbound/accounting-entries/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching UB Ocean Inbound customer account ID ${id}:`, error);
        return null;
    }
};

// ================================
//   ARRIVAL NOTICE
// ================================

export const getUbOceanInboundArrivalNotices = async (jobNo, hbl, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/arrival-notice`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Inbound arrival notices:", error);
        throw error;
    }
};

export const createUbOceanInboundArrivalNotice = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.post(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating UB Ocean Inbound arrival notice:", error);
        throw error;
    }
};

export const updateUbOceanInboundArrivalNotice = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.put(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating UB Ocean Inbound arrival notice:", error);
        throw error;
    }
};

export const deleteUbOceanInboundArrivalNotice = async (jobNo, hbl) => {
    try {
        const response = await logisticsApi.delete(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/arrival-notice`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting UB Ocean Inbound arrival notice:", error);
        throw error;
    }
};

// ================================
//   JOB COSTING
// ================================

export const getUbOceanInboundJobCosting = async (jobNo, hbl, params = {}) => {
    if (!jobNo || !hbl) {
        console.error("Job No and HBL are required for UB Ocean Inbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/ub/ocean-inbound/house/job/${jobNo}/hbl/${hbl}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching UB Ocean Inbound job costing:", error);
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
export const getOceanInboundProvisionals = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        // First, get the house to obtain ubId
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        // Then fetch provisionals using ubId
        return await getUbOceanInboundProvisionals(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Inbound provisionals for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Create provisional entry by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Provisional entry data
 * @returns {Promise} Created provisional entry
 */
export const createOceanInboundProvisional = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await createUbOceanInboundProvisional(ubId, data);
    } catch (error) {
        console.error(`Error creating Ocean Inbound provisional for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Update provisional entry by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Provisional entry data
 * @returns {Promise} Updated provisional entry
 */
export const updateOceanInboundProvisional = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await updateUbOceanInboundProvisional(ubId, data);
    } catch (error) {
        console.error(`Error updating Ocean Inbound provisional for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Delete provisional entry by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @returns {Promise} Deletion result
 */
export const deleteOceanInboundProvisional = async (jobNo, hblNo) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await deleteUbOceanInboundProvisional(ubId);
    } catch (error) {
        console.error(`Error deleting Ocean Inbound provisional for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Get job costing by jobNo and hblNo
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} params - Query parameters
 * @returns {Promise} Job costing data
 */
export const getOceanInboundJobCosting = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        return await getUbOceanInboundJobCosting(jobNo, hblNo, params);
    } catch (error) {
        console.error(`Error fetching Ocean Inbound job costing for Job ${jobNo} HBL ${hblNo}:`, error);
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
export const getOceanInboundCustomerAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await getUbOceanInboundCustomerAccounts(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Inbound customer accounts for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Create customer account by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Customer account data
 * @returns {Promise} Created customer account
 */
export const createOceanInboundCustomerAccount = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await createUbOceanInboundCustomerAccount(ubId, data);
    } catch (error) {
        console.error(`Error creating Ocean Inbound customer account for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Update customer account by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Customer account data
 * @returns {Promise} Updated customer account
 */
export const updateOceanInboundCustomerAccount = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await updateUbOceanInboundCustomerAccount(ubId, data);
    } catch (error) {
        console.error(`Error updating Ocean Inbound customer account for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Delete customer account by ID
 * @param {string} id - Accounting entry ID
 * @returns {Promise} Deletion result
 */
export const deleteOceanInboundCustomerAccount = async (id) => {
    try {
        if (!id) {
            throw new Error("Entry ID is required");
        }
        // For UB, we need to find the ubId from the entry first
        // Since we only have the entry ID, we'll use the direct delete endpoint if available
        // Otherwise, this might need to be refactored
        const response = await logisticsApi.delete(`/ub/ocean-inbound/accounting-entries/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Inbound customer account ${id}:`, error);
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
export const getOceanInboundVendorAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await getUbOceanInboundVendorAccounts(ubId, params);
    } catch (error) {
        console.error(`Error fetching Ocean Inbound vendor accounts for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Create vendor account by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Vendor account data
 * @returns {Promise} Created vendor account
 */
export const createOceanInboundVendorAccount = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await createUbOceanInboundVendorAccount(ubId, data);
    } catch (error) {
        console.error(`Error creating Ocean Inbound vendor account for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Update vendor account by jobNo and hblNo (wrapper that fetches ubId first)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @param {object} data - Vendor account data
 * @returns {Promise} Updated vendor account
 */
export const updateOceanInboundVendorAccount = async (jobNo, hblNo, data) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await updateUbOceanInboundVendorAccount(ubId, data);
    } catch (error) {
        console.error(`Error updating Ocean Inbound vendor account for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

/**
 * Delete vendor account by jobNo and hblNo (wrapper)
 * @param {string} jobNo - Job number
 * @param {string} hblNo - House bill of lading number
 * @returns {Promise} Deletion result
 */
export const deleteOceanInboundVendorAccount = async (jobNo, hblNo) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("Job No and HBL No are required");
        }
        const house = await getUbOceanInboundHouseByHbl(jobNo, hblNo);
        if (!house || !house.id) {
            throw new Error(`House not found for Job ${jobNo} HBL ${hblNo}`);
        }
        const ubId = house.id;
        return await deleteUbOceanInboundVendorAccount(ubId);
    } catch (error) {
        console.error(`Error deleting Ocean Inbound vendor account for Job ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

// ================================
//   ALIASES FOR COMPATIBILITY
//   Non-Ub function names for backward compatibility
// ================================

// Arrival Notice aliases
export const getOceanInboundArrivalNotices = getUbOceanInboundArrivalNotices;
export const createOceanInboundArrivalNotice = createUbOceanInboundArrivalNotice;
export const updateOceanInboundArrivalNotice = updateUbOceanInboundArrivalNotice;
export const deleteOceanInboundArrivalNotice = deleteUbOceanInboundArrivalNotice;

// House aliases
export const createOceanInboundHouse = createUbOceanInboundHouse;
export const updateOceanInboundHouse = updateUbOceanInboundHouse;

// Accounting Entry by ID aliases
export const getOceanInboundVendorAccountById = getUbOceanInboundVendorAccountById;
export const getOceanInboundCustomerAccountById = getUbOceanInboundCustomerAccountById;

