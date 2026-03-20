import type { SearchResult } from '@shared/types'
import WebSearch from './base'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'
const NODE_TEXT_SNIPPET_MAX_LENGTH = 500
const BAIDU_SNIPPET_CANDIDATE_SELECTORS = [
  '.c-abstract',
  '.c-span-last',
  '.c-color-text',
  '[class*="c-color-text"]',
  '.c-font-normal',
  '.c-row p',
]

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function getSnippetBySelector(node: Element, selector: string): string {
  return normalizeText(node.querySelector(selector)?.textContent || '')
}

function isBaiduResultOpNode(node: Element): boolean {
  return node.classList.contains('result-op')
}

function isBaiduInternalSearchLink(link: string): boolean {
  return /^\/s\?wd=/.test(link)
}

function getFallbackSnippetFromNodeText(nodeText: string, title: string): string {
  if (!nodeText) {
    return ''
  }
  if (!title) {
    return nodeText
  }
  if (nodeText.startsWith(title)) {
    return normalizeText(nodeText.slice(title.length))
  }
  return normalizeText(nodeText.replace(title, ''))
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

    const parsedNodeDiagnostics = nodes.map((node, index) => {
      const nodeA = node.querySelector('h3 a, .t a, a')
      const title = normalizeText(nodeA?.textContent)
      const link = nodeA?.getAttribute('href') || ''
      const nodeText = normalizeText(node.textContent)
      const snippetFromSelector =
        BAIDU_SNIPPET_CANDIDATE_SELECTORS.map((selector) => getSnippetBySelector(node, selector)).find(Boolean) || ''
      const snippetFallback = getFallbackSnippetFromNodeText(nodeText, title).slice(0, NODE_TEXT_SNIPPET_MAX_LENGTH)
      const snippet = snippetFromSelector || snippetFallback
      const snippetSource = snippetFromSelector ? 'selector' : snippetFallback ? 'node_text_fallback' : 'empty'
      const isResultOp = isBaiduResultOpNode(node)
      const isInternalSearch = isBaiduInternalSearchLink(link)

      return {
        index,
        title,
        link,
        isResultOp,
        isInternalSearch,
        snippet,
        snippetSource,
      }
    })

    const removedResultOpCount = parsedNodeDiagnostics.filter((node) => node.isResultOp).length
    const removedInternalSearchCount = parsedNodeDiagnostics.filter(
      (node) => !node.isResultOp && node.isInternalSearch
    ).length
    const removedMissingCoreCount = parsedNodeDiagnostics.filter((node) => !node.title || !node.link).length
    const keptNodes = parsedNodeDiagnostics.filter(
      (node) => !node.isResultOp && !node.isInternalSearch && node.title && node.link
    )

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Baidu filter diagnostics`, {
      totalNodeCount: parsedNodeDiagnostics.length,
      removedResultOpCount,
      removedInternalSearchCount,
      removedMissingCoreCount,
      keptNodeCount: keptNodes.length,
      keptNodeSamples: keptNodes.slice(0, 5).map((node) => ({
        index: node.index,
        title: node.title,
        link: node.link,
        snippetSource: node.snippetSource,
      })),
    })

    const items = keptNodes
      .map((node) => ({
        title: node.title,
        link: node.link,
        snippet: node.snippet,
      }))
      .slice(0, 10)

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Baidu parse done`, {
      strategy: 'organic',
      parsedCount: items.length,
    })

    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] Baidu parsed items preview`, {
      items: items.map((item, index) => ({
        index,
        title: item.title,
        link: item.link,
        snippet: item.snippet.slice(0, 200),
      })),
    })

    return items
  }
}
