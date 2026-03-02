import { WANJIE_ENCRYPTION_KEY, WANJIE_MODEL_API_HOST, WANJIE_WORKER_API_HOST } from '@shared/constants/wanjie'
import type { ProviderModelInfo, ProviderSettings } from '@shared/types'

export interface WanjieEncryptedPayload {
  data: string
  iv: string
}

interface WanjieApiResponse<T> {
  success?: boolean
  message?: string
  code?: number
  result?: T
  timestamp?: number
}

const WanjieDefaultErrorMessage = 'Wanjie request failed'
export const WANJIE_SMS_COOLDOWN_SECONDS = 60

export type WanjieAuthDebugStage =
  | 'request_decrypted'
  | 'request_encrypted'
  | 'response_encrypted'
  | 'response_decrypted'
  | 'response_failed'
  | 'response_invalid'

export type WanjieContextDebugStage = 'settings_models_read' | 'model_context_read' | 'model_context_assign'

const WanjieAuthDebugPathPattern = /^\/api\/(sms\/send|auth\/login|user\/models|user\/api-key|user\/api-keys)$/

export function shouldLogWanjieAuthPath(path: string): boolean {
  return WanjieAuthDebugPathPattern.test(path)
}

function shouldLogWanjieDebugByEnv(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function logWanjieAuthDebug(params: {
  path: string
  method: 'GET' | 'POST'
  stage: WanjieAuthDebugStage
  data: unknown
}) {
  if (!shouldLogWanjieDebugByEnv() || !shouldLogWanjieAuthPath(params.path)) {
    return
  }

  console.log('[Wanjie Auth Debug]', {
    path: params.path,
    method: params.method,
    stage: params.stage,
    data: params.data,
  })
}

export function logWanjieContextDebug(params: {
  stage: WanjieContextDebugStage
  modelId?: string
  data: unknown
}) {
  if (!shouldLogWanjieDebugByEnv()) {
    return
  }

  console.log('[Wanjie Context Debug]', {
    stage: params.stage,
    modelId: params.modelId,
    data: params.data,
  })
}

export interface WanjieBuiltinConfig {
  workerBaseUrl: string
  encryptionKey: string
  modelApiHost: string
}

export function getWanjieBuiltinConfig(): WanjieBuiltinConfig {
  return {
    workerBaseUrl: WANJIE_WORKER_API_HOST,
    encryptionKey: WANJIE_ENCRYPTION_KEY,
    modelApiHost: WANJIE_MODEL_API_HOST,
  }
}

export function createWanjieSmsCooldownUntil(
  nowMs: number = Date.now(),
  cooldownSeconds: number = WANJIE_SMS_COOLDOWN_SECONDS
): number {
  return nowMs + cooldownSeconds * 1000
}

export function getWanjieSmsCooldownSecondsLeft(cooldownUntilMs?: number, nowMs: number = Date.now()): number {
  if (!cooldownUntilMs || !Number.isFinite(cooldownUntilMs)) {
    return 0
  }
  return Math.max(0, Math.ceil((cooldownUntilMs - nowMs) / 1000))
}

export function buildWanjieConfiguredSettings(params: {
  phone: string
  smsId: string
  accessToken: string
  apiKey: string
  models: ProviderModelInfo[]
}): ProviderSettings {
  logWanjieContextDebug({
    stage: 'settings_models_read',
    data: params.models.map((model) => ({
      modelId: model.modelId,
      contextWindow: model.contextWindow,
    })),
  })

  return {
    apiHost: WANJIE_MODEL_API_HOST,
    wanjiePhone: params.phone,
    wanjieSmsId: params.smsId,
    wanjieAccountToken: params.accessToken,
    apiKey: params.apiKey,
    models: params.models,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEncryptedPayload(value: unknown): value is WanjieEncryptedPayload {
  return isRecord(value) && typeof value.data === 'string' && typeof value.iv === 'string'
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function encodeBase64(buffer: ArrayBuffer): string {
  if (typeof btoa === 'function') {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64')
  }

  throw new Error('Base64 encoder is not available in current runtime')
}

function decodeBase64(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }

  throw new Error('Base64 decoder is not available in current runtime')
}

async function importWanjieKey(encryptionKey: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(encryptionKey)
  const hash = await crypto.subtle.digest('SHA-256', keyData)
  return await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function encryptText(plaintext: string, encryptionKey: string): Promise<WanjieEncryptedPayload> {
  const key = await importWanjieKey(encryptionKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    data: encodeBase64(ciphertext),
    iv: encodeBase64(iv.buffer),
  }
}

async function decryptText(payload: WanjieEncryptedPayload, encryptionKey: string): Promise<string> {
  const key = await importWanjieKey(encryptionKey)
  const iv = Uint8Array.from(decodeBase64(payload.iv))
  const data = Uint8Array.from(decodeBase64(payload.data))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  return new TextDecoder().decode(decrypted)
}

async function encryptJson(payload: unknown, encryptionKey: string): Promise<WanjieEncryptedPayload> {
  return await encryptText(JSON.stringify(payload), encryptionKey)
}

async function decryptJson<T>(payload: WanjieEncryptedPayload, encryptionKey: string): Promise<T> {
  return JSON.parse(await decryptText(payload, encryptionKey)) as T
}

async function requestWanjieEncrypted<T>(params: {
  workerBaseUrl: string
  encryptionKey: string
  path: string
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
  accessToken?: string
}): Promise<T> {
  const { workerBaseUrl, encryptionKey, path, method = 'GET', body, accessToken } = params
  const headers: HeadersInit = {
    Accept: 'application/json',
  }
  const request: RequestInit = {
    method,
    headers,
  }
  let url = `${trimTrailingSlash(workerBaseUrl)}${path}`

  if (method !== 'GET') {
    const plainBody = body || {}
    logWanjieAuthDebug({
      path,
      method,
      stage: 'request_decrypted',
      data: plainBody,
    })

    const encryptedBody = await encryptJson(plainBody, encryptionKey)
    headers['Content-Type'] = 'application/json'
    request.body = JSON.stringify(encryptedBody)
    logWanjieAuthDebug({
      path,
      method,
      stage: 'request_encrypted',
      data: encryptedBody,
    })
  } else if (accessToken) {
    logWanjieAuthDebug({
      path,
      method,
      stage: 'request_decrypted',
      data: { token: accessToken },
    })

    const encryptedToken = await encryptText(accessToken, encryptionKey)
    const token = `${encodeURIComponent(encryptedToken.data)}.${encodeURIComponent(encryptedToken.iv)}`
    logWanjieAuthDebug({
      path,
      method,
      stage: 'request_encrypted',
      data: {
        token: encryptedToken,
      },
    })
    url += `?token=${token}`
  }

  const response = await fetch(url, request)
  const json = await response.json().catch(() => null)
  if (!isEncryptedPayload(json)) {
    logWanjieAuthDebug({
      path,
      method,
      stage: 'response_invalid',
      data: json,
    })
    const message =
      isRecord(json) && typeof json.message === 'string'
        ? json.message
        : `${WanjieDefaultErrorMessage}: invalid encrypted response`
    throw new Error(message)
  }

  logWanjieAuthDebug({
    path,
    method,
    stage: 'response_encrypted',
    data: json,
  })

  const decrypted = await decryptJson<WanjieApiResponse<T>>(json, encryptionKey)
  logWanjieAuthDebug({
    path,
    method,
    stage: 'response_decrypted',
    data: decrypted,
  })

  if (!response.ok || !decrypted.success) {
    logWanjieAuthDebug({
      path,
      method,
      stage: 'response_failed',
      data: decrypted,
    })
    throw new Error(decrypted.message || `${WanjieDefaultErrorMessage}: ${response.status}`)
  }

  return (decrypted.result ?? null) as T
}

function getStringFromRecord(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function getNumberFromRecord(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return undefined
}

function normalizeWanjieApiStyle(value: string | undefined): ProviderModelInfo['apiStyle'] | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }
  if (normalized === 'openai') {
    return 'openai'
  }
  if (normalized === 'google' || normalized === 'gemini') {
    return 'google'
  }
  if (normalized === 'anthropic' || normalized === 'claude') {
    return 'anthropic'
  }

  return undefined
}

function getWanjieModelApiStyle(record: Record<string, unknown>): ProviderModelInfo['apiStyle'] | undefined {
  const directApiStyle = normalizeWanjieApiStyle(getStringFromRecord(record, ['apiStyle', 'api_style']))
  if (directApiStyle) {
    return directApiStyle
  }

  const officialProvider = getStringFromRecord(record, ['officialProvider', 'official_provider'])
  return normalizeWanjieApiStyle(officialProvider)
}

interface WanjieModelCategory {
  supported: boolean
  hasVisionCapability: boolean
}

function shouldSkipWanjieModelByModelType(record: Record<string, unknown>): boolean {
  const modelType = getNumberFromRecord(record, ['modelType', 'model_type'])
  return modelType === 4 || modelType === 5
}

function mapWanjieInteractionType(value: number | undefined): WanjieModelCategory | undefined {
  switch (value) {
    case 1: // 图像生成文本
      return { supported: true, hasVisionCapability: true }
    case 3: // 文本生成-非交互文本
    case 4: // 文本生成-交互文本
      return { supported: true, hasVisionCapability: false }
    case 2: // 图像生成图像
    case 5: // 文本生成图片
    case 6: // 文字生成语音
      return { supported: false, hasVisionCapability: false }
    default:
      return undefined
  }
}

function mapWanjieModelType(value: number | undefined): WanjieModelCategory | undefined {
  switch (value) {
    case 1: // 图生文
      return { supported: true, hasVisionCapability: true }
    case 3: // 文本生成
      return { supported: true, hasVisionCapability: false }
    case 2: // 文生图
    case 4: // 语音
    case 5: // 视频
      return { supported: false, hasVisionCapability: false }
    default:
      return undefined
  }
}

function resolveWanjieModelCategory(record: Record<string, unknown>): WanjieModelCategory | undefined {
  const interactionType = getNumberFromRecord(record, ['interactionType', 'interaction_type'])
  const fromInteractionType = mapWanjieInteractionType(interactionType)
  if (fromInteractionType) {
    return fromInteractionType
  }

  const modelType = getNumberFromRecord(record, ['modelType', 'model_type'])
  return mapWanjieModelType(modelType)
}

function hasVisionCapability(record: Record<string, unknown>): boolean {
  const joinedText = [record.modelSummary, record.modelName, record.name]
    .filter((item) => typeof item === 'string')
    .join(' ')
    .toLowerCase()
  if (/(multi|vision|图像|图片|多模态)/.test(joinedText)) {
    return true
  }

  const modalRelations = record.modelModalRelations
  if (!Array.isArray(modalRelations)) {
    return false
  }
  return modalRelations.some((group) => {
    if (!isRecord(group) || !Array.isArray(group.typeGroups)) {
      return false
    }
    return group.typeGroups.some((typeGroup) => isRecord(typeGroup) && Number(typeGroup.modalType) === 2)
  })
}

function mapWanjieContextWindow(record: Record<string, unknown>): number | undefined {
  const contextLengthInK = getNumberFromRecord(record, ['contextLength'])
  if (typeof contextLengthInK === 'number') {
    // Wanjie returns contextLength in K tokens (e.g. 32 => 32000 tokens).
    if (contextLengthInK <= 0) {
      return undefined
    }
    return Math.round(contextLengthInK * 1000)
  }

  const contextWindow = getNumberFromRecord(record, ['contextWindow'])
  if (typeof contextWindow === 'number' && contextWindow > 0) {
    return contextWindow
  }

  return undefined
}

export function mapWanjieModels(rawModels: unknown): ProviderModelInfo[] {
  if (!Array.isArray(rawModels)) {
    return []
  }

  const uniqueModels = new Map<string, ProviderModelInfo>()
  for (const item of rawModels) {
    if (!isRecord(item)) {
      continue
    }

    const modelId = getStringFromRecord(item, ['modelCode', 'modelName', 'modelId', 'id', 'name']) || undefined
    if (!modelId || uniqueModels.has(modelId)) {
      continue
    }

    const model: ProviderModelInfo = {
      modelId,
      nickname: getStringFromRecord(item, ['modelName', 'name']) || modelId,
      type: 'chat',
    }

    if (shouldSkipWanjieModelByModelType(item)) {
      continue
    }

    const category = resolveWanjieModelCategory(item)
    if (category && !category.supported) {
      continue
    }

    const apiStyle = getWanjieModelApiStyle(item)
    if (apiStyle) {
      model.apiStyle = apiStyle
    }

    const contextWindow = mapWanjieContextWindow(item)
    logWanjieContextDebug({
      stage: 'model_context_read',
      modelId,
      data: {
        contextLength: item.contextLength,
        contextWindow: item.contextWindow,
        parsedContextWindow: contextWindow,
      },
    })
    if (typeof contextWindow === 'number') {
      model.contextWindow = contextWindow
      logWanjieContextDebug({
        stage: 'model_context_assign',
        modelId,
        data: {
          assignedContextWindow: model.contextWindow,
        },
      })
    }

    const visionCapability = category ? category.hasVisionCapability : hasVisionCapability(item)
    if (visionCapability) {
      model.capabilities = ['vision']
    }

    uniqueModels.set(modelId, model)
  }

  return [...uniqueModels.values()]
}

export function extractWanjieApiKey(rawApiKeyResult: unknown): string {
  if (!isRecord(rawApiKeyResult)) {
    return ''
  }

  const directApiKey = getStringFromRecord(rawApiKeyResult, ['apiKey', 'key'])
  if (directApiKey) {
    return directApiKey
  }

  const nestedApiKey = rawApiKeyResult.apiKey
  if (isRecord(nestedApiKey)) {
    const apiKey = getStringFromRecord(nestedApiKey, ['apiKey', 'key'])
    if (apiKey) {
      return apiKey
    }
  }

  const apiKeyListCandidate = Array.isArray(rawApiKeyResult.data)
    ? rawApiKeyResult.data
    : Array.isArray(rawApiKeyResult.list)
      ? rawApiKeyResult.list
      : []

  if (apiKeyListCandidate.length === 0) {
    return ''
  }

  const list = apiKeyListCandidate.filter(isRecord)
  const defaultItem = list.find((item) => item.defaultFlag === true)
  if (defaultItem) {
    return getStringFromRecord(defaultItem, ['apiKey', 'key']) || ''
  }

  return getStringFromRecord(list[0] || {}, ['apiKey', 'key']) || ''
}

export async function sendWanjieSms(params: {
  workerBaseUrl: string
  encryptionKey: string
  phone: string
}): Promise<{ smsId: string }> {
  const result = await requestWanjieEncrypted<Record<string, unknown>>({
    workerBaseUrl: params.workerBaseUrl,
    encryptionKey: params.encryptionKey,
    path: '/api/sms/send',
    method: 'POST',
    body: {
      phone: params.phone,
    },
  })

  const smsId = isRecord(result) ? getStringFromRecord(result, ['smsId']) : undefined
  if (!smsId) {
    throw new Error('Wanjie SMS request succeeded but smsId is missing')
  }

  return { smsId }
}

export async function loginWanjie(params: {
  workerBaseUrl: string
  encryptionKey: string
  phone: string
  code: string
  smsId: string
}): Promise<{ accessToken: string }> {
  const result = await requestWanjieEncrypted<Record<string, unknown>>({
    workerBaseUrl: params.workerBaseUrl,
    encryptionKey: params.encryptionKey,
    path: '/api/auth/login',
    method: 'POST',
    body: {
      phone: params.phone,
      code: params.code,
      smsId: params.smsId,
    },
  })

  const accessToken = isRecord(result) ? getStringFromRecord(result, ['accessToken']) : undefined
  if (!accessToken) {
    throw new Error('Wanjie login succeeded but accessToken is missing')
  }

  return { accessToken }
}

export async function getWanjieModels(params: {
  workerBaseUrl: string
  encryptionKey: string
  accessToken: string
}): Promise<ProviderModelInfo[]> {
  const result = await requestWanjieEncrypted<unknown>({
    workerBaseUrl: params.workerBaseUrl,
    encryptionKey: params.encryptionKey,
    accessToken: params.accessToken,
    path: '/api/user/models',
    method: 'GET',
  })
  return mapWanjieModels(result)
}

export async function getWanjieApiKey(params: {
  workerBaseUrl: string
  encryptionKey: string
  accessToken: string
}): Promise<string> {
  const result = await requestWanjieEncrypted<unknown>({
    workerBaseUrl: params.workerBaseUrl,
    encryptionKey: params.encryptionKey,
    accessToken: params.accessToken,
    path: '/api/user/api-key',
    method: 'GET',
  })
  return extractWanjieApiKey(result)
}

export async function getWanjieApiKeyFromList(params: {
  workerBaseUrl: string
  encryptionKey: string
  accessToken: string
}): Promise<string> {
  const result = await requestWanjieEncrypted<unknown>({
    workerBaseUrl: params.workerBaseUrl,
    encryptionKey: params.encryptionKey,
    accessToken: params.accessToken,
    path: '/api/user/api-keys',
    method: 'GET',
  })
  return extractWanjieApiKey(result)
}

export async function syncWanjieProviderConfig(params: {
  workerBaseUrl: string
  encryptionKey: string
  accessToken: string
}): Promise<{
  models: ProviderModelInfo[]
  apiKey: string
}> {
  const [models, apiKey, fallbackApiKey] = await Promise.all([
    getWanjieModels(params),
    getWanjieApiKey(params).catch(() => ''),
    getWanjieApiKeyFromList(params).catch(() => ''),
  ])

  return {
    models,
    apiKey: apiKey || fallbackApiKey,
  }
}

export function maskWanjieApiKey(apiKey: string) {
  if (!apiKey) {
    return ''
  }
  if (apiKey.length <= 8) {
    return `${apiKey.slice(0, 2)}****`
  }
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`
}
