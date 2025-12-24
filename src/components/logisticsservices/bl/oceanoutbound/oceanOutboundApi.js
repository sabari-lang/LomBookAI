import { logisticsApi } from "../../../../lib/httpClient";

/* ========================================================================
                            OCEAN OUTBOUND
======================================================================== */

// ================================
//   Job Creation (Ocean Outbound)
// ================================
export const getOceanOutboundJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(`/ocean-outbound/master`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Outbound Jobs:", error);
        return null;
    }
};




export const getOceanOutboundJobById = async (id) => {
    try {
        const response = await logisticsApi.get(`/ocean-outbound/master/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound Job ID ${id}:`, error);
        return null;
    }
};

export const createOceanOutboundJob = async (data) => {
    try {
        const response = await logisticsApi.post(`/ocean-outbound/master`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Outbound Job:", error);
        throw error;
    }
};

export const updateOceanOutboundJob = async (id, data) => {
    try {
        const response = await logisticsApi.put(`/ocean-outbound/master/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating Ocean Outbound Job ID ${id}:`, error);
        throw error;
    }
};

export const deleteOceanOutboundJob = async (jobNo) => {
    try {
        const response = await logisticsApi.delete(`/ocean-outbound/master/${jobNo}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Outbound Job ${jobNo}:`, error);
        return null;
    }
};


// ================================
//   CREATE HOUSE (Ocean Outbound)
// ================================
export const getOceanOutboundHouses = async (jobNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-outbound/houses/job/${jobNo}`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound Houses for JOB ${jobNo}:`, error);
        return null;
    }
};


export const getOceanOutboundHouseById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-outbound/houses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound house ID ${id}:`, error);
        return null;
    }
};

// CREATE Ocean Outbound House (based on Job No)
export const createOceanOutboundHouse = async (jobNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-outbound/houses/job/${jobNo}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(`Error creating Ocean Outbound House for JOB ${jobNo}:`, error);
        throw error;
    }
};


// UPDATE Ocean Outbound House (based on Job No + HBL No)
export const updateOceanOutboundHouse = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}`,
            data
        );
        return response.data;
    } catch (error) {
        console.error(
            `Error updating Ocean Outbound House JOB ${jobNo} HBL ${hblNo}:`,
            error
        );
        throw error;
    }
};


// DELETE Ocean Outbound House (based on Job No + HBL No)
export const deleteOceanOutboundHouse = async (jobNo, hblNo) => {
    try {
        const response = await logisticsApi.delete(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}`
        );
        return response.data;
    } catch (error) {
        console.error(
            `Error deleting Ocean Outbound House JOB ${jobNo} HBL ${hblNo}:`,
            error
        );
        return null;
    }
};


// ================================
//   Provisional Entry (Ocean Outbound)
// ================================
export const getOceanOutboundProvisionals = async (jobNo, hbl, params = {}) => {
    try {
        if (!jobNo || !hbl) {
            console.error("Job No and HBL are required");
            return null;
        }

        const url = `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/provisional`;

        const response = await logisticsApi.get(url, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Outbound provisional entries:", error);
        return null;
    }
};

export const getOceanOutboundProvisionalById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-outbound/houses/provisional/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound provisional ID ${id}:`, error);
        return null;
    }
};

export const createOceanOutboundProvisional = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Outbound provisional:", error);
        throw error;
    }
};

export const updateOceanOutboundProvisional = async (jobNo, hblNo, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Outbound provisional:", error);
        throw error;
    }
};


// Delete Provisional Entry (uses composite key: jobNo + hbl)
export const deleteOceanOutboundProvisional = async (jobNo, hblNo) => {
    try {
        if (!jobNo || !hblNo) {
            throw new Error("jobNo and hblNo are required for deleting Ocean Outbound provisionals");
        }
        const url = `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/provisional`;
        const response = await logisticsApi.delete(url);
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Outbound provisional (jobNo: ${jobNo}, hblNo: ${hblNo}):`, error);
        throw error;
    }
};


// ================================
// ACCOUNTING CUSTOMER (Ocean Outbound)
// ================================
export const getOceanOutboundCustomerAccounts = async (jobNo, hblNo, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/customer-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Outbound customer accounts:", error);
        throw error;
    }
};


export const getOceanOutboundCustomerAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-outbound/houses/accounting/customer/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound customer account ID ${id}:`, error);
        return null;
    }
};

export const createOceanOutboundCustomerAccount = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Outbound customer accounting:", error);
        throw error;
    }
};

export const updateOceanOutboundCustomerAccount = async (jobNo, hbl, data) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Outbound customer accounting:", error);
        throw error;
    }
};


export const deleteOceanOutboundCustomerAccount = async (jobNo, hbl) => {
    try {
        const response = await logisticsApi.delete(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/customer-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting Ocean Outbound customer accounting:", error);
        throw error;
    }
};



// ================================
// ACCOUNTING VENDOR (Ocean Outbound)
// ================================
export const getOceanOutboundVendorAccounts = async (jobNo, hbl, params = {}) => {
    try {
        const response = await logisticsApi.get(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/vendor-accounting-entry`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Outbound vendor accounts:", error);
        return null;
    }
};

export const getOceanOutboundClosedJobs = async (params = {}) => {
    try {
        const response = await logisticsApi.get(
            "/ocean-outbound/master/closed",
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Ocean Outbound Closed Jobs:", error);
        return null;
    }
};


export const getOceanOutboundVendorAccountById = async (id) => {
    try {
        // TODO: Verify backend route - may need jobNo and hbl instead of just id
        const response = await logisticsApi.get(`/ocean-outbound/houses/accounting/vendor/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Ocean Outbound vendor account ID ${id}:`, error);
        return null;
    }
};
export const createOceanOutboundVendorAccount = async (jobNo, hblNo, payload) => {
    try {
        const response = await logisticsApi.post(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error creating Ocean Outbound Vendor Accounting:", error);
        throw error;
    }
};

export const updateOceanOutboundVendorAccount = async (jobNo, hblNo, payload) => {
    try {
        const response = await logisticsApi.put(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/accounting/vendor-accounting-entry`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error updating Ocean Outbound Vendor Accounting:", error);
        throw error;
    }
};

// Delete Vendor Accounting Entry (uses composite key: jobNo + hbl)
export const deleteOceanOutboundVendorAccount = async (jobNo, hbl) => {
    try {
        if (!jobNo || !hbl) {
            throw new Error("jobNo and hbl are required for deleting Ocean Outbound vendor accounting");
        }
        const response = await logisticsApi.delete(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/accounting/vendor-accounting-entry`
        );
        return response.data;
    } catch (error) {
        console.error(`Error deleting Ocean Outbound Vendor Account (jobNo: ${jobNo}, hbl: ${hbl}):`, error);
        throw error;
    }
};


// ================================
// ARRIVAL NOTICE (Ocean Outbound)
// ================================
// ⚠️ DISABLED: Arrival Notice is NOT supported for Ocean Outbound
// Backend does not have endpoints for outbound arrival notice
// These functions are kept for reference but should NOT be used

// export const getOceanOutboundArrivalNotices = async (params = {}) => {
//     try {
//         const response = await logisticsApi.get("/ocean-outbound/arrival-notice", { params });
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching Ocean Outbound arrival notices:", error);
//         return null;
//     }
// };

// export const getOceanOutboundArrivalNoticeById = async (id) => {
//     try {
//         const response = await logisticsApi.get(`/ocean-outbound/arrival-notice/${id}`);
//         return response.data;
//     } catch (error) {
//         console.error(`Error fetching Ocean Outbound arrival notice ID ${id}:`, error);
//         return null;
//     }
// };

// export const createOceanOutboundArrivalNotice = async (data) => {
//     try {
//         const response = await logisticsApi.post("/ocean-outbound/arrival-notice", data);
//         return response.data;
//     } catch (error) {
//         console.error("Error creating Ocean Outbound arrival notice:", error);
//         throw error;
//     }
// };

// export const updateOceanOutboundArrivalNotice = async (id, data) => {
//     try {
//         const response = await logisticsApi.put(`/ocean-outbound/arrival-notice/${id}`, data);
//         return response.data;
//     } catch (error) {
//         console.error(`Error updating Ocean Outbound arrival notice ID ${id}:`, error);
//         throw error;
//     }
// };

// export const deleteOceanOutboundArrivalNotice = async (id) => {
//     try {
//         const response = await logisticsApi.delete(`/ocean-outbound/arrival-notice/${id}`);
//         return response.data;
//     } catch (error) {
//         console.error(`Error deleting Ocean Outbound arrival notice ID ${id}:`, error);
//         return null;
//     }
// };
// GET Job Costing - Ocean Outbound
export const getOceanOutboundJobCosting = async (jobNo, hbl, params = {}) => {
    if (!jobNo || !hbl) {
        console.error("Job No and HBL are required for Ocean Outbound job costing");
        return null;
    }

    try {
        const response = await logisticsApi.get(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hbl}/job-costing`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching ocean outbound job costing:", error);
        return null;
    }
};



// ---- OCEAN OUTBOUND STATUS UPDATE ----
export const updateOceanOutboundHouseStatus = async (jobNo, hblNo, payload) => {
    try {
        if (!jobNo || !hblNo) {
            console.error("Job No and HBL No are required for updating ocean outbound house status");
            throw new Error("Job No and HBL No are required");
        }
        const response = await logisticsApi.post(
            `/ocean-outbound/houses/job/${jobNo}/hbl/${hblNo}/status-update`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating Ocean Outbound House Status JOB ${jobNo} HBL ${hblNo}:`, error);
        throw error;
    }
};

// Alias for backward compatibility
export const updateOceanOutboundStatus = updateOceanOutboundHouseStatus;

