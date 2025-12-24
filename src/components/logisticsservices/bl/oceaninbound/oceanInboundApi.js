import { logisticsApi } from "../../../../lib/httpClient";

/* ========================================================================
                            OCEAN INBOUND
======================================================================== */

// ================================
//   Job Creation (Ocean Inbound)
// ================================
export const getOceanInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ocean-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound Jobs:", error);
        return null;
    }
};

export const getOceanInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/master/closed`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound Closed Jobs:", error);
        return null;
    }
};


export const getOceanInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ocean-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound Job ID ${id}:`, error);
        return null;
    }
};

export const createOceanInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ocean-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Inbound Job:", error);
        throw error;
    }
};

export const updateOceanInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ocean-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Ocean Inbound Job ID ${id}:`, error);
        throw error;
    }
};

export const deleteOceanInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ocean-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Inbound Job ${jobNo}:`, error);
        return null;
    }
};


// ================================
//   CREATE HOUSE (Ocean Inbound)
// ================================
export const getOceanInboundHouses = async (jobNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/houses/job/${jobNo}`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound Houses for JOB ${jobNo}:`, error);
        return null;
    }
};

export const getOceanInboundHouseById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-inbound/houses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound House ID ${id}:`, error);
        return null;
    }
};

// CREATE Ocean Inbound House (based on Job No)
export const createOceanInboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating Ocean Inbound House for JOB ${jobNo}:`, error);
        throw error;
    }
};


// UPDATE Ocean Inbound House (based on Job No + HBL No)
export const updateOceanInboundHouse = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(
            `Error updating Ocean Inbound House JOB ${jobNo} HBL ${hblNo}:`,
            error
        );
        throw error;
    }
};


// DELETE Ocean Inbound House (based on Job No + HBL No optional)
export const deleteOceanInboundHouse = async (jobNo, hblNo) => {
    try {
        const response = await logisticsApi.delete(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}`
        );
        return response.data;
    } catch (error) {
        console.error(
            `Error deleting Ocean Inbound House JOB ${jobNo} HBL ${hblNo}:`,
            error
        );
        return null;
    }
};


// ================================
//   Provisional Entry (Ocean Inbound)
// ================================
export const getOceanInboundProvisionals = async (jobNo, hbl, params = {}) => {
    try {
        if (!jobNo || !hbl) {
            console.error("Job No and HBL are required");
            return null;
        }

        const url = `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/provisional`;

        const response = await logisticsApi.get(url, { params });

        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound provisional entries:", error);
        return null;
    }
};


export const getOceanInboundProvisionalById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-inbound/houses/provisional/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound provisional ID ${id}:`, error);
        return null;
    }
};

export const createOceanInboundProvisional = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Inbound provisional:", error);
        throw error;
    }
};

export const updateOceanInboundProvisional = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Inbound provisional:", error);
        throw error;
    }
};

// Delete ALL Ocean Inbound Provisionals for a job/hbl (no provisionalId)
export const deleteOceanInboundProvisional = async (jobNo, hblNo) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("jobNo and hblNo are required for deleting Ocean Inbound provisionals");
        }
        const url = `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`;
        const response = await logisticsApi.delete(url);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Inbound provisionals (jobNo: ${jobNo}, hblNo: ${hblNo}):`, error);
        throw error;
    }
};


// ================================
// ACCOUNTING CUSTOMER (Ocean Inbound)
// ================================

// OCEAN INBOUND - LIST CUSTOMER ACCOUNTING ENTRIES
export const getOceanInboundCustomerAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/customer-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound customer accounts:", error);
        throw error;
    }
};


export const getOceanInboundCustomerAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-inbound/houses/accounting/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound customer account ID ${id}:`, error);
        return null;
    }
};

export const createOceanInboundCustomerAccount = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Inbound customer accounting entry:", error);
        throw error;
    }
};


export const updateOceanInboundCustomerAccount = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Inbound customer accounting entry:", error);
        throw error;
    }
};


export const deleteOceanInboundCustomerAccount = async (jobNo, hbl) => {
    try {
        const response = await logisticsApi.delete(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting Ocean Inbound customer accounting entry:", error);
        throw error;
    }
};


// ================================
// ACCOUNTING VENDOR (Ocean Inbound)
// ================================
export const getOceanInboundVendorAccounts = async (jobNo, hbl, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/vendor-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound vendor accounts:", error);
        return null;
    }
};


export const getOceanInboundVendorAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-inbound/houses/accounting/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Inbound vendor account ID ${id}:`, error);
        return null;
    }
};

export const createOceanInboundVendorAccount = async (jobNo, hblNo, payload) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Inbound Vendor Accounting Entry:", error);
        throw error;
    }
};

export const updateOceanInboundVendorAccount = async (jobNo, hblNo, payload) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Inbound Vendor Accounting Entry:", error);
        throw error;
    }
};

// Delete Vendor Accounting Entry (uses composite key: jobNo + hbl)
export const deleteOceanInboundVendorAccount = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("jobNo and hbl are required for deleting Ocean Inbound vendor accounting");
        }
        const response = await logisticsApi.delete(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/accounting/vendor-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Inbound Vendor Account (jobNo: ${jobNo}, hbl: ${hbl}):`, error);
        throw error;
    }
};


// ================================
// ARRIVAL NOTICE (Ocean Inbound)
// ================================
// ===================================
// OCEAN INBOUND - ARRIVAL NOTICE (NO ID)
// ===================================

// GET Arrival Notices
export const getOceanInboundArrivalNotices = async (jobNo, hblNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/arrival-notice`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Inbound arrival notices:", error);
        return null;
    }
};

// CREATE Arrival Notice
export const createOceanInboundArrivalNotice = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Inbound arrival notice:", error);
        throw error;
    }
};

// UPDATE Arrival Notice (NO ID)
export const updateOceanInboundArrivalNotice = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Inbound arrival notice:", error);
        throw error;
    }
};

// DELETE Arrival Notice (NO ID)
export const deleteOceanInboundArrivalNotice = async (jobNo, hblNo) => {
    try {
        const response = await logisticsApi.delete(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/arrival-notice`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting Ocean Inbound arrival notice:", error);
        return null;
    }
};
// GET Job Costing - Ocean Inbound
export const getOceanInboundJobCosting = async (jobNo, hbl, params = {}) => {
    if (!jobNo || !hbl) {
        console.error("Job No and HBL are required for Ocean Inbound job costing");
        return null;
    }

    try {
        const response = await logisticsApi.get(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hbl}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching ocean inbound job costing:", error);
        return null;
    }
};


// ---- OCEAN INBOUND STATUS UPDATE ----
export const updateOceanInboundHouseStatus = async (jobNo, hblNo, payload) => {
    try {
        if (!jobNo || !hblNo) {
            console.error("Job No and HBL No are required for updating ocean inbound house status");
            throw new Error("Job No and HBL No are required");
        }
        const response = await logisticsApi.post(
            `/ocean-inbound/houses/job/${jobNo}/hbl/${hblNo}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating Ocean Inbound House Status JOB ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

// Alias for backward compatibility
export const updateOceanInboundStatus = updateOceanInboundHouseStatus;

