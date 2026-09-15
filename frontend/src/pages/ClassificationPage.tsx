import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
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

export function ClassificationPage() {
  const innovation = readActiveInnovation()

  return (
    <AppShell title="Classification" subtitle="Preliminary AI-assisted classification">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Preliminary AI-Assisted Classification</p>
          <h2>{innovation.classification}</h2>
          <div className="confidence-row">
            <strong>{innovation.confidence}% confidence</strong>
          </div>

          <div className="two-column-list">
            <div>
              <h3>Product summary</h3>
              <p>{innovation.name} · {innovation.productType} · {innovation.jurisdiction}</p>
              <p><strong>Ingredients:</strong> {innovation.ingredients}</p>
              <p><strong>Intended use:</strong> {innovation.intendedUse}</p>
            </div>
            <div>
              <h3>Why this classification?</h3>
              <p>The product is positioned as a botanical wellness capsule and may fall under consumer wellness or traditional product classification depending on formulation, claims, and market positioning.</p>
            </div>
            <div>
              <h3>IP implications</h3>
              <p>Branding, naming, claims, and composition disclosure should be reviewed before commercialization or formal filing.</p>
            </div>
            <div>
              <h3>Traditional Knowledge implications</h3>
              <p>Botanical ingredients and usage narratives may require a TK screening check and prior-art review before any filing strategy is finalized.</p>
            </div>
            <div>
              <h3>Regulatory pathway</h3>
              <p>Classification should be confirmed against product claims and target market before final regulatory steps.</p>
            </div>
            <div>
              <h3>Next action</h3>
              <p>Complete the IP screening and TK review, then confirm the regulatory pathway for the intended market.</p>
            </div>
          </div>

          <div className="button-row">
            <Link to="/ip-explorer" className="primary-button">Continue to IP Screening <ArrowRight size={16} /></Link>
            <Link to="/sources" className="secondary-button"><ShieldCheck size={16} /> Review evidence</Link>
          </div>

          <div className="disclaimer-box warn-box">
            <p>This is an AI-assisted preliminary assessment and is not a legal determination.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
