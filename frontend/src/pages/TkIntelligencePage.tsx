import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Info,
  Leaf,
  Library,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './tk-intelligence.css'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'

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

export function TkIntelligencePage() {
  const innovation = readActiveInnovation()

  const ingredients = innovation.ingredients
    .split(';')
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)

  return (
    <AppShell
      title="TK Intelligence"
      subtitle="Traditional Knowledge review"
    >
      <div className="tk-page">
        {/* HERO */}
        <section className="tk-hero">
          <div className="tk-hero-main">
            <div className="tk-eyebrow">
              <Sparkles size={14} />
              Traditional Knowledge Intelligence
            </div>

            <h1>
              Understand where traditional knowledge may matter
              in your innovation.
            </h1>

            <p>
              Review ingredient-level signals, available knowledge
              context, and the evidence path before making IP or
              commercialization decisions.
            </p>

            <div className="tk-actions">
              <Link
                to="/abs-assessment"
                className="primary-button"
              >
                Continue to ABS Assessment
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/sources"
                className="secondary-button"
              >
                <FileSearch size={16} />
                Review source library
              </Link>
            </div>
          </div>

          <div className="tk-hero-side">
            <span className="tk-hero-label">
              Current innovation
            </span>

            <h2>{innovation.name}</h2>

            <div className="tk-meta">
              <span>{innovation.classification}</span>
              <span>{innovation.jurisdiction}</span>
            </div>

            <div className="tk-status">
              <div>
                <small>TK relevance</small>
                <strong>Medium</strong>
              </div>

              <span className="tk-status-pill">
                <CircleAlert size={14} />
                Moderate signal
              </span>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section className="tk-metrics">
          <div className="tk-metric">
            <div className="tk-metric-icon green">
              <Leaf size={18} />
            </div>

            <div>
              <span>Selected ingredients</span>
              <strong>{ingredients.length}</strong>
            </div>
          </div>

          <div className="tk-metric">
            <div className="tk-metric-icon gold">
              <CircleAlert size={18} />
            </div>

            <div>
              <span>TK relevance</span>
              <strong>Medium</strong>
            </div>
          </div>

          <div className="tk-metric">
            <div className="tk-metric-icon neutral">
              <ShieldCheck size={18} />
            </div>

            <div>
              <span>Potential TK signal</span>
              <strong>Moderate</strong>
            </div>
          </div>

          <div className="tk-metric">
            <div className="tk-metric-icon dark">
              <Library size={18} />
            </div>

            <div>
              <span>Evidence status</span>
              <strong>Partial</strong>
            </div>
          </div>
        </section>

        {/* INGREDIENTS + CONTEXT */}
        <section className="tk-grid-two">
          <article className="tk-card">
            <div className="tk-card-header">
              <div className="tk-card-icon">
                <Leaf size={18} />
              </div>

              <div>
                <span className="tk-section-label">
                  Ingredient signals
                </span>

                <h2>Selected ingredients</h2>

                <p>
                  These are the ingredients currently recorded for
                  the innovation.
                </p>
              </div>
            </div>

            <div className="tk-ingredients">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient) => (
                  <div
                    className="tk-ingredient"
                    key={ingredient}
                  >
                    <div className="tk-ingredient-icon">
                      <Leaf size={15} />
                    </div>

                    <div>
                      <strong>{ingredient}</strong>
                      <span>
                        Preliminary TK review item
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tk-empty">
                  <strong>
                    No ingredients recorded
                  </strong>

                  <p>
                    Add ingredient information before running a
                    detailed TK review.
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className="tk-card">
            <div className="tk-card-header">
              <div className="tk-card-icon">
                <Info size={18} />
              </div>

              <div>
                <span className="tk-section-label">
                  Knowledge context
                </span>

                <h2>Why this needs review</h2>
              </div>
            </div>

            <p className="tk-body">
              The current ingredients include botanical species
              commonly associated with ethnobotanical and
              traditional-use patterns. These signals should be
              reviewed before filing or relying on novelty
              assumptions.
            </p>

            <div className="tk-green-note">
              <CheckCircle2 size={16} />

              <span>
                Document traditional-use context before a filing
                decision.
              </span>
            </div>
          </article>
        </section>

        {/* REVIEW + EVIDENCE */}
        <section className="tk-grid-two">
          <article className="tk-card">
            <div className="tk-card-header">
              <div className="tk-card-icon">
                <BookOpen size={18} />
              </div>

              <div>
                <span className="tk-section-label">
                  Review pathway
                </span>

                <h2>What to check next</h2>
              </div>
            </div>

            <div className="tk-review-list">
              <div className="tk-review-item">
                <span>01</span>

                <div>
                  <strong>
                    Traditional-use context
                  </strong>

                  <p>
                    Identify whether the ingredient or formulation
                    has established traditional-use documentation
                    relevant to the claim.
                  </p>
                </div>
              </div>

              <div className="tk-review-item">
                <span>02</span>

                <div>
                  <strong>
                    Prior-art relevance
                  </strong>

                  <p>
                    Compare documented knowledge with the intended
                    invention and proposed patent claims.
                  </p>
                </div>
              </div>

              <div className="tk-review-item">
                <span>03</span>

                <div>
                  <strong>
                    Benefit-sharing implications
                  </strong>

                  <p>
                    If biological resources are involved, continue
                    the review into the relevant ABS assessment.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="tk-card">
            <div className="tk-card-header">
              <div className="tk-card-icon gold">
                <Library size={18} />
              </div>

              <div>
                <span className="tk-section-label">
                  Evidence navigation
                </span>

                <h2>What the prototype can show</h2>
              </div>
            </div>

            <div className="tk-evidence">
              <div className="tk-evidence-icon">
                <FileSearch size={18} />
              </div>

              <div>
                <strong>
                  Knowledge-base evidence
                </strong>

                <p>
                  Relevant TK material can be opened from the source
                  library to inspect the supporting context behind
                  the screening signal.
                </p>

                <Link
                  to="/sources"
                  className="tk-link"
                >
                  Open evidence library
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="tk-evidence secondary">
              <div className="tk-evidence-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <strong>
                  Formal determination is not implied
                </strong>

                <p>
                  The prototype does not claim a formal TKDL
                  determination or live database search result.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* NOTICE */}
        <section className="tk-notice">
          <BookOpen size={18} />

          <div>
            <strong>
              Advanced TK Database Search — Need to Build
            </strong>

            <p>
              Current review is limited to the available prototype
              evidence and should be treated as preliminary
              intelligence rather than a formal TK clearance.
            </p>
          </div>
        </section>

        {/* NEXT STEP */}
        <section className="tk-next">
          <div className="tk-next-copy">
            <div className="tk-next-icon">
              <ArrowRight size={18} />
            </div>

            <div>
              <span className="tk-section-label">
                Recommended next step
              </span>

              <h2>
                Check whether the innovation may also trigger ABS
                review.
              </h2>

              <p>
                Continue when biological resources or related
                access-and-benefit-sharing considerations may apply.
              </p>
            </div>
          </div>

          <Link
            to="/abs-assessment"
            className="primary-button"
          >
            Open ABS Assessment
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* DISCLAIMER */}
        <section className="tk-disclaimer">
          <Info size={17} />

          <p>
            This is an AI-assisted preliminary intelligence view.
            Confirm relevant traditional knowledge and current
            legal or regulatory requirements using official sources
            before taking action.
          </p>
        </section>
      </div>
    </AppShell>
  )
}