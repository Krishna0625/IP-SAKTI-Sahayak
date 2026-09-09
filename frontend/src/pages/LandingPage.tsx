import { ArrowRight, Bot, ShieldCheck, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

export function LandingPage() {
  return (
    <AppShell title="Landing" subtitle="Innovation passport overview">
      <div className="page-grid">
        <section className="hero-panel card-block">
          <div>
            <p className="eyebrow accent">IP-SAKTI Sahayak</p>
            <h2>Innovation passport for Ayurveda IP and regulatory clarity.</h2>
            <p className="lead">
              A prototype workspace for screening product ideas, assessing traditional knowledge relevance,
              reviewing ABS concerns, and preparing a preliminary regulatory view.
            </p>
            <div className="button-row">
              <Link to="/dashboard" className="primary-button">
                Open dashboard <ArrowRight size={16} />
              </Link>
              <Link to="/innovation/new" className="secondary-button">
                Create innovation
              </Link>
            </div>
          </div>
          <div className="summary-box">
            <span className="small-label">Current passport</span>
            <strong>Ashwagandha + Brahmi Wellness Capsule</strong>
            <div className="mini-metrics">
              <div>
                <span>Readiness</span>
                <strong>72%</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>86%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="card-grid three-up">
          <div className="info-card card-block">
            <ShieldCheck size={20} />
            <h3>Classification</h3>
            <p>Preliminary AI-assisted classification for Ayurveda and wellness products.</p>
          </div>
          <div className="info-card card-block">
            <Workflow size={20} />
            <h3>IP Screening</h3>
            <p>Review relevant patent, trade mark, GI, design, and traditional knowledge signals.</p>
          </div>
          <div className="info-card card-block">
            <Bot size={20} />
            <h3>AI Sahayak</h3>
            <p>Evidence-backed guidance for IP and compliance questions.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
