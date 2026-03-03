import { WANJIE_IMAGE_MODEL_LABELS } from '@shared/constants/wanjie'
import { ModelProviderEnum, type ProviderModelInfo } from '@shared/types'

export type ImageModelOption = {
  modelId: string
  displayName: string
}

type ImageProviderModel = Pick<ProviderModelInfo, 'modelId' | 'nickname' | 'labels'>

export const IMAGE_MODEL_FALLBACK_NAMES: Record<string, string> = {
  '': 'GPT Image',
  'gpt-image-1': 'GPT Image 1',
  'gpt-image-1.5': 'GPT Image 1.5',
  'gemini-2.5-flash-image': 'Nano Banana',
  'gemini-3-pro-image-preview': 'Nano Banana Pro',
  'gemini-3-pro-image': 'Nano Banana Pro',
}

export const OPENAI_IMAGE_MODEL_IDS = ['gpt-image-1', 'gpt-image-1.5'] as const
export const GEMINI_IMAGE_MODEL_IDS = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview', 'gemini-3-pro-image'] as const
const SUPPORTED_IMAGE_MODEL_IDS = [...GEMINI_IMAGE_MODEL_IDS, ...OPENAI_IMAGE_MODEL_IDS]

const WANJIE_IMAGE_LABELS = new Set<string>(WANJIE_IMAGE_MODEL_LABELS)

export function isImageOnlyModel(model: Pick<ProviderModelInfo, 'labels'>): boolean {
  return (model.labels || []).some((label) => WANJIE_IMAGE_LABELS.has(label))
}

export function getAvailableImageModelsForProvider(
  providerId: string,
  providerModels: ImageProviderModel[]
): ImageModelOption[] {
  const available: ImageModelOption[] = []
  const seen = new Set<string>()

  const add = (model: ImageProviderModel) => {
    if (seen.has(model.modelId)) return
    seen.add(model.modelId)
    available.push({
      modelId: model.modelId,
      displayName: model.nickname || IMAGE_MODEL_FALLBACK_NAMES[model.modelId] || model.modelId,
    })
  }

  for (const modelId of SUPPORTED_IMAGE_MODEL_IDS) {
    const model = providerModels.find((item) => item.modelId === modelId)
    if (model) {
      add(model)
    }
  }

  if (providerId === ModelProviderEnum.Wanjie) {
    for (const model of providerModels) {
      if (isImageOnlyModel(model)) {
        add(model)
      }
    }
  }

  return available
}
