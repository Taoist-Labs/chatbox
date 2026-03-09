import type { PlatformType } from './interfaces'
import MobileExporter from './mobile_exporter'
import WebPlatform from './web_platform'

export default class MobilePlatform extends WebPlatform {
  public type: PlatformType = 'mobile'
  public exporter = new MobileExporter()
}
