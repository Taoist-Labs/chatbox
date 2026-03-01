import { describe, expect, it } from 'vitest'
import { settings as defaultSettings } from '../defaults'
import { SettingsSchema } from './settings'

describe('SettingsSchema web search provider', () => {
  it('accepts yahoo as web search provider', () => {
    const seed = defaultSettings()
    const parsed = SettingsSchema.parse({
      ...seed,
      extension: {
        ...seed.extension,
        webSearch: {
          ...seed.extension.webSearch,
          provider: 'yahoo',
        },
      },
    })

    expect(parsed.extension.webSearch.provider).toBe('yahoo')
  })

  it('accepts baidu as web search provider', () => {
    const seed = defaultSettings()
    const parsed = SettingsSchema.parse({
      ...seed,
      extension: {
        ...seed.extension,
        webSearch: {
          ...seed.extension.webSearch,
          provider: 'baidu',
        },
      },
    })

    expect(parsed.extension.webSearch.provider).toBe('baidu')
  })

  it('accepts quark as web search provider', () => {
    const seed = defaultSettings()
    const parsed = SettingsSchema.parse({
      ...seed,
      extension: {
        ...seed.extension,
        webSearch: {
          ...seed.extension.webSearch,
          provider: 'quark',
        },
      },
    })

    expect(parsed.extension.webSearch.provider).toBe('quark')
  })
})
