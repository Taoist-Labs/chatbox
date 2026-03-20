import { describe, expect, it } from 'vitest'
import { getWebSearchProviderOptions, normalizeWebSearchProviderForPlatform } from './-web-search-options'

describe('web search provider options', () => {
  it('keeps only baidu and tavily on mobile', () => {
    const options = getWebSearchProviderOptions('mobile')

    expect(options.map((option) => option.value)).toEqual(['baidu', 'tavily'])
  })

  it('keeps bing, baidu and tavily on desktop', () => {
    const options = getWebSearchProviderOptions('desktop')

    expect(options.map((option) => option.value)).toEqual(['bing', 'baidu', 'tavily'])
  })

  it('normalizes disallowed mobile provider to baidu', () => {
    expect(normalizeWebSearchProviderForPlatform('bing', 'mobile')).toBe('baidu')
    expect(normalizeWebSearchProviderForPlatform('build-in', 'mobile')).toBe('baidu')
  })

  it('keeps allowed mobile provider unchanged', () => {
    expect(normalizeWebSearchProviderForPlatform('baidu', 'mobile')).toBe('baidu')
    expect(normalizeWebSearchProviderForPlatform('tavily', 'mobile')).toBe('tavily')
  })
})
