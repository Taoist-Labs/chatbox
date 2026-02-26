import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('chatbox deep prune', () => {
  it('removes chatbox settings routes from modal router source', () => {
    const source = readFileSync(new URL('../../modals/Settings.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/SettingsChatboxAiRouteComponent/)
    expect(source).not.toMatch(/SettingsProviderChatboxAiRouteComponent/)
    expect(source).not.toMatch(/path:\s*'\/settings\/chatbox-ai'/)
    expect(source).not.toMatch(/path:\s*'\/chatbox-ai'/)
  })

  it('removes chatbox provider special-case link path in provider list source', () => {
    const source = readFileSync(new URL('../../components/settings/provider/ProviderList.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/provider\.id === ModelProviderEnum\.ChatboxAI/)
    expect(source).not.toMatch(/\/settings\/provider\/chatbox-ai/)
  })

  it('removes chatbox models hook dependency from useProviders source', () => {
    const source = readFileSync(new URL('../../hooks/useProviders.ts', import.meta.url), 'utf8')

    expect(source).not.toMatch(/useChatboxAIModels/)
    expect(source).not.toMatch(/chatboxAIModels/)
  })

  it('uses wanjie as display-name fallback provider source', () => {
    const source = readFileSync(new URL('../../packages/model-setting-utils/index.ts', import.meta.url), 'utf8')

    expect(source).toMatch(/settings\.provider \?\? ModelProviderEnum\.Wanjie/)
    expect(source).not.toMatch(/settings\.provider \?\? ModelProviderEnum\.ChatboxAI/)
  })

  it('replaces dedicated chatbox settings route with redirect source', () => {
    const source = readFileSync(new URL('./chatbox-ai.tsx', import.meta.url), 'utf8')

    expect(source).toMatch(/navigate\(\{\s*to:\s*'\/settings\/provider\/wanjie'/)
    expect(source).not.toMatch(/useChatboxAIModels/)
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('replaces provider-level chatbox settings route with redirect source', () => {
    const source = readFileSync(new URL('./provider/chatbox-ai/index.tsx', import.meta.url), 'utf8')

    expect(source).toMatch(/navigate\(\{\s*to:\s*'\/settings\/provider\/wanjie'/)
    expect(source).not.toMatch(/useChatboxAIModels/)
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider as image creator default source', () => {
    const source = readFileSync(new URL('../image-creator/index.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/useState<string>\(ModelProviderEnum\.ChatboxAI\)/)
    expect(source).not.toMatch(/label:\s*'Chatbox AI'/)
    expect(source).not.toMatch(/providerId:\s*ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox group from image model selector source', () => {
    const source = readFileSync(new URL('../../components/ImageModelSelect.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/CHATBOXAI_IMAGE_MODEL_IDS/)
    expect(source).not.toMatch(/label="Chatbox AI"/)
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('uses wanjie as migration fallback provider source', () => {
    const source = readFileSync(new URL('../../stores/migration.ts', import.meta.url), 'utf8')

    expect(source).toMatch(/\?\s*oldSettings\.aiProvider\s*:\s*ModelProviderEnum\.Wanjie/)
    expect(source).toMatch(/provider:\s*session\.settings\?\.provider \|\| ModelProviderEnum\.Wanjie/)
  })

  it('removes chatbox ocr fallback model source', () => {
    const source = readFileSync(new URL('../../packages/model-calls/stream-text.ts', import.meta.url), 'utf8')

    expect(source).not.toMatch(/chatbox-ocr-1/)
    expect(source).not.toMatch(/Fallback to Chatbox AI built-in OCR model/)
  })

  it('removes obsolete chatbox settings component directory', () => {
    expect(existsSync(new URL('./provider/chatbox-ai/-components', import.meta.url))).toBe(false)
  })

  it('removes obsolete chatbox models hook file', () => {
    expect(existsSync(new URL('../../hooks/useChatboxAIModels.ts', import.meta.url))).toBe(false)
  })

  it('removes auth store type dependency on chatbox settings route', () => {
    const source = readFileSync(new URL('../../stores/authInfoStore.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/routes\/settings\/provider\/chatbox-ai\/-components\/types/)
  })

  it('removes chatbox parser option from document parser settings source', () => {
    const source = readFileSync(new URL('../../components/settings/DocumentParserSettings.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/value:\s*'chatbox-ai'/)
    expect(source).not.toMatch(/'chatbox-ai':/)
  })

  it('removes chatbox parser implementation from knowledge-base router source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/parsers/index.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ChatboxParser/)
    expect(source).not.toMatch(/case 'chatbox-ai':/)
  })

  it('removes chatbox parser branches from session helper source', () => {
    const source = readFileSync(new URL('../../stores/sessionHelpers.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/parseFileWithChatboxAI/)
    expect(source).not.toMatch(/case 'chatbox-ai':/)
  })

  it('removes chatbox parser branches from kb file loader source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/file-loaders.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/type === 'chatbox-ai'/)
    expect(source).not.toMatch(/\{\s*type:\s*'chatbox-ai'\s*\}/)
  })

  it('removes obsolete chatbox parser files', () => {
    expect(existsSync(new URL('../../../main/knowledge-base/parsers/chatbox-parser.ts', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../../../main/knowledge-base/remote-file-parser.ts', import.meta.url))).toBe(false)
  })
})
