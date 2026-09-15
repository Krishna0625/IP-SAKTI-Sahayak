import { Activity, ArrowRight, BookOpen, CheckCircle2, CircleAlert, FilePlus2, Search, ShieldAlert, Sparkles } from 'lucide-react'
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
    { label: 'Add Innovation', ok: hasInnovation, route: '/innovation/new' },
    { label: 'Classification', ok: true, route: '/classification' },
    { label: 'IP Screening', ok: true, route: '/ip-explorer' },
    { label: 'TK Assessment', ok: false, route: '/tk-intelligence' },
    { label: 'ABS Assessment', ok: false, route: '/abs-assessment' },
    { label: 'Regulatory Review', ok: true, route: '/regulatory' },
  ]
  const quickActions = [
    { label: 'Create Innovation', route: '/innovation/new', icon: FilePlus2 },
    { label: 'Ask MitraAI Sahayak', route: '/sahayak', icon: Sparkles },
    { label: 'Check Classification', route: '/classification', icon: CheckCircle2 },
    { label: 'Review IP Intelligence', route: '/ip-explorer', icon: ShieldAlert },
    { label: 'Check Traditional Knowledge', route: '/tk-intelligence', icon: BookOpen },
    { label: 'Review ABS Requirements', route: '/abs-assessment', icon: Search },
    { label: 'Explore Evidence & Sources', route: '/sources', icon: Activity },
  ]
  const activityRoutes: Record<string, string> = {
    Classification: '/classification',
    Evidence: '/ip-explorer',
    ABS: '/abs-assessment',
    Regulatory: '/regulatory',
  }

  return (
    <AppShell title="Dashboard" subtitle="Monitor your innovations, assessments, evidence and next actions." showPrototypeLabel={false}>
      <div className="page-grid dashboard-grid">
        <section className="dashboard-welcome card-block">
          <div>
            <p className="eyebrow accent">Decision-support workspace</p>
            <h1>Welcome to MitraAI</h1>
            <p>Your workspace for Innovation, IP &amp; Regulatory Intelligence.</p>
            <span className="welcome-copy">Move from an innovation idea to classification, IP screening, Traditional Knowledge, ABS and regulatory assessment with evidence-backed guidance.</span>
            <div className="button-row">
              <Link to="/innovation/new" className="primary-button"><FilePlus2 size={16} /> Start New Innovation</Link>
              <Link to="/sahayak" state={{ innovation }} className="secondary-button"><Sparkles size={16} /> Ask MitraAI Sahayak</Link>
            </div>
          </div>
          <div className="welcome-route"><span className="small-label">Start here</span><strong>Build an evidence-backed Innovation Assessment</strong><span>Begin with your product idea, then follow the assessment path.</span></div>
        </section>

        {!hasInnovation ? (
          <section className="card-block onboarding-card"><div><p className="eyebrow accent">New workspace</p><h2>Let&apos;s get started</h2><p className="muted-text">Create your first innovation record to begin your assessment.</p></div><Link to="/innovation/new" className="primary-button">Create Innovation <ArrowRight size={16} /></Link><div className="onboarding-help"><strong>Not sure where to begin?</strong><Link to="/sahayak" className="link-button">Ask AI Sahayak <Sparkles size={14} /></Link></div></section>
        ) : (
          <section className="card-block continue-card"><div><p className="eyebrow accent">Continue your work</p><h2>{innovation.name}</h2><p className="muted-text">Next recommended step: Complete TK &amp; ABS Assessment</p></div><Link to="/tk-intelligence" className="primary-button">Continue Assessment <ArrowRight size={16} /></Link></section>
        )}

        <section className="card-block workflow-card"><div className="section-head"><div><p className="eyebrow accent">Start here</p><h2>Follow your assessment path</h2></div><span className="small-label">{hasInnovation ? '3 of 5 complete' : 'Begin with step 1'}</span></div><div className="workflow-list">{checklist.map((item, index) => <Link key={item.label} to={item.route} className={`workflow-step ${item.ok ? 'complete' : 'pending'}`}><span className="workflow-number">{item.ok ? <CheckCircle2 size={16} /> : index + 1}</span><span><strong>{item.label}</strong><small>{item.ok ? 'Complete' : 'Review required'}</small></span><ArrowRight size={15} /></Link>)}</div></section>

        <section className="card-block passport-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Innovation Assessment</p>
              <h2>{innovation.name}</h2>
              <p className="passport-id">{innovation.id} · {innovation.jurisdiction} · {innovation.classification}</p>
            </div>
            <div className="readiness-badge">Readiness {innovation.readiness}%</div>
          </div>

          <div className="readiness-panel">
            <div className="readiness-copy"><strong>{innovation.readiness}% Ready</strong><span>2 assessments need attention</span></div>
            <div className="progress-track" aria-label={`${innovation.readiness}% readiness`}><span style={{ width: `${innovation.readiness}%` }} /></div>
            <Link to="/tk-intelligence" className="link-button readiness-link">Review Pending Items <ArrowRight size={14} /></Link>
          </div>

          <div className="checklist-box">
            {checklist.map((item) => (
              <Link key={item.label} to={item.route} className="assessment-row">
                <span className={item.ok ? 'status success' : 'status warning'} aria-label={item.ok ? 'Complete' : 'Review required'}>{item.ok ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}</span>
                <span className="assessment-name">{item.label}</span>
                <span className={item.ok ? 'assessment-state complete' : 'assessment-state review'}>{item.ok ? 'Complete' : 'Review Required'}</span>
                <span className="assessment-action">{item.ok ? 'View' : 'Continue'} <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
          <Link to={`/innovation/${innovation.id}`} className="primary-button passport-button">Open Innovation Assessment <ArrowRight size={16} /></Link>
        </section>

        <section className="card-block quick-actions-card">
          <div className="section-head">
            <div><p className="eyebrow accent">Quick start</p><h3>What would you like to do?</h3></div>
          </div>
          <div className="quick-action-grid">{quickActions.map(({ label, route, icon: Icon }) => <Link key={label} to={route} state={route === '/sahayak' ? { innovation } : undefined} className="action-tile"><Icon size={17} /><span>{label}</span><ArrowRight size={14} /></Link>)}</div>
        </section>

        <section className="card-block next-actions-card">
          <div className="section-head">
            <div><p className="eyebrow accent">Next actions</p><h3>2 assessments need attention</h3></div><CircleAlert size={19} className="accent-icon" />
          </div>
          <div className="next-action-list"><Link to="/tk-intelligence" className="next-action-row"><CircleAlert size={16} /><span>Complete Traditional Knowledge Assessment</span><ArrowRight size={14} /></Link><Link to="/abs-assessment" className="next-action-row"><CircleAlert size={16} /><span>Complete ABS Assessment</span><ArrowRight size={14} /></Link></div>
        </section>

        <section className="card-block evidence-card">
          <div className="section-head">
            <div className="inline-heading">
              <Activity size={18} />
              <h3>Recent Activity</h3>
            </div>
          </div>
          <ul className="activity-list">
            {activityFeed.map((item) => (
              <li key={item.id}><Link to={activityRoutes[item.type] ?? '/dashboard'} className="activity-link">
                <span className="activity-dot" />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.type} · {item.time}</small>
                </div>
                <ArrowRight size={14} /></Link></li>
            ))}
          </ul>
        </section>

        <section className="card-block radar-card">
          <div className="section-head"><div className="inline-heading"><ShieldAlert size={18} /><h3>Regulatory Radar</h3></div><span className="soft-tag">Prototype / Curated Monitoring</span></div>
          <ul className="list-stack">{regulatoryUpdates.map((item) => <li key={item.heading} className={item.state === 'Action required' ? 'radar-action' : item.state === 'Watchlist' ? 'radar-watch' : 'radar-normal'}><strong>{item.heading}</strong><span>{item.state}</span></li>)}</ul>
        </section>

        <section className="card-block evidence-mini-card">
          <div className="section-head">
            <div className="inline-heading">
              <BookOpen size={18} />
              <h3>Evidence & Sources</h3>
            </div>
          </div>
          <p className="muted-text">2 evidence items linked to this innovation</p>
          <div className="mini-evidence-list">
            {mockEvidence.slice(0, 2).map((item) => (
              <div key={item.id} className="mini-evidence-item">
                <strong>{item.title}</strong>
                <span>{item.id === 'e1' ? 'Classification · Official source' : 'Traditional Knowledge · Reference evidence'}</span>
              </div>
            ))}
          </div>
          <Link to="/sources" className="link-button inline-link">View all evidence <ArrowRight size={14} /></Link>
        </section>

        <section className="card-block sahayak-cta"><div><p className="eyebrow accent">MitraAI Sahayak</p><h3>Need help deciding what to do next?</h3><p className="muted-text">Ask MitraAI Sahayak about classification, IP, Traditional Knowledge, ABS or regulatory requirements.</p></div><Link to="/sahayak" state={{ innovation }} className="secondary-button"><Sparkles size={15} /> Open MitraAI Sahayak</Link></section>
      </div>
    </AppShell>
  )
}
