import React from "react";
import OceanOutboundComp from "../../../../components/logisticsservices/bl/oceanoutbound/OceanOutboundComp";
import OceanOutboundClosed from "../../../../components/logisticsservices/bl/oceanoutbound/OceanOutboundClosed";

const OceanOutbound = () => {

    // Fallback-safe wrappers
    const SafeOpen = OceanOutboundComp ?? (() => <p>Loading Open Records...</p>);
    const SafeClosed = OceanOutboundClosed ?? (() => <p>Loading Closed Records...</p>);

    return (
        <div className="w-100">

            {/* Open Jobs Section */}
            <SafeOpen />

            {/* Space Between Sections */}
            <div style={{ height: "30px" }}></div>

            {/* Closed Jobs Section */}
            <SafeClosed />

        </div>
    );
};

export default OceanOutbound;
