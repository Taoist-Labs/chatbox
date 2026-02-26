import { isTextFilePath } from '../../../shared/file-extensions'
import type { DocumentParserConfig, DocumentParserType } from '../../../shared/types/settings'
import { getLogger } from '../../util'
import { LocalParser } from './local-parser'
import { MineruParser } from './mineru-parser'
import type { DocumentParser, ParserFileMeta, ParserResult } from './types'

const log = getLogger('knowledge-base:parser-router')

export { MineruParser, testMineruConnection } from './mineru-parser'
export * from './types'

function normalizeParserConfig(config: DocumentParserConfig): DocumentParserConfig {
  if (config.type === 'none' || config.type === 'local' || config.type === 'mineru') {
    return config
  }

  log.warn(`Unknown parser type: ${config.type}, falling back to local parser`)
  return { ...config, type: 'local' }
}

/**
 * Create a parser instance based on configuration
 * @param config - Parser configuration
 * @param kbId - Knowledge base ID (required for local parser's vision model)
 */
export function createParser(config: DocumentParserConfig, kbId?: number): DocumentParser {
  const normalizedConfig = normalizeParserConfig(config)

  switch (normalizedConfig.type) {
    case 'none':
    case 'local':
      return new LocalParser(kbId)
    case 'mineru':
      if (!normalizedConfig.mineru?.apiToken) {
        throw new Error('MinerU API token is required')
      }
      return new MineruParser(normalizedConfig.mineru.apiToken)
    default:
      return new LocalParser(kbId)
  }
}

/**
 * Get effective parser configuration
 * Priority: KB config > Global config > Default (local)
 */
export function getEffectiveParserConfig(
  kbConfig?: DocumentParserConfig | null,
  globalConfig?: DocumentParserConfig | null
): DocumentParserConfig {
  if (kbConfig) {
    return normalizeParserConfig(kbConfig)
  }
  if (globalConfig) {
    return normalizeParserConfig(globalConfig)
  }
  return { type: 'local' }
}

/**
 * Parse a file using the appropriate parser
 * Text files always use local parsing for efficiency
 *
 * @param filePath - Path to the file
 * @param meta - File metadata
 * @param config - Parser configuration
 * @param kbId - Knowledge base ID (for vision model access)
 * @returns Parsed content and parser type used
 */
export async function parseFileWithRouter(
  filePath: string,
  meta: ParserFileMeta,
  config: DocumentParserConfig,
  kbId?: number
): Promise<ParserResult> {
  const normalizedConfig = normalizeParserConfig(config)

  // 文本文件始终使用本地解析
  if (isTextFilePath(filePath)) {
    log.debug(`[ROUTER] Using local parser for text file: ${meta.filename}`)
    const localParser = new LocalParser(kbId)
    const content = await localParser.parse(filePath, meta)
    return { content, parserUsed: 'local' }
  }

  // 非文本文件使用配置的解析器
  log.debug(`[ROUTER] Using ${normalizedConfig.type} parser for: ${meta.filename}`)
  const parser = createParser(normalizedConfig, kbId)
  const content = await parser.parse(filePath, meta)
  const parserUsed: DocumentParserType = normalizedConfig.type === 'none' ? 'local' : normalizedConfig.type
  return { content, parserUsed }
}

/**
 * Get display name for parser type
 */
export function getParserDisplayName(type: DocumentParserType): string {
  switch (type) {
    case 'none':
      return 'Text Only'
    case 'local':
      return 'Local'
    case 'mineru':
      return 'MinerU'
    default:
      return type
  }
}
