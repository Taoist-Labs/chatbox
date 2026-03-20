export const GEMINI_IMAGE_MODEL_IDS = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-3-pro-image',
  'gemini-3-pro-image-preview',
  'gemini-3.1-flash-image-preview',
] as const

const GEMINI_IMAGE_MODEL_ID_SET = new Set<string>(GEMINI_IMAGE_MODEL_IDS)

export function isGeminiImageGenerationModel(modelId: string): boolean {
  const normalizedModelId = modelId.trim().toLowerCase()

  if (!normalizedModelId.startsWith('gemini-')) {
    return false
  }

  return GEMINI_IMAGE_MODEL_ID_SET.has(normalizedModelId) || normalizedModelId.includes('-image')
}
