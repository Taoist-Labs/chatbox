import { describe, expect, it } from 'vitest'
import { formatDisplayVersion } from './app-version'

describe('formatDisplayVersion', () => {
  it('prefixes numeric versions with uppercase V', () => {
    expect(formatDisplayVersion('1.0')).toBe('V1.0')
  })

  it('normalizes lowercase v prefix to uppercase V', () => {
    expect(formatDisplayVersion('v1.0')).toBe('V1.0')
  })

  it('keeps uppercase V prefix unchanged', () => {
    expect(formatDisplayVersion('V1.0')).toBe('V1.0')
  })

  it('hides a trailing zero patch version for display', () => {
    expect(formatDisplayVersion('1.0.0')).toBe('V1.0')
  })

  it('hides non-numeric placeholder versions', () => {
    expect(formatDisplayVersion('web')).toBe('')
  })
})
