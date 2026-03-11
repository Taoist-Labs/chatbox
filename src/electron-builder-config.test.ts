import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('electron builder config', () => {
  it('uses Wamo Chat as the packaged macOS app name', () => {
    const source = readFileSync(join(process.cwd(), 'electron-builder.yml'), 'utf8')
    expect(source).toMatch(/^productName:\s*Wamo Chat$/m)
  })

  it('stores 1.0 as a quoted macOS short version string', () => {
    const source = readFileSync(join(process.cwd(), 'electron-builder.yml'), 'utf8')
    expect(source).toMatch(/bundleShortVersion:\s*["']1\.0["']/)
  })

  it('builds the macOS icon from the Wamo PNG asset', () => {
    const source = readFileSync(join(process.cwd(), 'electron-builder.yml'), 'utf8')
    expect(source).toMatch(/\n  icon:\s*assets\/icon-1024\.png\n/)
  })
})
