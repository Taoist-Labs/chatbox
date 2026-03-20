/**
 * This file exists solely to help i18next-parser extract translation keys
 * that are defined in src/shared/models/errors.ts and used dynamically via
 * t(errorDetail.i18nKey) or <Trans i18nKey={errorDetail.i18nKey} />.
 *
 * Do NOT delete this file. It is not imported anywhere at runtime.
 * When adding new error codes with i18nKey in errors.ts, add the key here too.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _errorI18nKeys(t: (key: string) => string) {
  // Document parser errors (errors.ts line 230+)
  t(
    'Local document parsing failed. You can go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and switch to a cloud document parser.'
  )
  t('Cloud document parser failed. Please try again later.')
  t(
    'Document parsing failed. You can go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and switch to a cloud document parser.'
  )
  t(
    'Selected document parser is currently only supported in Knowledge Base. For chat file attachments, please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and switch to Local or a cloud parser.'
  )
  t(
    'MinerU API token is required. Please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and configure your MinerU API token.'
  )
  t(
    'This file type requires a document parser. Please go to <OpenDocumentParserSettingButton>Settings</OpenDocumentParserSettingButton> and enable a cloud document parser.'
  )
}
