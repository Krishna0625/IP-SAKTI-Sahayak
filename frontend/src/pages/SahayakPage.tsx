import { useMemo, useState } from 'react'
import { Bot, CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { defaultAssistantAnswer, defaultQuestions, mockEvidence } from '../data/mockData'

const statuses = ['Empty', 'Loading', 'Answer', 'No evidence', 'Error'] as const

type SahayakState = (typeof statuses)[number]

export function SahayakPage() {
  const [jurisdiction, setJurisdiction] = useState<'India' | 'International'>('India')
  const [question, setQuestion] = useState(defaultQuestions[0])
  const [state, setState] = useState<SahayakState>('Answer')

  const answer = useMemo(() => {
    if (state === 'Answer') {
      return defaultAssistantAnswer
    }
    return null
  }, [state])

  const submitQuestion = () => {
    setState('Loading')
    window.setTimeout(() => {
      setState('Answer')
    }, 600)
  }

  return (
    <AppShell title="AI Sahayak" subtitle="Evidence-backed guidance">
      <div className="page-grid sahayak-layout">
        <section className="card-block assistant-console">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">AI Sahayak</p>
              <h2>Evidence-backed guidance for Ayurveda IP & regulatory questions.</h2>
            </div>
            <div className="selector-row">
              <button type="button" className={jurisdiction === 'India' ? 'selected-pill active' : 'selected-pill'} onClick={() => setJurisdiction('India')}>
                India
              </button>
              <button type="button" className={jurisdiction === 'International' ? 'selected-pill active' : 'selected-pill'} onClick={() => setJurisdiction('International')}>
                International
              </button>
            </div>
          </div>

          <div className="prompt-panel">
            <div className="question-list">
              {defaultQuestions.map((item) => (
                <button key={item} type="button" className={question === item ? 'chip active' : 'chip'} onClick={() => setQuestion(item)}>
                  {item}
                </button>
              ))}
            </div>

            <div className="assistant-input-row">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} />
              <button type="button" className="primary-button" onClick={submitQuestion}>
                {state === 'Loading' ? <><LoaderCircle size={16} className="spinner" /> Searching</> : 'Ask Sahayak'}
              </button>
            </div>
          </div>
        </section>

        <section className="card-block answer-panel">
          {state === 'Empty' && <p className="empty-state">No prompt yet.</p>}
          {state === 'Loading' && (
            <div className="loading-state">
              <LoaderCircle className="spinner" size={20} />
              <span>Reviewing evidence and preparing answer…</span>
            </div>
          )}
          {state === 'No evidence' && <p className="empty-state">Reliable evidence was not found in the available knowledge base.</p>}
          {state === 'Error' && <p className="empty-state error">Something went wrong while preparing the response.</p>}

          {answer && (
            <>
              <div className="answer-header">
                <div className="inline-heading">
                  <Bot size={18} />
                  <h3>ANSWER</h3>
                </div>
              </div>
              <p className="answer-text">{answer.answer}</p>

              <div className="answer-section">
                <h4>KEY CONSIDERATIONS</h4>
                <ul>
                  {answer.keyConsiderations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="answer-section">
                <h4>EVIDENCE</h4>
                <div className="evidence-cards">
                  {mockEvidence.map((item) => (
                    <div key={item.id} className="evidence-card-mini">
                      <div className="small-tag">Demo / Placeholder Evidence</div>
                      <strong>{item.title}</strong>
                      <span>{item.authority}</span>
                      <span>Section: {item.section}</span>
                      <span>Page: {item.page}</span>
                      <span>Relevance: {item.relevance}</span>
                      <button type="button" className="link-button inline-link">
                        {item.viewLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="answer-section">
                <h4>CONFIDENCE</h4>
                <div className="confidence-row">
                  <CheckCircle2 size={16} /> <span>{answer.confidence}</span>
                </div>
              </div>

              <div className="answer-section">
                <h4>DISCLAIMER</h4>
                <div className="disclaimer-box warn-box">
                  <ShieldAlert size={16} />
                  <p>{answer.disclaimer}</p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
