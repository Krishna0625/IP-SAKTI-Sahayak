import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

export function HelpPage() {
  return (
    <AppShell title="Help" subtitle="Prototype guidance">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Help</p>
          <h2>Using MitraAI</h2>
          <div className="two-column-list">
            <div>
              <h3>Start with an innovation</h3>
              <p>Create or open the demo innovation to review its preliminary passport and assessment areas.</p>
            </div>
            <div>
              <h3>Ask MitraAI</h3>
              <p>Ask a question to receive evidence-backed guidance from the configured backend knowledge base.</p>
            </div>
            <div>
              <h3>Prototype status</h3>
              <p>Some monitoring and assessment records are curated prototype data and are not live government integrations.</p>
            </div>
          </div>
          <Link to="/sahayak" className="primary-button">Open MitraAI Sahayak</Link>
        </section>
      </div>
    </AppShell>
  )
}
