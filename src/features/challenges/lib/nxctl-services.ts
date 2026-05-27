export type NxctlServiceEntry = {
  name: string
  key: string
}

type RawNxctlServiceObject = {
  name?: unknown
  key?: unknown
  challenge_key?: unknown
  access_key?: unknown
}

export function parseNxctlService(raw: string): NxctlServiceEntry {
  const value = String(raw ?? '').trim()
  if (!value) return { name: '', key: '' }

  try {
    const parsed = JSON.parse(value) as RawNxctlServiceObject
    if (parsed && typeof parsed === 'object') {
      const name = typeof parsed.name === 'string' ? parsed.name.trim() : ''
      const key =
        typeof parsed.key === 'string'
          ? parsed.key.trim()
          : typeof parsed.challenge_key === 'string'
            ? parsed.challenge_key.trim()
            : typeof parsed.access_key === 'string'
              ? parsed.access_key.trim()
              : ''

      if (name || key) return { name, key }
    }
  } catch {
    // Legacy services are stored as plain NXCTL names.
  }

  return { name: value, key: '' }
}

export function serializeNxctlService(service: NxctlServiceEntry): string {
  const name = String(service.name ?? '').trim()
  const key = String(service.key ?? '').trim()

  if (!key) return name

  return JSON.stringify({ name, key })
}

export function normalizeNxctlServiceValues(rawServices: string[]): string[] {
  return (rawServices || [])
    .map(parseNxctlService)
    .filter((service) => service.name.trim() !== '')
    .map(serializeNxctlService)
}
