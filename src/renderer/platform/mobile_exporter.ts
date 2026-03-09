import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import WebExporter from './web_exporter'

export default class MobileExporter extends WebExporter {
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
}
