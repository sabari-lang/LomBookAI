import React from "react";
import AirOutboundComp from "../../../../components/logisticsservices/bl/airoutbound/AirOutboundComp";
import AirOutboundClosedComp from "../../../../components/logisticsservices/bl/airoutbound/AirOutboundClosedComp";


const AirOutbound = () => {
    return (
        <div className="w-100">
            <AirOutboundComp />
            <div style={{ height: "30px" }}></div>
            <AirOutboundClosedComp />
        </div>
    );
};

export default AirOutbound;
