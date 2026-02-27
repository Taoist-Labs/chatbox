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

  it('logs context window read and assign stages when mapping models', () => {
    const previousNodeEnv = process.env.NODE_ENV
    const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
    try {
      mapWanjieModels([
        {
          modelName: 'gpt-4o',
          contextLength: 128000,
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
          contextLength: 128000,
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
