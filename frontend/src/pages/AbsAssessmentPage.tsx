import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Info,
  Leaf,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './abs-assessment.css'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'
const absKey = 'ip-sakti-abs-status'

type AbsAssessmentState = {
  origin: string
  status: string
}

function readActiveInnovation(): InnovationRecord {
  try {
    const activeId = localStorage.getItem(activeKey)

    const list = JSON.parse(
      localStorage.getItem(storageKey) ?? '[]',
    ) as InnovationRecord[]

    if (activeId) {
      const match = list.find(
        (entry) => entry.id === activeId,
      )

      if (match) {
        return match
      }
    }

    return list[0] ?? demoInnovation
  } catch {
    return demoInnovation
  }
}

function readSavedAssessment(): AbsAssessmentState {
  const defaults: AbsAssessmentState = {
    origin: 'Wild-sourced / cultivated botanical material',
    status: 'Needs verification',
  }

  try {
    const saved = localStorage.getItem(absKey)

    if (!saved) {
      return defaults
    }

    const parsed = JSON.parse(saved) as {
      origin?: string
      status?: string
    }

    return {
      origin: parsed.origin || defaults.origin,
      status: parsed.status || defaults.status,
    }
  } catch {
    return defaults
  }
}

export function AbsAssessmentPage() {
  const innovation = readActiveInnovation()
  const initialAssessment = readSavedAssessment()

  const [origin, setOrigin] = useState(initialAssessment.origin)
  const [status, setStatus] = useState(initialAssessment.status)

  const saveAssessment = () => {
    localStorage.setItem(
      absKey,
      JSON.stringify({
        origin,
        status,
      }),
    )
  }

  return (
    <AppShell
      title="ABS Assessment"
      subtitle="Preliminary compliance guidance"
    >
      <div className="abs-page">
        {/* HERO */}
        <section className="abs-hero">
          <div className="abs-hero-main">
            <div className="abs-eyebrow">
              <Sparkles size={14} />
              Preliminary Access and Benefit Sharing Assessment
            </div>

            <h1>
              Understand whether biological-resource access may
              require further ABS review.
            </h1>

            <p>
              Capture the current source/access information,
              review the preliminary assessment signal, and carry
              the innovation into the next regulatory step.
            </p>

            <div className="abs-actions">
              <button
                type="button"
                className="primary-button"
                onClick={saveAssessment}
              >
                <Save size={16} />
                Save assessment
              </button>

              <Link
                to="/regulatory"
                className="secondary-button"
              >
                Continue to Regulatory Review
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="abs-hero-side">
            <span className="abs-hero-label">
              Current innovation
            </span>

            <h2>{innovation.name}</h2>

            <div className="abs-meta">
              <span>{innovation.classification}</span>
              <span>{innovation.jurisdiction}</span>
            </div>

            <div className="abs-status-row">
              <div>
                <small>Potential ABS relevance</small>
                <strong>Yes, probable</strong>
              </div>

              <span className="abs-status-pill">
                <CircleAlert size={14} />
                Review required
              </span>
            </div>
          </div>
        </section>

        {/* SUMMARY METRICS */}
        <section className="abs-metrics">
          <div className="abs-metric">
            <div className="abs-metric-icon green">
              <Leaf size={18} />
            </div>

            <div>
              <span>Biological resource</span>
              <strong>{innovation.ingredients}</strong>
            </div>
          </div>

          <div className="abs-metric">
            <div className="abs-metric-icon gold">
              <CircleAlert size={18} />
            </div>

            <div>
              <span>Potential ABS relevance</span>
              <strong>Yes, probable</strong>
            </div>
          </div>

          <div className="abs-metric">
            <div className="abs-metric-icon neutral">
              <ShieldCheck size={18} />
            </div>

            <div>
              <span>Jurisdiction</span>
              <strong>{innovation.jurisdiction}</strong>
            </div>
          </div>

          <div className="abs-metric">
            <div className="abs-metric-icon dark">
              <FileCheck2 size={18} />
            </div>

            <div>
              <span>Assessment status</span>
              <strong>{status}</strong>
            </div>
          </div>
        </section>

        {/* MAIN FORM */}
        <section className="abs-main-grid">
          <article className="abs-card">
            <div className="abs-card-header">
              <div className="abs-card-icon">
                <Leaf size={18} />
              </div>

              <div>
                <span className="abs-section-label">
                  Source and access
                </span>

                <h2>
                  Capture biological-resource information
                </h2>

                <p>
                  Record what is currently known about the source
                  or access pathway. This information supports the
                  preliminary assessment.
                </p>
              </div>
            </div>

            <div className="abs-field-grid">
              <label className="abs-field abs-field-wide">
                <span>Source / access information</span>

                <textarea
                  value={origin}
                  onChange={(event) =>
                    setOrigin(event.target.value)
                  }
                  rows={5}
                />

                <small>
                  Include the current information available about
                  sourcing, cultivation, collection, or access.
                </small>
              </label>

              <label className="abs-field">
                <span>Current assessment result</span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                >
                  <option value="Needs verification">
                    Needs verification
                  </option>

                  <option value="Likely requires review">
                    Likely requires review
                  </option>

                  <option value="Ready for legal review">
                    Ready for legal review
                  </option>
                </select>

                <small>
                  This is a preliminary working status and not a
                  formal compliance determination.
                </small>
              </label>
            </div>

            <div className="abs-save-strip">
              <div>
                <CheckCircle2 size={17} />

                <div>
                  <strong>
                    Your assessment is stored locally
                  </strong>

                  <p>
                    Saving preserves the current origin and
                    assessment status for this prototype.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={saveAssessment}
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </article>

          {/* SIDE PANEL */}
          <aside className="abs-side-column">
            <article className="abs-card">
              <div className="abs-card-header compact">
                <div className="abs-card-icon">
                  <Info size={18} />
                </div>

                <div>
                  <span className="abs-section-label">
                    Innovation context
                  </span>

                  <h2>What is being assessed</h2>
                </div>
              </div>

              <dl className="abs-details">
                <div>
                  <dt>Product</dt>
                  <dd>{innovation.name}</dd>
                </div>

                <div>
                  <dt>Classification</dt>
                  <dd>{innovation.classification}</dd>
                </div>

                <div>
                  <dt>Ingredients</dt>
                  <dd>{innovation.ingredients}</dd>
                </div>

                <div>
                  <dt>Intended use</dt>
                  <dd>{innovation.intendedUse}</dd>
                </div>
              </dl>
            </article>

            <article className="abs-card">
              <div className="abs-card-header compact">
                <div className="abs-card-icon gold">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <span className="abs-section-label">
                    Review focus
                  </span>

                  <h2>What should be verified</h2>
                </div>
              </div>

              <div className="abs-check-list">
                <div>
                  <CheckCircle2 size={16} />
                  <span>
                    Confirm source or access information.
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  <span>
                    Check whether biological resources are
                    involved.
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  <span>
                    Review applicable benefit-sharing
                    obligations.
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={16} />
                  <span>
                    Validate current requirements against official
                    sources.
                  </span>
                </div>
              </div>
            </article>
          </aside>
        </section>

        {/* NOTICE */}
        <section className="abs-notice">
          <Info size={18} />

          <div>
            <strong>
              Preliminary ABS Assessment — Future Scaling
            </strong>

            <p>
              Automated ABS Compliance Determination is not
              enabled in the current prototype. Confirm origin,
              access history, and benefit-sharing obligations before
              commercialization.
            </p>
          </div>
        </section>

        {/* NEXT STEP */}
        <section className="abs-next">
          <div className="abs-next-copy">
            <div className="abs-next-icon">
              <ArrowRight size={18} />
            </div>

            <div>
              <span className="abs-section-label">
                Recommended next step
              </span>

              <h2>
                Move from ABS assessment into regulatory review.
              </h2>

              <p>
                Continue with the regulatory pathway after
                recording the current biological-resource and
                benefit-sharing considerations.
              </p>
            </div>
          </div>

          <Link
            to="/regulatory"
            className="primary-button"
          >
            Open Regulatory Review
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* DISCLAIMER */}
        <section className="abs-disclaimer">
          <CircleAlert size={17} />

          <p>
            This is an AI-assisted preliminary compliance view.
            It is not a formal ABS determination or legal advice.
            Confirm applicable requirements using current official
            sources before taking action.
          </p>
        </section>
      </div>
    </AppShell>
  )
}