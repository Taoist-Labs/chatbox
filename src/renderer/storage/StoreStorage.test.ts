import { describe, expect, it, vi } from 'vitest'

vi.mock('@/platform', () => ({
  default: {
    getStorageType: vi.fn(() => 'mock'),
    setStoreValue: vi.fn(),
    getStoreValue: vi.fn(),
    delStoreValue: vi.fn(),
    getAllStoreValues: vi.fn(),
    getAllStoreKeys: vi.fn(),
    setAllStoreValues: vi.fn(),
    setStoreBlob: vi.fn(),
    getStoreBlob: vi.fn(),
    delStoreBlob: vi.fn(),
    listStoreBlobKeys: vi.fn(),
  },
}))

describe('StorageKeyGenerator', () => {
  it('generates deterministic keys for file metadata', async () => {
    const { StorageKeyGenerator } = await import('./StoreStorage')
    const fileA = {
      name: 'report.pdf',
      size: 1024,
      type: 'application/pdf',
      lastModified: 1700000000000,
      path: '/tmp/report.pdf',
    } as unknown as File

    const fileB = {
      name: 'report.pdf',
      size: 1024,
      type: 'application/pdf',
      lastModified: 1700000000000,
      path: '/tmp/report.pdf',
    } as unknown as File

    const fileC = {
      name: 'report-v2.pdf',
      size: 1024,
      type: 'application/pdf',
      lastModified: 1700000000000,
      path: '/tmp/report-v2.pdf',
    } as unknown as File

    expect(StorageKeyGenerator.fileUniqKey(fileA)).toBe(StorageKeyGenerator.fileUniqKey(fileB))
    expect(StorageKeyGenerator.fileUniqKey(fileA)).not.toBe(StorageKeyGenerator.fileUniqKey(fileC))
  })

  it('generates deterministic keys for links', async () => {
    const { StorageKeyGenerator } = await import('./StoreStorage')
    expect(StorageKeyGenerator.linkUniqKey('https://example.com/a')).toBe(
      StorageKeyGenerator.linkUniqKey('https://example.com/a')
    )
    expect(StorageKeyGenerator.linkUniqKey('https://example.com/a')).not.toBe(
      StorageKeyGenerator.linkUniqKey('https://example.com/b')
    )
  })
})
