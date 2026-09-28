import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  FileCheck2,
  Leaf,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './classification-overrides.css'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'

function readActiveInnovation(): InnovationRecord {
  try {
    const activeId = localStorage.getItem(activeKey)
    const list = JSON.parse(
      localStorage.getItem(storageKey) ?? '[]',
    ) as InnovationRecord[]

    if (activeId) {
      const match = list.find((entry) => entry.id === activeId)
      if (match) return match
    }

    return list[0] ?? demoInnovation
  } catch {
    return demoInnovation
  }
}

function getClassificationTone(confidence: number) {
  if (confidence >= 80) return 'strong'
  if (confidence >= 60) return 'moderate'
  return 'review'
}

export function ClassificationPage() {
  const innovation = readActiveInnovation()
  const tone = getClassificationTone(innovation.confidence)

  return (
    <AppShell
      title="Classification"
      subtitle="Preliminary AI-assisted product classification"
    >
      <div className="classification-page">
        <section className="classification-hero">
          <div className="classification-hero-copy">
            <div className="eyebrow accent">
              <Sparkles size={14} />
              Preliminary AI-assisted assessment
            </div>

            <h1>Understand how your innovation is positioned.</h1>

            <p>
              Review the current product classification, the factors that influence
              it, and the checks that should follow before commercialization or
              formal regulatory filing.
            </p>

            <div className="classification-hero-actions">
              <Link to="/ip-explorer" className="primary-button">
                Continue to IP Screening
                <ArrowRight size={16} />
              </Link>

              <Link to="/sources" className="secondary-button">
                <ShieldCheck size={16} />
                Review evidence
              </Link>
            </div>
          </div>

          <div className="classification-hero-card">
            <div className="classification-hero-label">Current innovation</div>
            <div className="classification-innovation-name">{innovation.name}</div>
            <div className="classification-hero-meta">
              <span>{innovation.productType}</span>
              <span>{innovation.jurisdiction}</span>
            </div>
          </div>
        </section>

        <section className="classification-result-grid">
          <article className="classification-result-card">
            <div className="classification-section-heading">
              <div>
                <p className="eyebrow accent">Primary classification</p>
                <h2>{innovation.classification}</h2>
              </div>

              <div className={`classification-confidence ${tone}`}>
                <BarChart3 size={17} />
                <strong>{innovation.confidence}%</strong>
                <span>confidence</span>
              </div>
            </div>

            <div className="classification-confidence-track" aria-label={`${innovation.confidence}% confidence`}>
              <span style={{ width: `${Math.min(100, Math.max(0, innovation.confidence))}%` }} />
            </div>

            <p className="classification-result-note">
              This is a preliminary classification signal. Final positioning depends
              on the formulation, intended claims, target market, and applicable
              official requirements.
            </p>

            <div className="classification-signal-grid">
              <div className="classification-signal">
                <Leaf size={18} />
                <div>
                  <strong>Product profile</strong>
                  <span>{innovation.productType}</span>
                </div>
              </div>

              <div className="classification-signal">
                <Scale size={18} />
                <div>
                  <strong>Market scope</strong>
                  <span>{innovation.market}</span>
                </div>
              </div>

              <div className="classification-signal">
                <Search size={18} />
                <div>
                  <strong>Claims review</strong>
                  <span>Required before final positioning</span>
                </div>
              </div>

              <div className="classification-signal">
                <FileCheck2 size={18} />
                <div>
                  <strong>Formal status</strong>
                  <span>Preliminary assessment</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="classification-snapshot-card">
            <div className="classification-section-heading compact">
              <div>
                <p className="eyebrow">Innovation snapshot</p>
                <h3>What is being assessed</h3>
              </div>
            </div>

            <dl className="classification-detail-list">
              <div>
                <dt>Product</dt>
                <dd>{innovation.name}</dd>
              </div>
              <div>
                <dt>Ingredients</dt>
                <dd>{innovation.ingredients}</dd>
              </div>
              <div>
                <dt>Intended use</dt>
                <dd>{innovation.intendedUse}</dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>{innovation.jurisdiction}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="classification-two-column">
          <article className="classification-panel">
            <div className="classification-panel-heading">
              <div className="classification-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="eyebrow">Assessment logic</p>
                <h3>Why this classification is showing</h3>
              </div>
            </div>

            <div className="classification-explanation-list">
              <div>
                <span className="classification-step-number">01</span>
                <div>
                  <strong>Product positioning</strong>
                  <p>
                    The current record is positioned as a botanical wellness product,
                    which influences the initial classification pathway.
                  </p>
                </div>
              </div>

              <div>
                <span className="classification-step-number">02</span>
                <div>
                  <strong>Formulation and claims</strong>
                  <p>
                    Ingredients, intended use, and the claims made to consumers can
                    change the regulatory interpretation.
                  </p>
                </div>
              </div>

              <div>
                <span className="classification-step-number">03</span>
                <div>
                  <strong>Target market</strong>
                  <p>
                    The jurisdiction and market route should be confirmed before a
                    final compliance decision is made.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="classification-panel">
            <div className="classification-panel-heading">
              <div className="classification-icon gold">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="eyebrow">Decision checks</p>
                <h3>What should happen next</h3>
              </div>
            </div>

            <div className="classification-check-list">
              <div>
                <span className="classification-check-icon">
                  <Search size={15} />
                </span>
                <div>
                  <strong>IP screening</strong>
                  <p>Check naming, branding, composition, claims, and prior-art signals.</p>
                </div>
              </div>

              <div>
                <span className="classification-check-icon">
                  <Leaf size={15} />
                </span>
                <div>
                  <strong>Traditional Knowledge review</strong>
                  <p>Check whether the ingredients or usage narrative overlap with documented TK.</p>
                </div>
              </div>

              <div>
                <span className="classification-check-icon">
                  <FileCheck2 size={15} />
                </span>
                <div>
                  <strong>Regulatory confirmation</strong>
                  <p>Confirm the final pathway against claims, formulation, and intended market.</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="classification-next-strip">
          <div>
            <div className="classification-next-icon">
              <ArrowRight size={18} />
            </div>
            <div>
              <p className="eyebrow accent">Recommended next step</p>
              <h3>Move from classification into evidence-backed screening.</h3>
              <p>
                Use IP Screening to continue the innovation review and then validate
                the relevant sources before making filing or commercialization decisions.
              </p>
            </div>
          </div>

          <Link to="/ip-explorer" className="primary-button">
            Continue
            <ArrowRight size={16} />
          </Link>
        </section>

        <section className="classification-disclaimer">
          <AlertCircle size={17} />
          <p>
            This is an AI-assisted preliminary assessment and is not a legal
            determination. Confirm applicable requirements using current official
            sources before taking action.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
