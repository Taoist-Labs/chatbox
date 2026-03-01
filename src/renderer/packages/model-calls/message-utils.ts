import type { Message, MessageContentParts } from '@shared/types'
import type { ModelDependencies } from '@shared/types/adapters'
import type { FilePart, ImagePart, ModelMessage, TextPart } from 'ai'
import dayjs from 'dayjs'
import { compact } from 'lodash'
import { createModelDependencies } from '@/adapters'
import { cloneMessage, getMessageText } from '@/utils/message'

const OCR_SUMMARY_MAX_CHARS = 120
const OCR_EXCERPT_MAX_CHARS = 320

export interface ConvertToModelMessagesOptions {
  modelSupportVision?: boolean
  maxImagesPerRequest?: number
}

export interface ImageContextPolicyOptions {
  modelSupportVision: boolean
  maxImagesPerRequest?: number
}

function normalizeText(text?: string): string {
  return text?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }
  return `${text.slice(0, maxChars)}...`
}

function buildImageMemoryText(ocrResult: string | undefined, mode: 'limit' | 'vision_not_supported'): string {
  const header =
    mode === 'limit'
      ? 'Historical image omitted from model input to reduce token usage.'
      : 'Model does not support image input. Converted image to text memory.'

  const normalizedOCR = normalizeText(ocrResult)
  if (!normalizedOCR) {
    return header
  }

  const summary = truncateText(normalizedOCR, OCR_SUMMARY_MAX_CHARS)
  const excerpt = truncateText(normalizedOCR, OCR_EXCERPT_MAX_CHARS)
  if (summary === excerpt) {
    return `${header}\nOCR summary: ${summary}`
  }

  return `${header}\nOCR summary: ${summary}\nOCR excerpt: ${excerpt}`
}

export function applyImageContextPolicy(messages: Message[], options: ImageContextPolicyOptions): Message[] {
  const maxImages = options.modelSupportVision
    ? Math.max(0, Math.floor(options.maxImagesPerRequest ?? Number.MAX_SAFE_INTEGER))
    : 0

  const imageRefs: Array<{ messageIndex: number; contentIndex: number }> = []
  messages.forEach((message, messageIndex) => {
    message.contentParts.forEach((part, contentIndex) => {
      if (part.type === 'image') {
        imageRefs.push({ messageIndex, contentIndex })
      }
    })
  })

  if (imageRefs.length === 0) {
    return messages
  }

  const keepImageSet = new Set<string>()
  let keepCount = 0
  for (let i = imageRefs.length - 1; i >= 0 && keepCount < maxImages; i--) {
    const ref = imageRefs[i]
    keepImageSet.add(`${ref.messageIndex}:${ref.contentIndex}`)
    keepCount++
  }

  let hasChanges = false
  const transformedMessages = messages.map((message, messageIndex) => {
    let messageChanged = false
    const transformedParts: MessageContentParts = message.contentParts.map((part, contentIndex) => {
      if (part.type !== 'image') {
        return part
      }

      const keepImage = keepImageSet.has(`${messageIndex}:${contentIndex}`)
      if (keepImage) {
        return part
      }

      messageChanged = true
      hasChanges = true
      return {
        type: 'text',
        text: buildImageMemoryText(part.ocrResult, options.modelSupportVision ? 'limit' : 'vision_not_supported'),
      }
    })

    if (!messageChanged) {
      return message
    }

    const cloned = cloneMessage(message)
    cloned.contentParts = transformedParts
    return cloned
  })

  return hasChanges ? transformedMessages : messages
}

async function convertContentParts<T extends TextPart | ImagePart | FilePart>(
  contentParts: MessageContentParts,
  imageType: 'image' | 'file',
  dependencies: ModelDependencies,
  options?: { modelSupportVision: boolean }
): Promise<T[]> {
  return compact(
    await Promise.all(
      contentParts.map(async (c) => {
        if (c.type === 'text') {
          return { type: 'text', text: c.text } as T
        } else if (c.type === 'image') {
          if (options?.modelSupportVision === false) {
            return { type: 'text', text: `This is an image, OCR Result: \n${c.ocrResult}` } as T
          }
          try {
            const imageData = await dependencies.storage.getImage(c.storageKey)
            if (!imageData) {
              console.warn(`Image not found for storage key: ${c.storageKey}`)
              return null
            }
            const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '')
            const mediaType = imageData.match(/^data:([^;]+)/)?.[1] || 'image/png'

            if (imageType === 'image') {
              return {
                type: 'image',
                image: base64Data,
                mediaType,
              } as T
            } else {
              return {
                type: 'file',
                data: base64Data,
                mediaType,
              } as T
            }
          } catch (error) {
            console.error(`Failed to get image for storage key ${c.storageKey}:`, error)
            return null
          }
        }
        return null
      })
    )
  )
}

async function convertUserContentParts(
  contentParts: MessageContentParts,
  dependencies: ModelDependencies,
  options?: { modelSupportVision: boolean }
): Promise<Array<TextPart | ImagePart>> {
  return await convertContentParts<TextPart | ImagePart>(contentParts, 'image', dependencies, options)
}

async function convertAssistantContentParts(
  contentParts: MessageContentParts,
  dependencies: ModelDependencies
): Promise<Array<TextPart | FilePart>> {
  return await convertContentParts<TextPart | FilePart>(contentParts, 'file', dependencies)
}

export async function convertToModelMessages(
  messages: Message[],
  options?: ConvertToModelMessagesOptions
): Promise<ModelMessage[]> {
  const modelSupportVision = options?.modelSupportVision ?? true
  const preparedMessages = applyImageContextPolicy(messages, {
    modelSupportVision,
    maxImagesPerRequest: options?.maxImagesPerRequest,
  })

  const dependencies = await createModelDependencies()
  const results = await Promise.all(
    preparedMessages.map(async (m): Promise<ModelMessage | null> => {
      switch (m.role) {
        case 'system':
          return {
            role: 'system' as const,
            content: getMessageText(m),
          }
        case 'user': {
          const contentParts = await convertUserContentParts(m.contentParts || [], dependencies, { modelSupportVision })
          return {
            role: 'user' as const,
            content: contentParts,
          }
        }
        case 'assistant': {
          const contentParts = m.contentParts || []
          return {
            role: 'assistant' as const,
            content: await convertAssistantContentParts(contentParts, dependencies),
          }
        }
        case 'tool':
          return null
        default: {
          const _exhaustiveCheck: never = m.role
          throw new Error(`Unknown role: ${_exhaustiveCheck}`)
        }
      }
    })
  )
  
  // Filter out null values manually instead of using compact
  return results.filter((result): result is ModelMessage => result !== null)
}

/**
 * 在 system prompt 中注入模型信息
 * @param model
 * @param messages
 * @returns
 */
export function injectModelSystemPrompt(
  model: string,
  messages: Message[],
  additionalInfo: string,
  role: 'system' | 'user' = 'system'
) {
  const metadataPrompt = `Current model: ${model}\nCurrent date: ${dayjs().format(
    'YYYY-MM-DD'
  )}\n Additional info for this conversation: ${additionalInfo}\n\n`
  let hasInjected = false
  return messages.map((m) => {
    if (m.role === role && !hasInjected) {
      m = cloneMessage(m) // 复制，防止原始数据在其他地方被直接渲染使用
      m.contentParts = [{ type: 'text', text: metadataPrompt + getMessageText(m) }]
      hasInjected = true
    }
    return m
  })
}
