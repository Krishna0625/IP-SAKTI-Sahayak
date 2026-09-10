import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookText,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  FileText,
  FolderCog,
  Gauge,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  Settings,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
  title?: string
  subtitle?: string
  showPrototypeLabel?: boolean
}

type NavItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Assistant', to: '/sahayak', icon: Sparkles },
  { label: 'My Innovations', to: '/innovation/demo', icon: FolderCog },
  { label: 'Create Innovation', to: '/innovation/new', icon: FileText },
  { label: 'IP Explorer', to: '/ip-explorer', icon: ShieldCheck },
  { label: 'TK Intelligence', to: '/tk-intelligence', icon: BookText },
  { label: 'ABS Assessment', to: '/abs-assessment', icon: BriefcaseBusiness },
  { label: 'Regulatory', to: '/regulatory', icon: Gauge },
  { label: 'Sources', to: '/sources', icon: FolderCog },
  { label: 'Updates', to: '/updates', icon: Activity },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function AppShell({ children, title, subtitle, showPrototypeLabel = true }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const currentPageTitle = useMemo(() => {
    if (title) return title
    const match = navItems.find((item) => item.to === location.pathname)
    return match?.label ?? 'MitraAI'
  }, [location.pathname, title])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">IP</div>
          <div>
            <div className="brand-title">MitraAI</div>
            <div className="brand-subtitle">Innovation, IP & Regulatory Intelligence</div>
          </div>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-section" aria-label="Main navigation">
          <div className="nav-label">Overview</div>
          <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            <span>Landing</span>
          </NavLink>
          <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <nav className="nav-section" aria-label="Workflow navigation">
          <div className="nav-label">MitraAI</div>
          <NavLink to="/sahayak" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Sparkles size={16} />
            <span>MitraAI Assistant</span>
          </NavLink>
        </nav>

        <nav className="nav-section" aria-label="Innovation navigation">
          <div className="nav-label">Innovation</div>
          <NavLink to="/innovation/demo" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderCog size={16} />
            <span>My Innovations</span>
          </NavLink>
          <NavLink to="/innovation/new" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={16} />
            <span>Create Innovation</span>
          </NavLink>
        </nav>

        <nav className="nav-section" aria-label="Assessment navigation">
          <div className="nav-label">Assessment</div>
          {navItems
            .filter((item) => !['/dashboard', '/sahayak', '/innovation/demo', '/innovation/new', '/', '/updates'].includes(item.to))
            .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-label">Support</div>
          <NavLink to="/updates" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={16} />
            <span>Updates</span>
          </NavLink>
          <NavLink to="/help" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CircleHelp size={16} />
            <span>Help</span>
          </NavLink>
          <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <div>
              {showPrototypeLabel ? <div className="eyebrow">Prototype</div> : null}
              <h1>{currentPageTitle}</h1>
            </div>
          </div>

          <div className="topbar-right">
            {subtitle ? <span className="subtitle-label">{subtitle}</span> : null}
            <NavLink to="/sources" className="action-button">
              Review Portal <ChevronRight size={16} />
            </NavLink>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {mobileOpen ? <button type="button" className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close sidebar" /> : null}
      <div className="mobile-indicator"> </div>
      <div className="floating-action">
        <ArrowRight size={16} />
      </div>
    </div>
  )
}
