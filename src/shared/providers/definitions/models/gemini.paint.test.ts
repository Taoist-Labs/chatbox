import type { ModelDependencies } from 'src/shared/types/adapters'
import type { ProviderModelInfo } from 'src/shared/types/settings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomGemini from './custom-gemini'
import Gemini from './gemini'

const { mockGenerateText, mockCreateGoogleGenerativeAI, mockChat } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
  mockCreateGoogleGenerativeAI: vi.fn(),
  mockChat: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}))

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: mockCreateGoogleGenerativeAI,
}))

function createDependencies(): ModelDependencies {
  return {
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
      withScope: vi.fn(),
    },
    getRemoteConfig: vi.fn(),
  }
}

function createModel(modelId: string): ProviderModelInfo {
  return {
    modelId,
    type: 'chat',
  }
}

describe('Gemini paint image input forwarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChat.mockReturnValue({ id: 'mock-chat-model' })
    mockCreateGoogleGenerativeAI.mockReturnValue({ chat: mockChat })
    mockGenerateText.mockResolvedValue({
      files: [{ mediaType: 'image/png', base64: 'generated-image' }],
    })
  })

  it('Gemini: includes uploaded image in generateText user content', async () => {
    const gemini = new Gemini(
      {
        geminiAPIKey: 'test-key',
        geminiAPIHost: 'https://example.com',
        model: createModel('gemini-3-pro-image-preview'),
      },
      createDependencies()
    )

    await gemini.paint({
      prompt: '把这张图改成赛博朋克风格',
      images: [{ imageUrl: 'data:image/jpeg;base64,ZmFrZS1pbWFnZQ==' }],
      num: 1,
    })

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '把这张图改成赛博朋克风格' },
              { type: 'image', image: 'ZmFrZS1pbWFnZQ==', mediaType: 'image/jpeg' },
            ],
          },
        ],
      })
    )
  })

  it('CustomGemini: includes uploaded image in generateText user content', async () => {
    const customGemini = new CustomGemini(
      {
        apiKey: 'test-key',
        apiHost: 'https://example.com',
        model: createModel('gemini-3-pro-image-preview'),
      },
      createDependencies()
    )

    await customGemini.paint({
      prompt: '以这张图为参考生成夜景',
      images: [{ imageUrl: 'data:image/png;base64,dGVzdC1pbWFnZQ==' }],
      num: 1,
    })

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '以这张图为参考生成夜景' },
              { type: 'image', image: 'dGVzdC1pbWFnZQ==', mediaType: 'image/png' },
            ],
          },
        ],
      })
    )
  })

  it('Gemini: supports gemini-3.1-flash-image-preview image generation', async () => {
    const gemini = new Gemini(
      {
        geminiAPIKey: 'test-key',
        geminiAPIHost: 'https://example.com',
        model: createModel('gemini-3.1-flash-image-preview'),
      },
      createDependencies()
    )

    await gemini.paint({
      prompt: '生成一张月球基地概念图',
      num: 1,
    })

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          google: expect.objectContaining({
            responseModalities: ['TEXT', 'IMAGE'],
          }),
        },
      })
    )
  })

  it('CustomGemini: supports gemini-3.1-flash-image-preview image generation', async () => {
    const customGemini = new CustomGemini(
      {
        apiKey: 'test-key',
        apiHost: 'https://example.com',
        model: createModel('gemini-3.1-flash-image-preview'),
      },
      createDependencies()
    )

    await customGemini.paint({
      prompt: '生成一张水下城市概念图',
      num: 1,
    })

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          google: expect.objectContaining({
            responseModalities: ['TEXT', 'IMAGE'],
          }),
        },
      })
    )
  })
})
