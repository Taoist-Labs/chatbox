import { createOpenAI } from '@ai-sdk/openai'
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai'
import AbstractAISDKModel from '../../../models/abstract-ai-sdk'
import { ApiError } from '../../../models/errors'
import { fetchRemoteModels } from '../../../models/openai-compatible'
import type { CallChatCompletionOptions } from '../../../models/types'
import { createFetchWithProxy } from '../../../models/utils/fetch-proxy'
import type { ProviderModelInfo } from '../../../types'
import type { ModelDependencies } from '../../../types/adapters'
import { normalizeOpenAIApiHostAndPath } from '../../../utils/llm_utils'
import { extractOpenAIImageResultFromBody } from './openai-image-fallback'

interface Options {
  apiKey: string
  apiHost: string
  model: ProviderModelInfo
  dalleStyle: 'vivid' | 'natural'
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  injectDefaultMetadata: boolean
  useProxy: boolean
  stream?: boolean
}

function mapOutputFormatToMediaType(outputFormat?: string): string {
  if (!outputFormat) return 'image/png'
  switch (outputFormat.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'png':
    default:
      return 'image/png'
  }
}

function encodeArrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64')
  }
  if (typeof btoa === 'function') {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    return btoa(binary)
  }
  throw new Error('Base64 encoder is not available in current runtime')
}

export default class OpenAI extends AbstractAISDKModel {
  public name = 'OpenAI'
  public options: Options

  constructor(options: Options, dependencies: ModelDependencies) {
    super(options, dependencies)
    const { apiHost } = normalizeOpenAIApiHostAndPath(options)
    this.options = { ...options, apiHost }
  }

  static isSupportTextEmbedding() {
    return true
  }

  protected getProvider() {
    return createOpenAI({
      apiKey: this.options.apiKey,
      baseURL: this.options.apiHost,
      fetch: createFetchWithProxy(this.options.useProxy, this.dependencies),
      headers: this.options.apiHost.includes('openrouter.ai')
        ? {
            'HTTP-Referer': 'https://app.local',
            'X-Title': 'AI Chat',
          }
        : undefined,
    })
  }

  protected getChatModel() {
    const provider = this.getProvider()
    return wrapLanguageModel({
      model: provider.chat(this.options.model.modelId),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    })
  }

  protected getImageModel(modelId?: string) {
    const provider = this.getProvider()
    const imageModelId = modelId || this.options.model.modelId || 'gpt-image-1'
    return provider.image(imageModelId)
  }

  private async downloadImageAsDataUrl(url: string, signal?: AbortSignal): Promise<string> {
    const response = await this.dependencies.request.fetchWithOptions(url, { method: 'GET', signal })
    if (!response.ok) {
      throw new ApiError(`Failed to download generated image from URL: ${response.status}`)
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
    const base64 = encodeArrayBufferToBase64(await response.arrayBuffer())
    return `data:${contentType};base64,${base64}`
  }

  private async tryParseUrlImageFallback(error: unknown, signal?: AbortSignal): Promise<string[] | null> {
    const responseBody =
      typeof error === 'object' && error !== null && 'responseBody' in error
        ? (error as { responseBody?: unknown }).responseBody
        : undefined
    const extracted = extractOpenAIImageResultFromBody(responseBody)
    if (!extracted) {
      return null
    }

    const mediaType = mapOutputFormatToMediaType(extracted.outputFormat)
    const b64DataUrls = extracted.b64Images.map((image) => `data:${mediaType};base64,${image}`)
    if (extracted.urls.length === 0) {
      return b64DataUrls
    }

    const downloadedDataUrls = await Promise.all(
      extracted.urls.map((url) => this.downloadImageAsDataUrl(url, signal))
    )
    return [...b64DataUrls, ...downloadedDataUrls]
  }

  public override async paint(
    params: {
      prompt: string
      images?: { imageUrl: string }[]
      num: number
      aspectRatio?: string
    },
    signal?: AbortSignal,
    callback?: (picBase64: string) => void
  ): Promise<string[]> {
    try {
      return await super.paint(params, signal, callback)
    } catch (error) {
      const fallbackDataUrls = await this.tryParseUrlImageFallback(error, signal)
      if (!fallbackDataUrls) {
        throw error
      }
      for (const dataUrl of fallbackDataUrls) {
        callback?.(dataUrl)
      }
      return fallbackDataUrls
    }
  }

  protected getCallSettings(options: CallChatCompletionOptions) {
    const isModelSupportReasoning = this.isSupportReasoning()
    let providerOptions = {}
    if (isModelSupportReasoning) {
      providerOptions = {
        openai: options.providerOptions?.openai || {},
      }
    }

    return {
      temperature: this.options.temperature,
      topP: this.options.topP,
      maxOutputTokens: this.options.maxOutputTokens,
      providerOptions,
    }
  }

  public listModels() {
    return fetchRemoteModels(
      {
        apiHost: this.options.apiHost,
        apiKey: this.options.apiKey,
        useProxy: this.options.useProxy,
      },
      this.dependencies
    )
  }
}
