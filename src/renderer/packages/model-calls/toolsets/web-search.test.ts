import * as localParser from '@/packages/local-parser'
import platform from '@/platform'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseLinkTool } from './web-search'

vi.mock('@/packages/local-parser', () => ({
  parseUrl: vi.fn(),
}))

vi.mock('@/platform', () => ({
  default: {
    getStoreBlob: vi.fn(),
  },
}))

describe('parseLinkTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses links without license via free parser', async () => {
    vi.mocked(localParser.parseUrl).mockResolvedValue({
      key: 'parse-key',
      title: 'Example Title',
    })
    vi.mocked(platform.getStoreBlob).mockResolvedValue('x'.repeat(600))

    const result = await (parseLinkTool as any).execute(
      {
        url: 'https://example.com',
        maxLength: 500,
      },
      {}
    )

    expect(localParser.parseUrl).toHaveBeenCalledWith('https://example.com')
    expect(result).toEqual({
      url: 'https://example.com',
      title: 'Example Title',
      content: 'x'.repeat(500),
      originalLength: 600,
      truncated: true,
    })
  })
})
