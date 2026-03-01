import type { SearchResult } from '@shared/types'
import WebSearch from './base'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

export class QuarkSearch extends WebSearch {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] QuarkSearch start`, { query })

    const html = await this.fetchSerp(query, signal)
    const items = this.extractItems(html, traceId)

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] QuarkSearch done`, {
      query,
      itemCount: items.length,
    })

    return { items }
  }

  private async fetchSerp(query: string, signal?: AbortSignal) {
    const html = await this.fetch('https://quark.sm.cn/s', {
      method: 'GET',
      query: { q: query },
      signal,
    })
    return html as string
  }

  private extractItems(html: string, traceId: string) {
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const nodes = Array.from(dom.querySelectorAll('#results .result, .result, article, li')) as Element[]

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Quark parse diagnostics`, {
      title: normalizeText(dom.querySelector('title')?.textContent),
      htmlLength: html.length,
      nodeCount: nodes.length,
    })

    const items = nodes
      .map((node) => {
        const nodeA = node.querySelector(
          '.result-title, .c-title a, h3 a, h2 a, a[result-title], a'
        ) as HTMLAnchorElement | null
        const link = nodeA?.getAttribute('href') || ''
        const title = normalizeText(nodeA?.textContent)
        const snippet = normalizeText(
          node.querySelector('.result-desc, .c-abstract, .desc, p')?.textContent || ''
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

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Quark parse done`, {
      strategy: 'organic',
      parsedCount: items.length,
    })

    return items
  }
}
