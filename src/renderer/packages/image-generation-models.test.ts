import { ModelProviderEnum } from '@shared/types'
import { describe, expect, it } from 'vitest'
import {
  getAvailableImageModelsForProvider,
  isImageOnlyModel,
  isJimengImageToImageModel,
} from './image-generation-models'

describe('image-generation-models', () => {
  it('returns allowlist image models from provider model list', () => {
    const models = getAvailableImageModelsForProvider(ModelProviderEnum.OpenAI, [
      { modelId: 'gpt-image-1', nickname: 'GPT Image 1' },
      { modelId: 'gpt-4o', nickname: 'GPT 4o' },
    ])

    expect(models).toEqual([{ modelId: 'gpt-image-1', displayName: 'GPT Image 1' }])
  })

  it('includes gemini-3.1-flash-image-preview for Gemini provider image models', () => {
    const models = getAvailableImageModelsForProvider(ModelProviderEnum.Gemini, [
      { modelId: 'gemini-3.1-flash-image-preview', nickname: 'Gemini 3.1 Flash Image Preview' },
      { modelId: 'gemini-2.5-flash', nickname: 'Gemini 2.5 Flash' },
    ])

    expect(models).toEqual([
      {
        modelId: 'gemini-3.1-flash-image-preview',
        displayName: 'Gemini 3.1 Flash Image Preview',
      },
    ])
  })

  it('includes wanjie text-to-image and image-to-image models by label', () => {
    const models = getAvailableImageModelsForProvider(ModelProviderEnum.Wanjie, [
      {
        modelId: 'wanjie-text-to-image',
        nickname: 'Wanjie T2I',
        labels: ['wanjie:text-to-image'],
      },
      {
        modelId: 'wanjie-image-to-image',
        nickname: 'Wanjie I2I',
        labels: ['wanjie:image-to-image'],
      },
      { modelId: 'qwen-plus', nickname: 'Qwen Plus' },
    ])

    expect(models).toEqual([
      { modelId: 'wanjie-text-to-image', displayName: 'Wanjie T2I' },
      { modelId: 'wanjie-image-to-image', displayName: 'Wanjie I2I' },
    ])
  })

  it('does not include wanjie-only labels for non-wanjie providers', () => {
    const models = getAvailableImageModelsForProvider(ModelProviderEnum.OpenAI, [
      {
        modelId: 'custom-image-model',
        nickname: 'Custom Image',
        labels: ['wanjie:text-to-image'],
      },
    ])

    expect(models).toEqual([])
  })

  it('marks wanjie image-only labels as image-only models', () => {
    expect(isImageOnlyModel({ labels: ['wanjie:text-to-image'] })).toBe(true)
    expect(isImageOnlyModel({ labels: ['wanjie:image-to-image'] })).toBe(true)
    expect(isImageOnlyModel({ labels: ['recommended'] })).toBe(false)
    expect(isImageOnlyModel({})).toBe(false)
  })

  it('recognizes jimeng i2i model ids that require reference image upload', () => {
    expect(isJimengImageToImageModel('jimeng_i2i_v30')).toBe(true)
    expect(isJimengImageToImageModel('JIMENG_I2I_PRO')).toBe(true)
    expect(isJimengImageToImageModel('jimeng_t2i_v40')).toBe(false)
    expect(isJimengImageToImageModel('gpt-image-1')).toBe(false)
  })
})
