import { ArrowRight, FilePlus2, FolderOpen, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'
import './my-innovations-overrides.css'

const storageKey = 'ip-sakti-innovations'

function readInnovations(): InnovationRecord[] {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored === null ? [demoInnovation] : JSON.parse(stored) as InnovationRecord[]
  } catch {
    return []
  }
}

function formatUpdatedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function MyInnovationsPage() {
  const [query, setQuery] = useState('')
  const innovations = readInnovations()

  const filteredInnovations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return innovations

    return innovations.filter((innovation) =>
      [innovation.name, innovation.productType, innovation.jurisdiction, innovation.classification]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
  }, [innovations, query])

  const averageReadiness = innovations.length
    ? Math.round(innovations.reduce((total, item) => total + item.readiness, 0) / innovations.length)
    : 0

  const reviewRequired = innovations.filter((innovation) => innovation.readiness < 80).length

  return (
    <AppShell title="My Innovations" subtitle="Your saved product workspace.">
      <div className="page-grid innovations-page innovations-page-refresh">
        <section className="innovations-hero">
          <div className="innovations-hero-copy">
            <p className="eyebrow accent">Innovation workspace</p>
            <h2>Keep every product assessment in one place.</h2>
            <p className="muted-text">
              Open an innovation to continue classification, IP screening, Traditional Knowledge, ABS and regulatory review.
            </p>
            <div className="button-row">
              <Link to="/innovation/new" className="primary-button">
                <FilePlus2 size={16} /> Create New Innovation
              </Link>
              <Link to="/sahayak" className="secondary-button">
                <Sparkles size={16} /> Ask AI Sahayak
              </Link>
            </div>
          </div>

          <div className="innovations-hero-mark" aria-hidden="true">
            <FolderOpen size={30} />
            <span>Workspace</span>
            <strong>{innovations.length.toString().padStart(2, '0')}</strong>
            <small>saved innovation{innovations.length === 1 ? '' : 's'}</small>
          </div>
        </section>

        <section className="innovation-summary-grid" aria-label="Innovation workspace summary">
          <article className="card-block innovation-summary-card">
            <span className="small-label">Saved innovations</span>
            <strong>{innovations.length}</strong>
            <p>Products available in your workspace.</p>
          </article>
          <article className="card-block innovation-summary-card">
            <span className="small-label">Average readiness</span>
            <strong>{averageReadiness}%</strong>
            <p>Current completion signal across saved products.</p>
          </article>
          <article className="card-block innovation-summary-card">
            <span className="small-label">Review required</span>
            <strong>{reviewRequired}</strong>
            <p>Innovations below the current readiness threshold.</p>
          </article>
        </section>

        <section className="card-block innovations-toolbar innovations-toolbar-refresh">
          <div className="toolbar-copy">
            <p className="eyebrow accent">Saved work</p>
            <h3>Your innovations</h3>
          </div>
          <div className="toolbar-controls">
            <label className="innovation-search innovation-search-refresh">
              <Search size={17} />
              <span className="sr-only">Search innovations</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, type, classification or jurisdiction"
              />
            </label>
            <span className="small-label">{filteredInnovations.length} of {innovations.length}</span>
          </div>
        </section>

        {innovations.length === 0 ? (
          <section className="card-block innovations-empty innovations-empty-refresh">
            <p className="eyebrow accent">Start your workspace</p>
            <h2>No innovations saved yet.</h2>
            <p className="muted-text">Create your first innovation record to begin the assessment journey.</p>
            <div className="button-row">
              <Link to="/innovation/new" className="primary-button"><FilePlus2 size={16} /> Create Innovation</Link>
              <Link to="/sahayak" className="secondary-button"><Sparkles size={16} /> Ask AI Sahayak</Link>
            </div>
          </section>
        ) : filteredInnovations.length === 0 ? (
          <section className="card-block innovations-empty innovations-empty-refresh">
            <p className="eyebrow accent">No match</p>
            <h2>No saved innovation matches your search.</h2>
            <p className="muted-text">Try a different product name, type, classification or jurisdiction.</p>
          </section>
        ) : (
          <section className="innovation-list innovation-list-refresh" aria-label="Saved innovations">
            {filteredInnovations.map((innovation) => (
              <article key={innovation.id} className="card-block innovation-card innovation-card-refresh">
                <div className="innovation-card-head">
                  <div>
                    <p className="eyebrow accent">{innovation.id === demoInnovation.id ? 'Demo innovation' : 'Saved innovation'}</p>
                    <h2>{innovation.name}</h2>
                    <p className="muted-text">{innovation.description}</p>
                  </div>
                  <span className="soft-tag">{innovation.jurisdiction}</span>
                </div>

                <div className="innovation-detail-row">
                  <div>
                    <span className="small-label">Product type</span>
                    <strong>{innovation.productType}</strong>
                  </div>
                  <div>
                    <span className="small-label">Classification</span>
                    <strong>{innovation.classification}</strong>
                  </div>
                  <div>
                    <span className="small-label">Updated</span>
                    <strong>{formatUpdatedDate(innovation.createdAt)}</strong>
                  </div>
                </div>

                <div className="innovation-progress innovation-progress-refresh">
                  <div>
                    <strong>{innovation.readiness}%</strong>
                    <span>Readiness</span>
                  </div>
                  <div>
                    <div className="progress-track" aria-label={`${innovation.readiness}% readiness`}>
                      <span style={{ width: `${innovation.readiness}%` }} />
                    </div>
                    <small>{innovation.readiness >= 80 ? 'Ready for next review' : 'Review items remain'}</small>
                  </div>
                </div>

                <div className="innovation-card-footer">
                  <span className="small-label">Confidence {innovation.confidence}%</span>
                  <div className="innovation-card-actions">
                    <Link to={`/innovation/${innovation.id}`} className="secondary-button">
                      Open Innovation <ArrowRight size={15} />
                    </Link>
                    <Link to={`/innovation/${innovation.id}`} className="primary-button">
                      Continue Assessment <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <section className="card-block future-options future-options-refresh">
          <div>
            <p className="eyebrow accent">Workspace roadmap</p>
            <h3>More workspace capabilities are planned.</h3>
            <p className="muted-text">These are visible for roadmap clarity and are not active yet.</p>
          </div>
          <div className="future-tags">
            <span>Advanced Patent Search · Coming Soon</span>
            <span>Export Report · Coming Soon</span>
            <span>Collaboration · Coming Soon</span>
            <span>Innovation Comparison · Coming Soon</span>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
