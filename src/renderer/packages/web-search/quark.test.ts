/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { QuarkSearch } from './quark'

describe('QuarkSearch', () => {
  it('parses Quark SERP items from html response', async () => {
    const quark = new QuarkSearch()
    const html = `
      <html>
        <head><title>openai_夸克搜索</title></head>
        <body>
          <div id="results">
            <div class="result">
              <a class="result-title" href="https://openai.com/">OpenAI</a>
              <p class="result-desc">OpenAI official website.</p>
            </div>
            <div class="result">
              <a class="result-title" href="https://platform.openai.com/">OpenAI Platform</a>
              <p class="result-desc">Build with OpenAI APIs.</p>
            </div>
          </div>
        </body>
      </html>
    `

    vi.spyOn(quark as any, 'fetch').mockResolvedValue(html)

    const result = await quark.search('openai')

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      title: 'OpenAI',
      link: 'https://openai.com/',
      snippet: 'OpenAI official website.',
    })
  })
})
