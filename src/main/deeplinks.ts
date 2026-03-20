import type { BrowserWindow } from 'electron'

export function handleDeepLink(mainWindow: BrowserWindow, link: string) {
  const normalizedLink = link.replace(/^aiclient-dev:\/\//, 'aiclient://')
  const url = new URL(normalizedLink)

  console.log('🔗 Parsed URL:', { hostname: url.hostname, pathname: url.pathname, params: url.searchParams.toString() })

  // handle `aiclient://mcp/install?server=`
  if (url.hostname === 'mcp' && url.pathname === '/install') {
    const encodedConfig = url.searchParams.get('server') || ''
    mainWindow.webContents.send('navigate-to', `/settings/mcp?install=${encodeURIComponent(encodedConfig)}`)
  }
}
