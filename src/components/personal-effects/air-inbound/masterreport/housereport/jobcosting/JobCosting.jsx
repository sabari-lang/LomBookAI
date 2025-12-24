import React, { useMemo, useState } from "react";
import CommonSectionHeader from "../../../../../logisticsservices/bl/navbar/CommonSectionHeader";
import HouseProfitLossReport from "../../../../../common/reports/HouseProfitLossReport";
import {
    getUbAirInboundJobCosting,
    getUbAirInboundCustomerAccounts,
    getUbAirInboundVendorAccounts,
} from "../../../../../../services/personal-effects/airInbound/peAirInboundApi";

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

        const storedMaster = safeParseJson(sessionStorage.getItem("peUbMasterAirwayData"));
        const storedHouse = safeParseJson(sessionStorage.getItem("peUbHouseAirwayData"));

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
                title="Job Costing for Particular House (UB Air Inbound)"
                type="jobcosting"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            {!collapsed && (
                <HouseProfitLossReport
                    moduleType="air-inbound"
                    title="UB Air Inbound"
                    getJobCostingFn={getUbAirInboundJobCosting}
                    getCustomerAccountsFn={getUbAirInboundCustomerAccounts}
                    getVendorAccountsFn={getUbAirInboundVendorAccounts}
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
