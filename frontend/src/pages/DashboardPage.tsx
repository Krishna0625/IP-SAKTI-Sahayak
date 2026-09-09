import { Activity, Bot, ChevronRight, FileCheck2, ShieldAlert, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { activityFeed, demoInnovation, mockEvidence, regulatoryUpdates } from '../data/mockData'

export function DashboardPage() {
  const checklist = [
    { label: 'Classification', ok: true },
    { label: 'IP Screening', ok: true },
    { label: 'TK Assessment', ok: false },
    { label: 'ABS Assessment', ok: false },
    { label: 'Regulatory', ok: true },
  ]

  return (
    <AppShell title="Dashboard" subtitle="Innovation passport and monitoring">
      <div className="page-grid dashboard-grid">
        <section className="card-block passport-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Your Innovation Passport</p>
              <h2>Innovation: {demoInnovation.name}</h2>
            </div>
            <div className="readiness-badge">Readiness: {demoInnovation.readiness}%</div>
          </div>

          <div className="passport-meta">
            <div>
              <span>Classification</span>
              <strong>{demoInnovation.classification}</strong>
            </div>
            <div>
              <span>Jurisdiction</span>
              <strong>{demoInnovation.jurisdiction}</strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{demoInnovation.confidence}%</strong>
            </div>
          </div>

          <div className="checklist-box">
            {checklist.map((item) => (
              <div key={item.label} className="check-item">
                <span className={item.ok ? 'status success' : 'status warning'}>{item.ok ? '✓' : '⚠'}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card-block assistant-card">
          <div className="section-head">
            <div className="inline-heading">
              <Sparkles size={18} />
              <h3>AI Sahayak</h3>
            </div>
          </div>
          <p className="muted-text">Need a quick view on evidence, classification, or regulatory risks?</p>
          <Link to="/sahayak" className="link-button">
            Open guidance <ChevronRight size={16} />
          </Link>
        </section>

        <section className="card-block radar-card">
          <div className="section-head">
            <div className="inline-heading">
              <ShieldAlert size={18} />
              <h3>Regulatory Radar</h3>
            </div>
            <span className="soft-tag">Prototype / Curated Monitoring</span>
          </div>
          <ul className="list-stack">
            {regulatoryUpdates.map((item) => (
              <li key={item.heading}>
                <strong>{item.heading}</strong>
                <span>{item.note}</span>
                <em>{item.state}</em>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-block evidence-card">
          <div className="section-head">
            <div className="inline-heading">
              <Activity size={18} />
              <h3>Recent evidence/activity</h3>
            </div>
          </div>
          <ul className="activity-list">
            {activityFeed.map((item) => (
              <li key={item.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.type} · {item.time}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-block quick-actions-card">
          <div className="section-head">
            <div className="inline-heading">
              <FileCheck2 size={18} />
              <h3>Quick actions</h3>
            </div>
          </div>
          <div className="button-stack">
            <Link to="/classification" className="secondary-button">Classification</Link>
            <Link to="/ip-explorer" className="secondary-button">IP Explorer</Link>
            <Link to="/regulatory" className="secondary-button">Regulatory</Link>
          </div>
        </section>

        <section className="card-block evidence-mini-card">
          <div className="section-head">
            <div className="inline-heading">
              <Bot size={18} />
              <h3>Evidence trail</h3>
            </div>
          </div>
          <div className="mini-evidence-list">
            {mockEvidence.slice(0, 2).map((item) => (
              <div key={item.id} className="mini-evidence-item">
                <strong>{item.title}</strong>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
