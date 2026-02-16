import type { ProviderModelInfo } from 'src/shared/types'

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
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.data)
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
    headers['Content-Type'] = 'application/json'
    request.body = JSON.stringify(await encryptJson(body || {}, encryptionKey))
  } else if (accessToken) {
    const encryptedToken = await encryptText(accessToken, encryptionKey)
    const token = `${encodeURIComponent(encryptedToken.data)}.${encodeURIComponent(encryptedToken.iv)}`
    url += `?token=${token}`
  }

  const response = await fetch(url, request)
  const json = await response.json().catch(() => null)
  if (!isEncryptedPayload(json)) {
    const message =
      isRecord(json) && typeof json.message === 'string'
        ? json.message
        : `${WanjieDefaultErrorMessage}: invalid encrypted response`
    throw new Error(message)
  }

  const decrypted = await decryptJson<WanjieApiResponse<T>>(json, encryptionKey)
  if (!response.ok || !decrypted.success) {
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

export function mapWanjieModels(rawModels: unknown): ProviderModelInfo[] {
  if (!Array.isArray(rawModels)) {
    return []
  }

  const uniqueModels = new Map<string, ProviderModelInfo>()
  for (const item of rawModels) {
    if (!isRecord(item)) {
      continue
    }

    const modelId =
      getStringFromRecord(item, ['modelCode', 'modelName', 'modelIdStr', 'modelId', 'id', 'name']) || undefined
    if (!modelId || uniqueModels.has(modelId)) {
      continue
    }

    const model: ProviderModelInfo = {
      modelId,
      nickname: getStringFromRecord(item, ['modelName', 'name']) || modelId,
      type: 'chat',
    }

    const contextWindow = getNumberFromRecord(item, ['contextLength', 'contextWindow'])
    if (typeof contextWindow === 'number') {
      model.contextWindow = contextWindow
    }

    if (hasVisionCapability(item)) {
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
  const defaultItem = list.find((item) => item.dafaultFlag === true || item.defaultFlag === true)
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
