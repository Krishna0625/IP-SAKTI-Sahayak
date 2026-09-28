import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  Globe2,
  Leaf,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Product classification',
    text: 'Frame an Ayurveda or wellness product against the relevant product and regulatory pathways.',
    to: '/classification',
  },
  {
    icon: FileSearch,
    title: 'IP screening',
    text: 'Review patent, trademark, GI, design and related IP signals before choosing a protection path.',
    to: '/ip-explorer',
  },
  {
    icon: Leaf,
    title: 'Traditional Knowledge',
    text: 'Surface traditional-knowledge and prior-art considerations that may affect an innovation.',
    to: '/tk-intelligence',
  },
  {
    icon: Scale,
    title: 'ABS assessment',
    text: 'Check access-and-benefit-sharing considerations around biological resources and related use.',
    to: '/abs-assessment',
  },
  {
    icon: Globe2,
    title: 'Regulatory review',
    text: 'Organize the regulatory questions that matter for an Ayurveda, wellness, food or related product.',
    to: '/regulatory',
  },
  {
    icon: Bot,
    title: 'MitraAI Sahayak',
    text: 'Ask questions in supported Indian languages and receive evidence-grounded, source-linked guidance.',
    to: '/sahayak',
  },
]

const pathway = [
  ['01', 'Describe', 'Capture the innovation, ingredients, use and intended product.'],
  ['02', 'Screen', 'Surface IP, Traditional Knowledge, ABS and regulatory signals.'],
  ['03', 'Review', 'Open the evidence behind the result and decide the next step.'],
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="IP-SAKTI home">
          <span className="landing-brand-mark">IP</span>
          <span>
            <strong>IP-SAKTI</strong>
            <small>MitraAI Sahayak</small>
          </span>
        </Link>

        <nav className="landing-nav-links" aria-label="Landing page navigation">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">How it works</a>
          <Link to="/sources">Evidence</Link>
        </nav>

        <div className="landing-nav-actions">
          <Link to="/sahayak" className="landing-text-link">Ask Sahayak</Link>
          <Link to="/dashboard" className="landing-nav-button">
            Open workspace
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <Sparkles size={14} />
              AYUSH • IPR • Traditional Knowledge • ABS
            </div>

            <h1 id="landing-hero-title">
              From Ayurveda innovation to a clearer IP pathway.
            </h1>

            <p className="landing-hero-lead">
              IP-SAKTI brings product classification, intellectual property screening,
              Traditional Knowledge, Access and Benefit Sharing, regulatory review and
              evidence-grounded AI guidance into one workspace.
            </p>

            <div className="landing-hero-actions">
              <Link to="/sahayak" className="landing-primary-button">
                Start with MitraAI Sahayak
                <ArrowRight size={17} />
              </Link>
              <Link to="/innovation/new" className="landing-secondary-button">
                Create an innovation
              </Link>
            </div>

            <div className="landing-trust-row" aria-label="Platform characteristics">
              <span><CheckCircle2 size={15} /> Evidence-grounded</span>
              <span><CheckCircle2 size={15} /> Multilingual</span>
              <span><CheckCircle2 size={15} /> India-focused workflows</span>
            </div>
          </div>

          <div className="landing-visual" aria-label="IP-SAKTI workflow overview">
            <div className="landing-visual-glow" />
            <div className="landing-visual-card">
              <div className="landing-visual-header">
                <div>
                  <span className="landing-visual-label">Innovation workspace</span>
                  <strong>Ayurveda IP pathway</strong>
                </div>
                <span className="landing-status-chip">Ready to explore</span>
              </div>

              <div className="landing-pathway">
                {pathway.map(([number, title, text]) => (
                  <div className="landing-path-step" key={number}>
                    <span className="landing-path-number">{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="landing-visual-footer">
                <span>One connected workspace</span>
                <Link to="/dashboard">
                  View workflow
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="capabilities" aria-labelledby="capabilities-title">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-kicker">Built for the full journey</span>
              <h2 id="capabilities-title">The tools around the innovation, not just the answer.</h2>
            </div>
            <p>
              Move from an early idea to a structured review with connected workflows and evidence.
            </p>
          </div>

          <div className="landing-capability-grid">
            {capabilities.map(({ icon: Icon, title, text, to }) => (
              <Link to={to} className="landing-capability-card" key={title}>
                <span className="landing-capability-icon"><Icon size={19} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowRight className="landing-capability-arrow" size={16} />
              </Link>
            ))}
          </div>
        </section>

        <section className="landing-workflow" id="workflow" aria-labelledby="workflow-title">
          <div className="landing-workflow-intro">
            <span className="landing-section-kicker">A practical review loop</span>
            <h2 id="workflow-title">Start with the innovation. Follow the evidence.</h2>
            <p>
              The workspace is designed to keep exploratory guidance connected to the
              sources and review steps behind it.
            </p>
            <Link to="/sources" className="landing-inline-link">
              Explore evidence &amp; sources
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="landing-workflow-list">
            {pathway.map(([number, title, text]) => (
              <div className="landing-workflow-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta" aria-labelledby="landing-cta-title">
          <div>
            <span className="landing-section-kicker">Ready when you are</span>
            <h2 id="landing-cta-title">Ask the question that moves your innovation forward.</h2>
            <p>Use MitraAI Sahayak for a guided, source-aware starting point.</p>
          </div>
          <Link to="/sahayak" className="landing-primary-button">
            Open Sahayak
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>IP-SAKTI</strong>
          <span>Innovation, IP &amp; Regulatory Intelligence</span>
        </div>
        <span>For AYUSH startups, MSMEs, cultivators and innovators.</span>
      </footer>
    </div>
  )
}
