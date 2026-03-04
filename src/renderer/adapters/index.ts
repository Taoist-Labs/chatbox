import { createAfetch } from '@shared/request/request'
import type { ApiRequestOptions, ModelDependencies } from '@shared/types/adapters'
import platform from '@/platform'
import storage from '@/storage'
import { StorageKeyGenerator } from '@/storage/StoreStorage'
import * as settingActions from '@/stores/settingActions'
import { apiRequest } from '@/utils/request'
import { handleMobileRequest } from '@/utils/mobile-request'
import { RendererSentryAdapter } from './sentry'

export async function createModelDependencies(): Promise<ModelDependencies> {
  const afetch = createAfetch()

  return {
    storage: {
      async saveImage(folder: string, dataUrl: string): Promise<string> {
        const storageKey = StorageKeyGenerator.picture(folder)
        await storage.setBlob(storageKey, dataUrl)
        return storageKey
      },
      async getImage(storageKey: string): Promise<string> {
        const blob = await storage.getBlob(storageKey)
        if (!blob) return ''
        return blob.startsWith('data:') ? blob : `data:image/png;base64,${blob}`
      },
    },
    request: {
      fetchWithOptions: async (
        url: string,
        init?: RequestInit,
        options?: { retry?: number; parseRemoteAPIError?: boolean }
      ): Promise<Response> => {
        if (platform.type === 'mobile') {
          return handleMobileRequest(
            url,
            init?.method || 'GET',
            new Headers(init?.headers),
            init?.body,
            init?.signal || undefined,
            'arraybuffer'
          )
        }

        // 支持自定义选项的 fetch
        return afetch(url, init, options || {})
      },
      async apiRequest(options: ApiRequestOptions): Promise<Response> {
        if (options.method === 'POST') {
          return apiRequest.post(options.url, options.headers || {}, options.body, {
            signal: options.signal,
            retry: options.retry,
            useProxy: options.useProxy,
          })
        } else {
          return apiRequest.get(options.url, options.headers || {}, {
            signal: options.signal,
            retry: options.retry,
            useProxy: options.useProxy,
          })
        }
      },
    },
    sentry: new RendererSentryAdapter(),
    getRemoteConfig: settingActions.getRemoteConfig,
  }
}
