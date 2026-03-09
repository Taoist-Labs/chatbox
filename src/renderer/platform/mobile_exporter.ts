import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import * as base64 from '@/packages/base64'
import WebExporter from './web_exporter'

export default class MobileExporter extends WebExporter {
  private async shareSavedFile(path: string, filename: string) {
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    })

    await Share.share({
      title: filename,
      text: filename,
      url: uri,
      dialogTitle: 'Share File',
    })
  }

  async exportTextFile(filename: string, content: string) {
    if (!Capacitor.isNativePlatform()) {
      return super.exportTextFile(filename, content)
    }

    const path = `exports/${filename}`
    await Filesystem.writeFile({
      path,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    })

    await this.shareSavedFile(path, filename)
  }

  async exportImageFile(basename: string, base64Data: string) {
    if (!Capacitor.isNativePlatform()) {
      return super.exportImageFile(basename, base64Data)
    }

    let { type, data } = base64.parseImage(base64Data)
    if (!type) {
      type = 'image/png'
      data = base64Data
    }
    const ext = (type.split('/')[1] || 'png').split('+')[0]
    const filename = `${basename}.${ext}`
    const path = `exports/${filename}`

    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Cache,
      recursive: true,
    })

    await this.shareSavedFile(path, filename)
  }

  async exportByUrl(filename: string, url: string) {
    if (!Capacitor.isNativePlatform()) {
      return super.exportByUrl(filename, url)
    }

    await Share.share({
      title: filename,
      text: filename,
      url,
      dialogTitle: 'Share File',
    })
  }
}
