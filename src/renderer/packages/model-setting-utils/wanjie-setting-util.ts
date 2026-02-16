import OpenAI from 'src/shared/models/openai'
import { type ModelProvider, ModelProviderEnum, type ProviderSettings, type SessionType } from 'src/shared/types'
import { createModelDependencies } from '@/adapters'
import BaseConfig from './base-config'
import type { ModelSettingUtil } from './interface'

export default class WanjieSettingUtil extends BaseConfig implements ModelSettingUtil {
  public provider: ModelProvider = ModelProviderEnum.Wanjie

  getCurrentModelDisplayName(
    model: string,
    _sessionType: SessionType,
    providerSettings?: ProviderSettings
  ): Promise<string> {
    return Promise.resolve(
      `Wanjie API (${providerSettings?.models?.find((m) => m.modelId === model)?.nickname || model})`
    )
  }

  protected async listProviderModels(settings: ProviderSettings) {
    const model = settings.models?.[0] || { modelId: 'gpt-4o' }
    const dependencies = await createModelDependencies()
    const openai = new OpenAI(
      {
        apiHost: settings.apiHost || '',
        apiKey: settings.apiKey || '',
        model,
        temperature: 0,
        dalleStyle: 'vivid',
        injectDefaultMetadata: false,
        useProxy: settings.useProxy || false,
      },
      dependencies
    )
    return openai.listModels()
  }
}
