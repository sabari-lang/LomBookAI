import React, { useState } from "react";
import AirInboundComp from "../../../components/personal-effects/air-inbound/AirInboundComp";
import AirInboundClosedComp from "../../../components/personal-effects/air-inbound/AirInboundClosedComp";

const PEAirInbound = () => {
    const SafeOpen = AirInboundComp ?? (() => <p>Loading Open Records...</p>);
    const SafeClosed = AirInboundClosedComp ?? (() => <p>Loading Closed Records...</p>);

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

export default PEAirInbound;
