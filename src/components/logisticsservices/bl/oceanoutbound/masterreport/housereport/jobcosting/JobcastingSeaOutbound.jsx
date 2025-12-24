import React, { useMemo, useState } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import HouseProfitLossReport from "../../../../../../common/reports/HouseProfitLossReport";
import {
    getOceanOutboundJobCosting,
    getOceanOutboundCustomerAccounts,
    getOceanOutboundVendorAccounts,
} from "../../../oceanOutboundApi";

const safeParseJson = (value) => {
    if (!value) return {};
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error("Failed to parse sessionStorage item for sea outbound job costing", error);
        return {};
    }
};

/**
 * Job Costing component for Ocean Outbound (Sea Export)
 * 
 * Uses the shared HouseProfitLossReport component for consistent layout
 * across all logistics modules (Air/Sea, Inbound/Outbound).
 */
const JobcastingSeaOutbound = () => {
    const [collapsed, setCollapsed] = useState(false);

    const { jobNo, hbl, masterData, houseData } = useMemo(() => {
        if (typeof window === "undefined") {
            return { jobNo: "", hbl: "", masterData: {}, houseData: {} };
        }

        const storedMaster = safeParseJson(sessionStorage.getItem("masterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("houseAirwayData"));

        return {
            jobNo: storedMaster?.jobNo ?? "",
            hbl:
                storedHouse?.hbl ??
                storedHouse?.hblNo ??
                storedHouse?.houseNumber ??
                "",
            masterData: storedMaster ?? {},
            houseData: storedHouse ?? {},
        };
    }, []);

    return (
        <>
            <CommonSectionHeader
                title="Job Costing for Particular House (Sea Outbound)"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <HouseProfitLossReport
                    moduleType="ocean-outbound"
                    title="Sea Outbound"
                    getJobCostingFn={getOceanOutboundJobCosting}
                    getCustomerAccountsFn={getOceanOutboundCustomerAccounts}
                    getVendorAccountsFn={getOceanOutboundVendorAccounts}
                    jobNo={jobNo}
                    houseNo={hbl}
                    masterData={masterData}
                    houseData={houseData}
                />
            )}
        </>
    );
};

export default JobcastingSeaOutbound;
