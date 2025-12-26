import React from 'react'
import { useNavigate } from 'react-router-dom'

function Icon({ name, className = '' }) {
    const common = {
        width: 22,
        height: 22,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: 'false',
        className,
    }

    switch (name) {
        case 'freight':
            return (
                <svg {...common}>
                    <path
                        d="M3.5 8.25A2.25 2.25 0 0 1 5.75 6h8.5A2.25 2.25 0 0 1 16.5 8.25V17H5.75A2.25 2.25 0 0 1 3.5 14.75v-6.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M16.5 10h2.086c.44 0 .86.186 1.156.512l1.258 1.384c.318.35.494.806.494 1.279V17H16.5V10Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7.25 17.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM18.25 17.25a1.75 1.75 0 0 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    />
                    <path d="M5.25 12h6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            )

        case 'finance':
            return (
                <svg {...common}>
                    <path
                        d="M4.5 19.5V7.25A2.25 2.25 0 0 1 6.75 5h10.5A2.25 2.25 0 0 1 19.5 7.25V19.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path d="M7.5 9h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M7.5 12.5h6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path
                        d="M8 19.5v-4.25c0-.69.56-1.25 1.25-1.25h5.5c.69 0 1.25.56 1.25 1.25v4.25"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                </svg>
            )

        default:
            return null
    }
}

const modules = [
    {
        key: 'freight',
        title: 'Freight Forwarding',
        description: 'Manage shipments, milestones, and documentation in one place.',
        chips: ['Shipments', 'Milestones', 'Documents'],
        icon: 'freight',
        tone: 'primary',
        route: '/freight-dashboard',
        tint: 'rgba(14, 165, 233, 0.10)',
        text: '#0369A1',
    },
    {
        key: 'finance',
        title: 'Finance & Accounting',
        description: 'Track invoices, approvals, reconciliation, and reporting.',
        chips: ['Invoices', 'Approvals', 'Reports'],
        icon: 'finance',
        tone: 'success',
        route: '/finance-dashboard',
        tint: 'rgba(16, 185, 129, 0.10)',
        text: '#047857',
    },
]

const Dashboard = () => {
    const navigate = useNavigate()

    const go = (route) => {
        try {
            navigate(route)
        } catch (e) {
            console.error('Navigation error:', e)
            navigate('/')
        }
    }

    const onKey = (e, route) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            go(route)
        }
    }

    return (
        <div className="tw-min-h-screen" style={{ backgroundColor: '#F6FCFF' }}>
            {/* Header */}
            <header className="border-bottom bg-white">
                <div className="container py-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="rounded-4 d-flex align-items-center justify-content-center"
                                style={{
                                    width: 44,
                                    height: 44,
                                    background: 'linear-gradient(135deg, rgba(14,165,233,.18), rgba(16,185,129,.18))',
                                    border: '1px solid rgba(15, 23, 42, 0.06)',
                                }}
                                aria-hidden="true"
                            >
                                <span
                                    className="tw-inline-block tw-h-2.5 tw-w-2.5 tw-rounded-full"
                                    style={{ backgroundColor: '#0EA5E9' }}
                                />
                            </div>

                            <div>
                                <h1 className="h5 fw-bold mb-0">Dashboard</h1>
                                <div className="text-muted small">Choose where you want to work.</div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                                Back
                            </button>
                            <button type="button" className="btn btn-dark" onClick={() => navigate('/')}>
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="py-5">
                <div className="container">
                    <div className="row g-4 align-items-stretch">
                        {/* Left panel */}
                        <div className="col-12 col-lg-4">
                            <div
                                className="bg-white border rounded-4 p-4 h-100"
                                style={{ boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}
                            >
                                <h2 className="h6 fw-semibold mb-2">Quick access</h2>
                                <p className="text-muted mb-4">
                                    Open a dashboard to continue your work. You can switch between modules anytime.
                                </p>

                                <div className="d-grid gap-2">
                                    {modules.map((m) => (
                                        <button
                                            key={m.key}
                                            type="button"
                                            className={`btn btn-${m.tone} d-flex align-items-center justify-content-between`}
                                            onClick={() => go(m.route)}
                                        >
                                            <span className="d-flex align-items-center gap-2">
                                                <span
                                                    className="rounded-3 d-inline-flex align-items-center justify-content-center"
                                                    style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.18)' }}
                                                    aria-hidden="true"
                                                >
                                                    <Icon name={m.icon} className="tw-text-white" />
                                                </span>
                                                <span className="fw-semibold">{m.title}</span>
                                            </span>
                                            <span aria-hidden="true">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right panels */}
                        <div className="col-12 col-lg-8">
                            <div className="d-grid gap-3">
                                {modules.map((m) => (
                                    <div
                                        key={m.key}
                                        className="bg-white border rounded-4 p-4 tw-transition tw-duration-200 hover:tw-shadow-md"
                                        style={{ boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)', cursor: 'pointer' }}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => go(m.route)}
                                        onKeyDown={(e) => onKey(e, m.route)}
                                    >
                                        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                                            <div className="d-flex align-items-start gap-3">
                                                <div
                                                    className="rounded-4 d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: 52,
                                                        height: 52,
                                                        background: m.tint,
                                                        color: m.text,
                                                        border: '1px solid rgba(15, 23, 42, 0.06)',
                                                    }}
                                                    aria-hidden="true"
                                                >
                                                    <Icon name={m.icon} />
                                                </div>

                                                <div>
                                                    <h3 className="h5 fw-semibold mb-1">{m.title}</h3>
                                                    <p className="text-muted mb-3">{m.description}</p>

                                                    <div className="d-flex flex-wrap gap-2">
                                                        {m.chips.map((c) => (
                                                            <span key={c} className="badge rounded-pill text-bg-light border">
                                                                {c}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    type="button"
                                                    className={`btn btn-${m.tone}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        go(m.route)
                                                    }}
                                                >
                                                    Open
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 border-top bg-white">
                <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <small className="text-muted">© {new Date().getFullYear()} LOM Tech</small>
                    <small className="text-muted">Freight Forwarding • Finance & Accounting</small>
                </div>
            </footer>
        </div>
    )
}

export default Dashboard
