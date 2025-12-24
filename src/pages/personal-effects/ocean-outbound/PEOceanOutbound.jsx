import React from "react";
import OceanOutboundClosedComp from "../../../components/personal-effects/ocean-outbound/OceanOutboundClosed";
import OceanOutboundComp from "../../../components/personal-effects/ocean-outbound/OceanOutboundComp";

const PEOceanOutbound = () => {
    const SafeOpen = OceanOutboundComp ?? (() => <p>Loading Open Records...</p>);
    const SafeClosed = OceanOutboundClosedComp ?? (() => <p>Loading Closed Records...</p>);

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

export default PEOceanOutbound;
