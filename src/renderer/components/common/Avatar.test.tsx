import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SystemAvatar } from './Avatar'

describe('SystemAvatar', () => {
  it('does not forward internal or unknown props to Avatar root', () => {
    const onClick = vi.fn()
    const element = SystemAvatar({
      size: 'md',
      sessionType: 'chat',
      onClick,
      'data-testid': 'system-avatar',
    } as never) as ReactElement

    expect(element.props.onClick).toBe(onClick)
    expect(element.props.sessionType).toBeUndefined()
    expect(element.props['data-testid']).toBeUndefined()
  })
})
