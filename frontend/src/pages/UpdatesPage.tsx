import { Bell, Clock3, ShieldCheck } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { regulatoryUpdates } from '../data/mockData'
import './updates.css'

export function UpdatesPage() {
  return (
    <AppShell title="Updates" subtitle="Prototype monitoring updates">
      <div className="updates-page">
        <section className="updates-hero">
          <div>
            <p className="updates-eyebrow">UPDATES</p>
            <h1>Regulatory and evidence activity</h1>
            <p className="updates-intro">
              Review curated prototype activity across the regulatory and
              evidence-monitoring workflow.
            </p>
          </div>

          <div className="updates-live-badge">
            <span className="updates-live-dot" />
            <span>Prototype monitoring</span>
          </div>
        </section>

        <section className="updates-summary-grid">
          <article className="updates-summary-card">
            <div className="updates-summary-icon">
              <Bell size={18} />
            </div>
            <div>
              <span>Activity records</span>
              <strong>{regulatoryUpdates.length}</strong>
            </div>
          </article>

          <article className="updates-summary-card">
            <div className="updates-summary-icon">
              <Clock3 size={18} />
            </div>
            <div>
              <span>Monitoring mode</span>
              <strong>Curated prototype</strong>
            </div>
          </article>

          <article className="updates-summary-card">
            <div className="updates-summary-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span>Feed status</span>
              <strong>Verification required</strong>
            </div>
          </article>
        </section>

        <section className="updates-activity-card">
          <div className="updates-section-heading">
            <div>
              <span className="updates-section-label">Activity feed</span>
              <h2>Recent regulatory and evidence activity</h2>
              <p>
                Curated records currently available in the prototype
                monitoring workflow.
              </p>
            </div>

            <span className="updates-count">
              {regulatoryUpdates.length} updates
            </span>
          </div>

          <div className="updates-list">
            {regulatoryUpdates.map((item) => (
              <article className="updates-item" key={item.heading}>
                <div className="updates-timeline">
                  <span className="updates-timeline-dot" />
                </div>

                <div className="updates-item-content">
                  <div className="updates-item-header">
                    <div>
                      <span className="updates-item-label">Monitoring event</span>
                      <h3>{item.heading}</h3>
                    </div>

                    <span className="updates-state">{item.state}</span>
                  </div>

                  <p>{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="updates-notice">
          <div className="updates-notice-icon">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>Prototype monitoring notice</strong>
            <p>
              These updates are curated prototype records, not live government
              monitoring. Verify current regulatory information against
              authoritative sources before relying on it for a decision.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}