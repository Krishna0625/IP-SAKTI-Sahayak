import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Link2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './ip-screening-overrides.css'

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

type ScreeningRow = {
  title: string
  status: string
  signal: string
  tone: 'review' | 'clear' | 'watch'
  note: string
}

const screeningRows: ScreeningRow[] = [
  {
    title: 'Patent',
    status: 'Manual review required',
    signal: 'Potential relevance',
    tone: 'review',
    note: 'Review novelty, inventive step, claims, and available prior art before filing decisions.',
  },
  {
    title: 'Trademark',
    status: 'Preliminary check',
    signal: 'Name review required',
    tone: 'watch',
    note: 'Check the proposed brand and related goods/services against existing marks.',
  },
  {
    title: 'Geographical indication',
    status: 'No direct signal',
    signal: 'Low immediate relevance',
    tone: 'clear',
    note: 'Revisit if the product name or positioning depends on a specific geographic origin.',
  },
  {
    title: 'Copyright',
    status: 'Secondary issue',
    signal: 'Packaging/content review',
    tone: 'watch',
    note: 'Consider labels, packaging artwork, written content, and other original creative material.',
  },
  {
    title: 'Design',
    status: 'Preliminary review',
    signal: 'Packaging design',
    tone: 'watch',
    note: 'Consider design protection where the visual appearance of the product or pack is distinctive.',
  },
  {
    title: 'TK / prior art',
    status: 'Preliminary signal',
    signal: 'Mapping recommended',
    tone: 'review',
    note: 'Check for documented traditional knowledge and prior-art material before a patent strategy is finalised.',
  },
]

function getOverallLabel(rows: ScreeningRow[]) {
  const reviewCount = rows.filter((row) => row.tone === 'review').length
  const watchCount = rows.filter((row) => row.tone === 'watch').length

  if (reviewCount > 1) return 'Further screening required'
  if (watchCount > 0) return 'Targeted review required'
  return 'Preliminary checks complete'
}

export function IpExplorerPage() {
  const innovation = readActiveInnovation()
  const overall = getOverallLabel(screeningRows)
  const reviewCount = screeningRows.filter((row) => row.tone === 'review').length
  const clearCount = screeningRows.filter((row) => row.tone === 'clear').length

  return (
    <AppShell
      title="IP Screening"
      subtitle="Preliminary evidence-led review across relevant IP categories"
    >
      <div className="ip-screening-page">
        <section className="ip-screening-hero">
          <div className="ip-screening-hero-copy">
            <div className="eyebrow accent">
              <Sparkles size={14} />
              Evidence-led preliminary screening
            </div>

            <h1>See which IP areas deserve attention before you file or launch.</h1>

            <p>
              Review the current innovation against common IP categories, understand
              the signals, and move into targeted TK, ABS, and regulatory checks.
            </p>

            <div className="ip-screening-actions">
              <Link to="/tk-intelligence" className="primary-button">
                Continue to TK Assessment
                <ArrowRight size={16} />
              </Link>

              <Link to="/sources" className="secondary-button">
                <FileSearch size={16} />
                Review sources
              </Link>
            </div>
          </div>

          <div className="ip-screening-status-card">
            <div className="ip-screening-status-label">Current innovation</div>
            <strong>{innovation.name}</strong>

            <div className="ip-screening-status-meta">
              <span>{innovation.classification}</span>
              <span>{innovation.jurisdiction}</span>
            </div>

            <div className="ip-screening-overall">
              <div>
                <span>Overall screening status</span>
                <strong>{overall}</strong>
              </div>
              <div className="ip-screening-score">
                <strong>{reviewCount}</strong>
                <span>priority areas</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ip-screening-metrics">
          <article>
            <div className="ip-screening-metric-icon green">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span>Categories reviewed</span>
              <strong>{screeningRows.length}</strong>
            </div>
          </article>

          <article>
            <div className="ip-screening-metric-icon gold">
              <CircleAlert size={18} />
            </div>
            <div>
              <span>Priority areas</span>
              <strong>{reviewCount}</strong>
            </div>
          </article>

          <article>
            <div className="ip-screening-metric-icon neutral">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span>Low-immediate-relevance areas</span>
              <strong>{clearCount}</strong>
            </div>
          </article>

          <article>
            <div className="ip-screening-metric-icon dark">
              <Search size={18} />
            </div>
            <div>
              <span>Search status</span>
              <strong>Preliminary</strong>
            </div>
          </article>
        </section>

        <section className="ip-screening-main-grid">
          <article className="ip-screening-table-card">
            <div className="ip-screening-card-head">
              <div>
                <p className="eyebrow accent">Screening matrix</p>
                <h2>IP areas at a glance</h2>
                <p>
                  Signals are a starting point for review and are not a legal
                  determination or a live registry result.
                </p>
              </div>

              <div className="ip-screening-legend">
                <span><i className="review" /> Review</span>
                <span><i className="watch" /> Watch</span>
                <span><i className="clear" /> Low signal</span>
              </div>
            </div>

            <div className="ip-screening-table">
              {screeningRows.map((row) => (
                <div className="ip-screening-row" key={row.title}>
                  <div className="ip-screening-category">
                    <span className={`ip-screening-dot ${row.tone}`} />
                    <div>
                      <strong>{row.title}</strong>
                      <span>{row.status}</span>
                    </div>
                  </div>

                  <div className="ip-screening-row-signal">
                    <span>{row.signal}</span>
                    <p>{row.note}</p>
                  </div>

                  <div className={`ip-screening-badge ${row.tone}`}>
                    {row.tone === 'clear'
                      ? 'Low signal'
                      : row.tone === 'watch'
                        ? 'Review'
                        : 'Priority'}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="ip-screening-side-column">
            <article className="ip-screening-side-card">
              <div className="ip-screening-side-heading">
                <span className="ip-screening-side-icon">
                  <Link2 size={17} />
                </span>
                <div>
                  <p className="eyebrow">Innovation context</p>
                  <h3>What is being screened</h3>
                </div>
              </div>

              <dl>
                <div>
                  <dt>Product</dt>
                  <dd>{innovation.name}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{innovation.productType}</dd>
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

            <article className="ip-screening-side-card">
              <div className="ip-screening-side-heading">
                <span className="ip-screening-side-icon gold">
                  <LockKeyhole size={17} />
                </span>
                <div>
                  <p className="eyebrow">Scope note</p>
                  <h3>What this prototype does</h3>
                </div>
              </div>

              <p className="ip-screening-scope">
                The current screening layer organises preliminary signals from the
                configured knowledge base. It does not create live patent, trademark,
                GI, design, or copyright registry search records.
              </p>
            </article>
          </aside>
        </section>

        <section className="ip-screening-next">
          <div>
            <div className="ip-screening-next-icon">
              <ArrowRight size={19} />
            </div>
            <div>
              <p className="eyebrow accent">Recommended next step</p>
              <h3>Check traditional knowledge before narrowing the filing strategy.</h3>
              <p>
                Continue to TK Intelligence for a focused review of documented
                traditional knowledge, prior-art signals, and related evidence.
              </p>
            </div>
          </div>

          <Link to="/tk-intelligence" className="primary-button">
            Open TK Assessment
            <ArrowRight size={16} />
          </Link>
        </section>

        <section className="ip-screening-disclaimer">
          <CircleAlert size={17} />
          <p>
            Advanced live patent and registry search is a future-scaling capability.
            Use the cited official evidence and current registry sources before making
            filing, branding, or commercialization decisions.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
