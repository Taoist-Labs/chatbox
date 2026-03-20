import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('android versionName config', () => {
  it('uses V1.0 for android package metadata', () => {
    const source = readFileSync(join(process.cwd(), 'android/app/build.gradle'), 'utf8')
    expect(source).toMatch(/versionName\s+"V1\.0"/)
  })
})
