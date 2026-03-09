import { beforeEach, describe, expect, it, vi } from 'vitest'

const isNativePlatformMock = vi.fn()
const writeFileMock = vi.fn()
const getUriMock = vi.fn()
const shareMock = vi.fn()

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock,
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: {
    Cache: 'CACHE',
  },
  Encoding: {
    UTF8: 'utf8',
  },
  Filesystem: {
    writeFile: writeFileMock,
    getUri: getUriMock,
  },
}))

vi.mock('@capacitor/share', () => ({
  Share: {
    share: shareMock,
  },
}))

describe('MobileExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNativePlatformMock.mockReturnValue(true)
    writeFileMock.mockResolvedValue(undefined)
    getUriMock.mockResolvedValue({ uri: 'file:///cache/exports/data.json' })
    shareMock.mockResolvedValue(undefined)
  })

  it('uses Filesystem and Share for native text export', async () => {
    const { default: MobileExporter } = await import('./mobile_exporter')
    const exporter = new MobileExporter()

    await exporter.exportTextFile('data.json', '{"hello":"world"}')

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'exports/data.json',
        data: '{"hello":"world"}',
      })
    )
    expect(getUriMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'exports/data.json',
      })
    )
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///cache/exports/data.json',
      })
    )
  })

  it('uses Filesystem and Share for native image export', async () => {
    getUriMock.mockResolvedValueOnce({ uri: 'file:///cache/exports/cat.png' })

    const { default: MobileExporter } = await import('./mobile_exporter')
    const exporter = new MobileExporter()

    await exporter.exportImageFile('cat', 'data:image/png;base64,aGVsbG8=')

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'exports/cat.png',
        data: 'aGVsbG8=',
      })
    )
    expect(getUriMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'exports/cat.png',
      })
    )
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///cache/exports/cat.png',
      })
    )
  })

  it('shares url directly for native exportByUrl', async () => {
    const { default: MobileExporter } = await import('./mobile_exporter')
    const exporter = new MobileExporter()

    await exporter.exportByUrl('cat', 'https://example.com/cat.png')

    expect(writeFileMock).not.toHaveBeenCalled()
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'cat',
        url: 'https://example.com/cat.png',
      })
    )
  })
})
