const { spawn } = require('node:child_process')
const path = require('node:path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const electronVitePkg = require.resolve('electron-vite/package.json')
const electronViteCli = path.join(path.dirname(electronVitePkg), 'bin', 'electron-vite.js')
const child = spawn(process.execPath, [electronViteCli, 'dev'], {
  env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (typeof code === 'number') {
    process.exit(code)
  }
  if (signal) {
    process.kill(process.pid, signal)
  }
  process.exit(1)
})
