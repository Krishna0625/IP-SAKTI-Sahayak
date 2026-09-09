import { AppShell } from '../components/layout/AppShell'

export function TkIntelligencePage() {
  return (
    <AppShell title="TK Intelligence" subtitle="Preliminary intelligence view">
      <div className="page-grid dashboard-grid">
        <section className="card-block result-card">
          <p className="eyebrow accent">Traditional Knowledge Intelligence</p>
          <h2>Preliminary TK relevance summary</h2>
          <div className="metrics-grid">
            <div>
              <span>Traditional Knowledge relevance</span>
              <strong>Medium</strong>
            </div>
            <div>
              <span>Potential TK signal</span>
              <strong>Moderate</strong>
            </div>
            <div>
              <span>Evidence status</span>
              <strong>Partial</strong>
            </div>
            <div>
              <span>Review required</span>
              <strong>Yes</strong>
            </div>
          </div>
          <div className="disclaimer-box warn-box">
            <p>This is preliminary intelligence, not a legal determination.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
