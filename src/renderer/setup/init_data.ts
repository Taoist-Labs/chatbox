import { v4 as uuidv4 } from 'uuid'
import storage from '@/storage'
import { StorageKey, StorageKeyGenerator } from '@/storage/StoreStorage'
import * as chatStore from '@/stores/chatStore'
import { getSessionMeta, initEmptyChatSession } from '@/stores/sessionHelpers'

export async function initData() {
  await initSessionsIfNeeded()
}

async function initSessionsIfNeeded() {
  // 已经做过 migration，只需要检查是否存在 sessionList
  const sessionList = await chatStore.listSessionsMeta()
  if (sessionList.length > 0) {
    return
  }

  const session = {
    id: uuidv4(),
    ...initEmptyChatSession(),
  }
  await storage.setItemNow(StorageKeyGenerator.session(session.id), session)

  const newSessionList = [getSessionMeta(session)]
  await storage.setItemNow(StorageKey.ChatSessionsList, newSessionList)
  await chatStore.updateSessionList(() => {
    return newSessionList
  })
}
