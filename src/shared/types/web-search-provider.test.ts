import { describe, expect, it } from 'vitest'
import { settings as defaultSettings } from '../defaults'
import { SettingsSchema } from './settings'

describe('SettingsSchema web search provider', () => {
  it('rejects yahoo as web search provider', () => {
    const seed = defaultSettings()
    expect(() =>
      SettingsSchema.parse({
        ...seed,
        extension: {
          ...seed.extension,
          webSearch: {
            ...seed.extension.webSearch,
            provider: 'yahoo',
          },
        },
      })
    ).toThrow()
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

  it('rejects quark as web search provider', () => {
    const seed = defaultSettings()
    expect(() =>
      SettingsSchema.parse({
        ...seed,
        extension: {
          ...seed.extension,
          webSearch: {
            ...seed.extension.webSearch,
            provider: 'quark',
          },
        },
      })
    ).toThrow()
  })
})
