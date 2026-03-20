type OpenAIImageResult = {
  urls: string[]
  b64Images: string[]
  outputFormat?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toRecordFromBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return isRecord(body) ? body : null
}

export function extractOpenAIImageResultFromBody(body: unknown): OpenAIImageResult | null {
  const record = toRecordFromBody(body)
  if (!record || !Array.isArray(record.data)) {
    return null
  }

  const urls: string[] = []
  const b64Images: string[] = []

  for (const item of record.data) {
    if (!isRecord(item)) continue
    if (typeof item.url === 'string' && item.url.length > 0) {
      urls.push(item.url)
    }
    if (typeof item.b64_json === 'string' && item.b64_json.length > 0) {
      b64Images.push(item.b64_json)
    }
  }

  if (urls.length === 0 && b64Images.length === 0) {
    return null
  }

  return {
    urls,
    b64Images,
    outputFormat: typeof record.output_format === 'string' ? record.output_format : undefined,
  }
}
