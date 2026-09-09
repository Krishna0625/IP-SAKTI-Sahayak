import { useMemo, useState } from 'react'
import {
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
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const currentPageTitle = useMemo(() => {
    if (title) return title
    const match = navItems.find((item) => item.to === location.pathname)
    return match?.label ?? 'IP-SAKTI'
  }, [location.pathname, title])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">IP</div>
          <div>
            <div className="brand-title">IP-SAKTI</div>
            <div className="brand-subtitle">Sahayak Platform</div>
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
          <div className="nav-label">Sahayak</div>
          <NavLink to="/sahayak" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Sparkles size={16} />
            <span>AI Assistant</span>
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
            .filter((item) => !['/dashboard', '/sahayak', '/innovation/demo', '/innovation/new', '/'].includes(item.to))
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
          <button type="button" className="nav-item ghost-item" aria-label="Help">
            <CircleHelp size={16} />
            <span>Help</span>
          </button>
          <button type="button" className="nav-item ghost-item" aria-label="Settings">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
              <Menu size={18} />
            </button>
            <div>
              <div className="eyebrow">Prototype</div>
              <h1>{currentPageTitle}</h1>
            </div>
          </div>

          <div className="topbar-right">
            {subtitle ? <span className="subtitle-label">{subtitle}</span> : null}
            <button type="button" className="action-button">
              Review Portal <ChevronRight size={16} />
            </button>
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
