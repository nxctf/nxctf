export type NxctlServiceOptions = {
  type?: string
  user?: string
  pass?: string
}

export type NxctlServiceEntry = {
  name: string
  key: string
  options: NxctlServiceOptions
}

type RawNxctlServiceObject = {
  name?: unknown
  key?: unknown
  challenge_key?: unknown
  access_key?: unknown
  options?: unknown
}

export function parseNxctlService(raw: string): NxctlServiceEntry {
  const value = String(raw ?? '').trim()
  if (!value) return { name: '', key: '', options: {} }

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
      const rawOptions = parsed.options && typeof parsed.options === 'object'
        ? parsed.options as Record<string, unknown>
        : {}
      const options = normalizeNxctlServiceOptions(rawOptions)

      if (name || key || Object.keys(options).length > 0) return { name, key, options }
    }
  } catch {
    // Legacy services are stored as plain NXCTL names.
  }

  return { name: value, key: '', options: {} }
}

export function serializeNxctlService(service: Pick<NxctlServiceEntry, 'name'> & Partial<Omit<NxctlServiceEntry, 'name'>>): string {
  const name = String(service.name ?? '').trim()
  const key = String(service.key ?? '').trim()
  const options = normalizeNxctlServiceOptions(service.options)

  if (!key && Object.keys(options).length === 0) return name

  return JSON.stringify({
    name,
    ...(key ? { key } : {}),
    ...(Object.keys(options).length > 0 ? { options } : {}),
  })
}

export function normalizeNxctlServiceValues(rawServices: string[]): string[] {
  return (rawServices || [])
    .map(parseNxctlService)
    .filter((service) => service.name.trim() !== '')
    .map(serializeNxctlService)
}

function normalizeNxctlServiceOptions(rawOptions?: NxctlServiceOptions | Record<string, unknown> | null): NxctlServiceOptions {
  if (!rawOptions || typeof rawOptions !== 'object') return {}

  const rawRecord = rawOptions as Record<string, unknown>
  const type = typeof rawRecord.type === 'string' ? rawRecord.type.trim().toLowerCase() : ''
  const user = typeof rawRecord.user === 'string' ? rawRecord.user.trim() : ''
  const pass =
    typeof rawRecord.pass === 'string'
      ? rawRecord.pass.trim()
      : typeof rawRecord.password === 'string'
        ? rawRecord.password.trim()
        : ''

  if (type !== 'ssh') return {}

  return {
    type,
    ...(user ? { user } : {}),
    ...(pass ? { pass } : {}),
  }
}
