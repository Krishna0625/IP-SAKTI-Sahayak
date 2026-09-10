import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Bot, CheckCircle2, ChevronDown, LoaderCircle, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { demoInnovation } from '../data/mockData'

type ChatSource = { id?: string; title?: string; authority?: string; page?: number | string; section?: string; relevance?: number | string }
type ChatResponse = { answer: string; confidence: number; key_points: string[]; sources: ChatSource[]; disclaimer: string }
type ChatMessage = { id: number; role: 'user' | 'assistant'; question?: string; response?: ChatResponse; error?: string }
type Conversation = { id: string; title: string; createdAt: string; messages: ChatMessage[] }
type AnswerStyle = 'Simple' | 'Detailed' | 'Technical'

const conversationStorageKey = 'mitraai-conversations'
const suggestedPrompts = [
  'What should I consider before patenting my product?',
  'Could traditional knowledge affect my application?',
  'What ABS requirements might apply?',
  'What regulations apply to Ayurveda Aahara?',
]

function createConversation(question: string): Conversation {
  return { id: `${Date.now()}`, title: question.length > 46 ? `${question.slice(0, 46)}...` : question, createdAt: new Date().toISOString(), messages: [] }
}

function conversationDay(value: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(value)
  const today = new Date()
  const difference = Math.floor((today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000)
  return difference === 0 ? 'Today' : difference === 1 ? 'Yesterday' : 'Earlier'
}

export function SahayakPage() {
  const location = useLocation()
  const contextualInnovation = (location.state as { innovation?: typeof demoInnovation } | null)?.innovation
  const [jurisdiction, setJurisdiction] = useState<'India' | 'International'>('India')
  const [question, setQuestion] = useState('')
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('Simple')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(conversationStorageKey) ?? '[]') as Conversation[]
      if (Array.isArray(saved)) setConversations(saved)
    } catch {
      setConversations([])
    }
  }, [])

  useEffect(() => {
    if (conversations.length > 0) localStorage.setItem(conversationStorageKey, JSON.stringify(conversations))
  }, [conversations])

  const activeConversation = conversations.find((item) => item.id === activeConversationId)
  const activeMessages = activeConversation?.messages ?? []
  const groupedConversations = useMemo(() => conversations.reduce<Record<string, Conversation[]>>((groups, conversation) => {
    const day = conversationDay(conversation.createdAt)
    groups[day] = [...(groups[day] ?? []), conversation]
    return groups
  }, {}), [conversations])

  const submitQuestion = async (submittedQuestion = question) => {
    const trimmedQuestion = submittedQuestion.trim()
    if (!trimmedQuestion || isLoading) return

    setQuestion('')
    setError('')
    setIsLoading(true)
    const conversation = activeConversation ?? createConversation(trimmedQuestion)
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', question: trimmedQuestion }
    const conversationWithQuestion = { ...conversation, messages: [...conversation.messages, userMessage] }
    setConversations((current) => [conversationWithQuestion, ...current.filter((item) => item.id !== conversation.id)])
    setActiveConversationId(conversation.id)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuestion, jurisdiction: jurisdiction.toLowerCase(), language: 'en' }),
      })
      if (!response.ok) throw new Error(`Chat request failed with status ${response.status}`)
      const result = (await response.json()) as ChatResponse
      setConversations((current) => current.map((item) => item.id === conversation.id
        ? { ...item, messages: [...item.messages, { id: Date.now() + 1, role: 'assistant', response: result }] }
        : item))
    } catch {
      const friendlyError = 'Unable to connect to MitraAI right now. Please make sure the backend is running.'
      setError(friendlyError)
      setConversations((current) => current.map((item) => item.id === conversation.id
        ? { ...item, messages: [...item.messages, { id: Date.now() + 1, role: 'assistant', error: friendlyError }] }
        : item))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitQuestion()
    }
  }

  return (
    <AppShell title="MitraAI" subtitle="Innovation, IP & Regulatory Intelligence">
      <div className="mitraai-workspace">
        <aside className="conversation-sidebar card-block">
          <div className="conversation-heading"><div><p className="eyebrow accent">Conversations</p><h2>History</h2></div><button type="button" className="link-button" onClick={() => { setActiveConversationId(null); setQuestion('') }}>New</button></div>
          {Object.keys(groupedConversations).length === 0 ? <p className="muted-text conversation-empty">Your conversations will appear here.</p> : Object.entries(groupedConversations).map(([day, items]) => <div key={day} className="conversation-group"><span className="small-label">{day}</span>{items.map((conversation) => <button key={conversation.id} type="button" className={conversation.id === activeConversationId ? 'conversation-item active' : 'conversation-item'} onClick={() => { setActiveConversationId(conversation.id); setError('') }}>{conversation.title}</button>)}</div>)}
        </aside>

        <main className="mitraai-main">
          <section className="mitraai-header"><div><p className="eyebrow accent">MitraAI</p><h2>Innovation, IP & Regulatory Intelligence</h2><p className="muted-text">Clear, evidence-grounded guidance for your innovation journey.</p></div><div className="selector-row" aria-label="Jurisdiction"><button type="button" className={jurisdiction === 'India' ? 'selected-pill active' : 'selected-pill'} onClick={() => setJurisdiction('India')}>India</button><button type="button" className={jurisdiction === 'International' ? 'selected-pill active' : 'selected-pill'} onClick={() => setJurisdiction('International')}>International</button></div></section>
 
          {contextualInnovation ? <section className="context-card"><span className="small-label">You're viewing</span><strong>{contextualInnovation.name}</strong><span>What would you like to understand?</span><div className="prompt-chips">{['Check patent risks', 'Check TK concerns', 'Check ABS requirements', 'Check regulatory requirements'].map((prompt) => <button key={prompt} type="button" className="chip" onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div></section> : null}

          <section className="conversation-panel card-block">
            {activeMessages.length === 0 ? <div className="mitraai-empty-state"><div className="mitraai-mark"><Sparkles size={20} /></div><p className="eyebrow accent">MitraAI</p><h2>Evidence-grounded guidance for your innovation.</h2><p className="muted-text">Ask about IP, Traditional Knowledge, ABS, or regulatory requirements.</p><div className="suggested-prompts">{suggestedPrompts.map((prompt) => <button key={prompt} type="button" className="chip" onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div></div> : <div className="message-list">{activeMessages.map((message) => <div key={message.id} className={message.role === 'user' ? 'message user-message' : 'message assistant-message'}>{message.role === 'user' ? <p>{message.question}</p> : message.error ? <p className="error-text">{message.error}</p> : message.response ? <AnswerCard response={message.response} answerStyle={answerStyle} /> : null}</div>)}{isLoading ? <div className="loading-state"><LoaderCircle className="spinner" size={18} /><span>MitraAI is analyzing the available evidence...</span></div> : null}</div>}
          </section>

          {error && activeMessages.length === 0 ? <p className="error-text">{error}</p> : null}
          <section className="chat-composer card-block"><div className="composer-toolbar"><span className="small-label">Answer style</span><div className="style-switcher">{(['Simple', 'Detailed', 'Technical'] as AnswerStyle[]).map((style) => <button key={style} type="button" className={answerStyle === style ? 'style-button active' : 'style-button'} onClick={() => setAnswerStyle(style)}>{style}</button>)}</div></div><div className="composer-row"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleInputKeyDown} rows={2} placeholder="Ask MitraAI..." aria-label="Ask MitraAI" /><button type="button" className="primary-button send-button" onClick={() => void submitQuestion()} disabled={isLoading || !question.trim()}>{isLoading ? <LoaderCircle size={16} className="spinner" /> : <Send size={16} />}<span>{isLoading ? 'Analyzing' : 'Send'}</span></button></div><p className="composer-note">MitraAI provides preliminary information, not legal advice.</p></section>
        </main>
      </div>
    </AppShell>
  )
}

function AnswerCard({ response, answerStyle }: { response: ChatResponse; answerStyle: AnswerStyle }) {
  const keyPoints = answerStyle === 'Simple' ? response.key_points.slice(0, 3) : response.key_points.slice(0, 5)
  return <div className="answer-card"><div className="answer-card-heading"><Bot size={18} /><strong>DIRECT ANSWER</strong></div><div className="answer-copy">{response.answer}</div>{keyPoints.length > 0 ? <div className="answer-section"><h4>KEY POINTS</h4><ul>{keyPoints.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{keyPoints.length > 0 ? <div className="answer-section"><h4>WHAT YOU SHOULD DO</h4><ol>{keyPoints.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ol></div> : null}{response.sources.length > 0 ? <details className="evidence-details"><summary><span>EVIDENCE · {response.sources.length} sources</span><ChevronDown size={16} /></summary><div className="evidence-cards">{response.sources.map((source, index) => <div key={source.id ?? `${source.title}-${index}`} className="evidence-card-mini"><strong>{source.title ?? 'Source'}</strong>{source.authority && <span>{source.authority}</span>}{source.section && <span>Section: {source.section}</span>}{source.page !== undefined && <span>Page: {source.page}</span>}{source.relevance !== undefined && <span>Relevance: {source.relevance}</span>}</div>)}</div></details> : <p className="empty-state">Reliable evidence was not found in the available knowledge base.</p>}<details className="technical-details"><summary><span>LEGAL / TECHNICAL DETAILS</span><ChevronDown size={16} /></summary><p>{response.answer}</p></details><div className="answer-footer"><span className="confidence-badge"><CheckCircle2 size={15} /> Confidence {response.confidence}</span><div className="disclaimer-box warn-box"><ShieldAlert size={15} /><p>{response.disclaimer || 'This information is not legal advice.'}</p></div></div></div>
}
