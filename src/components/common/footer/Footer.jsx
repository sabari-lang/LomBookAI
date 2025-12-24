import React from "react";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";
import { confirm } from "../../../utils/confirm";

const Footer = () => {

    const handleVpnClick = async () => {
        const confirmed = await confirm("Do you want to connect to VPN?");
        if (confirmed) {
            notifyInfo("Connecting to VPN...");
        } else {
            console.log("VPN connection cancelled.");
        }
    };

    return (
        <footer
            className="d-flex justify-content-between align-items-center small px-4  text-white m-0"
            style={{
                // background: "#2F353E",
                background: "#010B13",
                borderTop: "1px solid #2f6aa3",
                height: "calc(100vh - 94vh)",
            }}
        >
            {/* <span>Powered by LOM</span>

            <div className="d-flex align-items-center gap-3">

                <span>© {new Date().getFullYear()} LOM Technologies Pvt Ltd</span>

       
                <img
                    src="https://cdn-icons-png.flaticon.com/512/10015/10015957.png"
                    alt="VPN"
                    title="Connect to VPN"
                    height="22"
                    width="22"
                    style={{
                        cursor: "pointer",
                        display: "block"
                    }}
                    onClick={handleVpnClick}
                />
            </div> */}
        </footer>
    );
};

export default Footer;
