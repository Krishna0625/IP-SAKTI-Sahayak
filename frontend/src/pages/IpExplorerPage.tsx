import { AppShell } from '../components/layout/AppShell'

const screeningRows = [
  { title: 'Patent screening', status: 'Pending manual review', signal: 'Potential prior art relevance' },
  { title: 'Trademark', status: 'Demo review only', signal: 'Brand naming check required' },
  { title: 'GI', status: 'No direct GI signal', signal: 'Low immediate risk' },
  { title: 'Copyright', status: 'Not primary issue', signal: 'Packaging copy to review' },
  { title: 'Design', status: 'Placeholder evidence', signal: 'Packaging design review' },
  { title: 'Prior-art / TK signal', status: 'Preliminary signal', signal: 'Traditional knowledge mapping needed' },
]

export function IpExplorerPage() {
  return (
    <AppShell title="IP Explorer" subtitle="Evidence and screening review">
      <div className="page-grid narrow-layout">
        <section className="card-block table-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">IP Screening</p>
              <h2>Evidence and screening dashboard</h2>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {screeningRows.map((row) => (
                <tr key={row.title}>
                  <td>{row.title}</td>
                  <td>{row.status}</td>
                  <td>{row.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  )
}
