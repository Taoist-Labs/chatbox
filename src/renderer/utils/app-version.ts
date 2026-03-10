export function formatDisplayVersion(version?: string | null): string {
  const trimmedVersion = version?.trim() ?? ''

  if (!trimmedVersion || !/\d/.test(trimmedVersion)) {
    return ''
  }

  return `V${trimmedVersion.replace(/^[vV]/, '')}`
}
