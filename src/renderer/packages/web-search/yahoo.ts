import type { SearchResult } from '@shared/types'
import WebSearch from './base'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function normalizeYahooLink(rawLink: string): string {
  if (!rawLink) {
    return rawLink
  }

  try {
    const parsed = new URL(rawLink)
    if (parsed.hostname === 'r.search.yahoo.com') {
      const matched = parsed.pathname.match(/\/RU=([^/]+)\/RK=/)
      if (matched?.[1]) {
        return decodeURIComponent(matched[1])
      }
    }
  } catch {
    // keep original link when URL parsing fails
  }

  return rawLink
}

export class YahooSearch extends WebSearch {
  async search(query: string, signal?: AbortSignal): Promise<SearchResult> {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] YahooSearch start`, { query })

    const html = await this.fetchSerp(query, signal)
    const items = this.extractItems(html, traceId)

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] YahooSearch done`, {
      query,
      itemCount: items.length,
    })

    return { items }
  }

  private async fetchSerp(query: string, signal?: AbortSignal) {
    const html = await this.fetch('https://search.yahoo.com/search', {
      method: 'GET',
      query: { p: query },
      signal,
    })
    return html as string
  }

  private extractItems(html: string, traceId: string) {
    const dom = new DOMParser().parseFromString(html, 'text/html')

    const nodes = Array.from(
      dom.querySelectorAll('#web ol > li, #web .algo, #main li[data-layout="organic"]')
    ) as Element[]

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Yahoo parse diagnostics`, {
      title: normalizeText(dom.querySelector('title')?.textContent),
      htmlLength: html.length,
      nodeCount: nodes.length,
    })

    const items = nodes
      .map((node) => {
        const nodeA = node.querySelector('h3.title > a, h3 > a, a')
        const href = nodeA?.getAttribute('href') || ''
        const title = normalizeText(nodeA?.textContent)
        const snippet = normalizeText(
          node.querySelector('.compText > p, .compText, p')?.textContent || ''
        )
        const link = normalizeYahooLink(href)

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

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Yahoo parse done`, {
      strategy: 'organic',
      parsedCount: items.length,
    })

    return items
  }
}
