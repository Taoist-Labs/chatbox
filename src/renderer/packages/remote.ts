import { getLogger } from '@/lib/utils'
import platform from '@/platform'
import { authInfoStore } from '@/stores/authInfoStore'
import { USE_BETA_WEB, USE_LOCAL_WEB } from '@/variables'
import { createAfetch, createAuthenticatedAfetch } from '../../shared/request/request'
import {
  type RemoteLicenseDetail,
  type Config,
  type CopilotDetail,
  type ModelProvider,
  type ProviderModelInfo,
  type RemoteConfig,
  type Settings,
} from '../../shared/types'
import { getOS } from './navigator'

const log = getLogger('remote-api')

let _afetch: ReturnType<typeof createAfetch> | null = null
let afetchPromise: Promise<ReturnType<typeof createAfetch>> | null = null

async function initAfetch(): Promise<ReturnType<typeof createAfetch>> {
  if (afetchPromise) return afetchPromise

  afetchPromise = (async () => {
    _afetch = createAfetch()
    return _afetch
  })()

  return afetchPromise
}

async function getAfetch() {
  if (!_afetch) {
    return await initAfetch()
  }
  return _afetch
}

// ========== Authenticated Afetch (带 token 自动刷新) ==========

let _authenticatedAfetch: ReturnType<typeof createAuthenticatedAfetch> | null = null
let authenticatedAfetchPromise: Promise<ReturnType<typeof createAuthenticatedAfetch>> | null = null

async function initAuthenticatedAfetch(): Promise<ReturnType<typeof createAuthenticatedAfetch>> {
  if (authenticatedAfetchPromise) return authenticatedAfetchPromise

  authenticatedAfetchPromise = (async () => {
    _authenticatedAfetch = createAuthenticatedAfetch({
      getTokens: async () => {
        const tokens = authInfoStore.getState().getTokens()
        return tokens
      },
      refreshTokens: async (refreshToken: string) => {
        const result = await refreshAccessToken({ refreshToken })
        authInfoStore.getState().setTokens(result)
        return result
      },
      clearTokens: async () => {
        authInfoStore.getState().clearTokens()
      },
    })
    return _authenticatedAfetch
  })()

  return authenticatedAfetchPromise
}

async function getAuthenticatedAfetch() {
  if (!_authenticatedAfetch) {
    return await initAuthenticatedAfetch()
  }
  return _authenticatedAfetch
}

// ========== WEB ORIGIN ==========

export function getWebOrigin() {
  if (USE_LOCAL_WEB) {
    return 'http://localhost:3002'
  } else if (USE_BETA_WEB) {
    return 'https://beta.ai-chatbox.com'
  } else {
    return 'https://ai-chatbox.com'
  }
}

const getRemoteHeaders = async () => {
  return {
    'CHATBOX-PLATFORM': await platform.getPlatform(),
    'CHATBOX-PLATFORM-TYPE': platform.type,
    'CHATBOX-VERSION': await platform.getVersion(),
    'CHATBOX-OS': getOS(),
  }
}

const PRUNED_REMOTE_CONFIG: RemoteConfig = {
  current_version: '',
  product_ids: [],
}

function toPrunedUrlTitle(url: string) {
  return url.replace(/^https?:\/\//, '')
}

// ========== 各个接口方法 ==========

export async function checkNeedUpdate(version: string, os: string, config: Config, settings: Settings) {
  return false
}

// export async function getSponsorAd(): Promise<null | SponsorAd> {
//     type Response = {
//         data: null | SponsorAd
//     }
//     const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
//         retry: 3,
//     })
//     return res['data'] || null
// }

// export async function listSponsorAboutBanner() {
//     type Response = {
//         data: SponsorAboutBanner[]
//     }
//     const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
//         retry: 3,
//     })
//     return res['data'] || []
// }

export async function listCopilots(lang: string) {
  return []
}

export async function recordCopilotShare(detail: CopilotDetail) {
  return
}

export async function getPremiumPrice() {
  return {
    price: 0,
    discount: 0,
    discountLabel: '',
  }
}

export async function getRemoteConfig(config: keyof RemoteConfig) {
  return {
    [config]: PRUNED_REMOTE_CONFIG[config],
  } as Pick<RemoteConfig, typeof config>
}

export interface DialogConfig {
  markdown: string
  buttons: { label: string; url: string }[]
}

export async function getDialogConfig(params: { uuid: string; language: string; version: string }) {
  return null
}

export async function getLicenseDetail(params: { licenseKey: string }) {
  return null
}

export interface LicenseDetailError {
  code: string
  detail: string
  status: number
  title: string
}

export interface LicenseDetailResponse {
  data: RemoteLicenseDetail | null
  error?: LicenseDetailError
}

export async function getLicenseDetailRealtime(params: { licenseKey: string }): Promise<LicenseDetailResponse> {
  return {
    data: null,
  }
}

export async function generateUploadUrl(params: { licenseKey: string; filename: string }) {
  return {
    url: '',
    filename: params.filename,
  }
}

export async function createUserFile<T extends boolean>(params: {
  licenseKey: string
  filename: string
  filetype: string
  returnContent: T
}) {
  const content = (params.returnContent ? '' : undefined) as T extends true ? string : undefined
  return {
    uuid: `pruned-${Date.now()}`,
    content,
  }
}

export async function uploadAndCreateUserFile(licenseKey: string, file: File) {
  let content = ''
  try {
    content = await file.text()
  } catch (e) {
    content = ''
  }
  const ext = file.type.split('/')[1] || 'txt'
  const storageKey = `parseFile-${file.name}_pruned.${ext}.txt`
  await platform.setStoreBlob(storageKey, content)
  return storageKey
}

export async function parseUserLinkPro(params: { licenseKey: string; url: string }) {
  const key = `pruned-${Date.now()}`
  const title = toPrunedUrlTitle(params.url)
  const storageKey = `parseUrl-${params.url}_${key}.txt`
  await platform.setStoreBlob(storageKey, '')
  return {
    key,
    title,
    storageKey,
  }
}

export async function parseUserLinkFree(params: { url: string }) {
  return {
    title: toPrunedUrlTitle(params.url),
    text: '',
  }
}

export async function webBrowsing(params: { licenseKey: string; query: string }) {
  return {
    query: params.query,
    links: [],
  }
}

export async function activateLicense(params: { licenseKey: string; instanceName: string }) {
  return {
    valid: false,
    instanceId: '',
    error: 'not_found',
  }
}

export async function deactivateLicense(params: { licenseKey: string; instanceId: string }) {
  return
}

export async function validateLicense(params: { licenseKey: string; instanceId: string }) {
  return {
    valid: false,
  }
}

export async function getModelManifest(params: { aiProvider: ModelProvider; licenseKey?: string; language?: string }) {
  return {
    groupName: '',
    models: [] as ProviderModelInfo[],
  }
}

export async function reportContent(params: { id: string; type: string; details: string }) {
  return
}

export async function getProviderModelsInfo(params: { modelIds: string[] }): Promise<Record<string, ProviderModelInfo | null>> {
  return {}
}

export async function requestLoginTicketId() {
  type Response = {
    data: {
      ticket_id: string
    }
  }
  const afetch = await getAfetch()

  let deviceType: string
  if (platform.type === 'mobile') {
    deviceType = await platform.getPlatform()
  } else if (platform.type === 'desktop') {
    const os = getOS()
    deviceType = os
  } else {
    // web 或其他
    deviceType = platform.type
  }
  const appVersion = await platform.getVersion()
  const deviceName = await platform.getDeviceName()

  console.log('getWebOrigin()', getWebOrigin())
  const res = await afetch(
    `${getWebOrigin()}/api/auth/request_login_ticket`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getRemoteHeaders()),
      },
      body: JSON.stringify({
        device_type: deviceType,
        app_version: appVersion,
        device_name: deviceName,
      }),
    },
    {
      parseRemoteAPIError: true,
      retry: 3,
    }
  )
  const json: Response = await res.json()
  return json.data.ticket_id
}

export async function checkLoginStatus(ticketId: string) {
  type Response = {
    data: {
      status?: 'success' | 'rejected' | 'pending'
      access_token?: string
      refresh_token?: string
    }
    success: boolean
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getWebOrigin()}/api/auth/login_status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getRemoteHeaders()),
      },
      body: JSON.stringify({ ticket_id: ticketId }),
    },
    {
      parseRemoteAPIError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  const responseStatus = json.data.status
  const accessToken = json.data.access_token || null
  const refreshToken = json.data.refresh_token || null

  let status: 'pending' | 'success' | 'rejected' = 'pending'
  if (responseStatus === 'success' && accessToken && refreshToken) {
    status = 'success'
  } else if (responseStatus === 'rejected') {
    status = 'rejected'
  }

  return {
    status,
    accessToken,
    refreshToken,
  }
}

export async function refreshAccessToken(params: { refreshToken: string }) {
  type Response = {
    data: {
      result: string
    }
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getWebOrigin()}/api/auth/token_refresh`,
    {
      method: 'POST',
      headers: {
        'x-chatbox-refresh-token': params.refreshToken,
        ...(await getRemoteHeaders()),
      },
    },
    {
      parseRemoteAPIError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  // log.info('✅ refreshAccessToken response', json)

  const accessToken = res.headers.get('x-chatbox-access-token')
  const refreshToken = res.headers.get('x-chatbox-refresh-token')

  if (!accessToken || !refreshToken) {
    log.error('❌ Missing tokens in response headers:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
    })
    throw new Error('Failed to refresh token: missing tokens in response headers')
  }

  return {
    accessToken,
    refreshToken,
  }
}

export async function getUserProfile() {
  type Response = {
    data: {
      email: string
      id: string
      created_at: string
    }
  }
  const afetch = await getAuthenticatedAfetch()
  const res = await afetch(
    `${getWebOrigin()}/api/user/profile`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(await getRemoteHeaders()),
      },
    },
    {
      parseRemoteAPIError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  return json.data
}

export interface UserLicense {
  id: number
  key: string
  status: string
  platform: string
  product_name: string
  payment_type: string
  image_usage: number
  unified_token_usage: number
  unified_token_limit: number
  unified_token_usage_details: Array<{
    type: string
    token_usage: number
    token_limit: number
  }>
  image_limit: number
  next_token_refresh_at: string
  expires_at: string
  created_at: string
  recurring_canceled: boolean
  quota_packs: any[]
}

export async function listLicensesByUser(): Promise<UserLicense[]> {
  type Response = {
    data: UserLicense[]
  }
  const afetch = await getAuthenticatedAfetch()
  const res = await afetch(
    `${getWebOrigin()}/api/license/list_by_user`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(await getRemoteHeaders()),
      },
    },
    {
      parseRemoteAPIError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  return json.data
}
