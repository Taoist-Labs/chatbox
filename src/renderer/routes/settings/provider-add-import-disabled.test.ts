import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('provider add/import disabled', () => {
  it('removes add/import entry points from provider settings route source', () => {
    const source = readFileSync(new URL('./provider/route.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/useProviderImport/)
    expect(source).not.toMatch(/AddProviderModal/)
    expect(source).not.toMatch(/ImportProviderModal/)
    expect(source).not.toMatch(/searchParams\.import/)
    expect(source).not.toMatch(/searchParams\.custom/)
    expect(source).not.toMatch(/handleClipboardImport/)
  })

  it('removes add/import controls from provider list source', () => {
    const source = readFileSync(new URL('../../components/settings/provider/ProviderList.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/onAddProvider/)
    expect(source).not.toMatch(/onImportProvider/)
    expect(source).not.toMatch(/isImporting/)
    expect(source).not.toMatch(/IconPlus/)
    expect(source).not.toMatch(/IconFileImport/)
    expect(source).not.toMatch(/Import from clipboard/)
  })

  it('removes provider import deeplink handling from main deeplinks source', () => {
    const source = readFileSync(new URL('../../../main/deeplinks.ts', import.meta.url), 'utf8')

    expect(source).not.toMatch(/provider\/import/)
    expect(source).not.toMatch(/\/settings\/provider\?import=/)
  })
})
