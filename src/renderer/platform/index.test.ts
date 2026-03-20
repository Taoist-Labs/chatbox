import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('platform init', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/variables')
    delete (globalThis as any).window
    process.env.NODE_ENV = originalNodeEnv
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('uses mobile platform when build target is mobile_app', async () => {
    vi.doMock('@/variables', () => ({
      BUILD_TARGET: 'mobile_app',
    }))
    process.env.NODE_ENV = 'development'
    ;(globalThis as any).window = {}

    const { default: platform } = await import('./index')

    expect(platform.type).toBe('mobile')
  })
})
