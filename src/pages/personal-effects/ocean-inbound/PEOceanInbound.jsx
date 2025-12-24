import React from "react";
import OceanInboundClosedComp from "../../../components/personal-effects/ocean-inbound/OceanInboundClosed";
import OceanInboundComp from "../../../components/personal-effects/ocean-inbound/OceanInboundComp";

const PEOceanInbound = () => {
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

export default PEOceanInbound;
