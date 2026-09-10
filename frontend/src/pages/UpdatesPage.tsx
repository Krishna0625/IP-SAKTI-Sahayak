import { AppShell } from '../components/layout/AppShell'
import { regulatoryUpdates } from '../data/mockData'

export function UpdatesPage() {
  return (
    <AppShell title="Updates" subtitle="Prototype monitoring updates">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Updates</p>
          <h2>Regulatory and evidence activity</h2>
          <p className="muted-text">These updates are curated prototype records, not live government monitoring.</p>
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
      </div>
    </AppShell>
  )
}
