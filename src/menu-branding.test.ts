import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readMenuSource(): string {
  return readFileSync(join(process.cwd(), 'src/main/menu.ts'), 'utf8')
}

describe('desktop help menu branding', () => {
  it('uses Wamo review links instead of upstream GitHub links', () => {
    const source = readMenuSource()

    expect(source).toContain("label: '官方网站'")
    expect(source).toContain("label: '反馈问题'")
    expect(source).toContain("const WAMO_WEBSITE_URL = 'https://wamo.caboroca.xyz/'")
    expect(source).not.toContain('github.com/chatboxai/chatbox')
    expect(source).not.toContain("label: 'Github Repo'")
  })
})
