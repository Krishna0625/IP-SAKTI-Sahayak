import { AppShell } from '../components/layout/AppShell'

export function RegulatoryPage() {
  return (
    <AppShell title="Regulatory" subtitle="Prototype review">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Regulatory Pathway</p>
          <h2>Preliminary regulatory review</h2>

          <div className="metrics-grid">
            <div>
              <span>Product classification</span>
              <strong>Wellness / Ayurveda-Aahar</strong>
            </div>
            <div>
              <span>Regulatory pathway</span>
              <strong>Review required</strong>
            </div>
            <div>
              <span>Key considerations</span>
              <strong>Claims, ingredients, market scope</strong>
            </div>
            <div>
              <span>Verification required</span>
              <strong>Yes</strong>
            </div>
          </div>

          <div className="update-list">
            <h3>Curated regulatory updates</h3>
            <ul>
              <li>Prototype / Curated Monitoring — Product labeling review</li>
              <li>Prototype / Curated Monitoring — Export documentation checks</li>
              <li>Prototype / Curated Monitoring — Traditional knowledge review</li>
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
