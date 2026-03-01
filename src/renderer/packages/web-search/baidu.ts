import type { SearchResult } from '@shared/types'
import WebSearch from './base'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

export class BaiduSearch extends WebSearch {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] BaiduSearch start`, { query })

    const html = await this.fetchSerp(query, signal)
    const items = this.extractItems(html, traceId)

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] BaiduSearch done`, {
      query,
      itemCount: items.length,
    })

    return { items }
  }

  private async fetchSerp(query: string, signal?: AbortSignal) {
    const html = await this.fetch('https://www.baidu.com/s', {
      method: 'GET',
      query: { wd: query },
      signal,
    })
    return html as string
  }

  private extractItems(html: string, traceId: string) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const nodes = Array.from(dom.querySelectorAll('#content_left .result, #content_left .c-container')) as Element[]

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Baidu parse diagnostics`, {
      title: normalizeText(dom.querySelector('title')?.textContent),
      htmlLength: html.length,
      nodeCount: nodes.length,
    })

    const items = nodes
      .map((node) => {
        const nodeA = node.querySelector('h3 a, .t a, a')
        const link = nodeA?.getAttribute('href') || ''
        const title = normalizeText(nodeA?.textContent)
        const snippet = normalizeText(
          node.querySelector('.c-abstract, .c-span-last, [class*="c-color-text"]')?.textContent || ''
        )

        if (!title || !link) {
          return null
        }

        return {
          title,
          link,
          snippet,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 10)

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Baidu parse done`, {
      strategy: 'organic',
      parsedCount: items.length,
    })

    return items
  }
}
