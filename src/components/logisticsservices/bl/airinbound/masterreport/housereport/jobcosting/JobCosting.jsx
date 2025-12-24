import React, { useMemo, useState } from "react";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import HouseProfitLossReport from "../../../../../../common/reports/HouseProfitLossReport";
import {
    getAirInboundJobCosting,
    getAirInboundCustomerAccounts,
    getAirInboundVendorAccounts,
} from "../../../Api";

const safeParseJson = (value) => {
    if (!value) return {};
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error("Failed to parse sessionStorage item for job costing", error);
        return {};
    }
};

const JobCosting = () => {
    const [collapsed, setCollapsed] = useState(false);

    const { jobNo, hawb, masterData, houseData } = useMemo(() => {
        if (typeof window === "undefined") {
            return { jobNo: "", hawb: "", masterData: {}, houseData: {} };
        }

        const storedMaster = safeParseJson(sessionStorage.getItem("masterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("houseAirwayData"));

        return {
            jobNo: storedMaster?.jobNo ?? "",
            hawb:
                storedHouse?.hawb ??
                storedHouse?.hawbNo ??
                storedHouse?.houseNumber ??
                "",
            masterData: storedMaster ?? {},
            houseData: storedHouse ?? {},
        };
    }, []);

    return (
        <>
            <CommonSectionHeader
                title="Job Costing for Particular House (Air Inbound)"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <HouseProfitLossReport
                    moduleType="air-inbound"
                    title="Air Inbound"
                    getJobCostingFn={getAirInboundJobCosting}
                    getCustomerAccountsFn={getAirInboundCustomerAccounts}
                    getVendorAccountsFn={getAirInboundVendorAccounts}
                    jobNo={jobNo}
                    houseNo={hawb}
                    masterData={masterData}
                    houseData={houseData}
                />
            )}
        </>
    );
};

export default JobCosting;
