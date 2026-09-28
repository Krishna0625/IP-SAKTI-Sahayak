import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  Menu,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import './sahayak-overrides.css'
import { demoInnovation } from '../data/mockData'
import {
  sendChatRequest,
  type ChatGenerationStatus,
  type ChatLanguage,
  type ChatResponse,
  type ChatResponseMode,
} from '../services/chatApi'

type ResponseMode = ChatResponseMode
type AnswerStyle = 'Simple' | 'Detailed' | 'Technical'
type Jurisdiction = 'India' | 'International'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  question?: string
  response?: ChatResponse
  error?: string
  retryQuestion?: string
  responseMode?: ResponseMode
  errorKind?: ErrorKind
}

type Conversation = {
  id: string
  title: string
  createdAt: string
  jurisdiction?: Jurisdiction
  language?: ChatLanguage
  answerStyle?: AnswerStyle
  messages: ChatMessage[]
}

type Preferences = {
  jurisdiction: Jurisdiction
  language: ChatLanguage
  answerStyle: AnswerStyle
}

type ErrorKind =
  | 'temporary'
  | 'rate-limit'
  | 'configuration'
  | 'general'

const conversationStorageKey = 'mitraai-conversations'
const preferenceStorageKey = 'mitraai-preferences'

const suggestedPrompts = [
  {
    category: 'Patent & IP',
    question:
      'What should I consider before patenting an Ashwagandha-based product?',
  },
  {
    category: 'Traditional Knowledge',
    question:
      'How can traditional knowledge affect a patent application in India?',
  },
  {
    category: 'ABS',
    question:
      'What are the key requirements for accessing biological resources in India?',
  },
  {
    category: 'Regulatory',
    question:
      'What regulatory considerations apply to an Ayurveda-Aahara product in India?',
  },
  {
    category: 'IP Strategy',
    question:
      'Which IP protections may be relevant to my innovation?',
  },
]

const contextPrompts = [
  'What does this assessment mean?',
  'Why is this relevant to my product?',
  'What should I do next?',
  'Show relevant evidence',
]

const languageLabels: Record<ChatLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  bn: 'বাংলা',
}

function readSavedPreferences(): Preferences {
  try {
    const saved = JSON.parse(
      localStorage.getItem(preferenceStorageKey) ?? 'null',
    ) as {
      jurisdiction?: string
      language?: string
      answerStyle?: string
    } | null

    const jurisdiction: Jurisdiction =
      saved?.jurisdiction === 'International'
        ? 'International'
        : 'India'

    const validLanguages: ChatLanguage[] = [
      'en',
      'hi',
      'te',
      'ta',
      'kn',
      'ml',
      'bn',
    ]

    const language: ChatLanguage = validLanguages.includes(
      saved?.language as ChatLanguage,
    )
      ? (saved?.language as ChatLanguage)
      : 'en'

    const answerStyle: AnswerStyle =
      saved?.answerStyle === 'Detailed'
        ? 'Detailed'
        : saved?.answerStyle === 'Technical'
          ? 'Technical'
          : 'Simple'

    return {
      jurisdiction,
      language,
      answerStyle,
    }
  } catch {
    return {
      jurisdiction: 'India',
      language: 'en',
      answerStyle: 'Simple',
    }
  }
}

function createConversation(
  question: string,
  context: Preferences,
): Conversation {
  return {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title:
      question.length > 46
        ? `${question.slice(0, 46)}...`
        : question,
    createdAt: new Date().toISOString(),
    jurisdiction: context.jurisdiction,
    language: context.language,
    answerStyle: context.answerStyle,
    messages: [],
  }
}

function conversationDay(
  value: string,
): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(value)
  const today = new Date()

  const difference = Math.floor(
    (
      today.setHours(0, 0, 0, 0) -
      date.setHours(0, 0, 0, 0)
    ) / 86400000,
  )

  if (difference === 0) return 'Today'
  if (difference === 1) return 'Yesterday'

  return 'Earlier'
}

function answerStyleToResponseMode(
  style: AnswerStyle,
): ResponseMode {
  switch (style) {
    case 'Simple':
      return 'simple'

    case 'Technical':
      return 'technical'

    case 'Detailed':
    default:
      return 'detailed'
  }
}

function responseModeLabel(
  mode: ResponseMode,
): AnswerStyle {
  switch (mode) {
    case 'simple':
      return 'Simple'

    case 'technical':
      return 'Technical'

    case 'detailed':
    default:
      return 'Detailed'
  }
}

function formatDomain(
  domain?: string,
): string | null {
  if (!domain) return null

  const labels: Record<string, string> = {
    patents: 'Patents',
    tk: 'Traditional Knowledge',
    abs: 'ABS',
    regulatory: 'Regulatory',
    trademarks: 'Trademarks',
    copyright: 'Copyright',
    gi: 'Geographical Indications',
  }

  return (
    labels[domain.toLowerCase()] ??
    domain
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      )
  )
}

function formatJurisdiction(
  jurisdiction?: string,
): string | null {
  if (!jurisdiction) return null

  if (jurisdiction.toLowerCase() === 'india') {
    return 'India'
  }

  if (
    jurisdiction.toLowerCase() ===
    'international'
  ) {
    return 'International'
  }

  return jurisdiction
}

function formatGenerationModel(
  model?: string | null,
): string | null {
  if (!model) return null

  const normalized = model
    .replace(/^models\//, '')
    .trim()

  if (!normalized) return null

  const labels: Record<string, string> = {
    'gemini-3.8-flash': 'Gemini 3.8 Flash',
    'gemini-3.7-flash': 'Gemini 3.7 Flash',
  }

  return labels[normalized] ?? normalized
}

function generationStatusLabel(
  status?: ChatGenerationStatus,
): string {
  switch (status) {
    case 'gemini':
      return 'AI + evidence'

    case 'gemini_fallback':
      return 'AI fallback + evidence'

    case 'evidence_fallback':
      return 'Evidence-grounded fallback'

    case 'rag_only':
      return 'Evidence-only response'

    default:
      return 'Evidence-grounded'
  }
}

function generationStatusClass(
  status?: ChatGenerationStatus,
): string {
  switch (status) {
    case 'gemini':
      return 'generation-status generation-status-success'

    case 'gemini_fallback':
      return 'generation-status generation-status-fallback'

    case 'evidence_fallback':
      return 'generation-status generation-status-warning'

    case 'rag_only':
      return 'generation-status generation-status-neutral'

    default:
      return 'generation-status generation-status-neutral'
  }
}

function classifyError(error: unknown): {
  kind: ErrorKind
  message: string
} {
  const raw =
    error instanceof Error
      ? error.message
      : String(error ?? '')

  const normalized = raw.toLowerCase()

  if (
    normalized.includes('429') ||
    normalized.includes('rate limit') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota')
  ) {
    return {
      kind: 'rate-limit',
      message:
        'The MitraAI request limit has been reached. Please try again later.',
    }
  }

  if (
    normalized.includes('503') ||
    normalized.includes('service unavailable') ||
    normalized.includes(
      'temporarily unavailable',
    ) ||
    normalized.includes('high demand') ||
    normalized.includes('overloaded')
  ) {
    return {
      kind: 'temporary',
      message:
        'The AI service is temporarily unavailable because of high demand. Please try again in a moment.',
    }
  }

  if (
    normalized.includes('401') ||
    normalized.includes('403') ||
    normalized.includes('api key') ||
    normalized.includes('authentication')
  ) {
    return {
      kind: 'configuration',
      message:
        'The AI service could not be reached with the current configuration.',
    }
  }

  return {
    kind: 'general',
    message:
      'We could not generate a response right now. Please try again.',
  }
}

export function SahayakPage() {
  const location = useLocation()

  const locationState = location.state as {
    innovation?: typeof demoInnovation
    assessment?: string
  } | null

  const contextualInnovation =
    locationState?.innovation

  const [preferences, setPreferences] =
    useState<Preferences>(() =>
      readSavedPreferences(),
    )

  const {
    jurisdiction,
    language,
    answerStyle,
  } = preferences

  const [question, setQuestion] = useState('')

  const [conversations, setConversations] =
    useState<Conversation[]>(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            conversationStorageKey,
          ) ?? '[]',
        ) as Conversation[]

        return Array.isArray(saved)
          ? saved
          : []
      } catch {
        return []
      }
    })

  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null)

  const [isLoading, setIsLoading] =
    useState(false)

  const [error, setError] = useState('')

  const [historyOpen, setHistoryOpen] =
    useState(false)

  const questionInputRef =
    useRef<HTMLTextAreaElement>(null)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(
      conversationStorageKey,
      JSON.stringify(conversations),
    )
  }, [conversations])

  useEffect(() => {
    localStorage.setItem(
      preferenceStorageKey,
      JSON.stringify(preferences),
    )
  }, [preferences])

  const activeConversation =
    conversations.find(
      (item) =>
        item.id === activeConversationId,
    )

  const activeMessages =
    activeConversation?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [activeMessages.length, isLoading])

  const groupedConversations = useMemo(
    () =>
      conversations.reduce<
        Record<string, Conversation[]>
      >((groups, conversation) => {
        const day = conversationDay(
          conversation.createdAt,
        )

        groups[day] = [
          ...(groups[day] ?? []),
          conversation,
        ]

        return groups
      }, {}),
    [conversations],
  )

  const updatePreferences = (
    changes: Partial<Preferences>,
  ) => {
    setPreferences((current) => ({
      ...current,
      ...changes,
    }))

    if (activeConversationId) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          activeConversationId
            ? {
                ...conversation,
                ...(changes.jurisdiction
                  ? {
                      jurisdiction:
                        changes.jurisdiction,
                    }
                  : {}),
                ...(changes.language
                  ? {
                      language:
                        changes.language,
                    }
                  : {}),
                ...(changes.answerStyle
                  ? {
                      answerStyle:
                        changes.answerStyle,
                    }
                  : {}),
              }
            : conversation,
        ),
      )
    }
  }

  const submitQuestion = async (
    submittedQuestion = question,
    retryMessageId?: string,
  ) => {
    const trimmedQuestion =
      submittedQuestion.trim()

    if (!trimmedQuestion || isLoading) {
      return
    }

    setQuestion('')
    setError('')
    setIsLoading(true)

    const conversation =
      activeConversation ??
      createConversation(
        trimmedQuestion,
        preferences,
      )

    const responseMode =
      answerStyleToResponseMode(
        preferences.answerStyle,
      )

    const userMessage: ChatMessage = {
      id: `user-${conversation.messages.length + 1}`,
      role: 'user',
      question: trimmedQuestion,
      responseMode,
    }

    const existingMessages =
      retryMessageId
        ? conversation.messages.filter(
            (message) =>
              message.id !== retryMessageId,
          )
        : conversation.messages

    const conversationWithQuestion: Conversation =
      {
        ...conversation,
        jurisdiction:
          preferences.jurisdiction,
        language: preferences.language,
        answerStyle:
          preferences.answerStyle,
        messages: [
          ...existingMessages,
          ...(retryMessageId
            ? []
            : [userMessage]),
        ],
      }

    setConversations((current) => [
      conversationWithQuestion,
      ...current.filter(
        (item) => item.id !== conversation.id,
      ),
    ])

    setActiveConversationId(
      conversation.id,
    )

    try {
      const result = await sendChatRequest({
        query: trimmedQuestion,
        jurisdiction:
          preferences.jurisdiction.toLowerCase() as
            | 'india'
            | 'international',
        language:
          preferences.language,
        response_mode: responseMode,
      })

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    id: `assistant-${item.messages.length + 1}`,
                    role: 'assistant',
                    response: result,
                    responseMode,
                  },
                ],
              }
            : item,
        ),
      )
    } catch (requestError) {
      const classified =
        classifyError(requestError)

      setError(classified.message)

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    id: `error-${item.messages.length + 1}`,
                    role: 'assistant',
                    error:
                      classified.message,
                    retryQuestion:
                      trimmedQuestion,
                    responseMode,
                    errorKind:
                      classified.kind,
                  },
                ],
              }
            : item,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      void submitQuestion()
    }
  }

  const selectPrompt = (
    prompt: string,
  ) => {
    setQuestion(prompt)

    requestAnimationFrame(() => {
      questionInputRef.current?.focus()
    })
  }

  const startNewConversation = () => {
    setActiveConversationId(null)
    setQuestion('')
    setError('')
    setHistoryOpen(false)

    requestAnimationFrame(() => {
      questionInputRef.current?.focus()
    })
  }

  const openConversation = (
    conversation: Conversation,
  ) => {
    setActiveConversationId(
      conversation.id,
    )

    setPreferences((current) => ({
      ...current,
      jurisdiction:
        conversation.jurisdiction ??
        current.jurisdiction,
      language:
        conversation.language ??
        current.language,
      answerStyle:
        conversation.answerStyle ??
        current.answerStyle,
    }))

    setError('')
    setHistoryOpen(false)
  }

  return (
    <AppShell
      title="MitraAI"
      subtitle="Innovation, IP & Regulatory Intelligence"
    >
      <div className="mitraai-workspace">
        <aside
          className={`conversation-sidebar card-block ${
            historyOpen
              ? 'history-open'
              : ''
          }`}
        >
          <div className="conversation-heading">
            <div>
              <p className="eyebrow accent">
                Conversations
              </p>

              <h2>Your chats</h2>
            </div>

            <button
              type="button"
              className="new-chat-button"
              onClick={
                startNewConversation
              }
            >
              <Sparkles size={15} />
              New Chat
            </button>
          </div>

          <div className="history-mobile-heading">
            <strong>
              Conversation history
            </strong>

            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setHistoryOpen(false)
              }
              aria-label="Close conversation history"
            >
              <X size={17} />
            </button>
          </div>

          <div className="conversation-list">
            {Object.keys(
              groupedConversations,
            ).length === 0 ? (
              <div className="conversation-empty">
                <strong>
                  No conversations yet
                </strong>

                <p>
                  Start a new conversation
                  from the workspace.
                </p>
              </div>
            ) : (
              Object.entries(
                groupedConversations,
              ).map(([day, items]) => (
                <div
                  key={day}
                  className="conversation-group"
                >
                  <span className="small-label">
                    {day}
                  </span>

                  {items.map(
                    (conversation) => (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        className={
                          conversation.id ===
                          activeConversationId
                            ? 'conversation-item active'
                            : 'conversation-item'
                        }
                        onClick={() =>
                          openConversation(
                            conversation,
                          )
                        }
                        title={
                          conversation.title
                        }
                      >
                        {
                          conversation.title
                        }
                      </button>
                    ),
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="mitraai-main">
          <section className="mitraai-header">
            <div className="header-title-row">
              <button
                type="button"
                className="history-toggle icon-button"
                onClick={() =>
                  setHistoryOpen(
                    (open) => !open,
                  )
                }
                aria-label="Toggle conversation history"
              >
                <Menu size={18} />
              </button>

              <div>
                <p className="eyebrow accent">
                  AI assistant
                </p>

                <h2>
                  MitraAI Sahayak
                </h2>

                <p className="muted-text">
                  Evidence-grounded guidance
                  for Ayurveda IP, Traditional
                  Knowledge, ABS and
                  regulatory questions.
                </p>
              </div>
            </div>

            <div className="sahayak-context-panel">
              <div className="sahayak-status">
                <span className="status-dot" />
                Evidence-grounded
              </div>

              <div className="context-control">
                <span className="small-label">
                  Jurisdiction
                </span>

                <div
                  className="selector-row"
                  aria-label="Jurisdiction"
                >
                  <button
                    type="button"
                    className={
                      jurisdiction === 'India'
                        ? 'selected-pill active'
                        : 'selected-pill'
                    }
                    onClick={() =>
                      updatePreferences({
                        jurisdiction:
                          'India',
                      })
                    }
                  >
                    India
                  </button>

                  <button
                    type="button"
                    className={
                      jurisdiction ===
                      'International'
                        ? 'selected-pill active'
                        : 'selected-pill'
                    }
                    onClick={() =>
                      updatePreferences({
                        jurisdiction:
                          'International',
                      })
                    }
                  >
                    International
                  </button>
                </div>
              </div>

              <label className="language-control">
                <span>Language</span>

                <select
                  value={language}
                  onChange={(event) =>
                    updatePreferences({
                      language:
                        event.target.value as ChatLanguage,
                    })
                  }
                  aria-label="Response language"
                >
                  <option value="en">
                    English
                  </option>
                  <option value="hi">
                    हिन्दी
                  </option>
                  <option value="te">
                    తెలుగు
                  </option>
                  <option value="ta">
                    தமிழ்
                  </option>
                  <option value="kn">
                    ಕನ್ನಡ
                  </option>
                  <option value="ml">
                    മലയാളം
                  </option>
                  <option value="bn">
                    বাংলা
                  </option>
                </select>
              </label>

              <div className="answer-style-control context-answer-style">
                <span className="small-label">
                  Answer style
                </span>

                <div className="style-switcher">
                  {(
                    [
                      'Simple',
                      'Detailed',
                      'Technical',
                    ] as AnswerStyle[]
                  ).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={
                        answerStyle ===
                        style
                          ? 'style-button active'
                          : 'style-button'
                      }
                      onClick={() =>
                        updatePreferences({
                          answerStyle:
                            style,
                        })
                      }
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {activeConversation ? (
            <div className="conversation-context-strip">
              <span className="context-strip-label">
                Conversation context
              </span>

              <span className="context-strip-pill">
                {activeConversation.jurisdiction ??
                  jurisdiction}
              </span>

              <span className="context-strip-pill">
                {languageLabels[
                  activeConversation.language ??
                    language
                ]}
              </span>

              <span className="context-strip-pill">
                {activeConversation.answerStyle ??
                  answerStyle}
              </span>
            </div>
          ) : null}

          {contextualInnovation ? (
            <section className="context-card">
              <div className="context-heading">
                <span className="context-icon">
                  <Sparkles size={16} />
                </span>

                <div>
                  <span className="small-label">
                    Reviewing this innovation
                  </span>

                  <strong>
                    {
                      contextualInnovation.name
                    }
                  </strong>
                </div>
              </div>

              <p>
                {locationState?.assessment ??
                  'Innovation overview'}
              </p>

              <div className="prompt-chips">
                {contextPrompts.map(
                  (prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="chip"
                      onClick={() =>
                        selectPrompt(
                          prompt,
                        )
                      }
                    >
                      {prompt}
                    </button>
                  ),
                )}
              </div>
            </section>
          ) : null}

          <section className="conversation-panel card-block">
            {activeMessages.length ===
            0 ? (
              <div className="mitraai-empty-state">
                <div className="mitraai-mark">
                  <Sparkles size={21} />
                </div>

                <p className="eyebrow accent">
                  Start a new conversation
                </p>

                <h2>
                  How can MitraAI help?
                </h2>

                <p className="muted-text empty-state-copy">
                  Choose your context above,
                  then ask about patents,
                  Traditional Knowledge,
                  ABS, regulation or IP
                  strategy.
                </p>

                <div className="empty-context-summary">
                  <span>
                    {jurisdiction}
                  </span>

                  <span>
                    {languageLabels[
                      language
                    ]}
                  </span>

                  <span>
                    {answerStyle}
                  </span>
                </div>

                <div className="suggested-prompts">
                  {suggestedPrompts.map(
                    (prompt) => (
                      <button
                        key={
                          prompt.question
                        }
                        type="button"
                        className="starter-prompt"
                        onClick={() =>
                          void submitQuestion(
                            prompt.question,
                          )
                        }
                      >
                        <span className="starter-category">
                          {
                            prompt.category
                          }
                        </span>

                        <span>
                          {
                            prompt.question
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="message-list">
                {activeMessages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className={
                        message.role ===
                        'user'
                          ? 'exchange user-exchange'
                          : 'exchange assistant-exchange'
                      }
                    >
                      {message.role ===
                      'user' ? (
                        <div className="message user-message">
                          <span className="message-label">
                            YOUR QUESTION
                          </span>

                          <p>
                            {
                              message.question
                            }
                          </p>

                          {message.responseMode ? (
                            <span className="message-mode-label">
                              {
                                responseModeLabel(
                                  message.responseMode,
                                )
                              }{' '}
                              answer
                            </span>
                          ) : null}
                        </div>
                      ) : message.error ? (
                        <div
                          className={`message error-message error-${
                            message.errorKind ??
                            'general'
                          }`}
                        >
                          <div className="error-message-copy">
                            <div className="error-title-row">
                              <ShieldAlert
                                size={17}
                              />

                              <strong>
                                {message.errorKind ===
                                'rate-limit'
                                  ? 'MitraAI request limit reached'
                                  : message.errorKind ===
                                      'temporary'
                                    ? 'MitraAI is temporarily unavailable'
                                    : message.errorKind ===
                                        'configuration'
                                      ? 'MitraAI service unavailable'
                                      : 'We could not generate an answer'}
                              </strong>
                            </div>

                            <p>
                              {
                                message.error
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              void submitQuestion(
                                message.retryQuestion ??
                                  '',
                                message.id,
                              )
                            }
                            disabled={
                              isLoading
                            }
                          >
                            Try again
                          </button>
                        </div>
                      ) : message.response ? (
                        <AnswerCard
                          response={
                            message.response
                          }
                          answerStyle={
                            message.responseMode
                              ? responseModeLabel(
                                  message.responseMode,
                                )
                              : answerStyle
                          }
                        />
                      ) : null}
                    </div>
                  ),
                )}

                {isLoading ? (
                  <div
                    className="loading-state"
                    aria-live="polite"
                  >
                    <LoaderCircle
                      className="spinner"
                      size={18}
                    />

                    <span>
                      MitraAI is reviewing
                      the available
                      evidence...
                    </span>
                  </div>
                ) : null}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>
            )}
          </section>

          {error &&
          activeMessages.length === 0 ? (
            <div
              className="error-banner"
              role="alert"
            >
              <ShieldAlert size={16} />
              <span>{error}</span>

              <button
                type="button"
                className="error-banner-retry"
                onClick={() =>
                  void submitQuestion()
                }
                disabled={isLoading}
              >
                Try again
              </button>
            </div>
          ) : null}

          <section className="chat-composer card-block">
            <div className="composer-toolbar">
              <div>
                <span className="composer-title">
                  Ask your question
                </span>

                <span className="composer-hint">
                  Press Enter to send · Shift
                  + Enter for a new line
                </span>
              </div>

              <div className="composer-context">
                <span>
                  {jurisdiction}
                </span>

                <span>
                  {languageLabels[
                    language
                  ]}
                </span>

                <span>
                  {answerStyle}
                </span>
              </div>
            </div>

            <div className="composer-row">
              <textarea
                ref={
                  questionInputRef
                }
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value,
                  )
                }
                onKeyDown={
                  handleInputKeyDown
                }
                rows={2}
                placeholder="Ask about patents, Traditional Knowledge, ABS, regulation..."
                aria-label="Ask MitraAI"
                disabled={isLoading}
              />

              <button
                type="button"
                className="primary-button send-button"
                onClick={() =>
                  void submitQuestion()
                }
                disabled={
                  isLoading ||
                  !question.trim()
                }
              >
                {isLoading ? (
                  <LoaderCircle
                    size={16}
                    className="spinner"
                  />
                ) : (
                  <Send size={16} />
                )}

                <span>
                  {isLoading
                    ? 'Analyzing...'
                    : 'Ask MitraAI'}
                </span>
              </button>
            </div>

            <p className="composer-note">
              MitraAI provides preliminary
              information and does not replace
              professional legal advice.
            </p>
          </section>
        </main>
      </div>
    </AppShell>
  )
}

function GenerationStatus({
  response,
}: {
  response: ChatResponse
}) {
  const modelLabel = formatGenerationModel(
    response.generation_model,
  )

  const statusLabel =
    generationStatusLabel(
      response.generation_status,
    )

  return (
    <div className="generation-status-wrap">
      <span
        className={generationStatusClass(
          response.generation_status,
        )}
      >
        <Sparkles size={12} />

        <span>{statusLabel}</span>
      </span>

      {modelLabel ? (
        <span className="generation-model-label">
          {modelLabel}
        </span>
      ) : null}

      {response.generation_note ? (
        <span
          className="generation-note"
          title={
            response.generation_note
          }
        >
          {response.generation_note}
        </span>
      ) : null}
    </div>
  )
}

function AnswerCard({
  response,
  answerStyle,
}: {
  response: ChatResponse
  answerStyle: AnswerStyle
}) {
  const keyPoints =
    answerStyle === 'Simple'
      ? response.key_points.slice(0, 3)
      : response.key_points.slice(0, 5)

  return (
    <div className="answer-card">
      <div className="answer-card-heading">
        <span className="answer-brand">
          <Bot size={17} />
          <strong>MitraAI</strong>
        </span>

        <div className="answer-heading-meta">
          <span className="answer-style-badge">
            {answerStyle} answer
          </span>

          <GenerationStatus
            response={response}
          />
        </div>
      </div>

      {response.generation_note ? (
        <div className="generation-note-panel">
          <Sparkles size={14} />

          <span>
            {response.generation_note}
          </span>
        </div>
      ) : null}

      <div className="answer-section direct-answer-section">
        <span className="answer-section-label">
          Direct answer
        </span>

        <div className="answer-copy markdown-answer">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h3>{children}</h3>
              ),
              h2: ({ children }) => (
                <h4>{children}</h4>
              ),
              h3: ({ children }) => (
                <h4>{children}</h4>
              ),
              p: ({ children }) => (
                <p>{children}</p>
              ),
              ul: ({ children }) => (
                <ul>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol>{children}</ol>
              ),
              li: ({ children }) => (
                <li>{children}</li>
              ),
              strong: ({ children }) => (
                <strong>{children}</strong>
              ),
              em: ({ children }) => (
                <em>{children}</em>
              ),
              blockquote: ({
                children,
              }) => (
                <blockquote>
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code>{children}</code>
              ),
            }}
          >
            {response.answer}
          </ReactMarkdown>
        </div>
      </div>

      {keyPoints.length > 0 ? (
        <div className="answer-section takeaway-section">
          <span className="answer-section-label">
            Key takeaways
          </span>

          <ul className="takeaway-list">
            {keyPoints.map((item) => (
              <li key={item}>
                <CheckCircle2 size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {response.sources.length > 0 ? (
        <details className="evidence-details">
          <summary>
            <span>
              Evidence &amp; sources
              <small>
                {response.sources.length}{' '}
                {response.sources.length ===
                1
                  ? 'source'
                  : 'sources'}
              </small>
            </span>

            <ChevronDown size={17} />
          </summary>

          <div className="evidence-cards">
            {response.sources.map(
              (source, index) => {
                const evidenceNumber =
                  source.evidence_number ??
                  index + 1

                const domainLabel =
                  formatDomain(
                    source.domain,
                  )

                const jurisdictionLabel =
                  formatJurisdiction(
                    source.jurisdiction,
                  )

                return (
                  <article
                    key={`${source.evidence_number ?? 'source'}-${
                      source.id ??
                      source.title ??
                      index
                    }`}
                    className="evidence-card-mini"
                  >
                    <div className="evidence-card-top">
                      <span className="evidence-number">
                        Source{' '}
                        {evidenceNumber}
                      </span>

                      <span className="evidence-verified">
                        <CheckCircle2
                          size={13}
                        />
                        Knowledge base
                      </span>
                    </div>

                    <div className="evidence-card-title-block">
                      <strong className="evidence-title">
                        {source.title ??
                          'Official document'}
                      </strong>

                      {source.authority ? (
                        <span className="evidence-authority">
                          {
                            source.authority
                          }
                        </span>
                      ) : null}
                    </div>

                    <div className="evidence-meta-row">
                      {source.section ? (
                        <span className="evidence-meta-item">
                          <span className="evidence-meta-label">
                            Provision
                          </span>

                          <span>
                            {
                              source.section
                            }
                          </span>
                        </span>
                      ) : null}

                      {source.page !==
                        undefined &&
                      source.page !==
                        null ? (
                        <span className="evidence-meta-item">
                          <span className="evidence-meta-label">
                            Page
                          </span>

                          <span>
                            {
                              source.page
                            }
                          </span>
                        </span>
                      ) : null}

                      {domainLabel ? (
                        <span className="evidence-domain-badge">
                          {domainLabel}
                        </span>
                      ) : null}

                      {jurisdictionLabel ? (
                        <span className="evidence-jurisdiction-badge">
                          {
                            jurisdictionLabel
                          }
                        </span>
                      ) : null}
                    </div>

                    {source.url ? (
                      <a
                        href={
                          source.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="evidence-source-link"
                      >
                        <span>
                          View official
                          source
                        </span>

                        <ExternalLink
                          size={14}
                        />
                      </a>
                    ) : null}
                  </article>
                )
              },
            )}
          </div>
        </details>
      ) : (
        <div className="evidence-empty">
          <ShieldAlert size={16} />

          <span>
            No supporting evidence was
            found in the available
            knowledge base.
          </span>
        </div>
      )}

      <div className="answer-footer">
        <div className="confidence-badge">
          <CheckCircle2 size={15} />

          <span>
            {Math.round(
              response.confidence * 100,
            )}
            % confidence
          </span>

          <small>
            Based on retrieved evidence
          </small>
        </div>

        <div className="answer-footer-actions">
          <Link
            to="/sources"
            className="link-button"
          >
            View all evidence
          </Link>
        </div>
      </div>

      <div className="disclaimer-box warn-box">
        <ShieldAlert size={15} />

        <p>
          {response.disclaimer ||
            'This information is not legal advice.'}
        </p>
      </div>
    </div>
  )
}