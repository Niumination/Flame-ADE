import { Channel, invoke } from '@tauri-apps/api/core'

interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: number[]
}

type AiStreamEvent =
  | { kind: 'headers'; status: number; headers: Record<string, string> }
  | { kind: 'chunk'; bytes: number[] }
  | { kind: 'end' }
  | { kind: 'error'; message: string }

const STATUS_TEXTS: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 408: 'Request Timeout',
  429: 'Too Many Requests',
  500: 'Internal Server Error', 502: 'Bad Gateway',
  503: 'Service Unavailable', 504: 'Gateway Timeout',
}

const HEADERS_TIMEOUT_MS = 30_000

async function streamViaChannel(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: number[] | undefined,
): Promise<Response> {
  const channel = new Channel<AiStreamEvent>()

  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  let resolveHeaders:
    | ((value: { status: number; headers: Headers }) => void)
    | null = null
  let rejectHeaders: ((reason: unknown) => void) | null = null
  const headersReady = new Promise<{ status: number; headers: Headers }>(
    (resolve, reject) => {
      resolveHeaders = resolve
      rejectHeaders = reject
    },
  )

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })

  let streamEnded = false
  channel.onmessage = (event: AiStreamEvent) => {
    if (streamEnded) return
    try {
      switch (event.kind) {
        case 'headers':
          resolveHeaders?.({
            status: event.status,
            headers: new Headers(event.headers),
          })
          break
        case 'chunk':
          controller?.enqueue(new Uint8Array(event.bytes))
          break
        case 'end':
          streamEnded = true
          controller?.close()
          break
        case 'error':
          streamEnded = true
          controller?.error(new Error(event.message))
          break
      }
    } catch (e) {
      if (!streamEnded) {
        streamEnded = true
        controller?.error(e)
      }
    }
  }

  invoke<null>('ai_http_stream', {
    url,
    method,
    headers,
    body: body ?? null,
    allowPrivateNetwork: false,
    onEvent: channel,
  }).catch((e) => {
    if (!streamEnded) {
      streamEnded = true
      controller?.error(new Error(`Rust stream failed: ${e?.message || String(e)}`))
    }
    rejectHeaders?.(e)
  })

  const headersTimeoutId = setTimeout(() => {
    rejectHeaders?.(new Error('Stream timed out waiting for response headers'))
  }, HEADERS_TIMEOUT_MS)

  let status: number
  let responseHeaders: Headers
  try {
    const result = await headersReady
    status = result.status
    responseHeaders = result.headers
  } finally {
    clearTimeout(headersTimeoutId)
  }

  return new Response(stream, {
    status,
    statusText: STATUS_TEXTS[status] || '',
    headers: responseHeaders,
  })
}

async function bufferViaRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: number[] | undefined,
): Promise<Response> {
  const result = await invoke<HttpResponse>('ai_http_request', {
    url,
    method,
    headers,
    body: body ?? null,
    allowPrivateNetwork: false,
  })

  const responseHeaders = new Headers(result.headers)
  const uint8 = new Uint8Array(result.body)
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(uint8)
      controller.close()
    },
  })

  return new Response(stream, {
    status: result.status,
    statusText: STATUS_TEXTS[result.status] || '',
    headers: responseHeaders,
  })
}

function isAiChatRequest(url: string, method: string): boolean {
  return method === 'POST' && url.includes('/chat/completions')
}

export async function corsFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  if (!url.startsWith('https://')) {
    return fetch(input, init)
  }

  const method = init?.method || 'GET'

  const headers: Record<string, string> = {}
  if (init?.headers) {
    const h = init.headers as Record<string, string>
    for (const key of Object.keys(h)) {
      headers[key] = h[key]
    }
  }

  let body: number[] | undefined
  if (init?.body != null) {
    if (typeof init.body === 'string') {
      body = Array.from(new TextEncoder().encode(init.body))
    } else if (init.body instanceof ArrayBuffer) {
      body = Array.from(new Uint8Array(init.body))
    } else if (init.body instanceof Blob) {
      body = Array.from(new Uint8Array(await init.body.arrayBuffer()))
    } else if (init.body instanceof URLSearchParams) {
      body = Array.from(new TextEncoder().encode(init.body.toString()))
    }
  }

  if (isAiChatRequest(url, method)) {
    return streamViaChannel(url, method, headers, body)
  }

  return bufferViaRequest(url, method, headers, body)
}
