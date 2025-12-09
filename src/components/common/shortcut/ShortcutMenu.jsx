import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ GROUPED SHORTCUTS
const shortcutGroups = [
    {
        title: "Items",
        shortcuts: [
            { name: "Items", key: "I", path: "/items" },
            // { name: "Composite Items", key: "C", path: "/compositeitems" },
            // { name: "Item Groups", key: "G", path: "/itemgroups" },
            // { name: "Price Lists", key: "P", path: "/pricelists" },
        ]
    },
    // {
    //     title: "Inventory",
    //     shortcuts: [
    //         { name: "Inventory Adjustments", key: "A", path: "/inventoryadjustments" },
    //         { name: "Packages", key: "K", path: "/packages" },
    //         { name: "Shipments", key: "H", path: "/shipments" },
    //     ]
    // },
    {
        title: "Sales",
        shortcuts: [
            { name: "Customers", key: "U", path: "/viewcustomer" },
            { name: "Quotes", key: "Q", path: "/quotes" },
            { name: "Sales Orders", key: "O", path: "/salesorders" },
            { name: "Invoices", key: "S", path: "/invoices" },
            { name: "Recurring Invoices", key: "R", path: "/recurring" },
            { name: "Delivery Challans", key: "D", path: "/deliverychallans" },
            { name: "Payments Received", key: "P", path: "/payments" },
        ]
    },
    {
        title: "Purchases",
        shortcuts: [
            { name: "Vendors", key: "V", path: "/vendors" },
            { name: "Expenses", key: "E", path: "/expenses" },
            { name: "Recurring Expenses", key: "X", path: "/recurringexpenses" },
            { name: "Purchase Orders", key: "U", path: "/purchaseorders" },
            { name: "Purchase Receives", key: "Y", path: "/purchasereceives" },
            { name: "Bills", key: "B", path: "/bills" },
            { name: "Payments Made", key: "M", path: "/paymentsmade" },
            { name: "Vendor Credits", key: "T", path: "/vendorcredits" },
        ]
    },
    {
        title: "Reports",
        shortcuts: [{ name: "Reports", key: "1", path: "/reports" }]
    },
    // {
    //     title: "Utilities",
    //     shortcuts: [{ name: "Utilities", key: "U", path: "/import-items" }]
    // },
    {
        title: "Documents",
        shortcuts: [{ name: "Documents", key: "F", path: "/documents" }]
    }
];

const ShortcutMenu = () => {
    const navigate = useNavigate();

    const handleClick = (path) => navigate(path);

    // ✅ ALT + KEY support
    useEffect(() => {
        const handleShortcut = (e) => {
            if (!e.altKey) return;
            const pressed = e.key.toUpperCase();

            for (const group of shortcutGroups ?? []) {
                const match = group.shortcuts?.find(
                    (s) => s.key.toUpperCase() === pressed
                );
                if (match) {
                    e.preventDefault();
                    navigate(match.path);
                }
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [navigate]);

    return (
        <div className="container py-2">

            {/* ✅ Fallback if no groups */}
            {shortcutGroups?.length > 0 ? (
                shortcutGroups?.map((group, index) => (
                    <div
                        key={index}
                        className="mb-3 p-3 rounded border bg-white shadow-sm"
                    >
                        {/* Group Name */}
                        <h6 className="fw-bold text-primary mb-2">{group.title}</h6>

                        <ul className="list-group border-0">
                            {group.shortcuts?.map((item, i) => (
                                <li
                                    key={i}
                                    className="list-group-item d-flex justify-content-between align-items-center"
                                    onClick={() => handleClick(item.path)}
                                    style={{
                                        cursor: "pointer",
                                        border: "0",
                                        borderBottom: "1px solid #eee"
                                    }}
                                >
                                    {item.name}
                                    <span className="badge bg-light text-dark px-2 py-1">
                                        ALT + {item.key}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted py-3">
                    No shortcuts available
                </div>
            )}
        </div>
    );
};

export default ShortcutMenu;
