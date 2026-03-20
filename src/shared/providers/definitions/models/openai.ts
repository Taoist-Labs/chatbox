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

const JIMENG_API_VERSION = '2022-08-31'
const JIMENG_SUBMIT_ACTION = 'CVSync2AsyncSubmitTask'
const JIMENG_GET_RESULT_ACTION = 'CVSync2AsyncGetResult'
const JIMENG_MAX_POLL_ATTEMPTS = 30
const JIMENG_POLL_INTERVAL_MS = 1000

const JIMENG_TEXT_TO_IMAGE_MODEL_IDS = new Set(['jimeng_t2i_v30', 'jimeng_t2i_v31', 'jimeng_t2i_v40'])
const JIMENG_IMAGE_TO_IMAGE_MODEL_IDS = new Set(['jimeng_i2i_v30', 'jimeng_t2i_v40'])
const JIMENG_TEXT_TO_IMAGE_MODEL_PATTERN = /^jimeng_t2i_/i
const JIMENG_IMAGE_TO_IMAGE_MODEL_PATTERN = /^jimeng_i2i_/i

const JIMENG_IMAGE_URL_KEYS = new Set(['image_urls', 'image_url', 'result_image_urls', 'result_image_url'])
const JIMENG_IMAGE_BASE64_KEYS = new Set(['binary_data_base64', 'b64_json', 'image_base64'])
const JIMENG_TASK_ID_KEYS = new Set(['task_id', 'taskid'])
const JIMENG_TASK_STATUS_KEYS = new Set(['status', 'task_status', 'taskstate', 'state'])
const JIMENG_ERROR_MESSAGE_KEYS = new Set(['message', 'msg', 'error', 'error_message', 'error_msg'])

const JIMENG_POLL_FAILED_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled', 'timeout'])
const JIMENG_POLL_DONE_STATUSES = new Set(['succeeded', 'success', 'done', 'finished', 'completed'])

const JIMENG_RATIO_TO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '3:2': { width: 1152, height: 768 },
  '2:3': { width: 768, height: 1152 },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseBase64DataUrl(value: string): { mediaType: string; data: string } | undefined {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/i)
  if (!match) {
    return undefined
  }
  return {
    mediaType: match[1],
    data: match[2],
  }
}

function mapJimengAspectRatioToDimensions(aspectRatio?: string): { width: number; height: number } | undefined {
  if (!aspectRatio || aspectRatio === 'auto') {
    return undefined
  }
  return JIMENG_RATIO_TO_DIMENSIONS[aspectRatio]
}

function collectStringsByKeys(value: unknown, keys: Set<string>): string[] {
  const values: string[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item)
      }
      return
    }
    if (!isRecord(node)) {
      return
    }

    for (const [key, child] of Object.entries(node)) {
      if (keys.has(key.toLowerCase())) {
        if (typeof child === 'string' && child.trim()) {
          values.push(child.trim())
        } else if (Array.isArray(child)) {
          for (const item of child) {
            if (typeof item === 'string' && item.trim()) {
              values.push(item.trim())
            }
          }
        }
      }

      visit(child)
    }
  }

  visit(value)
  return [...new Set(values)]
}

function findFirstStringByKeys(value: unknown, keys: Set<string>): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstStringByKeys(item, keys)
      if (found) {
        return found
      }
    }
    return undefined
  }

  if (!isRecord(value)) {
    return undefined
  }

  for (const [key, child] of Object.entries(value)) {
    if (keys.has(key.toLowerCase()) && typeof child === 'string' && child.trim()) {
      return child.trim()
    }
  }

  for (const child of Object.values(value)) {
    const found = findFirstStringByKeys(child, keys)
    if (found) {
      return found
    }
  }

  return undefined
}

function toBase64DataUrl(base64: string, mediaType: string): string {
  if (base64.startsWith('data:')) {
    return base64
  }
  return `data:${mediaType};base64,${base64}`
}

function isSuccessfulJimengCode(value: unknown): boolean {
  if (typeof value !== 'number') {
    return true
  }
  return value === 0 || value === 200 || value === 10000
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

  private isJimengModel(modelId: string): boolean {
    return JIMENG_TEXT_TO_IMAGE_MODEL_PATTERN.test(modelId) || JIMENG_IMAGE_TO_IMAGE_MODEL_PATTERN.test(modelId)
  }

  private isJimengTextToImageModel(modelId: string): boolean {
    const normalizedModelId = modelId.toLowerCase()
    return JIMENG_TEXT_TO_IMAGE_MODEL_IDS.has(normalizedModelId) || JIMENG_TEXT_TO_IMAGE_MODEL_PATTERN.test(modelId)
  }

  private isJimengImageToImageModel(modelId: string): boolean {
    const normalizedModelId = modelId.toLowerCase()
    return JIMENG_IMAGE_TO_IMAGE_MODEL_IDS.has(normalizedModelId) || JIMENG_IMAGE_TO_IMAGE_MODEL_PATTERN.test(modelId)
  }

  private buildJimengActionUrl(action: string): string {
    const url = new URL(this.options.apiHost)
    let pathname = url.pathname.replace(/\/+$/, '')
    if (pathname.endsWith('/v1')) {
      pathname = pathname.slice(0, -3)
    }
    url.pathname = `${pathname || ''}/jimeng/v1`.replace(/\/{2,}/g, '/')
    url.search = `Action=${encodeURIComponent(action)}&Version=${encodeURIComponent(JIMENG_API_VERSION)}`
    url.hash = ''
    return url.toString()
  }

  private async postJimengAction(
    action: string,
    payload: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<unknown> {
    const response = await this.dependencies.request.apiRequest({
      url: this.buildJimengActionUrl(action),
      method: 'POST',
      headers: {
        Authorization: this.options.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      useProxy: this.options.useProxy,
      signal,
    })

    const json = await response.json().catch(() => null)
    if (!isRecord(json)) {
      throw new ApiError(`Jimeng action ${action} returned invalid response`)
    }

    const successFlag = typeof json.success === 'boolean' ? json.success : undefined
    if (successFlag === false || !isSuccessfulJimengCode(json.code)) {
      const message = findFirstStringByKeys(json, JIMENG_ERROR_MESSAGE_KEYS)
      throw new ApiError(message || `Jimeng action ${action} failed`)
    }

    return json
  }

  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) {
      return
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, ms)

      const onAbort = () => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        reject(new ApiError('Jimeng request aborted'))
      }

      if (signal?.aborted) {
        onAbort()
        return
      }

      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }

  private async extractJimengImageDataUrls(payload: unknown, signal?: AbortSignal): Promise<string[]> {
    const outputFormat = findFirstStringByKeys(payload, new Set(['output_format']))
    const mediaType = mapOutputFormatToMediaType(outputFormat)
    const binaryImages = collectStringsByKeys(payload, JIMENG_IMAGE_BASE64_KEYS)
      .filter((item) => item.length > 0)
      .map((item) => toBase64DataUrl(item, mediaType))

    const remoteUrls = collectStringsByKeys(payload, JIMENG_IMAGE_URL_KEYS).filter((item) => /^https?:\/\//i.test(item))
    if (remoteUrls.length === 0) {
      return binaryImages
    }

    const downloaded = await Promise.all(remoteUrls.map((url) => this.downloadImageAsDataUrl(url, signal)))
    return [...binaryImages, ...downloaded]
  }

  private async waitForJimengResult(taskId: string, signal?: AbortSignal): Promise<string[]> {
    for (let attempt = 0; attempt < JIMENG_MAX_POLL_ATTEMPTS; attempt++) {
      const result = await this.postJimengAction(
        JIMENG_GET_RESULT_ACTION,
        {
          req_key: this.options.model.modelId,
          task_id: taskId,
        },
        signal
      )

      const images = await this.extractJimengImageDataUrls(result, signal)
      if (images.length > 0) {
        return images
      }

      const status = findFirstStringByKeys(result, JIMENG_TASK_STATUS_KEYS)?.toLowerCase()
      if (status && JIMENG_POLL_FAILED_STATUSES.has(status)) {
        const message = findFirstStringByKeys(result, JIMENG_ERROR_MESSAGE_KEYS)
        throw new ApiError(message || `Jimeng task failed: ${status}`)
      }
      if (status && JIMENG_POLL_DONE_STATUSES.has(status)) {
        throw new ApiError('Jimeng task completed but no output image was returned')
      }

      if (attempt < JIMENG_MAX_POLL_ATTEMPTS - 1) {
        await this.sleep(JIMENG_POLL_INTERVAL_MS, signal)
      }
    }

    throw new ApiError('Jimeng task timed out while waiting for result')
  }

  private buildJimengSubmitPayload(params: {
    prompt: string
    images?: { imageUrl: string }[]
    aspectRatio?: string
  }): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      req_key: this.options.model.modelId,
      prompt: params.prompt,
    }

    const dimensions = mapJimengAspectRatioToDimensions(params.aspectRatio)
    if (dimensions) {
      payload.width = dimensions.width
      payload.height = dimensions.height
    }

    if (params.images && params.images.length > 0) {
      const base64Images: string[] = []
      const remoteUrls: string[] = []

      for (const image of params.images) {
        const rawUrl = image.imageUrl?.trim()
        if (!rawUrl) {
          continue
        }
        const parsed = parseBase64DataUrl(rawUrl)
        if (parsed) {
          base64Images.push(parsed.data)
        } else {
          remoteUrls.push(rawUrl)
        }
      }

      if (base64Images.length > 0) {
        payload.binary_data_base64 = base64Images
      } else if (remoteUrls.length > 0) {
        payload.image_urls = remoteUrls
      }
    }

    return payload
  }

  private async paintWithJimeng(
    params: {
      prompt: string
      images?: { imageUrl: string }[]
      num: number
      aspectRatio?: string
    },
    signal?: AbortSignal,
    callback?: (picBase64: string) => void
  ): Promise<string[]> {
    const modelId = this.options.model.modelId
    const hasInputImages = (params.images?.length || 0) > 0
    const supportsTextToImage = this.isJimengTextToImageModel(modelId)
    const supportsImageToImage = this.isJimengImageToImageModel(modelId)

    if (!hasInputImages && !supportsTextToImage) {
      throw new ApiError(`Jimeng model ${modelId} requires at least one input image`)
    }
    if (hasInputImages && !supportsImageToImage) {
      throw new ApiError(`Jimeng model ${modelId} does not support image-to-image generation`)
    }

    const submitPayload = this.buildJimengSubmitPayload(params)
    if (hasInputImages && !('binary_data_base64' in submitPayload) && !('image_urls' in submitPayload)) {
      throw new ApiError(`Jimeng model ${modelId} requires at least one input image`)
    }

    const num = Math.max(1, params.num || 1)
    const outputs: string[] = []
    for (let i = 0; i < num; i++) {
      const submitResult = await this.postJimengAction(JIMENG_SUBMIT_ACTION, submitPayload, signal)
      const immediateImages = await this.extractJimengImageDataUrls(submitResult, signal)
      const taskId = findFirstStringByKeys(submitResult, JIMENG_TASK_ID_KEYS)
      const generatedImages =
        immediateImages.length > 0
          ? immediateImages
          : await this.waitForJimengResult(
              taskId ||
                (() => {
                  throw new ApiError('Jimeng submit task succeeded but task_id is missing')
                })(),
              signal
            )

      for (const dataUrl of generatedImages) {
        outputs.push(dataUrl)
        callback?.(dataUrl)
      }
    }

    return outputs
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
    if (this.isJimengModel(this.options.model.modelId)) {
      return await this.paintWithJimeng(params, signal, callback)
    }

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
