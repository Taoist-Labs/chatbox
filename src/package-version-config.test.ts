import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type PackageMetadata = {
  productName?: string
  version: string
}

const strictSemverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

function readPackageJson(path: string): PackageMetadata {
  return JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')) as PackageMetadata
}

describe('desktop package metadata', () => {
  it('uses Wamo Chat as the packaged product name', () => {
    const rootPackage = readPackageJson('package.json')
    const releasePackage = readPackageJson('release/app/package.json')

    expect(rootPackage.productName).toBe('Wamo Chat')
    expect(releasePackage.productName).toBe('Wamo Chat')
  })

  it('uses a strict semver version in root package.json for electron-builder', () => {
    const rootPackage = readPackageJson('package.json')
    expect(rootPackage.version).toMatch(strictSemverPattern)
  })

  it('keeps root and release app versions in sync', () => {
    const rootPackage = readPackageJson('package.json')
    const releasePackage = readPackageJson('release/app/package.json')
    expect(rootPackage.version).toBe(releasePackage.version)
  })

  it('stores 1.0.0 internally so packaging remains valid', () => {
    const rootPackage = readPackageJson('package.json')
    expect(rootPackage.version).toBe('1.0.0')
  })
})
