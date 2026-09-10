import { Activity, ArrowRight, BookOpen, CheckCircle2, CircleAlert, FilePlus2, Search, ShieldAlert, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { activityFeed, demoInnovation, mockEvidence, regulatoryUpdates } from '../data/mockData'

export function DashboardPage() {
  const checklist = [
    { label: 'Classification', ok: true, route: '/classification' },
    { label: 'IP Screening', ok: true, route: '/ip-explorer' },
    { label: 'TK Assessment', ok: false, route: '/tk-intelligence' },
    { label: 'ABS Assessment', ok: false, route: '/abs-assessment' },
    { label: 'Regulatory', ok: true, route: '/regulatory' },
  ]

  return (
    <AppShell title="Dashboard" subtitle="Monitor your innovations, assessments, evidence and next actions." showPrototypeLabel={false}>
      <div className="page-grid dashboard-grid">
        <section className="dashboard-intro">
          <div>
            <p className="eyebrow accent">Decision-support workspace</p>
            <h2>Innovation overview</h2>
          </div>
          <span className="small-label">India workspace</span>
        </section>

        <section className="dashboard-metrics" aria-label="Innovation overview metrics">
          <div className="metric-tile"><span>Active Innovations</span><strong>1</strong><small>Current workspace</small></div>
          <div className="metric-tile"><span>Assessments Completed</span><strong>3 / 5</strong><small>One passport</small></div>
          <div className="metric-tile"><span>Pending Actions</span><strong>2</strong><small>Needs review</small></div>
          <div className="metric-tile"><span>Evidence Items</span><strong>2</strong><small>Linked to innovation</small></div>
        </section>

        <section className="card-block passport-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Innovation Passport</p>
              <h2>{demoInnovation.name}</h2>
              <p className="passport-id">{demoInnovation.id} · {demoInnovation.jurisdiction} · {demoInnovation.classification}</p>
            </div>
            <div className="readiness-badge">Readiness {demoInnovation.readiness}%</div>
          </div>

          <div className="readiness-panel">
            <div className="readiness-copy"><strong>{demoInnovation.readiness}%</strong><span>3 of 5 assessments complete</span></div>
            <div className="progress-track" aria-label={`${demoInnovation.readiness}% readiness`}><span style={{ width: `${demoInnovation.readiness}%` }} /></div>
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
          <Link to="/innovation/demo" className="primary-button passport-button">Open Innovation Passport <ArrowRight size={16} /></Link>
        </section>

        <section className="card-block next-actions-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Next Actions</p>
              <h3>2 actions need your attention</h3>
            </div>
            <CircleAlert size={19} className="accent-icon" />
          </div>
          <div className="next-action-list">
            <Link to="/tk-intelligence" className="next-action-row"><CircleAlert size={16} /><span>Complete Traditional Knowledge Assessment</span><ArrowRight size={14} /></Link>
            <Link to="/abs-assessment" className="next-action-row"><CircleAlert size={16} /><span>Complete ABS Assessment</span><ArrowRight size={14} /></Link>
          </div>
          <div className="sahayak-helper">
            <div><strong>Need help with your innovation?</strong><span>Ask MitraAI about IP, TK, ABS, or regulatory requirements.</span></div>
            <Link to="/sahayak" state={{ innovation: demoInnovation }} className="secondary-button"><Sparkles size={15} /> Ask MitraAI</Link>
          </div>
        </section>

        <section className="card-block radar-card">
          <div className="section-head">
            <div className="inline-heading">
              <ShieldAlert size={18} />
              <h3>Regulatory Radar</h3>
            </div>
            <span className="soft-tag">Prototype / Curated Monitoring</span>
          </div>
          <ul className="list-stack">
            {regulatoryUpdates.map((item) => (
              <li key={item.heading} className={item.state === 'Action required' ? 'radar-action' : item.state === 'Watchlist' ? 'radar-watch' : 'radar-normal'}>
                <strong>{item.heading}</strong>
                <span>{item.state}</span>
              </li>
            ))}
          </ul>
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
              <li key={item.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.type} · {item.time}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-block quick-actions-card">
          <div className="section-head">
            <div className="inline-heading">
              <FilePlus2 size={18} />
              <h3>Quick actions</h3>
            </div>
          </div>
          <div className="button-stack">
            <Link to="/innovation/new" className="action-tile"><FilePlus2 size={17} /><span>Create Innovation</span><ArrowRight size={14} /></Link>
            <Link to="/tk-intelligence" className="action-tile"><CheckCircle2 size={17} /><span>Continue Assessment</span><ArrowRight size={14} /></Link>
            <Link to="/sources" className="action-tile"><Search size={17} /><span>Search Evidence</span><ArrowRight size={14} /></Link>
            <Link to="/sahayak" state={{ innovation: demoInnovation }} className="action-tile"><Sparkles size={17} /><span>Ask MitraAI</span><ArrowRight size={14} /></Link>
          </div>
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
          <Link to="/innovation/demo" className="link-button inline-link">View all evidence <ArrowRight size={14} /></Link>
        </section>
      </div>
    </AppShell>
  )
}
