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

  it('removes dedicated chatbox settings route file', () => {
    expect(existsSync(new URL('./chatbox-ai.tsx', import.meta.url))).toBe(false)
  })

  it('removes provider-level chatbox settings route file', () => {
    expect(existsSync(new URL('./provider/chatbox-ai/index.tsx', import.meta.url))).toBe(false)
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
    expect(source).not.toMatch(/RemoteAPIError/)
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

  it('removes chatbox-only stream output visibility branch from session settings source', () => {
    const source = readFileSync(new URL('../../modals/SessionSettings.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/settings\?\.provider !== ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider icon branch from provider icon source', () => {
    const source = readFileSync(new URL('../../components/icons/ProviderIcon.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/provider === ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox-ai openai-compatibility special branch from llm utils source', () => {
    const source = readFileSync(new URL('../../../shared/utils/llm_utils.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/providerId === 'chatbox-ai'/)
  })

  it('removes chatbox-ai parser normalization from settings schema source', () => {
    const source = readFileSync(new URL('../../../shared/types/settings.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/value === 'chatbox-ai' \? 'local' : value/)
  })

  it('removes chatbox provider enum entries from shared provider types source', () => {
    const source = readFileSync(new URL('../../../shared/types/provider.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ChatboxAI = 'chatbox-ai'/)
  })

  it('removes chatbox provider name mapping from shared models source', () => {
    const source = readFileSync(new URL('../../../shared/models/index.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider enum usage from migration source', () => {
    const source = readFileSync(new URL('../../stores/migration.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox provider enum usage from initial data source', () => {
    const source = readFileSync(new URL('../../packages/initial_data.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('removes obsolete chatbox provider definition file', () => {
    expect(existsSync(new URL('../../../shared/providers/definitions/chatboxai.ts', import.meta.url))).toBe(false)
  })

  it('removes chatbox aiProvider literals from initial data source', () => {
    const source = readFileSync(new URL('../../packages/initial_data.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/aiProvider:\s*'chatbox-ai'/)
  })

  it('removes chatbox-specific auth store persistence key source', () => {
    const source = readFileSync(new URL('../../stores/authInfoStore.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/name:\s*'chatbox-ai-auth-info'/)
  })

  it('removes chatbox auth callback deep link route residue from main deeplinks source', () => {
    const source = readFileSync(new URL('../../../main/deeplinks.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\/settings\/provider\/chatbox-ai\?ticket_id=\$\{ticketId\}&status=\$\{status\}/)
  })

  it('removes chatbox ai model key migration residue from migration source', () => {
    const source = readFileSync(new URL('../../stores/migration.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxAIModel/)
  })

  it('removes chatbox provider token config residue comments source', () => {
    const source = readFileSync(new URL('../../packages/token_config.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ModelProviderEnum\.ChatboxAI/)
  })

  it('removes chatbox ai service faqs link from about source', () => {
    const source = readFileSync(new URL('../about.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatbox-ai-service-faqs/)
  })

  it('removes chatbox official domain and support email links from about source', () => {
    const source = readFileSync(new URL('../about.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app/)
    expect(source).not.toMatch(/hi@chatboxai\.com/)
  })

  it('removes chatbox domain updater feed urls from main app-updater source', () => {
    const source = readFileSync(new URL('../../../main/app-updater.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app\/api\/auto_upgrade/)
  })

  it('removes chatbox domain help links from main menu source', () => {
    const source = readFileSync(new URL('../../../main/menu.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/shell\.openExternal\('https:\/\/chatboxai\.app'\)/)
  })

  it('removes chatbox domain defaults from remote api source', () => {
    const source = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app/)
  })

  it('removes chatbox domain defaults from shared api pool source', () => {
    const source = readFileSync(new URL('../../../shared/request/remote_api_pool.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app/)
  })

  it('removes chatbox api error class usage from shared request source', () => {
    const source = readFileSync(new URL('../../../shared/request/request.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ChatboxAIAPIError/)
  })

  it('removes chatbox api error class declaration from shared errors source', () => {
    const source = readFileSync(new URL('../../../shared/models/errors.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/class ChatboxAIAPIError/)
    expect(source).not.toMatch(/interface ChatboxAIAPIErrorDetail/)
  })

  it('removes chatbox-named remote error parse option from request and adapter sources', () => {
    const requestSource = readFileSync(new URL('../../../shared/request/request.ts', import.meta.url), 'utf8')
    const adapterTypesSource = readFileSync(new URL('../../../shared/types/adapters.ts', import.meta.url), 'utf8')
    expect(requestSource).not.toMatch(/parseChatboxRemoteError/)
    expect(adapterTypesSource).not.toMatch(/parseChatboxRemoteError/)
  })

  it('removes chatbox-named api pool helpers from request and remote sources', () => {
    const poolSource = readFileSync(new URL('../../../shared/request/remote_api_pool.ts', import.meta.url), 'utf8')
    const requestSource = readFileSync(new URL('../../../shared/request/request.ts', import.meta.url), 'utf8')
    const remoteSource = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(poolSource).not.toMatch(/isChatboxAPI/)
    expect(poolSource).not.toMatch(/getChatboxAPIOrigin/)
    expect(requestSource).not.toMatch(/isChatboxAPI/)
    expect(remoteSource).not.toMatch(/getChatboxAPIOrigin/)
  })

  it('removes chatbox-named shared request pool file', () => {
    expect(existsSync(new URL('../../../shared/request/chatboxai_pool.ts', import.meta.url))).toBe(false)
  })

  it('removes chatbox-named shared request pool import paths', () => {
    const requestSource = readFileSync(new URL('../../../shared/request/request.ts', import.meta.url), 'utf8')
    const remoteSource = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(requestSource).not.toMatch(/chatboxai_pool/)
    expect(remoteSource).not.toMatch(/chatboxai_pool/)
  })

  it('removes orphaned chatbox-specific provider model file', () => {
    expect(existsSync(new URL('../../../shared/providers/definitions/models/chatboxai.ts', import.meta.url))).toBe(false)
  })

  it('removes chatbox license detail type naming from shared settings source', () => {
    const source = readFileSync(new URL('../../../shared/types/settings.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/ChatboxAILicenseDetailSchema/)
    expect(source).not.toMatch(/export type ChatboxAILicenseDetail/)
  })

  it('removes chatbox license detail type usage from remote api source', () => {
    const source = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/type ChatboxAILicenseDetail/)
    expect(source).not.toMatch(/ChatboxAILicenseDetail \| null/)
  })

  it('removes chatbox-named helper identifiers from remote api source', () => {
    const source = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\bchatboxaiAPI\b/)
    expect(source).not.toMatch(/\bgetChatboxOrigin\b/)
    expect(source).not.toMatch(/\bgetChatboxHeaders\b/)
  })

  it('removes chatbox-named web env switches from renderer variables and remote source', () => {
    const variablesSource = readFileSync(new URL('../../variables.ts', import.meta.url), 'utf8')
    const remoteSource = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    expect(variablesSource).not.toMatch(/\bUSE_LOCAL_CHATBOX\b/)
    expect(variablesSource).not.toMatch(/\bUSE_BETA_CHATBOX\b/)
    expect(remoteSource).not.toMatch(/\bUSE_LOCAL_CHATBOX\b/)
    expect(remoteSource).not.toMatch(/\bUSE_BETA_CHATBOX\b/)
  })

  it('removes chatbox-named build constants from renderer source usage', () => {
    const variablesSource = readFileSync(new URL('../../variables.ts', import.meta.url), 'utf8')
    expect(variablesSource).not.toMatch(/export const CHATBOX_BUILD_TARGET\b/)
    expect(variablesSource).not.toMatch(/export const CHATBOX_BUILD_PLATFORM\b/)

    const sources = [
      readFileSync(new URL('../../index.tsx', import.meta.url), 'utf8'),
      readFileSync(new URL('../../Sidebar.tsx', import.meta.url), 'utf8'),
      readFileSync(new URL('../../hooks/useVersion.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../packages/apple_app_store.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../platform/index.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../setup/protect.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../setup/load_polyfill.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../setup/sentry_init.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../components/session/ThreadHistoryDrawer.tsx', import.meta.url), 'utf8'),
    ]

    for (const source of sources) {
      expect(source).not.toMatch(/\bCHATBOX_BUILD_TARGET\b/)
      expect(source).not.toMatch(/\bCHATBOX_BUILD_PLATFORM\b/)
    }
  })

  it('removes chatboxAI-named local identifiers from renderer and defaults source', () => {
    const errorTipsSource = readFileSync(new URL('../../routes/image-creator/-components/ImageGenerationErrorTips.tsx', import.meta.url), 'utf8')
    const defaultsSource = readFileSync(new URL('../../../shared/defaults.ts', import.meta.url), 'utf8')
    expect(errorTipsSource).not.toMatch(/\bchatboxAIErrorDetail\b/)
    expect(defaultsSource).not.toMatch(/\bchatboxAIModel\b/)
  })

  it('removes chatboxAI-named session attachment uuid fields from shared session schema', () => {
    const source = readFileSync(new URL('../../../shared/types/session.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\bchatboxAIFileUUID\b/)
    expect(source).not.toMatch(/\bchatboxAILinkUUID\b/)
  })

  it('removes chatbox-named temp image filename prefix from main adapters source', () => {
    const source = readFileSync(new URL('../../../main/adapters/index.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/`chatbox_\$\{folder\}_/)
  })

  it('removes chatbox-named primary kb db filename from main knowledge-base source', () => {
    const source = readFileSync(new URL('../../../main/knowledge-base/db.ts', import.meta.url), 'utf8')
    expect(source).toMatch(/knowledge_base\.db/)
    expect(source).not.toMatch(/const dbPath = .*chatbox_kb\.db/)
  })

  it('removes chatbox-named primary blob directory from main store source', () => {
    const source = readFileSync(new URL('../../../main/store-node.ts', import.meta.url), 'utf8')
    expect(source).toMatch(/store-blobs/)
    expect(source).not.toMatch(/const filename = path\.resolve\(app\.getPath\('userData'\), 'chatbox-blobs', sanitizeFilename\(key\)\)/)
  })

  it('removes legacy release-origin comments and chatbox-ai api wording from sources', () => {
    const remoteSource = readFileSync(new URL('../../packages/remote.ts', import.meta.url), 'utf8')
    const imageGenerationSource = readFileSync(new URL('../../../shared/types/image-generation.ts', import.meta.url), 'utf8')
    expect(remoteSource).not.toMatch(/\bRELEASE_ORIGIN\b/)
    expect(imageGenerationSource).not.toMatch(/ChatboxAI API error code/)
  })

  it('removes chatbox-domain comment residue from internal config and protect sources', () => {
    const variablesSource = readFileSync(new URL('../../variables.ts', import.meta.url), 'utf8')
    const protectSource = readFileSync(new URL('../../setup/protect.ts', import.meta.url), 'utf8')
    const defaultsSource = readFileSync(new URL('../../../shared/defaults.ts', import.meta.url), 'utf8')
    expect(variablesSource).not.toMatch(/api\.chatboxai\.app/)
    expect(protectSource).not.toMatch(/chatboxai\.app/)
    expect(defaultsSource).not.toMatch(/chatboxai-3\.5/)
  })

  it('removes chatbox domain and branding residue from format-chat export source', () => {
    const source = readFileSync(new URL('../../lib/format-chat.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app/)
    expect(source).not.toMatch(/Chatbox AI/)
  })

  it('removes chatbox-branded openrouter metadata headers from model providers', () => {
    const openRouterSource = readFileSync(
      new URL('../../../shared/providers/definitions/models/openrouter.ts', import.meta.url),
      'utf8'
    )
    const openAISource = readFileSync(new URL('../../../shared/providers/definitions/models/openai.ts', import.meta.url), 'utf8')
    const openAIResponsesSource = readFileSync(
      new URL('../../../shared/providers/definitions/models/openai-responses.ts', import.meta.url),
      'utf8'
    )
    const customOpenAISource = readFileSync(
      new URL('../../../shared/providers/definitions/models/custom-openai.ts', import.meta.url),
      'utf8'
    )
    const customOpenAIResponsesSource = readFileSync(
      new URL('../../../shared/providers/definitions/models/custom-openai-responses.ts', import.meta.url),
      'utf8'
    )

    expect(openRouterSource).not.toMatch(/https:\/\/chatboxai\.app/)
    expect(openRouterSource).not.toMatch(/'X-Title':\s*'Chatbox AI'/)

    expect(openAISource).not.toMatch(/https:\/\/chatboxai\.app/)
    expect(openAISource).not.toMatch(/'X-Title':\s*'Chatbox AI'/)

    expect(openAIResponsesSource).not.toMatch(/https:\/\/chatboxai\.app/)
    expect(openAIResponsesSource).not.toMatch(/'X-Title':\s*'Chatbox AI'/)

    expect(customOpenAISource).not.toMatch(/https:\/\/chatboxai\.app/)
    expect(customOpenAISource).not.toMatch(/'X-Title':\s*'Chatbox AI'/)

    expect(customOpenAIResponsesSource).not.toMatch(/https:\/\/chatboxai\.app/)
    expect(customOpenAIResponsesSource).not.toMatch(/'X-Title':\s*'Chatbox AI'/)
  })

  it('removes chatbox-specific image generation upgrade links from error tips source', () => {
    const source = readFileSync(new URL('../image-creator/-components/ImageGenerationErrorTips.tsx', import.meta.url), 'utf8')
    expect(source).not.toMatch(/chatboxai\.app/)
    expect(source).not.toMatch(/view_more_plans/)
    expect(source).not.toMatch(/click_view_more_plans_button_from_image_creator/)
  })

  it('removes chatbox analytics domain residue from renderer index templates', () => {
    const desktopSource = readFileSync(new URL('../../index.ejs', import.meta.url), 'utf8')
    const desktopDevSource = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
    const webSource = readFileSync(new URL('../../index.web.ejs', import.meta.url), 'utf8')

    expect(desktopSource).not.toMatch(/app\.chatboxai\.app/)
    expect(desktopSource).not.toMatch(/plausible\.midway\.run/)

    expect(desktopDevSource).not.toMatch(/app\.chatboxai\.app/)
    expect(desktopDevSource).not.toMatch(/plausible\.midway\.run/)

    expect(webSource).not.toMatch(/web\.chatboxai\.app/)
    expect(webSource).not.toMatch(/plausible\.midway\.run/)
  })
})
