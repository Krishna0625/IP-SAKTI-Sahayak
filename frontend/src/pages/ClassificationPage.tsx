import { AppShell } from '../components/layout/AppShell'

export function ClassificationPage() {
  return (
    <AppShell title="Classification" subtitle="Preliminary AI-assisted classification">
      <div className="page-grid narrow-layout">
        <section className="card-block result-card">
          <p className="eyebrow accent">Preliminary AI-assisted Classification</p>
          <h2>Ayurveda-Aahar / Wellness Product</h2>
          <div className="confidence-row">
            <strong>86% confidence</strong>
          </div>

          <div className="two-column-list">
            <div>
              <h3>Why this classification</h3>
              <p>The product is positioned as a botanical wellness capsule and may fall under consumer wellness or traditional product classification depending on formulation and claims.</p>
            </div>
            <div>
              <h3>IP implications</h3>
              <p>Branding, product naming, and composition disclosures should be reviewed before filing or commercialization.</p>
            </div>
            <div>
              <h3>Traditional Knowledge implications</h3>
              <p>Botanical ingredients and usage narratives may require TK screening and prior art review.</p>
            </div>
            <div>
              <h3>Regulatory pathway</h3>
              <p>Classification should be confirmed against product claims and market strategy before final regulatory steps.</p>
            </div>
          </div>

          <div className="disclaimer-box warn-box">
            <p>This is an AI-assisted preliminary assessment and is not a legal determination.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
