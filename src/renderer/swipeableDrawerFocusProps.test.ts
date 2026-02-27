import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function assertDisableEnforceFocusPassedViaModalProps(source: string) {
  expect(source).not.toMatch(/disableEnforceFocus=\{true\}/)
  expect(source).toMatch(/ModalProps=\{\{[\s\S]*disableEnforceFocus:\s*true[\s\S]*\}\}/)
}

describe('SwipeableDrawer focus props', () => {
  it('keeps sidebar drawer disableEnforceFocus inside ModalProps', () => {
    const source = readFileSync(join(process.cwd(), 'src/renderer/Sidebar.tsx'), 'utf8')
    assertDisableEnforceFocusPassedViaModalProps(source)
  })

  it('keeps thread-history drawer disableEnforceFocus inside ModalProps', () => {
    const source = readFileSync(join(process.cwd(), 'src/renderer/components/session/ThreadHistoryDrawer.tsx'), 'utf8')
    assertDisableEnforceFocusPassedViaModalProps(source)
  })
})
