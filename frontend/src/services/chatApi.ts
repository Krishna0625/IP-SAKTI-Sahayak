export type ChatLanguage =
  | 'en'
  | 'hi'
  | 'te'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'bn'
export type ChatJurisdiction = 'india' | 'international'
export type ChatResponseMode = 'simple' | 'detailed' | 'technical'

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

export type ChatResponse = {
  answer: string
  confidence: number
  key_points: string[]
  sources: ChatSource[]
  disclaimer: string
}

type ChatRequest = {
  query: string
  jurisdiction: ChatJurisdiction
  language: ChatLanguage
  response_mode: ChatResponseMode
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

function isChatResponse(value: unknown): value is ChatResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const response = value as Record<string, unknown>
  return (
    typeof response.answer === 'string' &&
    typeof response.confidence === 'number' &&
    Array.isArray(response.key_points) &&
    Array.isArray(response.sources) &&
    typeof response.disclaimer === 'string'
  )
}

export async function sendChatRequest(
  request: ChatRequest,
): Promise<ChatResponse> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error(
      'Unable to connect to IP-SAKTI Sahayak. Please make sure the backend server is running.',
    )
  }

  if (!response.ok) {
    let detail = ''

    try {
      const errorBody: unknown = await response.json()
      if (
        errorBody &&
        typeof errorBody === 'object' &&
        typeof (errorBody as Record<string, unknown>).detail === 'string'
      ) {
        detail = (errorBody as Record<string, string>).detail
      }
    } catch {
      // Keep the frontend error user-friendly when the server has no JSON body.
    }

    throw new Error(
      detail || 'The chat request could not be completed. Please try again.',
    )
  }

  const result: unknown = await response.json()
  if (!isChatResponse(result)) {
    throw new Error('The chat service returned an invalid response.')
  }

  return result
}
