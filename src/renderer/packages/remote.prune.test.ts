import { ofetch } from 'ofetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as requestModule from '../../shared/request/request'
import {
  checkNeedUpdate,
  getDialogConfig,
  getModelManifest,
  getProviderModelsInfo,
  getRemoteConfig,
  listCopilots,
  parseUserLinkFree,
  validateLicense,
  webBrowsing,
} from './remote'

vi.mock('ofetch', () => ({
  ofetch: vi.fn(async () => {
    throw new Error('ofetch should not be called when API features are pruned')
  }),
}))

vi.mock('../../shared/request/request', () => {
  const throwingFetch = vi.fn(async () => {
    throw new Error('createAfetch should not be called when API features are pruned')
  })
  return {
    createAfetch: vi.fn(() => throwingFetch),
    createAuthenticatedAfetch: vi.fn(() => throwingFetch),
    uploadFile: vi.fn(async () => {
      throw new Error('uploadFile should not be called when API features are pruned')
    }),
  }
})

describe('remote api pruned behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false for update check', async () => {
    const result = await checkNeedUpdate(
      '1.0.0',
      'darwin',
      { uuid: 'test-uuid' } as any,
      { allowReportingAndTracking: false } as any
    )

    expect(result).toBe(false)
    expect(vi.mocked(ofetch)).not.toHaveBeenCalled()
  })

  it('returns empty remote copilots list', async () => {
    const result = await listCopilots('zh')

    expect(result).toEqual([])
    expect(vi.mocked(ofetch)).not.toHaveBeenCalled()
  })

  it('returns empty remote config defaults', async () => {
    const productIds = await getRemoteConfig('product_ids')
    const currentVersion = await getRemoteConfig('current_version')

    expect(productIds).toEqual({ product_ids: [] })
    expect(currentVersion).toEqual({ current_version: '' })
    expect(vi.mocked(ofetch)).not.toHaveBeenCalled()
  })

  it('returns null dialog config', async () => {
    const result = await getDialogConfig({
      uuid: 'u',
      language: 'zh-CN',
      version: '1.0.0',
    })

    expect(result).toBeNull()
    expect(vi.mocked(ofetch)).not.toHaveBeenCalled()
  })

  it('returns empty parsed webpage content', async () => {
    const result = await parseUserLinkFree({ url: 'https://example.com/path' })

    expect(result).toEqual({
      title: 'example.com/path',
      text: '',
    })
    expect(vi.mocked(requestModule.createAfetch)).not.toHaveBeenCalled()
  })

  it('returns empty built-in web browsing results', async () => {
    const result = await webBrowsing({
      licenseKey: 'license-1',
      query: 'latest ai news',
    })

    expect(result).toEqual({
      query: 'latest ai news',
      links: [],
    })
    expect(vi.mocked(requestModule.createAfetch)).not.toHaveBeenCalled()
  })

  it('returns invalid license validation result', async () => {
    const result = await validateLicense({
      licenseKey: 'license-1',
      instanceId: 'instance-1',
    })

    expect(result).toEqual({ valid: false })
    expect(vi.mocked(requestModule.createAfetch)).not.toHaveBeenCalled()
  })

  it('returns empty remote model metadata', async () => {
    const manifest = await getModelManifest({
      aiProvider: 'openai' as any,
    })
    const modelsInfo = await getProviderModelsInfo({
      modelIds: ['gpt-4o'],
    })

    expect(manifest).toEqual({
      groupName: '',
      models: [],
    })
    expect(modelsInfo).toEqual({})
    expect(vi.mocked(requestModule.createAfetch)).not.toHaveBeenCalled()
  })
})
