import { RemoteAPIError } from '@shared/models/errors'
import { tool } from 'ai'
import z from 'zod'
import * as localParser from '@/packages/local-parser'
import { webSearchExecutor } from '@/packages/web-search'
import platform from '@/platform'

const WEB_SEARCH_LOG_PREFIX = '[WebSearchDebug]'

const toolSetDescription = `
Use these tools to search the web and extract content from URLs.

## web_search
Search the web for current information. Use short, concise queries (English preferred).

## parse_link
Extract readable content from a URL. Use when you need detailed information from a specific webpage.
`

export const webSearchTool = tool({
  description:
    'Search the web for current events and real-time information. Use short, concise queries (English preferred).',
  inputSchema: z.object({
    query: z.string().describe('the search query'),
  }),
  execute: async (input: { query: string }, { abortSignal }: { abortSignal?: AbortSignal }) => {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] tool web_search called`, {
      query: input.query,
      platformType: platform.type,
      signalAborted: abortSignal?.aborted ?? false,
    })
    try {
      const result = await webSearchExecutor({ query: input.query }, { abortSignal })
      console.log(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] tool web_search completed`, {
        query: result.query,
        resultCount: result.searchResults.length,
      })
      return result
    } catch (error) {
      console.error(`${WEB_SEARCH_LOG_PREFIX} [${traceId}] tool web_search failed`, {
        query: input.query,
        error,
      })
      throw error
    }
  },
})

const DEFAULT_PARSE_LINK_MAX_CHARS = 12_000

export const parseLinkTool = tool({
  description:
    'Parses the readable content of a web page. Use this when you need to extract detailed information from a specific URL shared by the user.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to parse. Always include the schema, e.g. https://example.com'),
    maxLength: z
      .number()
      .int()
      .min(500)
      .max(50_000)
      .optional()
      .describe('Optional maximum number of characters to return from the parsed content.'),
  }),
  execute: async (input: { url: string; maxLength?: number }, _context: { abortSignal?: AbortSignal }) => {
    const parsed = await localParser.parseUrl(input.url)
    const content = ((await platform.getStoreBlob(parsed.key)) || '').trim()

    const maxLength = input.maxLength ?? DEFAULT_PARSE_LINK_MAX_CHARS
    const normalizedMaxLength = Math.min(Math.max(maxLength, 500), 50_000)
    const truncatedContent = content.slice(0, normalizedMaxLength)

    return {
      url: input.url,
      title: parsed.title,
      content: truncatedContent,
      originalLength: content.length,
      truncated: content.length > truncatedContent.length,
    }
  },
})

export default {
  description: toolSetDescription,
  tools: {
    web_search: webSearchTool,
    parse_link: parseLinkTool,
  },
}
