import { logisticsApi } from "../../lib/httpClient";

// ================================
//   Personal Effects Air Inbound API Service
//   All endpoints use /personal-effects/air-inbound/ prefix
// ================================

// ================================
//   Job Creation (PE Air Inbound)
// ================================

export const getPEAirInboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Inbound Jobs:", error);
        return null;
    }
};

export const getPEAirInboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/master/closed`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE Air Inbound Closed Jobs:", error);
        return null;
    }
};

export const getPEAirInboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE Air Inbound Job with ID ${id}:`, error);
        return null;
    }
};

export const createPEAirInboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/personal-effects/air-inbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating PE Air Inbound Job:", error);
        throw error;
    }
};

export const updatePEAirInboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/personal-effects/air-inbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating PE Air Inbound Job with ID ${id}:`, error);
        throw error;
    }
};

export const deletePEAirInboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/personal-effects/air-inbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Air Inbound Job ${jobNo}:`, error);
        return null;
    }
};

// ================================
//   PE Air Inbound Houses
// ================================

export const getPEAirInboundHouses = async (jobNo, params = {}) => {
    try {
        if (!jobNo) {
            console.error("Job No is required");
            return null;
        }
        const response = await logisticsApi.get(`/personal-effects/air-inbound/houses/job/${jobNo}`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE air inbound houses:", error);
        return null;
    }
};

export const getPEAirInboundHouseById = async (id) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/houses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE air inbound house with ID ${id}:`, error);
        return null;
    }
};

export const createPEAirInboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(`/personal-effects/air-inbound/houses/job/${jobNo}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating PE air inbound house:", error);
        throw error;
    }
};

export const updatePEAirInboundHouse = async (jobNo, id, data) => {
    try {
        const response = await logisticsApi.put(`/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating PE air inbound house ${id}:`, error);
        throw error;
    }
};

export const deletePEAirInboundHouse = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for deleting PE air inbound house");
            return null;
        }
        const response = await logisticsApi.delete(`/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE air inbound house JOB ${jobNo} HAWB ${hawb}:`, error);
        return null;
    }
};

// ================================
//   PE Air Inbound Provisional Entries
// ================================

export const getPEAirInboundProvisionals = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required");
            return null;
        }
        const url = `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.get(url, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching PE provisional entries:", error);
        return null;
    }
};

export const getPEAirInboundProvisionalById = async (id) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/houses/provisional/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE provisional entry ID ${id}:`, error);
        return null;
    }
};

export const createPEAirInboundProvisional = async (jobNo, hawb, data) => {
    const url = `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
    return logisticsApi.post(url, data).then(res => res.data);
};

export const updatePEAirInboundProvisional = async (jobNo, hawb, data) => {
    const url = `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
    return logisticsApi.put(url, data).then(res => res.data);
};

export const deletePEAirInboundProvisional = async (jobNo, hawb) => {
    try {
        if (!jobNo || !hawb) {
            throw new Error("jobNo and hawb are required for deleting PE Air Inbound provisionals");
        }
        const url = `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/provisional`;
        const response = await logisticsApi.delete(url);
        return response.data;
    } catch (error) {
        console.error(`Error deleting PE Air Inbound provisional (jobNo: ${jobNo}, hawb: ${hawb}):`, error);
        throw error;
    }
};

// ================================
//   PE Air Inbound Customer Accounts
// ================================

export const getPEAirInboundCustomerAccounts = async (jobNo, hawb, params = {}) => {
    try {
        if (!jobNo || !hawb) return null;
        const response = await logisticsApi.get(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching PE customer accounting entries:", error);
        return null;
    }
};

export const getPEAirInboundCustomerAccountById = async (id) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/houses/accounting/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE customer accounting ID ${id}:`, error);
        return null;
    }
};

export const createPEAirInboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating PE customer accounting entry:", error);
        throw error;
    }
};

export const updatePEAirInboundCustomerAccount = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating PE customer accounting entry:", error);
        throw error;
    }
};

export const deletePEAirInboundCustomerAccount = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/customer-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting PE customer accounting entry:", error);
        throw error;
    }
};

// ================================
//   PE Air Inbound Vendor Accounts
// ================================

export const getPEAirInboundVendorAccounts = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching PE vendor accounting entries:", error);
        return null;
    }
};

export const getPEAirInboundVendorAccountById = async (id) => {
    try {
        const response = await logisticsApi.get(`/personal-effects/air-inbound/houses/accounting/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching PE vendor accounting ID ${id}:`, error);
        return null;
    }
};

export const createPEAirInboundVendorAccount = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating PE vendor accounting entry:", error);
        throw error;
    }
};

export const updatePEAirInboundVendorAccount = async (jobNo, hawbNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawbNo}/accounting/vendor-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating PE vendor accounting entry:", error);
        throw error;
    }
};

export const deletePEAirInboundVendorAccount = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/vendor-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting PE vendor accounting entry:", error);
        throw error;
    }
};

// ================================
//   PE Air Inbound Arrival Notices
// ================================

export const getPEAirInboundArrivalNotices = async (jobNo, hawb, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching PE arrival notices:", error);
        return null;
    }
};

export const createPEAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.post(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating PE arrival notice:", error);
        throw error;
    }
};

export const updatePEAirInboundArrivalNotice = async (jobNo, hawb, data) => {
    try {
        const response = await logisticsApi.put(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating PE arrival notice:", error);
        throw error;
    }
};

export const deletePEAirInboundArrivalNotice = async (jobNo, hawb) => {
    try {
        const response = await logisticsApi.delete(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/arrival-notice`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting PE arrival notice:", error);
        return null;
    }
};

// ================================
//   PE Air Inbound Job Costing
// ================================

export const getPEAirInboundJobCosting = async (jobNo, hawb, params = {}) => {
    if (!jobNo || !hawb) {
        console.error("Job No and HAWB are required for PE Air Inbound job costing");
        return null;
    }
    try {
        const response = await logisticsApi.get(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching PE job costing:", error);
        return null;
    }
};

// ================================
//   PE Air Inbound Status Update
// ================================

export const updatePEAirInboundHouseStatus = async (jobNo, hawb, payload) => {
    try {
        if (!jobNo || !hawb) {
            console.error("Job No and HAWB are required for updating PE air inbound house status");
            throw new Error("Job No and HAWB are required");
        }
        const response = await logisticsApi.post(
            `/personal-effects/air-inbound/houses/job/${jobNo}/hawb/${hawb}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating PE Air Inbound House Status JOB ${jobNo} HAWB ${hawb}:`, error);
        throw error;
    }
};

export const updatePEAirInboundStatus = updatePEAirInboundHouseStatus;
