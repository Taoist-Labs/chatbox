/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { YahooSearch } from './yahoo'

describe('YahooSearch', () => {
  it('parses Yahoo SERP items from html response', async () => {
    const yahoo = new YahooSearch()
    const html = `
      <html>
        <head><title>OpenAI - Yahoo Search</title></head>
        <body>
          <div id="web">
            <ol>
              <li class="algo">
                <h3 class="title"><a href="https://openai.com/">OpenAI</a></h3>
                <div class="compText"><p>OpenAI official website.</p></div>
              </li>
              <li class="algo">
                <h3 class="title"><a href="https://platform.openai.com/">OpenAI Platform</a></h3>
                <div class="compText"><p>Build with OpenAI APIs.</p></div>
              </li>
            </ol>
          </div>
        </body>
      </html>
    `

    vi.spyOn(yahoo as any, 'fetch').mockResolvedValue(html)

    const result = await yahoo.search('openai')

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      title: 'OpenAI',
      link: 'https://openai.com/',
      snippet: 'OpenAI official website.',
    })
  })
})
