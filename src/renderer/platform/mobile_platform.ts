import type { PlatformType } from './interfaces'
import WebPlatform from './web_platform'

export default class MobilePlatform extends WebPlatform {
  public type: PlatformType = 'mobile'
}
