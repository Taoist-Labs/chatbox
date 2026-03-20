import { CapacitorHttp } from '@capacitor/core'
import type { SearchResult } from '@shared/types'
import { type FetchOptions, ofetch } from 'ofetch'
import platform from '@/platform'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

abstract class WebSearch {
  abstract search(query: string, signal?: AbortSignal): Promise<SearchResult>

  async fetch(url: string, options: FetchOptions) {
    const { origin } = new URL(url)
    const method = (options.method || 'GET').toString().toUpperCase()
    console.log(`${WEB_SEARCH_LOG_PREFIX} http request start`, {
      platformType: platform.type,
      url,
      method,
      hasQuery: Boolean(options.query),
      hasBody: Boolean(options.body),
    })

    try {
      if (platform.type === 'mobile') {
        const { data, status } = await CapacitorHttp.request({
          url,
          method: options.method,
          headers: {
            ...(options.headers || ({} as any)),
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            origin,
            referer: origin,
          },
          params: options.query,
          data: options.body,
        })
        console.log(`${WEB_SEARCH_LOG_PREFIX} http request success`, {
          platformType: platform.type,
          url,
          method,
          status,
        })
        return data
      }

      const data = await ofetch(url, options)
      console.log(`${WEB_SEARCH_LOG_PREFIX} http request success`, {
        platformType: platform.type,
        url,
        method,
        status: 'web-fetch',
      })
      return data
    } catch (error) {
      console.error(`${WEB_SEARCH_LOG_PREFIX} http request failed`, {
        platformType: platform.type,
        url,
        method,
        error,
      })
      throw error
    }
  }
}

export default WebSearch
