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
import { demoInnovation } from '../data/mockData'
import {
  sendChatRequest,
  type ChatLanguage,
  type ChatResponse,
  type ChatResponseMode,
} from '../services/chatApi'

type ResponseMode = ChatResponseMode

type AnswerStyle =
  | 'Simple'
  | 'Detailed'
  | 'Technical'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  question?: string
  response?: ChatResponse
  error?: string
  retryQuestion?: string
  responseMode?: ResponseMode
}

type Conversation = {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

const conversationStorageKey =
  'mitraai-conversations'

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

function createConversation(
  question: string,
): Conversation {
  return {
    id: `${Date.now()}`,
    title:
      question.length > 46
        ? `${question.slice(0, 46)}...`
        : question,
    createdAt:
      new Date().toISOString(),
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

  return difference === 0
    ? 'Today'
    : difference === 1
      ? 'Yesterday'
      : 'Earlier'
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
  if (!domain) {
    return null
  }

  const labels: Record<
    string,
    string
  > = {
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
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      )
  )
}

function formatJurisdiction(
  jurisdiction?: string,
): string | null {
  if (!jurisdiction) {
    return null
  }

  if (
    jurisdiction.toLowerCase() ===
    'india'
  ) {
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

export function SahayakPage() {
  const location = useLocation()

  const contextualInnovation = (
    location.state as {
      innovation?: typeof demoInnovation
    } | null
  )?.innovation

  const [jurisdiction, setJurisdiction] =
    useState<
      'India' | 'International'
    >('India')

  const [language, setLanguage] =
    useState<ChatLanguage>('en')

  const [question, setQuestion] =
    useState('')

  const [answerStyle, setAnswerStyle] =
    useState<AnswerStyle>('Simple')

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

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<string | null>(null)

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
    if (conversations.length > 0) {
      localStorage.setItem(
        conversationStorageKey,
        JSON.stringify(conversations),
      )
    }
  }, [conversations])

  const activeConversation =
    conversations.find(
      (item) =>
        item.id ===
        activeConversationId,
    )

  const activeMessages =
    activeConversation?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
        block: 'nearest',
      },
    )
  }, [
    activeMessages.length,
    isLoading,
  ])

  const groupedConversations = useMemo(
    () =>
      conversations.reduce<
        Record<
          string,
          Conversation[]
        >
      >(
        (
          groups,
          conversation,
        ) => {
          const day = conversationDay(
            conversation.createdAt,
          )

          groups[day] = [
            ...(groups[day] ?? []),
            conversation,
          ]

          return groups
        },
        {},
      ),
    [conversations],
  )

  const submitQuestion = async (
    submittedQuestion = question,
    retryMessageId?: string,
  ) => {
    const trimmedQuestion =
      submittedQuestion.trim()

    if (
      !trimmedQuestion ||
      isLoading
    ) {
      return
    }

    setQuestion('')
    setError('')
    setIsLoading(true)

    const conversation =
      activeConversation ??
      createConversation(
        trimmedQuestion,
      )

    const responseMode =
      answerStyleToResponseMode(
        answerStyle,
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
              message.id !==
              retryMessageId,
          )
        : conversation.messages

    const conversationWithQuestion =
      {
        ...conversation,
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
        (item) =>
          item.id !==
          conversation.id,
      ),
    ])

    setActiveConversationId(
      conversation.id,
    )

    try {
      const result = await sendChatRequest({
        query: trimmedQuestion,
        jurisdiction: jurisdiction.toLowerCase() as
          | 'india'
          | 'international',
        language,
        response_mode: responseMode,
      })

      setConversations((current) =>
        current.map((item) =>
          item.id ===
          conversation.id
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
      const friendlyError =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to connect to IP-SAKTI Sahayak. Please try again.'

      setError(friendlyError)

      setConversations((current) =>
        current.map((item) =>
          item.id ===
          conversation.id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  {
                    id: `error-${item.messages.length + 1}`,
                    role: 'assistant',
                    error:
                      friendlyError,
                    retryQuestion:
                      trimmedQuestion,
                    responseMode,
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

    requestAnimationFrame(() =>
      questionInputRef.current?.focus(),
    )
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
                MitraAI Sahayak
              </p>

              <h2>
                Conversations
              </h2>
            </div>

            <button
              type="button"
              className="link-button history-new-button"
              onClick={() => {
                setActiveConversationId(
                  null,
                )
                setQuestion('')
                setHistoryOpen(false)
              }}
            >
              + New
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

          {Object.keys(
            groupedConversations,
          ).length === 0 ? (
            <div className="conversation-empty">
              <strong>
                No conversations yet
              </strong>

              <p>
                Ask your first question
                to begin.
              </p>
            </div>
          ) : (
            Object.entries(
              groupedConversations,
            ).map(
              ([day, items]) => (
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
                        onClick={() => {
                          setActiveConversationId(
                            conversation.id,
                          )
                          setError('')
                          setHistoryOpen(
                            false,
                          )
                        }}
                      >
                        {
                          conversation.title
                        }
                      </button>
                    ),
                  )}
                </div>
              ),
            )
          )}
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
                  MitraAI Sahayak
                </p>

                <h2>
                  MitraAI Sahayak
                </h2>

                <p className="muted-text">
                  Evidence-backed guidance
                  for Ayurveda IP,
                  Traditional Knowledge,
                  ABS and regulatory
                  questions.
                </p>
              </div>
            </div>

            <div className="sahayak-header-controls">
              <div className="sahayak-status">
                <span className="status-dot" />
                Evidence-grounded AI
              </div>

              <div
                className="selector-row"
                aria-label="Jurisdiction"
              >
                <button
                  type="button"
                  className={
                    jurisdiction ===
                    'India'
                      ? 'selected-pill active'
                      : 'selected-pill'
                  }
                  onClick={() =>
                    setJurisdiction(
                      'India',
                    )
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
                    setJurisdiction(
                      'International',
                    )
                  }
                >
                  International
                </button>
              </div>

              <label className="language-control">
                <span>Language</span>
                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target.value as ChatLanguage,
                    )
                  }
                  aria-label="Response language"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="te">తెలుగు</option>
                  <option value="ta">தமிழ்</option>
                  <option value="kn">ಕನ್ನಡ</option>
                  <option value="ml">മലയാളം</option>
                  <option value="bn">বাংলা</option>
                </select>
              </label>
            </div>
          </section>

          {contextualInnovation ? (
            <section className="context-card">
              <span className="small-label">
                You're reviewing
              </span>

              <strong>
                {
                  contextualInnovation.name
                }
              </strong>

              <span>
                {(
                  location.state as {
                    assessment?: string
                  } | null
                )?.assessment ??
                  'Innovation overview'}{' '}
                · What would you like to
                understand?
              </span>

              <div className="prompt-chips">
                {[
                  'What does this assessment mean?',
                  'Why is this relevant to my product?',
                  'What should I do next?',
                  'Show relevant evidence',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chip starter-prompt"
                    onClick={() =>
                      selectPrompt(prompt)
                    }
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="conversation-panel card-block">
            {activeMessages.length ===
            0 ? (
              <div className="mitraai-empty-state">
                <div className="mitraai-mark">
                  <Sparkles size={20} />
                </div>

                <p className="eyebrow accent">
                  MitraAI Sahayak
                </p>

                <h2>
                  Ask about your Ayurvedic
                  innovation, IP protection,
                  Traditional Knowledge,
                  ABS or regulatory
                  requirements.
                </h2>

                <p className="muted-text">
                  Choose a question to
                  begin an
                  evidence-grounded
                  conversation.
                </p>

                <div className="suggested-prompts">
                  {suggestedPrompts.map(
                    (prompt) => (
                      <button
                        key={
                          prompt.question
                        }
                        type="button"
                        className="chip starter-prompt"
                        onClick={() =>
                          void submitQuestion(
                            prompt.question,
                          )
                        }
                      >
                        <span className="starter-category">
                          {prompt.category}
                        </span>

                        <span>
                          {prompt.question}
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
                              {responseModeLabel(
                                message.responseMode,
                              )}{' '}
                              response
                            </span>
                          ) : null}
                        </div>
                      ) : message.error ? (
                        <div className="message error-message">
                          <p className="error-text">
                            We couldn't generate
                            a response right
                            now.
                          </p>

                          <p className="muted-text">
                            Please try again.
                          </p>

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
                            Retry
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
                  <div className="loading-state">
                    <LoaderCircle
                      className="spinner"
                      size={18}
                    />

                    <span>
                      MitraAI is reviewing the
                      available evidence...
                    </span>
                  </div>
                ) : null}

                <div
                  ref={messagesEndRef}
                />
              </div>
            )}
          </section>

          {error &&
          activeMessages.length === 0 ? (
            <p className="error-text">
              {error}
            </p>
          ) : null}

          <section className="chat-composer card-block">
            <div className="composer-toolbar">
              <span className="small-label">
                Answer style
              </span>

              <div className="style-switcher">
                {[
                  'Simple',
                  'Detailed',
                  'Technical',
                ].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={
                      answerStyle === style
                        ? 'style-button active'
                        : 'style-button'
                    }
                    onClick={() =>
                      setAnswerStyle(
                        style as AnswerStyle,
                      )
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="composer-row">
              <textarea
                ref={questionInputRef}
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
                placeholder="Ask about IP, Traditional Knowledge, ABS or regulatory requirements..."
                aria-label="Ask MitraAI"
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
                    ? 'Analyzing'
                    : 'Ask MitraAI'}
                </span>
              </button>
            </div>

            <p className="composer-note">
              Information provided by
              MitraAI Sahayak is for
              preliminary guidance and
              does not constitute legal
              advice.
            </p>
          </section>
        </main>
      </div>
    </AppShell>
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
      ? response.key_points.slice(
          0,
          3,
        )
      : response.key_points.slice(
          0,
          5,
        )

  return (
    <div className="answer-card">
      <div className="answer-card-heading">
        <Bot size={18} />

        <strong>
          MITRAAI SAHAYAK
        </strong>
      </div>

      <div className="answer-section direct-answer-section">
        <h4>DIRECT ANSWER</h4>

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
              code: ({
                children,
              }) => (
                <code>{children}</code>
              ),
            }}
          >
            {response.answer}
          </ReactMarkdown>
        </div>
      </div>

      {keyPoints.length > 0 ? (
        <div className="answer-section">
          <h4>KEY TAKEAWAYS</h4>

          <ul className="takeaway-list">
            {keyPoints.map(
              (item) => (
                <li key={item}>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}

      {response.sources.length > 0 ? (
        <details
          className="evidence-details"
          open
        >
          <summary>
            <span>
              EVIDENCE ·{' '}
              {response.sources.length}{' '}
              SOURCES
            </span>

            <ChevronDown
              size={16}
            />
          </summary>

          <div className="evidence-cards">
            {response.sources.map(
              (
                source,
                index,
              ) => {
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
                    key={`${source.evidence_number ?? 'source'}-${source.id ?? source.title ?? index}`}
                    className="evidence-card-mini"
                  >
                    {/* ------------------------------------------------
                        Card header
                    ------------------------------------------------- */}

                    <div className="evidence-card-top">
                      <span className="evidence-number">
                        EVIDENCE{' '}
                        {evidenceNumber}
                      </span>

                      <span className="evidence-verified">
                        <CheckCircle2
                          size={13}
                        />

                        KNOWLEDGE BASE SOURCE
                      </span>
                    </div>

                    {/* ------------------------------------------------
                        Title
                    ------------------------------------------------- */}

                    <div className="evidence-card-title-block">
                      <strong className="evidence-title">
                        {source.title ??
                          'Official document'}
                      </strong>

                      {source.authority ? (
                        <span className="evidence-authority">
                          {source.authority}
                        </span>
                      ) : null}
                    </div>

                    {/* ------------------------------------------------
                        Metadata
                    ------------------------------------------------- */}

                    <div className="evidence-meta-row">
                      {source.section ? (
                        <span className="evidence-meta-item">
                          <span className="evidence-meta-label">
                            PROVISION
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
                            PAGE
                          </span>

                          <span>
                            {source.page}
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

                    {/* ------------------------------------------------
                        Official source
                    ------------------------------------------------- */}

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
                          View official source
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
        <p className="empty-state">
          Reliable evidence was not
          found in the available
          knowledge base.
        </p>
      )}

      <div className="answer-footer">
        <span className="confidence-badge">
          <CheckCircle2 size={15} />

          Confidence{' '}
          {Math.round(
            response.confidence * 100,
          )}
          %

          <small>
            Retrieved evidence quality
          </small>
        </span>

        <div className="answer-footer-actions">
          <Link
            to="/sources"
            className="link-button"
          >
            View Evidence
          </Link>

          <div className="disclaimer-box warn-box">
            <ShieldAlert size={15} />

            <p>
              {response.disclaimer ||
                'This information is not legal advice.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}