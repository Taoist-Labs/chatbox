import { readFileSync } from 'node:fs'
import { act, create } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteComponent } from './index'

const mockNavigate = vi.fn()
const mockUseIsSmallScreen = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/hooks/useScreenChange', () => ({
  useIsSmallScreen: () => mockUseIsSmallScreen(),
}))

describe('settings navigation defaults', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseIsSmallScreen.mockReset()
  })

  it('redirects desktop settings index to wanjie provider settings', () => {
    mockUseIsSmallScreen.mockReturnValue(false)

    act(() => {
      create(<RouteComponent />)
    })

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/settings/provider/wanjie', replace: true })
  })

  it('does not redirect on mobile settings index', () => {
    mockUseIsSmallScreen.mockReturnValue(true)

    act(() => {
      create(<RouteComponent />)
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not contain chatbox-ai item in settings sidebar source', () => {
    const source = readFileSync(new URL('./route.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/key:\s*'chatbox-ai'/)
  })
})
