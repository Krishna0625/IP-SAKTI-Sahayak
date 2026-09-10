import { AppShell } from '../components/layout/AppShell'

export function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Prototype preferences">
      <div className="page-grid narrow-layout">
        <section className="card-block form-card">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Preferences</p>
              <h2>Application settings</h2>
            </div>
          </div>

          <div className="settings-grid">
            <label className="field-block">
              <span>Language</span>
              <select defaultValue="English">
                <option>English</option>
                <option>Hindi</option>
                <option>Kannada</option>
              </select>
            </label>
            <label className="field-block">
              <span>Default jurisdiction</span>
              <select defaultValue="India">
                <option>India</option>
                <option>International</option>
              </select>
            </label>
            <label className="field-block">
              <span>Notification preference</span>
              <select defaultValue="Weekly summary">
                <option>Weekly summary</option>
                <option>Daily digest</option>
                <option>Critical alerts only</option>
              </select>
            </label>
            <div className="about-box">
              <h3>About MitraAI</h3>
              <p>
                MitraAI is a prototype platform for preliminary Ayurveda IP, traditional knowledge,
                and regulatory guidance.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
