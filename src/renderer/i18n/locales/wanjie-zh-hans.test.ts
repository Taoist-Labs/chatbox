import { describe, expect, it } from 'vitest'
import zhHansTranslations from './zh-Hans/translation.json'

describe('wanjie zh-Hans translations', () => {
  it('contains localized text for the login flow panel and form', () => {
    const expectedTranslations: Record<string, string> = {
      'Wanjie Login Flow': 'Wanjie 登录流程',
      'Use phone + SMS code to login, then the app will automatically pull API Key and authorized model list.':
        '使用手机号 + 短信验证码登录，应用会自动拉取 API Key 和已授权模型列表。',
      'Phone Number': '手机号',
      'Send SMS Code': '发送短信验证码',
      'Verification Code': '短信验证码',
      'smsId has been captured automatically from the SMS request.': '已自动从短信请求中捕获 smsId。',
      'Please click "Send SMS Code" first to obtain smsId automatically.':
        '请先点击“发送短信验证码”以自动获取 smsId。',
      'Login and Configure': '登录并配置',
      'Refresh Configuration': '刷新配置',
    }

    for (const [key, value] of Object.entries(expectedTranslations)) {
      expect(zhHansTranslations[key as keyof typeof zhHansTranslations]).toBe(value)
    }
  })
})
