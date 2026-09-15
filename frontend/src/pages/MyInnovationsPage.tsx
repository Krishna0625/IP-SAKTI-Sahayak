import { ArrowRight, FilePlus2, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'

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
    return innovations.filter((innovation) => [innovation.name, innovation.productType, innovation.jurisdiction, innovation.classification].some((value) => value.toLowerCase().includes(normalizedQuery)))
  }, [innovations, query])

  return (
    <AppShell title="My Innovations" subtitle="Continue product assessments and evidence review.">
      <div className="page-grid innovations-page">
        <section className="innovations-header">
          <div>
            <p className="eyebrow accent">Innovation workspace</p>
            <h2>My Innovations</h2>
            <p className="muted-text">Review saved products and continue their classification, IP, TK, ABS and regulatory assessments.</p>
          </div>
          <Link to="/innovation/new" className="primary-button"><FilePlus2 size={16} /> Create New Innovation</Link>
        </section>

        <section className="card-block innovations-toolbar">
          <label className="innovation-search">
            <Search size={17} />
            <span className="sr-only">Search innovations</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product, type or jurisdiction" />
          </label>
          <span className="small-label">{filteredInnovations.length} of {innovations.length} innovations</span>
        </section>

        {innovations.length === 0 ? (
          <section className="card-block innovations-empty">
            <p className="eyebrow accent">No saved innovations</p>
            <h2>Your innovation workspace is empty.</h2>
            <p className="muted-text">Create your first innovation record to begin classification, IP, TK, ABS and regulatory assessment.</p>
            <div className="button-row"><Link to="/innovation/new" className="primary-button"><FilePlus2 size={16} /> Create Innovation</Link><Link to="/sahayak" className="secondary-button"><Sparkles size={16} /> Ask AI Sahayak</Link></div>
          </section>
        ) : filteredInnovations.length === 0 ? (
          <section className="card-block innovations-empty"><h2>No matching innovations</h2><p className="muted-text">Try a different product name, type or jurisdiction.</p></section>
        ) : (
          <section className="innovation-list" aria-label="Saved innovations">
            {filteredInnovations.map((innovation) => (
              <article key={innovation.id} className="card-block innovation-card">
                <div className="innovation-card-head">
                  <div><p className="eyebrow accent">{innovation.id === demoInnovation.id ? 'Demo innovation' : 'Saved innovation'}</p><h2>{innovation.name}</h2></div>
                  <span className="soft-tag">{innovation.jurisdiction}</span>
                </div>
                <div className="innovation-meta"><span>{innovation.productType}</span><span>{innovation.classification}</span><span>Updated {formatUpdatedDate(innovation.createdAt)}</span></div>
                <div className="innovation-progress"><div><strong>{innovation.readiness}%</strong><span>Readiness</span></div><div className="progress-track" aria-label={`${innovation.readiness}% readiness`}><span style={{ width: `${innovation.readiness}%` }} /></div></div>
                <div className="innovation-card-actions"><Link to={`/innovation/${innovation.id}`} className="primary-button">Open Innovation <ArrowRight size={15} /></Link><Link to={`/innovation/${innovation.id}`} className="secondary-button">Continue Assessment <ArrowRight size={15} /></Link></div>
              </article>
            ))}
          </section>
        )}

        <section className="card-block future-options"><div><p className="eyebrow accent">Future scaling</p><h3>More workspace capabilities are planned</h3><p className="muted-text">These options are visible for roadmap clarity and are not active yet.</p></div><div className="future-tags"><span>Advanced Patent Search · Coming Soon</span><span>Export Report · Coming Soon</span><span>Collaboration · Coming Soon</span><span>Innovation Comparison · Coming Soon</span><span>Automated Regulatory Monitoring · Coming Soon</span></div></section>
      </div>
    </AppShell>
  )
}