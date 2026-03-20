import { autoUpdater } from 'electron-updater'
import { getSettings } from './store-node'
import { getLogger } from './util'

const log = getLogger('app-updater')

export class AppUpdater {
  constructor(onUpdateDownloaded: () => void) {
    log.transports.file.level = 'info'
    autoUpdater.logger = log

    autoUpdater.once('update-downloaded', (event) => {
      // Notify renderer process about the update
      onUpdateDownloaded()
    })
    const settings = getSettings()
    if (settings.autoUpdate) {
      log.info('Auto update check is pruned in this build')
    }
  }

  async tryUpdate() {
    log.info('Skip update check because remote updater is pruned')
    return null
  }
}
