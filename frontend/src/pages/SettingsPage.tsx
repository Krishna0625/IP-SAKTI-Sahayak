import { Globe2, Info, Settings2, Bell } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import './settings.css'

export function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Prototype preferences">
      <div className="settings-page">
        <section className="settings-hero">
          <div>
            <p className="settings-eyebrow">PREFERENCES</p>
            <h1>Application settings</h1>
            <p className="settings-intro">
              Configure the language, jurisdiction, and notification preferences
              used throughout the MitraAI prototype.
            </p>
          </div>

          <div className="settings-hero-badge">
            <Settings2 size={16} />
            <span>Prototype preferences</span>
          </div>
        </section>

        <section className="settings-layout">
          <div className="settings-main-card">
            <div className="settings-section-heading">
              <div>
                <span className="settings-section-label">General preferences</span>
                <h2>Workspace configuration</h2>
                <p>
                  These controls currently represent the prototype's default
                  application preferences.
                </p>
              </div>
            </div>

            <div className="settings-fields">
              <label className="settings-field">
                <div className="settings-field-label">
                  <Globe2 size={16} />
                  <span>Language</span>
                </div>

                <select defaultValue="English">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                </select>

                <small>
                  Language preference for the application interface.
                </small>
              </label>

              <label className="settings-field">
                <div className="settings-field-label">
                  <Globe2 size={16} />
                  <span>Default jurisdiction</span>
                </div>

                <select defaultValue="India">
                  <option>India</option>
                  <option>International</option>
                </select>

                <small>
                  Default legal context used when reviewing information.
                </small>
              </label>

              <label className="settings-field">
                <div className="settings-field-label">
                  <Bell size={16} />
                  <span>Notification preference</span>
                </div>

                <select defaultValue="Weekly summary">
                  <option>Weekly summary</option>
                  <option>Daily digest</option>
                  <option>Critical alerts only</option>
                </select>

                <small>
                  Choose how monitoring and update notifications are presented.
                </small>
              </label>
            </div>
          </div>

          <aside className="settings-about-card">
            <div className="settings-about-icon">
              <Info size={18} />
            </div>

            <span className="settings-section-label">About MitraAI</span>

            <h2>AI-assisted IP &amp; regulatory guidance</h2>

            <p>
              MitraAI is a prototype platform for preliminary Ayurveda IP,
              traditional knowledge, and regulatory guidance.
            </p>

            <div className="settings-about-note">
              <strong>Prototype scope</strong>
              <span>
                Preferences shown here are currently presented as application
                configuration controls for the demonstration.
              </span>
            </div>
          </aside>
        </section>

        <section className="settings-notice">
          <div className="settings-notice-icon">
            <Settings2 size={17} />
          </div>

          <div>
            <strong>Settings notice</strong>
            <p>
              These controls are currently part of the prototype interface.
              Preference persistence and account-level configuration can be
              expanded during future implementation.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}