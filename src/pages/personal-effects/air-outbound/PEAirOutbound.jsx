import React from "react";
import AirOutboundComp from "../../../components/personal-effects/air-outbound/AirOutboundComp";
import AirOutboundClosedComp from "../../../components/personal-effects/air-outbound/AirOutboundClosedComp";

const PEAirOutbound = () => {
    return (
        <div className="w-100">
            <AirOutboundComp />
            <div style={{ height: "30px" }}></div>
            <AirOutboundClosedComp />
        </div>
    );
};

export default PEAirOutbound;
