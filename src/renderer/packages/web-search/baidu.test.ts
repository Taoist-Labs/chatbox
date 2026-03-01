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
})
