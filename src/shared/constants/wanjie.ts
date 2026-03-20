// Wanjie integration is deployment-specific and intentionally configured in code.
export const WANJIE_WORKER_API_HOST = 'https://chat.caboroca.xyz'
export const WANJIE_MODEL_API_HOST = 'https://maas-openapi.wanjiedata.com/api'
export const WANJIE_ANTHROPIC_MODEL_API_HOST = 'https://maas-openapi.wanjiedata.com/api/anthropic/v1'
export const WANJIE_ENCRYPTION_KEY = '32Q3J2ktrtcQV4xP31JBws0SlbCOXara'

export const WANJIE_TEXT_TO_IMAGE_LABEL = 'wanjie:text-to-image'
export const WANJIE_IMAGE_TO_IMAGE_LABEL = 'wanjie:image-to-image'
export const WANJIE_IMAGE_MODEL_LABELS = [WANJIE_TEXT_TO_IMAGE_LABEL, WANJIE_IMAGE_TO_IMAGE_LABEL] as const
