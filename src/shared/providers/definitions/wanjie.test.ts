import { WANJIE_ANTHROPIC_MODEL_API_HOST, WANJIE_MODEL_API_HOST } from 'src/shared/constants/wanjie'
import { settings as getDefaultSettings, newConfigs } from 'src/shared/defaults'
import { getModel } from 'src/shared/providers'
import Claude from 'src/shared/providers/definitions/models/claude'
import Gemini from 'src/shared/providers/definitions/models/gemini'
import OpenAI from 'src/shared/providers/definitions/models/openai'
import { ModelProviderEnum, type SessionSettings, type Settings } from 'src/shared/types'
import type { ModelDependencies } from 'src/shared/types/adapters'
import type { SentryScope } from 'src/shared/utils/sentry_adapter'
import { describe, expect, it, vi } from 'vitest'

const mockScope: SentryScope = {
  setTag: vi.fn(),
  setExtra: vi.fn(),
}

const mockDependencies: ModelDependencies = {
  request: {
    fetchWithOptions: vi.fn(),
    apiRequest: vi.fn(),
  },
  storage: {
    saveImage: vi.fn(),
    getImage: vi.fn(),
  },
  sentry: {
    captureException: vi.fn(),
    withScope: vi.fn((callback: (scope: SentryScope) => void) => callback(mockScope)),
  },
  getRemoteConfig: vi.fn(),
}

function buildWanjieSettings(apiStyle?: 'openai' | 'google' | 'anthropic'): Settings {
  const defaultSettings = getDefaultSettings()
  return {
    ...defaultSettings,
    providers: {
      ...(defaultSettings.providers || {}),
      [ModelProviderEnum.Wanjie]: {
        apiKey: 'sk-test',
        apiHost: WANJIE_MODEL_API_HOST,
        models: [
          {
            modelId: 'wanjie-test-model',
            type: 'chat',
            apiStyle,
          },
        ],
      },
    },
  }
}

function buildSessionSettings(): SessionSettings {
  return {
    provider: ModelProviderEnum.Wanjie,
    modelId: 'wanjie-test-model',
    stream: true,
  }
}

describe('wanjie provider definition', () => {
  it('defaults to OpenAI-compatible runtime when apiStyle is missing', () => {
    const model = getModel(buildSessionSettings(), buildWanjieSettings(undefined), newConfigs(), mockDependencies)

    expect(model).toBeInstanceOf(OpenAI)
  })

  it('creates Gemini runtime for google apiStyle models', () => {
    const model = getModel(buildSessionSettings(), buildWanjieSettings('google'), newConfigs(), mockDependencies)

    expect(model).toBeInstanceOf(Gemini)
  })

  it('creates Claude runtime and uses anthropic base url for anthropic apiStyle models', () => {
    const model = getModel(buildSessionSettings(), buildWanjieSettings('anthropic'), newConfigs(), mockDependencies)

    expect(model).toBeInstanceOf(Claude)
    expect((model as Claude).options.claudeApiHost).toBe(WANJIE_ANTHROPIC_MODEL_API_HOST)
  })
})
