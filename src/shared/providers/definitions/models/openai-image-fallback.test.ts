import { describe, expect, it } from 'vitest'
import { extractOpenAIImageResultFromBody } from './openai-image-fallback'

describe('openai-image-fallback', () => {
  it('extracts url-based image results from image generation response body', () => {
    const result = extractOpenAIImageResultFromBody(
      '{"created":1772526055,"data":[{"url":"https://rgw.wanjiedata.com/maas-public-bucket/2026/03/03/bf59c6409ae493adbce63c3af71acb59.jpg"}],"usage":{"input_tokens_details":{}}}'
    )

    expect(result).toEqual({
      urls: ['https://rgw.wanjiedata.com/maas-public-bucket/2026/03/03/bf59c6409ae493adbce63c3af71acb59.jpg'],
      b64Images: [],
      outputFormat: undefined,
    })
  })

  it('extracts b64-based image results from standard response body', () => {
    const result = extractOpenAIImageResultFromBody({
      data: [{ b64_json: 'ZmFrZS1iYXNlNjQ=' }],
      output_format: 'png',
    })

    expect(result).toEqual({
      urls: [],
      b64Images: ['ZmFrZS1iYXNlNjQ='],
      outputFormat: 'png',
    })
  })

  it('returns null for unrelated payload', () => {
    expect(extractOpenAIImageResultFromBody('{"ok":true}')).toBeNull()
  })
})
