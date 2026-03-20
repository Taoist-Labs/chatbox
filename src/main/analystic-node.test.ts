import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./store-node', () => ({
  getConfig: () => ({ uuid: 'test-uuid' }),
}))

vi.mock('electron', () => ({
  app: {
    getVersion: () => '9.9.9',
  },
}))

vi.mock('ofetch', () => ({
  ofetch: vi.fn(async () => ({ ok: true })),
}))

import { ofetch } from 'ofetch'
import { event } from './analystic-node'

describe('analystic-node', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('temporarily skips network request for analytics event reporting', async () => {
    await event('user_engagement', { event_category: 'user' })

    expect(vi.mocked(ofetch)).not.toHaveBeenCalled()
  })
})
