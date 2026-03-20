import { beforeEach, describe, expect, it, vi } from 'vitest'

const capacitorHttpRequestMock = vi.fn()

vi.mock('@capacitor/core', () => ({
  CapacitorHttp: {
    request: (...args: any[]) => capacitorHttpRequestMock(...args),
  },
}))

describe('handleMobileRequest', () => {
  beforeEach(() => {
    capacitorHttpRequestMock.mockReset()
  })

  it('requests binary response and returns decodable bytes for arraybuffer mode', async () => {
    capacitorHttpRequestMock.mockResolvedValue({
      status: 200,
      data: 'AQID',
      headers: {
        'content-type': 'image/png',
      },
    })

    const { handleMobileRequest } = await import('@/utils/mobile-request')
    const response = await (handleMobileRequest as any)(
      'https://rgw.wanjiedata.com/demo.png',
      'GET',
      new Headers(),
      undefined,
      undefined,
      'arraybuffer'
    )

    expect(capacitorHttpRequestMock).toHaveBeenCalledWith(expect.objectContaining({ responseType: 'arraybuffer' }))
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3])
  })
})
