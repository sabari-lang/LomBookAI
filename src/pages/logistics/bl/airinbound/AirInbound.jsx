import React, { useState } from "react";
import AirInboundComp from "../../../../components/logisticsservices/bl/airinbound/AirInboundComp";
import AirInboundClosedComp from "../../../../components/logisticsservices/bl/airinbound/AirInboundClosedComp";


const AirInbound = () => {
  
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

export default AirInbound;
