/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { BaiduSearch } from './baidu'

describe('BaiduSearch', () => {
  it('parses Baidu SERP items from html response', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <head><title>openai_百度搜索</title></head>
        <body>
          <div id="content_left">
            <div class="result c-container">
              <h3><a href="https://openai.com/">OpenAI</a></h3>
              <div class="c-abstract">OpenAI official website.</div>
            </div>
            <div class="result c-container">
              <h3><a href="https://platform.openai.com/">OpenAI Platform</a></h3>
              <div class="c-abstract">Build with OpenAI APIs.</div>
            </div>
          </div>
        </body>
      </html>
    `

    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    const result = await baidu.search('openai')

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      title: 'OpenAI',
      link: 'https://openai.com/',
      snippet: 'OpenAI official website.',
    })
  })

  it('prints parsed item previews for ios diagnostics', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <body>
          <div id="content_left">
            <div class="result c-container">
              <h3><a href="https://example.com/a">Result A</a></h3>
              <div class="c-abstract">snippet a</div>
            </div>
          </div>
        </body>
      </html>
    `
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    try {
      await baidu.search('ios-debug')

      expect(
        logSpy.mock.calls.some(
          (call) =>
            String(call[0]).includes('Baidu parsed items preview') &&
            Array.isArray(call[1]?.items) &&
            call[1].items[0]?.title === 'Result A'
        )
      ).toBe(true)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('filters out result-op card blocks and internal /s?wd links', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <body>
          <div id="content_left">
            <div class="result-op c-container">
              <h3><a href="https://example.com/weather-card">查看40天预报</a></h3>
              <div>weather card text</div>
            </div>
            <div class="result c-container">
              <h3><a href="/s?wd=%E6%AD%A6%E6%B1%89%E5%A4%A9%E6%B0%94">武汉市近一周穿衣指数</a></h3>
              <div>internal result</div>
            </div>
            <div class="result c-container">
              <h3><a href="https://example.com/ok">Result OK</a></h3>
              <div class="c-abstract">external snippet</div>
            </div>
          </div>
        </body>
      </html>
    `
    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    const result = await baidu.search('filter-debug')

    expect(result.items).toEqual([
      {
        title: 'Result OK',
        link: 'https://example.com/ok',
        snippet: 'external snippet',
      },
    ])
  })

  it('falls back snippet from node text when selector misses', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <body>
          <div id="content_left">
            <div class="result c-container">
              <h3><a href="https://example.com/fallback">Fallback Result</a></h3>
              <div class="desc">This snippet comes from node text fallback.</div>
            </div>
          </div>
        </body>
      </html>
    `
    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    const result = await baidu.search('fallback-debug')

    expect(result.items[0]?.snippet).toContain('This snippet comes from node text fallback.')
  })

  it('prints filter diagnostics for skipped and kept nodes', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <body>
          <div id="content_left">
            <div class="result-op c-container">
              <h3><a href="https://example.com/weather-card">card</a></h3>
            </div>
            <div class="result c-container">
              <h3><a href="/s?wd=inner">inner</a></h3>
            </div>
            <div class="result c-container">
              <h3><a href="https://example.com/ok">ok</a></h3>
              <div class="c-abstract">ok snippet</div>
            </div>
          </div>
        </body>
      </html>
    `
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    try {
      await baidu.search('filter-diagnostics')

      expect(
        logSpy.mock.calls.some(
          (call) =>
            String(call[0]).includes('Baidu filter diagnostics') &&
            call[1]?.totalNodeCount === 3 &&
            call[1]?.removedResultOpCount === 1 &&
            call[1]?.removedInternalSearchCount === 1 &&
            call[1]?.keptNodeCount === 1
        )
      ).toBe(true)
    } finally {
      logSpy.mockRestore()
    }
  })

  it('does not print heavy investigation logs after fallback fix is stable', async () => {
    const baidu = new BaiduSearch()
    const html = `
      <html>
        <body>
          <div id="content_left">
            <div class="result c-container">
              <h3><a href="https://example.com/a">Result A</a></h3>
              <div class="desc">fallback snippet text</div>
            </div>
          </div>
        </body>
      </html>
    `
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(baidu as any, 'fetch').mockResolvedValue(html)

    try {
      await baidu.search('trim-heavy-debug')

      const labels = logSpy.mock.calls.map((call) => String(call[0]))
      expect(labels.some((label) => label.includes('Baidu raw html before parse'))).toBe(false)
      expect(labels.some((label) => label.includes('Baidu selector diagnostics'))).toBe(false)
    } finally {
      logSpy.mockRestore()
    }
  })
})
