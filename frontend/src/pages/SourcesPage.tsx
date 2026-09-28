import { BookOpen, Database, ShieldCheck } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { sourceRecords } from '../data/mockData'
import './sources.css'

export function SourcesPage() {
  return (
    <AppShell title="Evidence & Sources" subtitle="Demo source library">
      <div className="sources-page">
        <section className="sources-hero">
          <div>
            <p className="sources-eyebrow">EVIDENCE &amp; SOURCES</p>
            <h1>Source library for grounded review</h1>
            <p className="sources-intro">
              Review the curated source records used to support the prototype
              workflows across IPR, traditional knowledge, ABS, and regulatory
              guidance.
            </p>
          </div>

          <div className="sources-hero-badge">
            <Database size={16} />
            <span>Demo source library</span>
          </div>
        </section>

        <section className="sources-summary-grid">
          <article className="sources-summary-card">
            <div className="sources-summary-icon">
              <Database size={18} />
            </div>
            <div>
              <span>Total records</span>
              <strong>{sourceRecords.length}</strong>
            </div>
          </article>

          <article className="sources-summary-card">
            <div className="sources-summary-icon">
              <BookOpen size={18} />
            </div>
            <div>
              <span>Evidence categories</span>
              <strong>IPR &amp; compliance</strong>
            </div>
          </article>

          <article className="sources-summary-card">
            <div className="sources-summary-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span>Library status</span>
              <strong>Curated prototype</strong>
            </div>
          </article>
        </section>

        <section className="sources-library-card">
          <div className="sources-section-heading">
            <div>
              <span className="sources-section-label">Source records</span>
              <h2>Available evidence entries</h2>
              <p>
                These records represent the source metadata available to the
                current prototype.
              </p>
            </div>

            <span className="sources-record-count">
              {sourceRecords.length} records
            </span>
          </div>

          <div className="sources-table-wrap">
            <table className="sources-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Authority</th>
                  <th>Jurisdiction</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {sourceRecords.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="source-name-cell">
                        <div className="source-name-icon">
                          <BookOpen size={15} />
                        </div>
                        <strong>{row.source}</strong>
                      </div>
                    </td>

                    <td>{row.authority}</td>
                    <td>{row.jurisdiction}</td>
                    <td>
                      <span className="source-category-pill">
                        {row.category}
                      </span>
                    </td>
                    <td className="source-version">{row.version}</td>
                    <td>
                      <span className="source-status-pill">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sources-notice">
          <div className="sources-notice-icon">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>Prototype source-library notice</strong>
            <p>
              The current library is a demo / curated source view. Source
              records shown here are metadata entries for the prototype and
              should not be treated as a live government publication feed.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}