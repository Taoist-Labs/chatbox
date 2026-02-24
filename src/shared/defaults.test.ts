import { chatSessionSettings, pictureSessionSettings, SystemProviders } from './defaults'
import { ModelProviderEnum } from './types'
import { describe, expect, it } from 'vitest'

describe('defaults provider slimming', () => {
  it('only keeps wanjie in system providers', () => {
    expect(SystemProviders).toHaveLength(1)
    expect(SystemProviders[0]?.id).toBe(ModelProviderEnum.Wanjie)
  })

  it('uses wanjie as default session provider', () => {
    expect(chatSessionSettings().provider).toBe(ModelProviderEnum.Wanjie)
    expect(pictureSessionSettings().provider).toBe(ModelProviderEnum.Wanjie)
  })
})
