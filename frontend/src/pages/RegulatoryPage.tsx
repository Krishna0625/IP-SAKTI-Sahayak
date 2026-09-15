import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation, regulatoryUpdates } from '../data/mockData'
import type { InnovationRecord } from '../types'

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
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Regulatory Review</p>
          <h2>Preliminary regulatory review</h2>

          <div className="metrics-grid">
            <div>
              <span>Product</span>
              <strong>{innovation.name}</strong>
            </div>
            <div>
              <span>Product category</span>
              <strong>{innovation.classification}</strong>
            </div>
            <div>
              <span>Regulatory pathway</span>
              <strong>Preliminary review required</strong>
            </div>
            <div>
              <span>Verification required</span>
              <strong>Yes</strong>
            </div>
          </div>

          <div className="update-list">
            <h3>Prototype / Curated Monitoring</h3>
            <ul>
              {regulatoryUpdates.map((item) => (
                <li key={item.heading}><strong>{item.heading}</strong> · {item.note} · {item.state}</li>
              ))}
            </ul>
          </div>

          <div className="disclaimer-box warn-box">
            <ShieldAlert size={17} />
            <p>Automated Regulatory Monitoring — Future Scaling. This is a prototype / curated monitoring view and is not a live government feed.</p>
          </div>

          <div className="button-row">
            <Link to="/sahayak" className="primary-button">Ask AI Sahayak <ArrowRight size={16} /></Link>
            <Link to="/sources" className="secondary-button">Review source library</Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
