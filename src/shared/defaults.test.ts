import { describe, expect, it } from 'vitest'
import { settings } from './defaults'

describe('shared defaults', () => {
  it('uses empty default prompt for new sessions', () => {
    expect(settings().defaultPrompt).toBe('')
  })
})
