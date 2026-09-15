import { useEffect, useState } from 'react'
import { ArrowRight, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'
const absKey = 'ip-sakti-abs-status'

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

export function AbsAssessmentPage() {
  const innovation = readActiveInnovation()
  const [origin, setOrigin] = useState('Wild-sourced / cultivated botanical material')
  const [status, setStatus] = useState('Needs verification')

  useEffect(() => {
    const saved = localStorage.getItem(absKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { origin?: string; status?: string }
        if (parsed.origin) setOrigin(parsed.origin)
        if (parsed.status) setStatus(parsed.status)
      } catch {
        // ignore invalid persisted data
      }
    }
  }, [])

  const saveAssessment = () => {
    localStorage.setItem(absKey, JSON.stringify({ origin, status }))
  }

  return (
    <AppShell title="ABS Assessment" subtitle="Preliminary compliance guidance">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Preliminary ABS Assessment</p>
          <h2>Access and Benefit Sharing assessment</h2>

          <div className="metrics-grid">
            <div>
              <span>Biological resource involved</span>
              <strong>{innovation.ingredients}</strong>
            </div>
            <div>
              <span>Potential ABS relevance</span>
              <strong>Yes, probable</strong>
            </div>
            <div>
              <span>Jurisdiction</span>
              <strong>{innovation.jurisdiction}</strong>
            </div>
            <div>
              <span>Assessment status</span>
              <strong>{status}</strong>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '18px' }}>
            <label className="field-block">
              <span>Source / access information</span>
              <textarea value={origin} onChange={(event) => setOrigin(event.target.value)} rows={3} />
            </label>
            <label className="field-block">
              <span>Current assessment result</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="Needs verification">Needs verification</option>
                <option value="Likely requires review">Likely requires review</option>
                <option value="Ready for legal review">Ready for legal review</option>
              </select>
            </label>
          </div>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={saveAssessment}><Save size={16} /> Save assessment</button>
            <Link to="/regulatory" className="secondary-button">Continue to Regulatory Review <ArrowRight size={16} /></Link>
          </div>

          <div className="disclaimer-box warn-box">
            <p>Preliminary ABS Assessment. Automated ABS Compliance Determination — Future Scaling. Confirm origin, access history, and benefit-sharing obligations before commercialization.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
