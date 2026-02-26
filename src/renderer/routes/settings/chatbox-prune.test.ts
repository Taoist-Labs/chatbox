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

  it('removes chatbox parser enum from shared settings types source', () => {
    const source = readFileSync(new URL('../../../shared/types/settings.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/DocumentParserType = 'none' \| 'local' \| 'chatbox-ai' \| 'mineru'/)
    expect(source).not.toMatch(/z\.enum\(\['none', 'local', 'chatbox-ai', 'mineru'\]\)/)
  })

  it('removes chatbox parser option from knowledge base form source', () => {
    const source = readFileSync(new URL('../../components/knowledge-base/KnowledgeBaseForm.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/Cloud-based document parsing service, supports PDF, Office files, EPUB and many other file types/)
  })

  it('removes chatbox parser label branches from knowledge base ui source', () => {
    const kbSource = readFileSync(new URL('../../components/knowledge-base/KnowledgeBase.tsx', import.meta.url), 'utf8')
    const docsSource = readFileSync(
      new URL('../../components/knowledge-base/KnowledgeBaseDocuments.tsx', import.meta.url),
      'utf8'
    )
    expect(kbSource).not.toMatch(/case 'chatbox-ai':/)
    expect(docsSource).not.toMatch(/case 'chatbox-ai':/)
  })

  it('removes default picture-session intro message source', () => {
    const source = readFileSync(new URL('../../stores/sessionHelpers.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/Image Creator Intro/)
    expect(source).toMatch(/initEmptyPictureSession[\s\S]*messages:\s*\[\]/)
  })

  it('removes fallback default system message injection on new thread source', () => {
    const source = readFileSync(new URL('../../stores/session/threads.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/createMessage\('system', defaults\.getDefaultPrompt\(\)\)/)
  })

  it('removes server-retry parser upsell flow from knowledge base documents source', () => {
    const source = readFileSync(new URL('../../components/knowledge-base/KnowledgeBaseDocuments.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/RemoteRetryModal/)
    expect(source).not.toMatch(/showRemoteRetryModal/)
    expect(source).not.toMatch(/Use server parsing/)
    expect(source).not.toMatch(/PARSER_NO_SUGGESTION_LIST/)
    expect(source).not.toMatch(/parser_type === 'chatbox-ai'/)
  })

  it('removes obsolete remote retry modal file', () => {
    expect(existsSync(new URL('../../components/knowledge-base/RemoteRetryModal.tsx', import.meta.url))).toBe(false)
  })

  it('removes knowledge-base chatbox provider mode controls from form source', () => {
    const source = readFileSync(new URL('../../components/knowledge-base/KnowledgeBaseForm.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/KnowledgeBaseChatboxAIInfo/)
    expect(source).not.toMatch(/KnowledgeBaseProviderModeSelect/)
    expect(source).not.toMatch(/Radio value="chatbox-ai"/)
    expect(source).not.toMatch(/'chatbox-ai' \| 'custom'/)
  })

  it('removes knowledge-base chatbox provider mode branches from page source', () => {
    const source = readFileSync(new URL('../../components/knowledge-base/KnowledgeBase.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/newProviderMode/)
    expect(source).not.toMatch(/chatboxAIModels/)
    expect(source).not.toMatch(/isChatboxAIKnowledgeBase/)
    expect(source).not.toMatch(/providerMode === 'chatbox-ai'/)
    expect(source).not.toMatch(/knowledge_base_models/)
  })

  it('removes chatbox provider mode enum from shared types source', () => {
    const source = readFileSync(new URL('../../../shared/types.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/KnowledgeBaseProviderMode = 'chatbox-ai' \| 'custom'/)
  })

  it('removes chatbox provider mode type union from kb ipc source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/ipc-handlers.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/providerMode\?: 'chatbox-ai' \| 'custom'/)
  })

  it('removes chatbox rerank provider host override source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/model-providers.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/providerId === 'chatbox-ai'/)
    expect(source).not.toMatch(/getChatboxAPIOrigin/)
    expect(source).not.toMatch(/settings\.licenseKey/)
  })

  it('removes remote parsing retry flags from kb retry paths source', () => {
    const interfaceSource = readFileSync(new URL('../../platform/knowledge-base/interface.ts', import.meta.url), 'utf8')
    const controllerSource = readFileSync(
      new URL('../../platform/knowledge-base/desktop-controller.ts', import.meta.url),
      'utf8'
    )
    const ipcSource = readFileSync(new URL('../../../main/knowledge-base/ipc-handlers.ts', import.meta.url), 'utf8')
    const loaderSource = readFileSync(new URL('../../../main/knowledge-base/file-loaders.ts', import.meta.url), 'utf8')

    expect(interfaceSource).not.toMatch(/retryFile\(fileId: number, useRemoteParsing\?: boolean\)/)
    expect(controllerSource).not.toMatch(/useRemoteParsing/)
    expect(ipcSource).not.toMatch(/useRemoteParsing/)
    expect(loaderSource).not.toMatch(/use_remote_parsing/)
  })

  it('removes kb provider mode runtime fields from shared and controller sources', () => {
    const sharedSource = readFileSync(new URL('../../../shared/types.ts', import.meta.url), 'utf8')
    const interfaceSource = readFileSync(new URL('../../platform/knowledge-base/interface.ts', import.meta.url), 'utf8')
    const controllerSource = readFileSync(
      new URL('../../platform/knowledge-base/desktop-controller.ts', import.meta.url),
      'utf8'
    )
    const pageSource = readFileSync(new URL('../../components/knowledge-base/KnowledgeBase.tsx', import.meta.url), 'utf8')

    expect(sharedSource).not.toMatch(/KnowledgeBaseProviderMode/)
    expect(sharedSource).not.toMatch(/providerMode\?:/)
    expect(interfaceSource).not.toMatch(/providerMode\?:/)
    expect(controllerSource).not.toMatch(/providerMode\?:/)
    expect(pageSource).not.toMatch(/providerMode:\s*'custom'/)
  })

  it('removes kb file parsed_remotely runtime fields from shared and ipc sources', () => {
    const sharedSource = readFileSync(new URL('../../../shared/types.ts', import.meta.url), 'utf8')
    const ipcSource = readFileSync(new URL('../../../main/knowledge-base/ipc-handlers.ts', import.meta.url), 'utf8')

    expect(sharedSource).not.toMatch(/parsed_remotely/)
    expect(ipcSource).not.toMatch(/parsed_remotely:/)
  })

  it('removes kb provider_mode runtime reads and writes from ipc source', () => {
    const ipcSource = readFileSync(new URL('../../../main/knowledge-base/ipc-handlers.ts', import.meta.url), 'utf8')
    expect(ipcSource).not.toMatch(/providerMode:/)
    expect(ipcSource).not.toMatch(/provider_mode/)
  })

  it('removes obsolete kb db migrations for remote/provider mode columns', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/db.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/use_remote_parsing/)
    expect(source).not.toMatch(/parsed_remotely/)
    expect(source).not.toMatch(/provider_mode/)
  })

  it('removes pro-only remote link parsing branch from session helper source', () => {
    const source = readFileSync(new URL('../../stores/sessionHelpers.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/settingActions\.isPro/)
    expect(source).not.toMatch(/parseUserLinkPro/)
    expect(source).not.toMatch(/ChatboxAI 方案/)
  })

  it('removes chatbox-specific remote config fields from shared types source', () => {
    const source = readFileSync(new URL('../../../shared/types.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/knowledge_base_models\?:/)
    expect(source).not.toMatch(/export type ChatboxAIModel/)
  })

  it('removes chatbox api error mapping dependency from kb file loader source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/file-loaders.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ChatboxAIAPIError/)
    expect(source).not.toMatch(/codeNameMap/)
  })

  it('removes chatbox-first remote config bootstrap from root route source', () => {
    const source = readFileSync(new URL('../__root.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/getRemoteConfig\('setting_chatboxai_first'\)/)
    expect(source).not.toMatch(/setting_chatboxai_first/)
  })

  it('removes chatbox-first local mode upsell from message loading source', () => {
    const source = readFileSync(new URL('../../components/chat/MessageLoading.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/setting_chatboxai_first/)
    expect(source).not.toMatch(/Chatbox AI Service/)
  })

  it('removes chatbox-first web browsing error branch from session messages source', () => {
    const source = readFileSync(new URL('../../stores/session/messages.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/setting_chatboxai_first/)
  })

  it('removes chatbox-first image error branch from abstract ai sdk source', () => {
    const source = readFileSync(new URL('../../../shared/models/abstract-ai-sdk.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/setting_chatboxai_first/)
  })

  it('removes chatbox-first remote config flag from shared types source', () => {
    const source = readFileSync(new URL('../../../shared/types.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/setting_chatboxai_first:/)
  })

  it('removes chatbox provider default web browsing branch from input box source', () => {
    const source = readFileSync(new URL('../../components/InputBox/InputBox.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/model\?\.provider === ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider default web browsing branch from generation source', () => {
    const source = readFileSync(new URL('../../stores/session/generation.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/return provider === ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider default web browsing branch from session messages source', () => {
    const source = readFileSync(new URL('../../stores/session/messages.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/return provider === ModelProviderEnum\.ChatboxAI/)
  })
})
