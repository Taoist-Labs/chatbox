import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const iosInfoPlistPath = join(process.cwd(), 'ios/App/App/Info.plist')

function readIosInfoPlist(): string {
  return readFileSync(iosInfoPlistPath, 'utf8')
}

describe('ios privacy config', () => {
  const runIfIosProjectExists = existsSync(iosInfoPlistPath) ? it : it.skip

  runIfIosProjectExists('declares camera and photo library usage descriptions for image attachments', () => {
    const source = readIosInfoPlist()

    expect(source).toMatch(/<key>NSCameraUsageDescription<\/key>\s*<string>[^<]+<\/string>/)
    expect(source).toMatch(/<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>[^<]+<\/string>/)
  })
})
