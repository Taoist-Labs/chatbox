import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('provider bootstrap', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('does not auto-register legacy-ai provider', async () => {
    const { getSystemProviders } = await import('./index')
    const providers = getSystemProviders()

    expect(providers.some((provider) => provider.id === 'chatbox-ai')).toBe(false)
  })
})

