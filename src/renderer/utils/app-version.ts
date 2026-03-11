export function formatDisplayVersion(version?: string | null): string {
  const trimmedVersion = version?.trim() ?? ''

  if (!trimmedVersion || !/\d/.test(trimmedVersion)) {
    return ''
  }

  const normalizedVersion = trimmedVersion.replace(/^[vV]/, '').replace(/^(\d+\.\d+)\.0$/, '$1')

  return `V${normalizedVersion}`
}
