import { beforeEach, describe, expect, it, vi } from 'vitest'

const afetchMock = vi.fn()
const handleMobileRequestMock = vi.fn()

vi.mock('@shared/request/request', () => ({
  createAfetch: () => afetchMock,
}))

vi.mock('@/platform', () => ({
  default: {
    type: 'mobile',
  },
}))

vi.mock('@/storage', () => ({
  default: {
    setBlob: vi.fn(),
    getBlob: vi.fn(),
  },
}))

vi.mock('@/stores/settingActions', () => ({
  getRemoteConfig: vi.fn(),
}))

vi.mock('@/utils/mobile-request', () => ({
  handleMobileRequest: (...args: any[]) => handleMobileRequestMock(...args),
}))

describe('createModelDependencies', () => {
  beforeEach(() => {
    afetchMock.mockReset()
    handleMobileRequestMock.mockReset()
  })

  it('uses native mobile request for fetchWithOptions on mobile', async () => {
    handleMobileRequestMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))

    const { createModelDependencies } = await import('@/adapters')
    const dependencies = await createModelDependencies()
    await dependencies.request.fetchWithOptions('https://rgw.wanjiedata.com/demo.png', { method: 'GET' })

    expect(handleMobileRequestMock).toHaveBeenCalledOnce()
    expect(afetchMock).not.toHaveBeenCalled()
  })
})
