import type { Settings } from '@shared/types'
import type { PlatformType } from '@/platform/interfaces'

type WebSearchProvider = Settings['extension']['webSearch']['provider']
type SelectableWebSearchProvider = Exclude<WebSearchProvider, 'build-in'>

export type WebSearchProviderOption = {
  value: SelectableWebSearchProvider
  label: string
}

const WEB_SEARCH_PROVIDER_OPTIONS: readonly WebSearchProviderOption[] = [
  { value: 'bing', label: 'Bing Search (Free)' },
  { value: 'baidu', label: 'Baidu Search (Free)' },
  { value: 'tavily', label: 'Tavily' },
]

const MOBILE_WEB_SEARCH_PROVIDERS: ReadonlySet<SelectableWebSearchProvider> = new Set(['baidu', 'tavily'])

export function getWebSearchProviderOptions(platformType: PlatformType): WebSearchProviderOption[] {
  if (platformType === 'mobile') {
    return WEB_SEARCH_PROVIDER_OPTIONS.filter((option) => MOBILE_WEB_SEARCH_PROVIDERS.has(option.value))
  }
  return [...WEB_SEARCH_PROVIDER_OPTIONS]
}

export function normalizeWebSearchProviderForPlatform(
  provider: WebSearchProvider,
  platformType: PlatformType
): SelectableWebSearchProvider {
  const normalizedProvider: SelectableWebSearchProvider = provider === 'build-in' ? 'bing' : provider
  if (platformType === 'mobile' && !MOBILE_WEB_SEARCH_PROVIDERS.has(normalizedProvider)) {
    return 'baidu'
  }
  return normalizedProvider
}
