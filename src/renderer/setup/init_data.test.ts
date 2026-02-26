import { beforeEach, describe, expect, it, vi } from 'vitest'

const listSessionsMetaMock = vi.fn()
const updateSessionListMock = vi.fn()
const setItemNowMock = vi.fn()
const getLocaleMock = vi.fn()

vi.mock('@/stores/chatStore', () => ({
  listSessionsMeta: listSessionsMetaMock,
  updateSessionList: updateSessionListMock,
}))

vi.mock('@/storage', () => ({
  default: {
    setItemNow: setItemNowMock,
  },
}))

vi.mock('@/platform', () => ({
  default: {
    getLocale: getLocaleMock,
  },
}))

vi.mock('@/storage/StoreStorage', () => ({
  StorageKey: {
    ChatSessionsList: 'chat-sessions-list',
  },
  StorageKeyGenerator: {
    session: (sessionId: string) => `session:${sessionId}`,
  },
}))

vi.mock('@/stores/sessionHelpers', () => ({
  getSessionMeta: (session: { id: string; name: string; type: string }) => ({
    id: session.id,
    name: session.name,
    type: session.type,
  }),
  initEmptyChatSession: () => ({
    name: 'Untitled',
    type: 'chat',
    messages: [],
    settings: {
      provider: 'wanjie',
      modelId: '',
    },
  }),
}))

vi.mock('uuid', () => ({
  v4: () => 'session-id-1',
}))

describe('initData', () => {
  beforeEach(() => {
    vi.resetModules()
    listSessionsMetaMock.mockReset().mockResolvedValue([])
    updateSessionListMock.mockReset().mockResolvedValue(undefined)
    setItemNowMock.mockReset().mockResolvedValue(undefined)
    getLocaleMock.mockReset().mockResolvedValue('en-US')
  })

  it('creates exactly one empty chat session on first run', async () => {
    let nextSessionList: unknown[] = []
    updateSessionListMock.mockImplementation(async (updater: (prev: unknown[]) => unknown[]) => {
      nextSessionList = updater([])
    })

    const { initData } = await import('./init_data')
    await initData()

    expect(nextSessionList).toHaveLength(1)
    expect(nextSessionList[0]).toMatchObject({
      id: 'session-id-1',
      name: 'Untitled',
      type: 'chat',
    })

    const sessionWrite = setItemNowMock.mock.calls.find(([key]) => key === 'session:session-id-1')
    expect(sessionWrite).toBeDefined()
    expect(sessionWrite?.[1]).toMatchObject({
      id: 'session-id-1',
      name: 'Untitled',
      type: 'chat',
      messages: [],
    })
  })

  it('skips initialization when sessions already exist', async () => {
    listSessionsMetaMock.mockResolvedValueOnce([{ id: 'existing-session' }])

    const { initData } = await import('./init_data')
    await initData()

    expect(updateSessionListMock).not.toHaveBeenCalled()
    expect(setItemNowMock).not.toHaveBeenCalled()
  })
})
