import { describe, expect, it } from 'vitest'
import ar from './ar/translation.json'
import de from './de/translation.json'
import en from './en/translation.json'
import es from './es/translation.json'
import fr from './fr/translation.json'
import itIT from './it-IT/translation.json'
import ja from './ja/translation.json'
import ko from './ko/translation.json'
import nbNO from './nb-NO/translation.json'
import ptPT from './pt-PT/translation.json'
import ru from './ru/translation.json'
import sv from './sv/translation.json'
import zhHans from './zh-Hans/translation.json'
import zhHant from './zh-Hant/translation.json'

const REQUIRED_KEYS = ['jimeng_i2i_upload_tip'] as const

const locales: Record<string, Record<string, string>> = {
  ar,
  de,
  en,
  es,
  fr,
  'it-IT': itIT,
  ja,
  ko,
  'nb-NO': nbNO,
  'pt-PT': ptPT,
  ru,
  sv,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
}

describe('image creator multilingual translations', () => {
  it('contains translations for all required locales', () => {
    for (const [locale, translations] of Object.entries(locales)) {
      for (const key of REQUIRED_KEYS) {
        const value = translations[key]
        expect(value, `[${locale}] missing key: ${key}`).toBeTypeOf('string')
        expect(value, `[${locale}] empty value for key: ${key}`).not.toBe('')
      }
    }
  })
})
