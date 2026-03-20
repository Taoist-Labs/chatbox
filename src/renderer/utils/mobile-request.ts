import { CapacitorHttp } from '@capacitor/core'
import { createNativeReadableStream } from '@/native/stream-http'
import { ApiError } from '../../shared/models/errors'

type MobileResponseType = 'text' | 'arraybuffer'

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'))
  }

  if (typeof atob === 'function') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  throw new ApiError('Unable to decode base64 binary response')
}

function toArrayBufferPayload(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data
  }

  if (ArrayBuffer.isView(data)) {
    const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    return Uint8Array.from(view).buffer as ArrayBuffer
  }

  if (Array.isArray(data)) {
    return Uint8Array.from(data).buffer as ArrayBuffer
  }

  if (typeof data === 'string') {
    return decodeBase64ToUint8Array(data).buffer as ArrayBuffer
  }

  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return Uint8Array.from((data as { data: number[] }).data).buffer as ArrayBuffer
  }

  throw new ApiError('Invalid arraybuffer response payload')
}

export async function handleMobileRequest(
  url: string,
  method: string,
  headers: Headers,
  body?: RequestInit['body'],
  signal?: AbortSignal,
  responseType: MobileResponseType = 'text'
): Promise<Response> {
  // Fix: Convert Headers to plain object without using .entries()
  const headerObj: Record<string, string> = {}
  headers.forEach((value, key) => {
    headerObj[key] = value
  })
  const isStreaming = body && typeof body === 'string' && JSON.parse(body).stream === true

  if (isStreaming) {
    try {
      // Add SSE Accept header for proper content negotiation
      const streamHeaders = {
        ...headerObj,
        Accept: 'text/event-stream',
      }

      const stream = createNativeReadableStream({
        url,
        method,
        headers: streamHeaders,
        body: body as string,
      })

      // Handle abort signal for stream cancellation
      if (signal) {
        const onAbort = () => {
          try {
            void stream.cancel('aborted')
          } catch {}
        }
        if (signal.aborted) onAbort()
        else signal.addEventListener('abort', onAbort, { once: true })
      }

      // TODO: Once native plugin supports returning status/headers,
      // use them instead of hardcoded values
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (err) {
      console.warn('Native streaming unavailable, falling back', err)
    }
  }

  const response = await CapacitorHttp.request({
    url,
    method,
    headers: headerObj,
    data: body,
    responseType,
  })

  const rawData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
  // Treat status 0 or < 200 as errors, in addition to >= 400
  if (response.status === 0 || response.status < 200 || response.status >= 400) {
    throw new ApiError(`Status Code ${response.status}`, rawData)
  }

  if (responseType === 'arraybuffer') {
    const binaryBody = toArrayBufferPayload(response.data)
    return new Response(binaryBody, {
      status: response.status,
      headers: response.headers,
    })
  }

  const responseData = rawData

  if (isStreaming) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(responseData))
        controller.close()
      },
    })
    return new Response(stream, {
      status: response.status,
      headers: { ...response.headers, 'Content-Type': 'text/event-stream' },
    })
  }

  return new Response(responseData, {
    status: response.status,
    headers: response.headers,
  })
}
