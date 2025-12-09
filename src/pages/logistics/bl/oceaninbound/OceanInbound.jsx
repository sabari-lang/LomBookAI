import React from "react";
import OceanInboundClosedComp from "../../../../components/logisticsservices/bl/oceaninbound/OceanInboundClosed";
import OceanInboundComp from "../../../../components/logisticsservices/bl/oceaninbound/OceanInboundComp";

const OceanInbound = () => {
    
    // Fallback safe component wrappers
    const SafeOpen = OceanInboundComp ?? (() => <p>Loading Open Records...</p>);
    const SafeClosed = OceanInboundClosedComp ?? (() => <p>Loading Closed Records...</p>);

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

export default OceanInbound;
