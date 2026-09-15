import { ArrowRight, ShieldAlert } from 'lucide-react'
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

const screeningRows = [
  { title: 'Patent screening', status: 'Pending manual review', signal: 'Potential prior art relevance' },
  { title: 'Trademark', status: 'Demo review only', signal: 'Brand naming check required' },
  { title: 'GI', status: 'No direct GI signal', signal: 'Low immediate risk' },
  { title: 'Copyright', status: 'Not primary issue', signal: 'Packaging copy to review' },
  { title: 'Design', status: 'Placeholder evidence', signal: 'Packaging design review' },
  { title: 'Prior-art / TK signal', status: 'Preliminary signal', signal: 'Traditional knowledge mapping needed' },
]

export function IpExplorerPage() {
  const innovation = readActiveInnovation()

  return (
    <AppShell title="IP Screening" subtitle="Evidence and screening review">
      <div className="page-grid narrow-layout">
        <section className="card-block table-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">IP Screening</p>
              <h2>{innovation.name}</h2>
            </div>
          </div>

          <div className="metrics-grid">
            <div>
              <span>Selected product</span>
              <strong>{innovation.name}</strong>
            </div>
            <div>
              <span>Classification</span>
              <strong>{innovation.classification}</strong>
            </div>
            <div>
              <span>Jurisdiction</span>
              <strong>{innovation.jurisdiction}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Preliminary review</strong>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {screeningRows.map((row) => (
                <tr key={row.title}>
                  <td>{row.title}</td>
                  <td>{row.status}</td>
                  <td>{row.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="disclaimer-box warn-box">
            <ShieldAlert size={17} />
            <p>Advanced Patent / Prior-Art Search — Future Scaling. This prototype does not create live patent-search records.</p>
          </div>

          <div className="button-row">
            <Link to="/tk-intelligence" className="primary-button">Continue to TK Assessment <ArrowRight size={16} /></Link>
            <Link to="/sources" className="secondary-button">View sources</Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
