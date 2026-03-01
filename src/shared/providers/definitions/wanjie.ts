import { WANJIE_ANTHROPIC_MODEL_API_HOST, WANJIE_MODEL_API_HOST } from '../../constants/wanjie'
import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import Claude from './models/claude'
import Gemini from './models/gemini'
import OpenAI from './models/openai'

export const wanjieProvider = defineProvider({
  id: ModelProviderEnum.Wanjie,
  name: 'Wanjie',
  type: ModelProviderType.OpenAI,
  description: 'wanjie',
  urls: {
    website: 'https://fangzhou.wanjiedata.com',
    docs: 'https://fangzhou.wanjiedata.com',
  },
  defaultSettings: {
    apiHost: WANJIE_MODEL_API_HOST,
    models: [],
  },
  createModel: (config) => {
    const modelApiStyle = config.model.apiStyle || 'openai'
    const modelApiHost = modelApiStyle === 'anthropic' ? WANJIE_ANTHROPIC_MODEL_API_HOST : config.formattedApiHost

    if (modelApiStyle === 'google') {
      return new Gemini(
        {
          geminiAPIKey: config.providerSetting.apiKey || '',
          geminiAPIHost: modelApiHost,
          model: config.model,
          temperature: config.settings.temperature,
          topP: config.settings.topP,
          maxOutputTokens: config.settings.maxTokens,
          stream: config.settings.stream,
        },
        config.dependencies
      )
    }

    if (modelApiStyle === 'anthropic') {
      return new Claude(
        {
          claudeApiKey: config.providerSetting.apiKey || '',
          claudeApiHost: modelApiHost,
          model: config.model,
          temperature: config.settings.temperature,
          topP: config.settings.topP,
          maxOutputTokens: config.settings.maxTokens,
          stream: config.settings.stream,
        },
        config.dependencies
      )
    }

    return new OpenAI(
      {
        apiKey: config.providerSetting.apiKey || '',
        apiHost: modelApiHost,
        model: config.model,
        dalleStyle: config.settings.dalleStyle || 'vivid',
        temperature: config.settings.temperature,
        topP: config.settings.topP,
        maxOutputTokens: config.settings.maxTokens,
        injectDefaultMetadata: config.globalSettings.injectDefaultMetadata,
        useProxy: config.providerSetting.useProxy || false,
        stream: config.settings.stream,
      },
      config.dependencies
    )
  },
  getDisplayName: (modelId, providerSettings) => {
    return `Wanjie API (${providerSettings?.models?.find((m) => m.modelId === modelId)?.nickname || modelId})`
  },
})
