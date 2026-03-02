import { WANJIE_ENCRYPTION_KEY, WANJIE_MODEL_API_HOST, WANJIE_WORKER_API_HOST } from '@shared/constants/wanjie'
import type { ProviderModelInfo } from '@shared/types'
import { describe, expect, it, vi } from 'vitest'
import {
  WANJIE_SMS_COOLDOWN_SECONDS,
  buildWanjieConfiguredSettings,
  createWanjieSmsCooldownUntil,
  extractWanjieApiKey,
  getWanjieSmsCooldownSecondsLeft,
  getWanjieBuiltinConfig,
  logWanjieAuthDebug,
  mapWanjieModels,
  shouldLogWanjieAuthPath,
} from './wanjie'

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
          defaultFlag: false,
        },
        {
          id: 'k1',
          apiKey: 'sk-default',
          defaultFlag: true,
        },
      ],
    })

    expect(apiKey).toBe('sk-default')
  })

  it('does not treat legacy dafaultFlag typo as default marker', () => {
    const apiKey = extractWanjieApiKey({
      data: [
        {
          id: 'k1',
          apiKey: 'sk-first',
        },
        {
          id: 'k2',
          apiKey: 'sk-legacy-default',
          dafaultFlag: true,
        },
      ],
    })

    expect(apiKey).toBe('sk-first')
  })

  it('maps model response into provider model list', () => {
    const models = mapWanjieModels([
      {
        modelName: 'gpt-4o',
        modelSummary: '多模态模型',
        contextLength: 128,
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
        contextLength: 64,
      },
      {
        modelId: 'qwen-plus',
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

  it('maps interactionType/modelType into chat model type and vision capability', () => {
    const models = mapWanjieModels([
      {
        modelName: 'i1-model',
        interactionType: 1,
      },
      {
        modelName: 'i4-model',
        interactionType: 4,
      },
      {
        modelName: 't1-model',
        modelType: 1,
      },
      {
        modelName: 't3-model',
        modelType: 3,
      },
    ])

    expect(models).toEqual([
      {
        modelId: 'i1-model',
        nickname: 'i1-model',
        type: 'chat',
        capabilities: ['vision'],
      },
      {
        modelId: 'i4-model',
        nickname: 'i4-model',
        type: 'chat',
      },
      {
        modelId: 't1-model',
        nickname: 't1-model',
        type: 'chat',
        capabilities: ['vision'],
      },
      {
        modelId: 't3-model',
        nickname: 't3-model',
        type: 'chat',
      },
    ])
  })

  it('filters out unsupported explicit interactionType/modelType model categories', () => {
    const models = mapWanjieModels([
      {
        modelName: 'image-to-image',
        interactionType: 2,
      },
      {
        modelName: 'text-to-image',
        interactionType: 5,
      },
      {
        modelName: 'speech',
        modelType: 4,
      },
      {
        modelName: 'video',
        modelType: 5,
      },
      {
        modelName: 'chat',
        interactionType: 3,
      },
    ])

    expect(models).toEqual([
      {
        modelId: 'chat',
        nickname: 'chat',
        type: 'chat',
      },
    ])
  })

  it('maps officialProvider into apiStyle for compatibility routing', () => {
    const models = mapWanjieModels([
      {
        modelName: 'gpt-4o',
        officialProvider: 'OpenAI',
      },
      {
        modelName: 'gemini-2.5-pro',
        officialProvider: 'Gemini',
      },
      {
        modelName: 'claude-3-7-sonnet',
        officialProvider: 'Anthropic',
      },
    ])

    expect(models).toEqual([
      {
        modelId: 'gpt-4o',
        nickname: 'gpt-4o',
        type: 'chat',
        apiStyle: 'openai',
      },
      {
        modelId: 'gemini-2.5-pro',
        nickname: 'gemini-2.5-pro',
        type: 'chat',
        apiStyle: 'google',
      },
      {
        modelId: 'claude-3-7-sonnet',
        nickname: 'claude-3-7-sonnet',
        type: 'chat',
        apiStyle: 'anthropic',
      },
    ])
  })

  it('treats contextLength=0 as unlimited and leaves contextWindow undefined', () => {
    const models = mapWanjieModels([
      {
        modelName: 'wanjie-unlimited',
        contextLength: 0,
      },
    ])

    expect(models).toEqual([
      {
        modelId: 'wanjie-unlimited',
        nickname: 'wanjie-unlimited',
        type: 'chat',
      },
    ])
  })

  it('ignores legacy modelIdStr-only payload fields when mapping models', () => {
    const models = mapWanjieModels([
      {
        modelIdStr: 'legacy-model-id',
      },
    ])

    expect(models).toEqual([])
  })

  it('logs context window read and assign stages when mapping models', () => {
    const previousNodeEnv = process.env.NODE_ENV
    const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
    try {
      mapWanjieModels([
        {
          modelName: 'gpt-4o',
          contextLength: 128,
        },
      ])

      const contextDebugCalls = debugSpy.mock.calls
        .filter((call) => call[0] === '[Wanjie Context Debug]')
        .map((call) => call[1] as { stage?: string })

      expect(contextDebugCalls.some((call) => call.stage === 'model_context_read')).toBe(true)
      expect(contextDebugCalls.some((call) => call.stage === 'model_context_assign')).toBe(true)
    } finally {
      debugSpy.mockRestore()
      process.env.NODE_ENV = previousNodeEnv
    }
  })

  it('does not print debug logs outside development', () => {
    const previousNodeEnv = process.env.NODE_ENV
    const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    process.env.NODE_ENV = 'production'
    try {
      logWanjieAuthDebug({
        path: '/api/auth/login',
        method: 'POST',
        stage: 'response_encrypted',
        data: { data: 'cipher', iv: 'nonce' },
      })

      mapWanjieModels([
        {
          modelName: 'gpt-4o',
          contextLength: 128,
        },
      ])

      const debugLabels = debugSpy.mock.calls.map((call) => call[0])
      expect(debugLabels).not.toContain('[Wanjie Auth Debug]')
      expect(debugLabels).not.toContain('[Wanjie Context Debug]')
    } finally {
      debugSpy.mockRestore()
      process.env.NODE_ENV = previousNodeEnv
    }
  })

  it('uses built-in wanjie runtime config', () => {
    expect(getWanjieBuiltinConfig()).toEqual({
      workerBaseUrl: WANJIE_WORKER_API_HOST,
      encryptionKey: WANJIE_ENCRYPTION_KEY,
      modelApiHost: WANJIE_MODEL_API_HOST,
    })
  })

  it('builds configured settings with built-in model host and provided smsId', () => {
    const models: ProviderModelInfo[] = [{ modelId: 'gpt-4o', type: 'chat' }]

    const settings = buildWanjieConfiguredSettings({
      phone: '13800138000',
      smsId: 'sms-123',
      accessToken: 'token-abc',
      apiKey: 'sk-test',
      models,
    })

    expect(settings).toEqual({
      apiHost: WANJIE_MODEL_API_HOST,
      wanjiePhone: '13800138000',
      wanjieSmsId: 'sms-123',
      wanjieAccountToken: 'token-abc',
      apiKey: 'sk-test',
      models,
    })
  })

  it('recognizes wanjie login-related paths for debug logs', () => {
    expect(shouldLogWanjieAuthPath('/api/sms/send')).toBe(true)
    expect(shouldLogWanjieAuthPath('/api/auth/login')).toBe(true)
    expect(shouldLogWanjieAuthPath('/api/user/models')).toBe(true)
    expect(shouldLogWanjieAuthPath('/api/user/api-key')).toBe(true)
    expect(shouldLogWanjieAuthPath('/api/user/api-keys')).toBe(true)
    expect(shouldLogWanjieAuthPath('/api/other')).toBe(false)
  })

  it('prints encrypted and decrypted debug logs for wanjie auth flow', () => {
    const previousNodeEnv = process.env.NODE_ENV
    const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
    try {
      logWanjieAuthDebug({
        path: '/api/auth/login',
        method: 'POST',
        stage: 'response_encrypted',
        data: { data: 'cipher', iv: 'nonce' },
      })

      logWanjieAuthDebug({
        path: '/api/auth/login',
        method: 'POST',
        stage: 'response_decrypted',
        data: { success: true, result: { accessToken: 'token' } },
      })

      expect(debugSpy).toHaveBeenCalledTimes(2)
      expect(debugSpy.mock.calls[0]?.[0]).toBe('[Wanjie Auth Debug]')
      expect(debugSpy.mock.calls[0]?.[1]).toMatchObject({
        path: '/api/auth/login',
        method: 'POST',
        stage: 'response_encrypted',
      })
      expect(debugSpy.mock.calls[1]?.[1]).toMatchObject({
        path: '/api/auth/login',
        method: 'POST',
        stage: 'response_decrypted',
      })
    } finally {
      debugSpy.mockRestore()
      process.env.NODE_ENV = previousNodeEnv
    }
  })

  it('creates sms cooldown deadline using default cooldown seconds', () => {
    const now = 1_700_000_000_000
    expect(createWanjieSmsCooldownUntil(now)).toBe(now + WANJIE_SMS_COOLDOWN_SECONDS * 1000)
  })

  it('computes sms cooldown seconds left with ceiling and clamps to zero', () => {
    const now = 1_700_000_000_000

    expect(getWanjieSmsCooldownSecondsLeft(now + 59_200, now)).toBe(60)
    expect(getWanjieSmsCooldownSecondsLeft(now + 1_000, now)).toBe(1)
    expect(getWanjieSmsCooldownSecondsLeft(now - 1, now)).toBe(0)
    expect(getWanjieSmsCooldownSecondsLeft(undefined, now)).toBe(0)
  })
})
