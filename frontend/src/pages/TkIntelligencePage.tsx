import { ArrowRight, BookText, Info, Library } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'
import type { InnovationRecord } from '../types'

const storageKey = 'ip-sakti-innovations'
const activeKey = 'ip-sakti-active-innovation'

function readActiveInnovation(): InnovationRecord {
  try {
    const activeId = localStorage.getItem(activeKey)
    const list = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as InnovationRecord[]
    if (activeId) {
      const match = list.find((entry) => entry.id === activeId)
      if (match) return match
    }
    return list[0] ?? demoInnovation
  } catch {
    return demoInnovation
  }
}

export function TkIntelligencePage() {
  const innovation = readActiveInnovation()
  const ingredients = innovation.ingredients.split(';').map((ingredient) => ingredient.trim()).filter(Boolean)

  return (
    <AppShell title="TK Intelligence" subtitle="Preliminary intelligence view">
      <div className="page-grid dashboard-grid">
        <section className="card-block result-card tk-result-card">
          <p className="eyebrow accent">Traditional Knowledge Intelligence</p>
          <h2>Preliminary TK relevance summary</h2>
          <div className="tk-metrics-grid">
            <div className="tk-metric-card h-full flex flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <span>Selected ingredients</span>
              <strong className="tk-ingredient-list font-mono">
                {ingredients.map((ingredient) => <span key={ingredient} className="tk-ingredient-badge bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">{ingredient}</span>)}
              </strong>
            </div>
            <div className="tk-metric-card h-full flex flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <span>Traditional knowledge relevance</span>
              <strong><span className="tk-status-badge tk-status-amber bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">Medium</span></strong>
            </div>
            <div className="tk-metric-card h-full flex flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <span>Potential TK signal</span>
              <strong><span className="tk-status-badge tk-status-amber bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">Moderate</span></strong>
            </div>
            <div className="tk-metric-card h-full flex flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 bg-white/90 backdrop-blur-sm">
              <span>Evidence status</span>
              <strong><span className="tk-status-badge tk-status-slate bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full w-fit">Partial</span></strong>
            </div>
          </div>

          <div className="tk-content-grid">
            <div className="tk-content-card h-full flex flex-col justify-between p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl md:min-h-[160px]">
              <h3 className="tk-content-heading"><Info size={17} aria-hidden="true" /> Knowledge context</h3>
              <p>The ingredients include botanical species commonly associated with ethnobotanical and traditional use patterns. These signals should be reviewed before filing.</p>
            </div>
            <div className="tk-content-card h-full flex flex-col justify-between p-6 bg-white border border-slate-200/80 shadow-sm rounded-xl md:min-h-[160px]">
              <h3 className="tk-content-heading"><Library size={17} aria-hidden="true" /> Evidence and source navigation</h3>
              <p>Relevant TK evidence is available in the prototype source library but should not be treated as a formal TKDL determination.</p>
            </div>
          </div>

          <div className="disclaimer-box warn-box tk-search-notice w-full border-l-4 border-l-amber-500 bg-amber-50/70 p-4 rounded-r-lg text-xs text-amber-900 flex items-center gap-2">
            <BookText size={16} />
            <p>Advanced TK Database Search — Need to Build. Current review is limited to the available prototype evidence.</p>
          </div>

          <div className="button-row tk-actions border-t border-slate-200/60 pt-5 mt-6 flex flex-row justify-end gap-4">
            <Link to="/abs-assessment" className="primary-button transition-all hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-offset-2">Continue to ABS Assessment <ArrowRight size={16} /></Link>
            <Link to="/sources" className="secondary-button transition-all hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-offset-2">View source library</Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
