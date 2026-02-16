import type { ProviderModelInfo } from 'src/shared/types'
import { extractWanjieApiKey, mapWanjieModels } from './wanjie'

describe('wanjie helpers', () => {
  it('extracts api key from default api key payload', () => {
    const apiKey = extractWanjieApiKey({
      id: 'key_001',
      apiKey: 'sk-test-default',
      secretKey: 'secret',
    })

    expect(apiKey).toBe('sk-test-default')
  })

  it('extracts api key from key list payload when default key exists', () => {
    const apiKey = extractWanjieApiKey({
      data: [
        {
          id: 'k2',
          apiKey: 'sk-second',
          dafaultFlag: false,
        },
        {
          id: 'k1',
          apiKey: 'sk-default',
          dafaultFlag: true,
        },
      ],
    })

    expect(apiKey).toBe('sk-default')
  })

  it('maps model response into provider model list', () => {
    const models = mapWanjieModels([
      {
        modelName: 'gpt-4o',
        modelSummary: '多模态模型',
        contextLength: 128000,
        modelModalRelations: [
          {
            modalClass: 1,
            typeGroups: [
              {
                modalType: 2,
              },
            ],
          },
        ],
      },
      {
        modelName: 'gpt-4o',
        contextLength: 64000,
      },
      {
        id: '2',
        modelIdStr: 'qwen-plus',
        modelSummary: '文本模型',
      },
    ])

    const expected: ProviderModelInfo[] = [
      {
        modelId: 'gpt-4o',
        nickname: 'gpt-4o',
        type: 'chat',
        contextWindow: 128000,
        capabilities: ['vision'],
      },
      {
        modelId: 'qwen-plus',
        nickname: 'qwen-plus',
        type: 'chat',
      },
    ]

    expect(models).toEqual(expected)
  })
})
