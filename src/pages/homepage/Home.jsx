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
            d="M7.25 17.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM18.25 17.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z"
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

    case 'ocr':
      return (
        <svg {...common}>
          <path
            d="M7 3.5H6A2.5 2.5 0 0 0 3.5 6v1M17 3.5h1A2.5 2.5 0 0 1 20.5 6v1M3.5 17v1A2.5 2.5 0 0 0 6 20.5h1M20.5 17v1A2.5 2.5 0 0 1 18 20.5h-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M15.25 15.5l1.25 1.25 2.25-2.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    default:
      return null
  }
}

const FEATURES = [
  {
    key: 'freight',
    title: 'Freight Forwarding',
    description: 'Create shipments, manage documents, and track milestones from pickup to delivery.',
    items: ['Quotes & bookings', 'Shipment tracking', 'Docs & compliance'],
    accent: 'tw-bg-sky-500/10 tw-text-sky-700',
  },
  {
    key: 'finance',
    title: 'Finance & Accounting',
    description: 'Keep invoices organized and books clean with clear ownership and approvals.',
    items: ['Invoice management', 'Reconciliation', 'Reports'],
    accent: 'tw-bg-emerald-500/10 tw-text-emerald-700',
  },
  {
    key: 'ocr',
    title: 'OCR(AI)',
    description: 'Extract key fields from PDFs and scans so your team spends less time typing.',
    items: ['PDF & scan parsing', 'Field validation', 'Export-ready data'],
    accent: 'tw-bg-violet-500/10 tw-text-violet-700',
  },
]

const Home = () => {
  const navigate = useNavigate()

  // Safe navigation helper with fallback
  const safeNavigate = (path) => {
    if (!path) {
      navigate('/')
      return
    }
    try {
      navigate(path)
    } catch (e) {
      console.error('Navigation error:', e)
      navigate('/')
    }
  }

  // Route mappings for cards
  const cardRoutes = {
    freight: '/air-inbound', // Freight Forwarding -> Commercial -> Air Inbound (first child)
    finance: '/items', // Finance -> Items (first child)
    ocr: '/documents', // Documents to OCR
  }

  const handleCardClick = (key) => {
    const route = cardRoutes[key]
    safeNavigate(route)
  }

  const handleCardKeyDown = (e, key) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick(key)
    }
  }

  return (
    <div className="tw-min-h-screen" style={{ backgroundColor: '#F6FCFF' }}>
      {/* Simple top bar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom">
        <div className="container py-2">
          <a className="navbar-brand fw-semibold d-flex align-items-center gap-2" href="/">
            <span
              className="tw-inline-block tw-h-3 tw-w-3 tw-rounded tw-bg-gradient-to-br tw-from-sky-500 tw-to-emerald-500"
              aria-hidden="true"
            />
            LOM Tech
          </a>
          <div className="d-flex gap-2">
            <a className="btn btn-sm btn-outline-secondary rounded-pill px-3" href="#features">
              Features
            </a>
          </div>
        </div>
      </nav>

      {/* Intro */}
      <header className="py-5">
        <div className="container text-center">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-secondary border-opacity-25 text-secondary bg-white">
            <span className="tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-emerald-500" aria-hidden="true" />
            <small className="mb-0">Simple, clean, production-ready UI</small>
          </div>

          <h1 className="display-6 fw-bold mt-3 mb-2">Everything your team needs in one place.</h1>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: 720 }}>
            Manage freight operations, handle finance workflows, and extract data from documents — with a modern interface
            that stays easy to understand.
          </p>

          {/* <a className="btn btn-primary btn-lg rounded-pill px-4" href="#features">
            View Features
          </a> */}
        </div>
      </header>

      {/* Feature Cards */}
      <section id="features" className="pb-5">
        <div className="container">
          <div className="row g-4">
            {FEATURES.map((f) => (
              <div className="col-12 col-md-4" key={f.key}>
                <div
                  className="card h-100 border-0 tw-transition tw-duration-200 hover:tw-shadow-md hover:-tw-translate-y-0.5"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(f.key)}
                  onKeyDown={(e) => handleCardKeyDown(e, f.key)}
                  style={{ cursor: 'pointer', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className={`tw-h-11 tw-w-11 rounded-3 d-flex align-items-center justify-content-center ${f.accent}`}
                        aria-hidden="true"
                      >
                        <Icon name={f.key} className="tw-text-current" />
                      </div>
                      <div>
                        <h3 className="h5 fw-semibold mb-1">{f.title}</h3>
                        <p className="text-muted mb-0">{f.description}</p>
                      </div>
                    </div>

                    <ul className="mt-3 mb-0 text-muted">
                      {f.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-4 border-top bg-white">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <small className="text-muted">© {new Date().getFullYear()} LOM Tech</small>
          <small className="text-muted">Freight Forwarding • Finance & Accounting • OCR</small>
        </div>
      </footer>
    </div>
  )
}

export default Home
