import { cachified } from '@epic-web/cachified'
import type { SearchResultItem } from '@shared/types'
import { truncate } from 'lodash'
import platform from '@/platform'
import { getExtensionSettings, getLanguage } from '@/stores/settingActions'
import { RemoteAPIError } from '../../../shared/models/errors'
import type WebSearch from './base'
import { BaiduSearch } from './baidu'
import { BingSearch } from './bing'
import { BingNewsSearch } from './bing-news'
import { TavilySearch } from './tavily'
import { YahooSearch } from './yahoo'

const MAX_CONTEXT_ITEMS = 10
const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

function createWebSearchTraceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getProviderName(provider: WebSearch) {
  return provider.constructor?.name || 'UnknownSearchProvider'
}

// 根据配置的搜索提供方来选择搜索服务
function getSearchProviders() {
  const settings = getExtensionSettings()

  const selectedProviders: WebSearch[] = []
  const provider = settings.webSearch.provider
  const language = getLanguage()

  switch (provider) {
    case 'build-in':
    case 'bing':
      selectedProviders.push(new BingSearch())
      if (language !== 'zh-Hans') {
        selectedProviders.push(new BingNewsSearch()) // 国内无法使用
      }
      break
    case 'tavily':
      if (!settings.webSearch.tavilyApiKey) {
        throw RemoteAPIError.fromCodeName('tavily_api_key_required', 'tavily_api_key_required')
      }
      selectedProviders.push(
        new TavilySearch(
          settings.webSearch.tavilyApiKey,
          settings.webSearch.tavilySearchDepth,
          settings.webSearch.tavilyMaxResults,
          settings.webSearch.tavilyTimeRange,
          settings.webSearch.tavilyIncludeRawContent
        )
      )
      break
    case 'yahoo':
      selectedProviders.push(new YahooSearch())
      break
    case 'baidu':
      selectedProviders.push(new BaiduSearch())
      break
    default:
      throw new Error(`Unsupported search provider: ${provider}`)
  }

  return selectedProviders
}

async function _searchRelatedResults(query: string, signal?: AbortSignal, traceId: string = 'no-trace') {
  const providers = getSearchProviders()
  const providerNames = providers.map((provider) => getProviderName(provider))
  console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] provider pipeline start`, {
    query,
    providerNames,
    providerCount: providers.length,
    signalAborted: signal?.aborted ?? false,
  })

  const results = await Promise.all(
    providers.map(async (provider) => {
      const providerName = getProviderName(provider)
      console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] provider request start`, { providerName, query })
      try {
        const result = await provider.search(query, signal)
        console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] provider request success`, {
          providerName,
          query,
          itemCount: result.items.length,
        })
        console.debug(`web search result for "${query}":`, result.items)
        return result
      } catch (err) {
        console.error(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] provider request failed`, { providerName, query, err })
        return { items: [] }
      }
    })
  )

  const items: SearchResultItem[] = []

  // add items in turn
  let i = 0
  let hasMore = false
  do {
    hasMore = false
    for (const result of results) {
      const item = result.items[i]
      if (item) {
        hasMore = true
        items.push(item)
      } else {
      }
    }
    i++
  } while (hasMore && items.length < MAX_CONTEXT_ITEMS)

  console.debug('web search items', items)
  console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] provider pipeline done`, {
    query,
    mergedItemCount: items.length,
  })

  return items.map((item) => ({
    title: item.title,
    snippet: truncate(item.snippet, { length: 150 }),
    link: item.link,
    rawContent: item.rawContent,
  }))
}

const cache = new Map()

export const webSearchExecutor = async (
  { query }: { query: string },
  { abortSignal }: { abortSignal?: AbortSignal }
) => {
  const traceId = createWebSearchTraceId()
  const settings = getExtensionSettings()
  const cacheKey = `search-context:${query}`
  const hasCachedValue = cache.has(cacheKey)
  console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] executor start`, {
    query,
    cacheKey,
    hasCachedValue,
    provider: settings.webSearch.provider,
    platformType: platform.type,
    signalAborted: abortSignal?.aborted ?? false,
  })

  const searchResults = await cachified({
    cache,
    key: cacheKey,
    ttl: 1000 * 60 * 5,
    getFreshValue: () => _searchRelatedResults(query, abortSignal, traceId),
  })
  console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] executor done`, {
    query,
    hasCachedValue,
    resultCount: searchResults.length,
  })

  return { query, searchResults }
}

export type { SearchResultItem }
