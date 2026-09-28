import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FilePlus2,
  FileSearch,
  Gauge,
  Leaf,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { activityFeed, demoInnovation, mockEvidence, regulatoryUpdates } from '../data/mockData'
import type { InnovationRecord } from '../types'

const storageKey = 'ip-sakti-innovations'

function readInnovations(): InnovationRecord[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as InnovationRecord[]
  } catch {
    return []
  }
}

export function DashboardPage() {
  const innovations = readInnovations()
  const hasInnovation = innovations.length > 0
  const innovation = innovations[0] ?? demoInnovation

  const checklist = [
    { label: 'Add Innovation', ok: hasInnovation, route: '/innovation/new', icon: FilePlus2 },
    { label: 'Classification', ok: true, route: '/classification', icon: CheckCircle2 },
    { label: 'IP Screening', ok: true, route: '/ip-explorer', icon: ShieldCheck },
    { label: 'TK Assessment', ok: false, route: '/tk-intelligence', icon: Leaf },
    { label: 'ABS Assessment', ok: false, route: '/abs-assessment', icon: Search },
    { label: 'Regulatory Review', ok: true, route: '/regulatory', icon: Gauge },
  ]

  const completedCount = checklist.filter((item) => item.ok).length
  const pendingCount = checklist.length - completedCount
  const quickActions = [
    { label: 'Create Innovation', route: '/innovation/new', icon: FilePlus2 },
    { label: 'Ask MitraAI Sahayak', route: '/sahayak', icon: Sparkles },
    { label: 'Check Classification', route: '/classification', icon: CheckCircle2 },
    { label: 'Review IP Intelligence', route: '/ip-explorer', icon: ShieldCheck },
    { label: 'Check Traditional Knowledge', route: '/tk-intelligence', icon: Leaf },
    { label: 'Review ABS Requirements', route: '/abs-assessment', icon: Search },
    { label: 'Explore Evidence & Sources', route: '/sources', icon: BookOpen },
  ]

  const activityRoutes: Record<string, string> = {
    Classification: '/classification',
    Evidence: '/ip-explorer',
    ABS: '/abs-assessment',
    Regulatory: '/regulatory',
  }

  const priorityAction = pendingCount > 0
    ? checklist.find((item) => !item.ok)
    : checklist[0]

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your evidence-backed innovation workspace."
      showPrototypeLabel={false}
    >
      <div className="dashboard-v2">
        <section className="dashboard-v2-hero">
          <div className="dashboard-v2-hero-copy">
            <p className="eyebrow accent">Decision-support workspace</p>
            <h1>Move your innovation forward with evidence.</h1>
            <p>
              Start with an innovation, then move through classification, IP screening,
              Traditional Knowledge, ABS and regulatory review in one guided workspace.
            </p>
            <div className="dashboard-v2-actions">
              <Link to="/innovation/new" className="primary-button">
                <FilePlus2 size={16} />
                Start New Innovation
              </Link>
              <Link to="/sahayak" state={{ innovation }} className="secondary-button">
                <Sparkles size={16} />
                Ask MitraAI Sahayak
              </Link>
            </div>
          </div>

          <div className="dashboard-v2-hero-side">
            <div className="dashboard-v2-side-label">Current workspace</div>
            <strong>{innovation.name}</strong>
            <span>{innovation.jurisdiction} · {innovation.classification}</span>
            <div className="dashboard-v2-side-meta">
              <span>Readiness</span>
              <b>{innovation.readiness}%</b>
            </div>
            <div className="progress-track" aria-label={`${innovation.readiness}% readiness`}>
              <span style={{ width: `${innovation.readiness}%` }} />
            </div>
            <Link to={`/innovation/${innovation.id}`} className="dashboard-v2-inline-link">
              Open innovation assessment <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <section className="dashboard-v2-metrics">
          <div className="dashboard-v2-metric">
            <span>Assessment progress</span>
            <strong>{completedCount}/{checklist.length}</strong>
            <small>workflow checkpoints complete</small>
          </div>
          <div className="dashboard-v2-metric">
            <span>Readiness</span>
            <strong>{innovation.readiness}%</strong>
            <small>current innovation readiness</small>
          </div>
          <div className="dashboard-v2-metric">
            <span>Evidence linked</span>
            <strong>{mockEvidence.length}</strong>
            <small>knowledge-base references</small>
          </div>
          <div className="dashboard-v2-metric metric-alert">
            <span>Needs attention</span>
            <strong>{pendingCount}</strong>
            <small>{pendingCount === 1 ? 'checkpoint' : 'checkpoints'} to review</small>
          </div>
        </section>

        <section className="dashboard-v2-section dashboard-v2-workflow">
          <div className="dashboard-v2-section-head">
            <div>
              <p className="eyebrow accent">Assessment path</p>
              <h2>Follow the innovation journey</h2>
            </div>
            <span className="small-label">{completedCount} of {checklist.length} complete</span>
          </div>

          <div className="dashboard-v2-workflow-grid">
            {checklist.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.route}
                  className={`dashboard-v2-step ${item.ok ? 'is-complete' : 'is-pending'}`}
                >
                  <span className="dashboard-v2-step-number">
                    {item.ok ? <CheckCircle2 size={15} /> : index + 1}
                  </span>
                  <span className="dashboard-v2-step-icon"><Icon size={16} /></span>
                  <span className="dashboard-v2-step-copy">
                    <strong>{item.label}</strong>
                    <small>{item.ok ? 'Complete' : 'Review required'}</small>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              )
            })}
          </div>
        </section>

        <section className="dashboard-v2-main-grid">
          <article className="dashboard-v2-card dashboard-v2-assessment-card">
            <div className="dashboard-v2-card-head">
              <div>
                <p className="eyebrow accent">Innovation assessment</p>
                <h2>{innovation.name}</h2>
                <span className="dashboard-v2-meta-line">{innovation.id} · {innovation.jurisdiction} · {innovation.classification}</span>
              </div>
              <span className="readiness-badge">{innovation.readiness}% ready</span>
            </div>

            <div className="dashboard-v2-readiness">
              <div>
                <strong>{pendingCount} {pendingCount === 1 ? 'item' : 'items'} need attention</strong>
                <span>Complete the remaining assessments before making a protection or compliance decision.</span>
              </div>
              {priorityAction ? (
                <Link to={priorityAction.route} className="dashboard-v2-inline-link">
                  Continue with {priorityAction.label} <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>

            <div className="dashboard-v2-assessment-list">
              {checklist.map((item) => (
                <Link key={item.label} to={item.route} className="dashboard-v2-assessment-row">
                  <span className={item.ok ? 'status success' : 'status warning'}>
                    {item.ok ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
                  </span>
                  <span className="dashboard-v2-assessment-name">{item.label}</span>
                  <span className={item.ok ? 'assessment-state complete' : 'assessment-state review'}>
                    {item.ok ? 'Complete' : 'Review required'}
                  </span>
                  <span className="assessment-action">
                    {item.ok ? 'View' : 'Continue'} <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </article>

          <article className="dashboard-v2-card dashboard-v2-actions-card">
            <div className="dashboard-v2-card-head">
              <div>
                <p className="eyebrow accent">Quick start</p>
                <h2>Choose your next move</h2>
              </div>
            </div>
            <div className="dashboard-v2-action-grid">
              {quickActions.map(({ label, route, icon: Icon }) => (
                <Link
                  key={label}
                  to={route}
                  state={route === '/sahayak' ? { innovation } : undefined}
                  className="dashboard-v2-action-tile"
                >
                  <span className="dashboard-v2-action-icon"><Icon size={16} /></span>
                  <span>{label}</span>
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-v2-lower-grid">
          <article className="dashboard-v2-card">
            <div className="dashboard-v2-card-head">
              <div className="inline-heading">
                <Activity size={18} />
                <h3>Recent activity</h3>
              </div>
              <Link to="/updates" className="dashboard-v2-text-link">View updates <ArrowRight size={13} /></Link>
            </div>
            <ul className="dashboard-v2-list">
              {activityFeed.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link to={activityRoutes[item.type] ?? '/dashboard'} className="dashboard-v2-list-row">
                    <span className="dashboard-v2-list-dot" />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.type} · {item.time}</small>
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-v2-card">
            <div className="dashboard-v2-card-head">
              <div className="inline-heading">
                <Gauge size={18} />
                <h3>Regulatory radar</h3>
              </div>
              <span className="soft-tag">Curated monitoring</span>
            </div>
            <ul className="dashboard-v2-radar-list">
              {regulatoryUpdates.slice(0, 3).map((item) => (
                <li key={item.heading} className={item.state === 'Action required' ? 'is-action' : item.state === 'Watchlist' ? 'is-watch' : ''}>
                  <strong>{item.heading}</strong>
                  <span>{item.state}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-v2-card">
            <div className="dashboard-v2-card-head">
              <div className="inline-heading">
                <FileSearch size={18} />
                <h3>Evidence &amp; sources</h3>
              </div>
              <Link to="/sources" className="dashboard-v2-text-link">View all <ArrowRight size={13} /></Link>
            </div>
            <p className="dashboard-v2-muted">Recent knowledge-base references connected to the workspace.</p>
            <div className="dashboard-v2-evidence-list">
              {mockEvidence.slice(0, 2).map((item) => (
                <Link key={item.id} to="/sources" className="dashboard-v2-evidence-item">
                  <strong>{item.title}</strong>
                  <span>{item.id === 'e1' ? 'Classification · Official source' : 'Traditional Knowledge · Reference evidence'}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-v2-sahayak">
          <div>
            <p className="eyebrow accent">MitraAI Sahayak</p>
            <h2>Have a question before you choose the next step?</h2>
            <p>Ask about classification, patents, trademarks, GI, Traditional Knowledge, ABS or regulatory requirements.</p>
          </div>
          <Link to="/sahayak" state={{ innovation }} className="secondary-button">
            <Sparkles size={15} />
            Open MitraAI Sahayak
          </Link>
        </section>
      </div>
    </AppShell>
  )
}
