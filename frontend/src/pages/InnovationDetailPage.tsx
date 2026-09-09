import { ArrowUpRight, Printer, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation, mockEvidence } from '../data/mockData'
import type { InnovationRecord } from '../types'

const storageKey = 'ip-sakti-innovations'

function readInnovation(id: string | undefined): InnovationRecord {
  if (!id || id === 'demo') return demoInnovation

  try {
    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as InnovationRecord[]
    const match = persisted.find((item) => item.id === id)
    return match ?? demoInnovation
  } catch {
    return demoInnovation
  }
}

export function InnovationDetailPage() {
  const { id } = useParams()
  const innovation = readInnovation(id)

  const handlePrint = () => window.print()

  return (
    <AppShell title="Innovation Passport" subtitle="Detailed evidence summary">
      <div className="page-grid detail-layout">
        <section className="card-block passport-full">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Innovation Passport</p>
              <h2>{innovation.name}</h2>
            </div>
            <button type="button" className="secondary-button" onClick={handlePrint}>
              <Printer size={16} /> Print Passport
            </button>
          </div>

          <div className="passport-topline">
            <span>{innovation.jurisdiction}</span>
            <span>Readiness {innovation.readiness}%</span>
            <span className="soft-tag">ID {innovation.id}</span>
          </div>

          <div className="info-grid two-up">
            <div className="info-panel">
              <h3>Preliminary Classification</h3>
              <p>{innovation.classification}</p>
              <small>Confidence {innovation.confidence}%</small>
            </div>
            <div className="info-panel">
              <h3>Key Findings</h3>
              <ul className="key-findings">
                <li>Potential wellness product positioning.</li>
                <li>Traditional knowledge review required.</li>
                <li>Preliminary regulatory pathway is available.</li>
              </ul>
            </div>
            <div className="info-panel">
              <h3>IP Review</h3>
              <p>Patent screening, trademark review and prior art assessment recommended before formal filing strategy.</p>
            </div>
            <div className="info-panel">
              <h3>Traditional Knowledge Review</h3>
              <p>Botanical ingredients may carry traditional knowledge relevance and should be reviewed before filing.</p>
            </div>
            <div className="info-panel">
              <h3>ABS Assessment</h3>
              <p>Preliminary compliance guidance indicates a need to confirm source origin and access arrangements.</p>
            </div>
            <div className="info-panel">
              <h3>Regulatory Pathway</h3>
              <p>Wellness product classification should be confirmed before claiming specific compliance obligations.</p>
            </div>
          </div>

          <div className="action-list">
            <h3>Recommended Next Actions</h3>
            <ol>
              <li>Review potential prior art</li>
              <li>Assess traditional knowledge relevance</li>
              <li>Review ABS requirements</li>
              <li>Verify regulatory pathway</li>
              <li>Consult an IP facilitator where appropriate</li>
            </ol>
          </div>

          <div className="evidence-section">
            <h3>Evidence</h3>
            <div className="evidence-list">
              {mockEvidence.map((item) => (
                <div key={item.id} className="evidence-item">
                  <div className="evidence-header">
                    <div>
                      <span className="mini-chip">{item.relevance}</span>
                      <strong>{item.title}</strong>
                    </div>
                    <button type="button" className="link-button inline-link">
                      {item.viewLabel} <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="meta-row">
                    <span>{item.authority}</span>
                    <span>{item.section}</span>
                    <span>{item.page}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="disclaimer-box">
            <ShieldCheck size={18} />
            <p>
              This prototype provides preliminary guidance only. It is not a legal determination or formal advice.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
