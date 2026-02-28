import type { SearchResult } from '@shared/types'
import WebSearch from './base'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

export class BingSearch extends WebSearch {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] BingSearch start`, { query })
    const html = await this.fetchSerp(query, signal)
    const items = this.extractItems(html, traceId)
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] BingSearch done`, {
      query,
      itemCount: items.length,
    })
    return { items }
  }

  private async fetchSerp(query: string, signal?: AbortSignal) {
    const html = await this.fetch('https://www.bing.com/search', {
      method: 'GET',
      query: { q: query },
      signal,
    })
    return html as string
  }

  private extractItems(html: string, traceId: string) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const nodes = dom.querySelectorAll('#b_results>li.b_algo')

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Bing parse diagnostics`, {
      title: normalizeText(dom.querySelector('title')?.textContent),
      htmlLength: html.length,
      classicNodeCount: nodes.length,
    })

    const items = Array.from(nodes)
      .slice(0, 10)
      .map((node) => {
        const nodeA = node.querySelector('h2>a')!
        const link = nodeA.getAttribute('href')!
        const title = nodeA.textContent || ''
        const nodeAbstract = node.querySelector('p[class^="b_lineclamp"]')
        const snippet = nodeAbstract?.textContent || ''
        return { title, link, snippet }
      })

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Bing parse done`, {
      strategy: 'classic',
      parsedCount: items.length,
    })
    return items
  }
}
