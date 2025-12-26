import React, { useMemo } from "react";

/**
 * ------------------------------------------------------------
 * Static data (matches the screenshot)
 * Replace with API when ready.
 * ------------------------------------------------------------
 */
const STATIC_DASHBOARD = {
    clearancePending: {
        title: "Clearance Pending (without Clearance Date)",
        statuses: {
            "-": 1,
            "Clearance Completed": 607,
            Closed: 316,
            "Not Arrived": 1031,
            Open: 1129,
            "Pending for Query": 21,
            "Today Planning": 2,
        },
        total: 3107,
    },
    invoicePending: {
        title: "Invoice Pending (without Invoice Date)",
        statuses: {
            "Clearance Completed": 753,
            Closed: 8,
            "Not Arrived": 3,
            Open: 172,
        },
        total: 936,
    },
    despatchPending: {
        title: "Despatch Pending (without Despatch Date)",
        statuses: {
            "Clearance Completed": 768,
            Closed: 515,
            "Not Arrived": 124,
            Open: 424,
            Others: 1,
            "Pending for Query": 101,
            "Today Planning": 1,
        },
        total: 1934,
    },
    totalUsers: 53,
};

const toRows = (statuses) =>
    Object.entries(statuses || {}).map(([label, value]) => ({
        label: String(label),
        value: Number(value) || 0,
    }));

const styles = {
    page: {
        background: "#F6FCFF",
        padding: "14px 12px 18px",
        minHeight: "calc(100vh - 60px)",
    },

    // Card base (auto-height)
    card: {
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
    },

    // CSS-like hover (no state re-render)
    cardHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 16px 32px rgba(15, 23, 42, 0.10)",
    },

    cardHeader: (bg, color) => ({
        background: bg,
        color,
        padding: "12px 14px",
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: 0.15,
        borderBottom: "1px solid rgba(0,0,0,0.08)",
    }),

    cardBody: {
        padding: 14,
    },

    sectionHeader: {
        fontWeight: 700,
        fontSize: 13.5,
        color: "#0f172a",
        marginBottom: 10,
    },

    list: {
        display: "grid",
        gap: 8,
        paddingRight: 4,

        // ✅ optional: if you want scroll like screenshot, enable below:
        // maxHeight: 260,
        // overflow: "auto",
    },

    row: {
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 14,
        lineHeight: 1.25,
    },

    rowLabel: {
        color: "#0f172a",
        minWidth: 0,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    rowValue: {
        fontWeight: 800,
        color: "#0f172a",
        flexShrink: 0,
        minWidth: 34,
        textAlign: "right",
    },

    total: {
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid rgba(15, 23, 42, 0.10)",
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
    },

    totalValue: {
        fontWeight: 900,
        letterSpacing: 0.1,
    },

    otherDetailsCard: {
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    },

    otherHeader: {
        background: "#343a40",
        color: "#fff",
        padding: "12px 14px",
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: 0.15,
    },

    otherBody: {
        padding: 18,
        minHeight: 190,
    },

    userTile: {
        borderRadius: 12,
        padding: 16,
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.14)",
        background:
            "linear-gradient(135deg, rgba(13,110,253,1) 0%, rgba(10,88,202,1) 65%, rgba(8,70,170,1) 100%)",
        boxShadow: "0 14px 30px rgba(13, 110, 253, 0.22)",
        maxWidth: 360,
        minHeight: 112,
    },

    userNumber: {
        fontSize: 44,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: 0.3,
    },

    userLabel: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: 600,
        opacity: 0.95,
    },
};

const IconUsers = (props) => (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path
            d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5C14.3431 5 13 6.34315 13 8C13 9.65685 14.3431 11 16 11Z"
            fill="white"
        />
        <path
            d="M8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"
            fill="white"
        />
        <path d="M8 13C5.79086 13 4 14.7909 4 17V19H12V17C12 14.7909 10.2091 13 8 13Z" fill="white" />
        <path
            d="M16 13C13.7909 13 12 14.7909 12 17V19H20V17C20 14.7909 18.2091 13 16 13Z"
            fill="white"
        />
    </svg>
);

const UsersTile = ({ value }) => {
    return (
        <div style={styles.userTile} role="group" aria-label="Total users">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
                <div>
                    <div style={styles.userNumber}>{value}</div>
                    <div style={styles.userLabel}>Total users</div>
                </div>
                <IconUsers style={{ opacity: 0.22, flexShrink: 0 }} />
            </div>
        </div>
    );
};

const StatusCard = ({ title, headerBg, headerColor, statuses, total }) => {
    const rows = useMemo(() => toRows(statuses), [statuses]);

    return (
        <section
            className="dashboard-status-card"
            style={styles.card}
            aria-label={title}
        >
            <div style={styles.cardHeader(headerBg, headerColor)}>{title}</div>

            <div style={styles.cardBody}>
                <div style={styles.sectionHeader}>Status</div>

                <div style={styles.list}>
                    {rows.map((r) => (
                        <div key={r.label} style={styles.row}>
                            <div title={r.label} style={styles.rowLabel}>
                                {r.label}
                            </div>
                            <div style={styles.rowValue}>{r.value}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.total}>
                    <span>Total</span>
                    <span style={styles.totalValue}>{total}</span>
                </div>
            </div>
        </section>
    );
};

const Dashboard = () => {
    // Replace later with API (react-query) if needed:
    // const stats = query.data || STATIC_DASHBOARD;
    const stats = STATIC_DASHBOARD;

    return (
        <div className="container-fluid" style={styles.page}>
            {/* Small CSS for hover without React state */}
            <style>
                {`
          .dashboard-status-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 32px rgba(15, 23, 42, 0.10);
          }
        `}
            </style>

            {/* Top 3 cards */}
            <div className="row g-3 align-items-start">
                <div className="col-12 col-md-4">
                    <StatusCard
                        title={stats.clearancePending.title}
                        headerBg="#17a2b8"
                        headerColor="#fff"
                        statuses={stats.clearancePending.statuses}
                        total={stats.clearancePending.total}
                    />
                </div>

                <div className="col-12 col-md-4">
                    <StatusCard
                        title={stats.invoicePending.title}
                        headerBg="#28a745"
                        headerColor="#fff"
                        statuses={stats.invoicePending.statuses}
                        total={stats.invoicePending.total}
                    />
                </div>

                <div className="col-12 col-md-4">
                    <StatusCard
                        title={stats.despatchPending.title}
                        headerBg="#ffc107"
                        headerColor="#111827"
                        statuses={stats.despatchPending.statuses}
                        total={stats.despatchPending.total}
                    />
                </div>
            </div>

            {/* Other Details */}
            <div className="row g-3" style={{ marginTop: 18 }}>
                <div className="col-12">
                    <section style={styles.otherDetailsCard} aria-label="Other details">
                        <div style={styles.otherHeader}>Other Details</div>

                        <div style={styles.otherBody}>
                            <div className="row g-3 align-items-start">
                                <div className="col-12 col-md-4">
                                    <UsersTile value={stats.totalUsers} />
                                </div>

                                {/* keep empty space like the screenshot */}
                                <div className="col-12 col-md-8" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
