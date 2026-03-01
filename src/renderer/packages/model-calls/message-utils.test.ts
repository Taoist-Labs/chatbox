import type { Message } from '@shared/types'
import { describe, expect, it } from 'vitest'
import { applyImageContextPolicy } from './message-utils'

function createMessage(id: string, contentParts: Message['contentParts']): Message {
  return {
    id,
    role: 'user',
    contentParts,
  } as Message
}

function countImageParts(messages: Message[]): number {
  return messages.reduce((count, message) => {
    return count + message.contentParts.filter((part) => part.type === 'image').length
  }, 0)
}

describe('applyImageContextPolicy', () => {
  it('keeps only the latest image when maxImagesPerRequest is 1', () => {
    const messages: Message[] = [
      createMessage('m1', [
        { type: 'text', text: 'first' },
        { type: 'image', storageKey: 'img-1', ocrResult: 'invoice page 1' },
      ]),
      createMessage('m2', [
        { type: 'text', text: 'second' },
        { type: 'image', storageKey: 'img-2', ocrResult: 'invoice page 2' },
      ]),
      createMessage('m3', [{ type: 'image', storageKey: 'img-3' }]),
    ]

    const result = applyImageContextPolicy(messages, {
      modelSupportVision: true,
      maxImagesPerRequest: 1,
    })

    expect(countImageParts(result)).toBe(1)
    expect(result[2].contentParts.find((part) => part.type === 'image')).toEqual({
      type: 'image',
      storageKey: 'img-3',
    })
    expect(result[0].contentParts.some((part) => part.type === 'text' && part.text.includes('Historical image'))).toBe(
      true
    )
    expect(result[1].contentParts.some((part) => part.type === 'text' && part.text.includes('Historical image'))).toBe(
      true
    )
  })

  it('converts all images to text when model does not support vision', () => {
    const messages: Message[] = [
      createMessage('m1', [
        { type: 'text', text: 'hello' },
        { type: 'image', storageKey: 'img-1', ocrResult: 'line1 line2 line3' },
      ]),
      createMessage('m2', [{ type: 'image', storageKey: 'img-2' }]),
    ]

    const result = applyImageContextPolicy(messages, {
      modelSupportVision: false,
      maxImagesPerRequest: 1,
    })

    expect(countImageParts(result)).toBe(0)
    expect(result[0].contentParts.some((part) => part.type === 'text' && part.text.includes('OCR'))).toBe(true)
  })

  it('does not mutate original messages', () => {
    const messages: Message[] = [
      createMessage('m1', [
        { type: 'text', text: 'hello' },
        { type: 'image', storageKey: 'img-1', ocrResult: 'text for image 1' },
      ]),
      createMessage('m2', [{ type: 'image', storageKey: 'img-2' }]),
    ]

    const snapshot = structuredClone(messages)

    const result = applyImageContextPolicy(messages, {
      modelSupportVision: true,
      maxImagesPerRequest: 1,
    })

    expect(result).not.toBe(messages)
    expect(messages).toEqual(snapshot)
  })

  it('keeps all images by default when maxImagesPerRequest is not provided', () => {
    const messages: Message[] = [
      createMessage('m1', [{ type: 'image', storageKey: 'img-1' }]),
      createMessage('m2', [{ type: 'image', storageKey: 'img-2' }]),
    ]

    const result = applyImageContextPolicy(messages, {
      modelSupportVision: true,
    })

    expect(countImageParts(result)).toBe(2)
  })
})
