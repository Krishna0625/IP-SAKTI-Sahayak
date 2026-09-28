import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation, regulatoryUpdates } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './regulatory-review.css'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'

function readActiveInnovation(): InnovationRecord {
  try {
    const activeId = localStorage.getItem(activeKey)
    const list = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as InnovationRecord[]

    if (activeId) {
      const match = list.find((entry) => entry.id === activeId)
      if (match) return match
    }

    return list[0] ?? demoInnovation
  } catch {
    return demoInnovation
  }
}

export function RegulatoryPage() {
  const innovation = readActiveInnovation()

  return (
    <AppShell title="Regulatory Review" subtitle="Prototype review">
      <div className="regulatory-page">
        <section className="regulatory-hero">
          <div>
            <p className="regulatory-eyebrow">REGULATORY REVIEW</p>
            <h1>Preliminary regulatory review</h1>
            <p className="regulatory-intro">
              Review the current product classification, preliminary pathway,
              and curated regulatory monitoring signals before moving to
              detailed verification.
            </p>
          </div>

          <div className="regulatory-status">
            <span className="regulatory-status-dot" />
            <span>Verification required</span>
          </div>
        </section>

        <section className="regulatory-summary-card">
          <div className="regulatory-section-heading">
            <div>
              <span className="regulatory-section-label">Product overview</span>
              <h2>Current innovation assessment</h2>
            </div>
            <span className="regulatory-prototype-badge">Prototype</span>
          </div>

          <div className="regulatory-metrics">
            <article className="regulatory-metric">
              <span>Product</span>
              <strong>{innovation.name}</strong>
            </article>

            <article className="regulatory-metric">
              <span>Product category</span>
              <strong>{innovation.classification}</strong>
            </article>

            <article className="regulatory-metric">
              <span>Regulatory pathway</span>
              <strong>Preliminary review required</strong>
            </article>

            <article className="regulatory-metric">
              <span>Verification required</span>
              <strong className="regulatory-value-warning">Yes</strong>
            </article>
          </div>
        </section>

        <section className="regulatory-monitoring-card">
          <div className="regulatory-section-heading">
            <div>
              <span className="regulatory-section-label">Monitoring</span>
              <h2>Prototype / Curated Monitoring</h2>
            </div>

            <span className="regulatory-monitoring-count">
              {regulatoryUpdates.length} updates
            </span>
          </div>

          <div className="regulatory-update-list">
            {regulatoryUpdates.map((item) => (
              <article className="regulatory-update-item" key={item.heading}>
                <div className="regulatory-update-indicator" />

                <div className="regulatory-update-content">
                  <div className="regulatory-update-topline">
                    <h3>{item.heading}</h3>
                    <span className="regulatory-update-state">{item.state}</span>
                  </div>

                  <p>{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="regulatory-warning">
          <div className="regulatory-warning-icon">
            <ShieldAlert size={19} />
          </div>

          <div>
            <strong>Prototype monitoring notice</strong>
            <p>
              Automated Regulatory Monitoring — Future Scaling. This is a
              prototype / curated monitoring view and is not a live government
              feed.
            </p>
          </div>
        </section>

        <section className="regulatory-actions">
          <div>
            <span className="regulatory-section-label">Next step</span>
            <h2>Continue with guided review</h2>
            <p>
              Use Sahayak for a contextual question or inspect the source
              library behind the current prototype workflow.
            </p>
          </div>

          <div className="regulatory-action-buttons">
            <Link to="/sahayak" className="regulatory-primary-button">
              Ask AI Sahayak
              <ArrowRight size={17} />
            </Link>

            <Link to="/sources" className="regulatory-secondary-button">
              Review source library
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}