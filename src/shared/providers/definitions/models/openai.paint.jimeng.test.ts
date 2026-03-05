import type { ModelDependencies } from 'src/shared/types/adapters'
import type { ProviderModelInfo } from 'src/shared/types/settings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OpenAI from './openai'

const { mockCreateOpenAI, mockGenerateImage, mockExtractReasoningMiddleware } = vi.hoisted(() => ({
  mockCreateOpenAI: vi.fn(),
  mockGenerateImage: vi.fn(),
  mockExtractReasoningMiddleware: vi.fn(() => undefined),
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}))

vi.mock('ai', () => ({
  extractReasoningMiddleware: mockExtractReasoningMiddleware,
  experimental_generateImage: mockGenerateImage,
  wrapLanguageModel: ({ model }: { model: unknown }) => model,
}))

function createDependencies() {
  const apiRequest = vi.fn()
  const fetchWithOptions = vi.fn()

  const dependencies: ModelDependencies = {
    request: {
      apiRequest,
      fetchWithOptions,
    },
    storage: {
      saveImage: vi.fn(),
      getImage: vi.fn(),
    },
    sentry: {
      captureException: vi.fn(),
      withScope: vi.fn(),
    },
    getRemoteConfig: vi.fn(() => ({})),
  }

  return {
    dependencies,
    apiRequest,
    fetchWithOptions,
  }
}

function createModel(modelId: string, dependencies: ModelDependencies) {
  const model: ProviderModelInfo = {
    modelId,
    type: 'chat',
  }

  return new OpenAI(
    {
      apiKey: 'sk-test',
      apiHost: 'https://maas-openapi.wanjiedata.com/api',
      model,
      dalleStyle: 'vivid',
      injectDefaultMetadata: false,
      useProxy: false,
      stream: false,
    },
    dependencies
  )
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('OpenAI Jimeng paint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateOpenAI.mockReturnValue({
      image: vi.fn(() => ({ id: 'mock-image-model' })),
      chat: vi.fn(),
    })
    mockGenerateImage.mockResolvedValue({
      images: [{ mediaType: 'image/png', base64: 'legacy-flow' }],
    })
  })

  it('submits and polls jimeng t2i models through CVSync2Async API', async () => {
    const { dependencies, apiRequest, fetchWithOptions } = createDependencies()
    const model = createModel('jimeng_t2i_v31', dependencies)

    apiRequest
      .mockResolvedValueOnce(
        jsonResponse({
          code: 0,
          data: {
            task_id: 'task-1',
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          code: 0,
          data: {
            status: 'done',
            image_urls: ['https://img.example.com/a.png'],
          },
        })
      )

    fetchWithOptions.mockResolvedValue(
      new Response(Uint8Array.from([112, 105, 120, 101, 108]), {
        status: 200,
        headers: {
          'content-type': 'image/png',
        },
      })
    )

    const callback = vi.fn()
    const result = await model.paint(
      {
        prompt: '银河里的鲸鱼',
        num: 1,
      },
      undefined,
      callback
    )

    expect(result).toEqual(['data:image/png;base64,cGl4ZWw='])
    expect(callback).toHaveBeenCalledWith('data:image/png;base64,cGl4ZWw=')
    expect(mockGenerateImage).not.toHaveBeenCalled()
    expect(apiRequest).toHaveBeenCalledTimes(2)

    const submitCall = apiRequest.mock.calls[0]?.[0] as { url: string; headers: Record<string, string>; body: string }
    expect(submitCall.url).toContain('/jimeng/v1?Action=CVSync2AsyncSubmitTask&Version=2022-08-31')
    expect(submitCall.headers).toMatchObject({
      Authorization: 'sk-test',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(submitCall.body)).toEqual({
      req_key: 'jimeng_t2i_v31',
      prompt: '银河里的鲸鱼',
    })

    const pollCall = apiRequest.mock.calls[1]?.[0] as { url: string; body: string }
    expect(pollCall.url).toContain('/jimeng/v1?Action=CVSync2AsyncGetResult&Version=2022-08-31')
    expect(JSON.parse(pollCall.body)).toEqual({
      req_key: 'jimeng_t2i_v31',
      task_id: 'task-1',
    })
  })

  it('sends binary_data_base64 for jimeng i2i with data url inputs', async () => {
    const { dependencies, apiRequest } = createDependencies()
    const model = createModel('jimeng_i2i_v30', dependencies)

    apiRequest
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            task_id: 'task-2',
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            status: 'done',
            binary_data_base64: ['Z2VuZXJhdGVkLWltZw=='],
          },
        })
      )

    const result = await model.paint({
      prompt: '背景改成在黑洞边缘',
      images: [{ imageUrl: 'data:image/jpeg;base64,ZmFrZS1pbWFnZQ==' }],
      num: 1,
    })

    expect(result).toEqual(['data:image/png;base64,Z2VuZXJhdGVkLWltZw=='])
    const submitCall = apiRequest.mock.calls[0]?.[0] as { body: string }
    expect(JSON.parse(submitCall.body)).toEqual({
      req_key: 'jimeng_i2i_v30',
      prompt: '背景改成在黑洞边缘',
      binary_data_base64: ['ZmFrZS1pbWFnZQ=='],
    })
  })

  it('sends image_urls for jimeng i2i with remote url inputs', async () => {
    const { dependencies, apiRequest, fetchWithOptions } = createDependencies()
    const model = createModel('jimeng_i2i_v30', dependencies)

    apiRequest
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            task_id: 'task-3',
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            status: 'done',
            image_urls: ['https://img.example.com/b.png'],
          },
        })
      )
    fetchWithOptions.mockResolvedValue(
      new Response(Uint8Array.from([102, 111, 111]), {
        status: 200,
        headers: {
          'content-type': 'image/png',
        },
      })
    )

    const result = await model.paint({
      prompt: '加一点星云效果',
      images: [{ imageUrl: 'https://example.com/ref.png' }],
      num: 1,
    })

    expect(result).toEqual(['data:image/png;base64,Zm9v'])
    const submitCall = apiRequest.mock.calls[0]?.[0] as { body: string }
    expect(JSON.parse(submitCall.body)).toEqual({
      req_key: 'jimeng_i2i_v30',
      prompt: '加一点星云效果',
      image_urls: ['https://example.com/ref.png'],
    })
  })

  it('allows jimeng_t2i_v40 to run image-to-image mode when reference image is provided', async () => {
    const { dependencies, apiRequest, fetchWithOptions } = createDependencies()
    const model = createModel('jimeng_t2i_v40', dependencies)

    apiRequest
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            task_id: 'task-v40',
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            status: 'done',
            image_urls: ['https://img.example.com/v40.png'],
          },
        })
      )
    fetchWithOptions.mockResolvedValue(
      new Response(Uint8Array.from([118, 52, 48]), {
        status: 200,
        headers: {
          'content-type': 'image/png',
        },
      })
    )

    const result = await model.paint({
      prompt: '把背景换成黑洞边缘',
      images: [{ imageUrl: 'https://example.com/ref-v40.png' }],
      num: 1,
    })

    expect(result).toEqual(['data:image/png;base64,djQw'])
    const submitCall = apiRequest.mock.calls[0]?.[0] as { body: string }
    expect(JSON.parse(submitCall.body)).toEqual({
      req_key: 'jimeng_t2i_v40',
      prompt: '把背景换成黑洞边缘',
      image_urls: ['https://example.com/ref-v40.png'],
    })
  })

  it('rejects jimeng i2i requests when no input image is provided', async () => {
    const { dependencies, apiRequest } = createDependencies()
    const model = createModel('jimeng_i2i_v30', dependencies)

    await expect(
      model.paint({
        prompt: '背景改成在黑洞边缘',
        num: 1,
      })
    ).rejects.toThrow('requires at least one input image')

    expect(apiRequest).not.toHaveBeenCalled()
  })
})
