import { logisticsApi } from "../../../../lib/httpClient";


const storedRaw = sessionStorage.getItem("masterAirwayData");
const storedData = storedRaw ? JSON.parse(storedRaw) : null;

// ================================
//   Job Creation (Air Inbound)
// ================================

// Get all Air Inbound Jobs (GET)
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

// Get single Air Inbound Job by ID (GET)
export const getAirInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/air-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Air Inbound Job with ID ${id}:`, error);
        return null;
    }
};

// Create new Air Inbound Job (POST)
export const createAirInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/air-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Air Inbound Job:", error);
        throw error;
    }
};

// Update Air Inbound Job (PUT)
export const updateAirInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/air-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

// Delete Air Inbound Job (DELETE)
export const deleteAirInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/air-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Air Inbound Job ${jobNo}:`, error);
        return null;
    }
};


// CREATE HOUSE FOR AIRINBOUND

// Get all Houses by Job No (with pagination params)
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


// Get House by ID
export const getAirInboundHouseById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hawb instead of just id
        const response = await logisticsApi.get(`/air-inbound/houses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching air inbound house with ID ${id}:`, error);
        return null;
    }
};

// Create House
export const createAirInboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(`/air-inbound/houses/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating air inbound house:", error);
        throw error;
    }
};


// Update House
export const updateAirInboundHouse = async (jobNo, id, data) => {
    try {
        const response = await logisticsApi.put(`/air-inbound/houses/job/${jobNo}/hawb/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating air inbound house ${id}:`, error);
        throw error;
    }
};


// Delete House
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

// PROVISIONAL ENTRY FOR CUSTOMERS 


// Get All Provisional Entries for Job + HAWB (with pagination)
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


// Get Provisional by ID
export const getAirInboundProvisionalById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hawb instead of just id
        const response = await logisticsApi.get(`/air-inbound/houses/provisional/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching provisional entry ID ${id}:`, error);
        return null;
    }
};

export const createAirInboundProvisional = async (jobNo, hawb, data) => {
    const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
    return logisticsApi.post(url, data).then(res => res.data);
};

export const updateAirInboundProvisional = async (jobNo, hawb, data) => {
    const url = `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
    return logisticsApi.put(url, data).then(res => res.data);
};


// Delete Provisional Entry (uses composite key: jobNo + hawb)
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


// ACCOUNTING ENTRY FOR CUSTOMERS
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


// Get Entry by ID
export const getAirInboundCustomerAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hawb instead of just id
        const response = await logisticsApi.get(`/air-inbound/houses/accounting/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching customer accounting ID ${id}:`, error);
        return null;
    }
};

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


// Delete Entry

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


// ACCOUNTING ENTRY FOR VENDORS

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


// Get by ID
export const getAirInboundVendorAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hawb instead of just id
        const response = await logisticsApi.get(`/air-inbound/houses/accounting/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching vendor accounting ID ${id}:`, error);
        return null;
    }
};

// Create Vendor Accounting Entry
export const createAirInboundVendorAccount = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating vendor accounting entry:", error);
        throw error;
    }
};


// Update Vendor Accounting Entry
export const updateAirInboundVendorAccount = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/air-inbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating vendor accounting entry:", error);
        throw error;
    }
};

// Delete Vendor Accounting Entry

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


// ARRIVAL NOTICE 

// GET all Arrival Notices for a specific Job + HAWB
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

// CREATE Arrival Notice (NO ID)
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

// UPDATE Arrival Notice (NO ID)
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

// DELETE Arrival Notice (NO ID)
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


// Job Closing (Air Inbound)
// GET Job Costing for a specific Job + HAWB
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


// ---- AIR INBOUND STATUS UPDATE ----
export const updateAirInboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for updating air inbound house status");
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

// Alias for backward compatibility
export const updateAirInboundStatus = updateAirInboundHouseStatus;
