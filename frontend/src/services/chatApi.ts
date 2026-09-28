export type ChatLanguage =
  | 'en'
  | 'hi'
  | 'te'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'bn'

export type ChatJurisdiction =
  | 'india'
  | 'international'

export type ChatResponseMode =
  | 'simple'
  | 'detailed'
  | 'technical'

export type ChatSource = {
  evidence_number?: number
  id?: string
  title?: string
  authority?: string
  jurisdiction?: string
  domain?: string
  page?: number | string
  section?: string
  relevance?: number | string
  url?: string
}

export type ChatGenerationStatus =
  | 'gemini'
  | 'gemini_fallback'
  | 'evidence_fallback'
  | 'rag_only'

export type ChatResponse = {
  answer: string
  confidence: number
  key_points: string[]
  sources: ChatSource[]
  disclaimer: string

  generation_status?: ChatGenerationStatus
  generation_model?: string | null
  generation_note?: string | null
}

export type ChatRequest = {
  query: string
  jurisdiction: ChatJurisdiction
  language: ChatLanguage
  response_mode: ChatResponseMode
}

export type ChatErrorKind =
  | 'network'
  | 'rate-limit'
  | 'temporary'
  | 'configuration'
  | 'server'
  | 'invalid-response'
  | 'unknown'

export class ChatApiError extends Error {
  readonly status: number | null
  readonly kind: ChatErrorKind
  readonly detail?: string

  constructor(
    message: string,
    options: {
      status?: number | null
      kind?: ChatErrorKind
      detail?: string
    } = {},
  ) {
    super(message)

    this.name = 'ChatApiError'
    this.status = options.status ?? null
    this.kind = options.kind ?? 'unknown'
    this.detail = options.detail
  }
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '')

function isChatGenerationStatus(
  value: unknown,
): value is ChatGenerationStatus {
  return (
    value === 'gemini' ||
    value === 'gemini_fallback' ||
    value === 'evidence_fallback' ||
    value === 'rag_only'
  )
}

function isChatResponse(
  value: unknown,
): value is ChatResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const response =
    value as Record<string, unknown>

  const hasRequiredFields =
    typeof response.answer === 'string' &&
    typeof response.confidence === 'number' &&
    Array.isArray(response.key_points) &&
    Array.isArray(response.sources) &&
    typeof response.disclaimer === 'string'

  if (!hasRequiredFields) {
    return false
  }

  // Generation metadata is optional so older backend responses
  // remain compatible during development.
  if (
    response.generation_status !== undefined &&
    !isChatGenerationStatus(
      response.generation_status,
    )
  ) {
    return false
  }

  if (
    response.generation_model !== undefined &&
    response.generation_model !== null &&
    typeof response.generation_model !== 'string'
  ) {
    return false
  }

  if (
    response.generation_note !== undefined &&
    response.generation_note !== null &&
    typeof response.generation_note !== 'string'
  ) {
    return false
  }

  return true
}

function getErrorDetail(
  value: unknown,
): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const body =
    value as Record<string, unknown>

  if (typeof body.detail === 'string') {
    return body.detail
  }

  if (typeof body.message === 'string') {
    return body.message
  }

  if (typeof body.error === 'string') {
    return body.error
  }

  return ''
}

function createHttpError(
  status: number,
  detail: string,
): ChatApiError {
  switch (status) {
    case 429:
      return new ChatApiError(
        'The MitraAI request limit has been reached. Please try again later.',
        {
          status,
          kind: 'rate-limit',
          detail,
        },
      )

    case 503:
      return new ChatApiError(
        'The AI service is temporarily unavailable because of high demand. Please try again in a moment.',
        {
          status,
          kind: 'temporary',
          detail,
        },
      )

    case 401:
    case 403:
      return new ChatApiError(
        'The AI service could not be reached with the current configuration.',
        {
          status,
          kind: 'configuration',
          detail,
        },
      )

    case 500:
    case 502:
    case 504:
      return new ChatApiError(
        'The backend service is temporarily unavailable. Please try again.',
        {
          status,
          kind: 'server',
          detail,
        },
      )

    default:
      return new ChatApiError(
        'The chat request could not be completed. Please try again.',
        {
          status,
          kind: 'unknown',
          detail,
        },
      )
  }
}

async function parseErrorBody(
  response: Response,
): Promise<string> {
  try {
    const body: unknown =
      await response.json()

    return getErrorDetail(body)
  } catch {
    return ''
  }
}

export async function sendChatRequest(
  request: ChatRequest,
): Promise<ChatResponse> {
  let response: Response

  try {
    response = await fetch(
      `${apiBaseUrl}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )
  } catch {
    throw new ChatApiError(
      'Unable to connect to IP-SAKTI Sahayak. Please make sure the backend server is running.',
      {
        status: null,
        kind: 'network',
      },
    )
  }

  if (!response.ok) {
    const detail =
      await parseErrorBody(response)

    throw createHttpError(
      response.status,
      detail,
    )
  }

  let result: unknown

  try {
    result = await response.json()
  } catch {
    throw new ChatApiError(
      'The chat service returned an invalid response.',
      {
        status: response.status,
        kind: 'invalid-response',
      },
    )
  }

  if (!isChatResponse(result)) {
    throw new ChatApiError(
      'The chat service returned an invalid response.',
      {
        status: response.status,
        kind: 'invalid-response',
      },
    )
  }

  return result
}