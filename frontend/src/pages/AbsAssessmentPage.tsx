import { AppShell } from '../components/layout/AppShell'

export function AbsAssessmentPage() {
  return (
    <AppShell title="ABS Assessment" subtitle="Preliminary compliance guidance">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Preliminary compliance guidance</p>
          <h2>Access and Benefit Sharing assessment</h2>

          <div className="metrics-grid">
            <div>
              <span>Biological resource involved</span>
              <strong>Botanical extract</strong>
            </div>
            <div>
              <span>Potential ABS relevance</span>
              <strong>Yes, probable</strong>
            </div>
            <div>
              <span>Jurisdiction</span>
              <strong>India</strong>
            </div>
            <div>
              <span>Assessment status</span>
              <strong>Preliminary</strong>
            </div>
          </div>

          <div className="disclaimer-box warn-box">
            <p>Preliminary compliance guidance — confirm origin, access history, and benefit-sharing obligations before commercialization.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
