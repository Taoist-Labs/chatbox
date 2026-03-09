import { DebouncedFunc } from 'lodash'
import debounce from 'lodash/debounce'
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid'
import BaseStorage from './BaseStorage'

const FILE_UNIQ_KEY_NAMESPACE = '4f43f93b-5fd7-4527-9230-9903b67aceeb'
const LINK_UNIQ_KEY_NAMESPACE = '4f1f8992-cf44-48f8-a2c4-147e6c28ff95'

function getFileFingerprint(file: File): string {
  const fileWithPath = file as File & { path?: string }
  return [
    fileWithPath.name || '',
    fileWithPath.type || '',
    fileWithPath.size || 0,
    fileWithPath.lastModified || 0,
    fileWithPath.path || '',
  ].join('|')
}

export enum StorageKey {
  ChatSessions = 'chat-sessions',
  Configs = 'configs',
  Settings = 'settings',
  MyCopilots = 'myCopilots',
  ConfigVersion = 'configVersion',
  RemoteConfig = 'remoteConfig',
  ChatSessionsList = 'chat-sessions-list',
  ChatSessionSettings = 'chat-session-settings',
  PictureSessionSettings = 'picture-session-settings',
  AuthInfo = 'authInfo',
}

export const StorageKeyGenerator = {
  session(id: string) {
    return `session:${id}`
  },
  fileUniqKey(file: File) {
    return `file-uniq:${uuidv5(getFileFingerprint(file), FILE_UNIQ_KEY_NAMESPACE)}`
  },
  linkUniqKey(url: string) {
    return `link-uniq:${uuidv5(url.trim(), LINK_UNIQ_KEY_NAMESPACE)}`
  },
  picture(category: string) {
    return `picture:${category}:${uuidv4()}`
  },
  file(sessionId: string, msgId: string) {
    return `file:${sessionId}:${msgId}:${uuidv4()}`
  },
}

export default class StoreStorage extends BaseStorage {
  constructor() {
    super()
  }
  public async getItem<T>(key: string, initialValue: T): Promise<T> {
    let value: T = await super.getItem(key, initialValue)

    if (key === StorageKey.Configs && value === initialValue) {
      await super.setItemNow(key, initialValue) // 持久化初始生成的 uuid
    }

    return value
  }

  private debounceQueue = new Map<string, DebouncedFunc<(key: string, value: unknown) => void>>()

  public async setItem<T>(key: string, value: T): Promise<void> {
    let debounced = this.debounceQueue.get(key)
    if (!debounced) {
      debounced = debounce(this.setItemNow.bind(this), 500, { maxWait: 2000 })
      this.debounceQueue.set(key, debounced)
    }
    debounced(key, value)
  }
}
