import { AppShell } from '../components/layout/AppShell'
import { sourceRecords } from '../data/mockData'

export function SourcesPage() {
  return (
    <AppShell title="Sources" subtitle="Demo source library">
      <div className="page-grid narrow-layout">
        <section className="card-block table-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Source Library</p>
              <h2>Demo / Placeholder source records</h2>
            </div>
          </div>

          <table className="data-table">
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
                  <td>{row.source}</td>
                  <td>{row.authority}</td>
                  <td>{row.jurisdiction}</td>
                  <td>{row.category}</td>
                  <td>{row.version}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  )
}
