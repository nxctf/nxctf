import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const configFilePath = path.join(process.cwd(), 'src/config.ts')
const envFilePath = path.join(process.cwd(), '.env.local')
const isProduction = process.env.NODE_ENV === 'production'

type SetupConfig = {
  shortName: string
  fullName: string
  description: string
  notifSolves: boolean
  teamsEnabled: boolean
  hideScoreboardIndividual: boolean
  hideScoreboardTotal: boolean
  image_icon: string
  image_logo: string
  image_preview: string
}

type SecretConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  turnstileSiteKey: string
  turnstileSiteKeyEnabled: boolean
  nxctlEnabled: boolean
  nxctlApiUrl: string
  nxctlApiToken: string
  nxctlApiAdminSecret: string
}

type ConfigResponse = {
  config: SetupConfig
  secret: SecretConfig
}

function toJsonString(value: string) {
  return JSON.stringify(value)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseEnvValue(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const quoted = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  return quoted ? trimmed.slice(1, -1) : trimmed
}

function readEnvEntry(source: string, key: string, fallback = '') {
  const lines = source.split(/\r?\n/)
  const pattern = new RegExp(`^\\s*#?\\s*${escapeRegExp(key)}\\s*=\\s*(.*)$`)

  for (const line of lines) {
    const match = line.match(pattern)
    if (!match) continue

    const enabled = !line.trimStart().startsWith('#')
    return {
      value: parseEnvValue(match[1] || ''),
      enabled,
    }
  }

  return {
    value: fallback,
    enabled: Boolean(fallback),
  }
}

function stringifyEnvValue(value: string) {
  const normalized = String(value ?? '')
  if (normalized === '') return ''
  if (/^[A-Za-z0-9_./:-]+$/.test(normalized)) return normalized
  return JSON.stringify(normalized)
}

function replaceOrAppendEnvLine(source: string, key: string, value: string, enabled: boolean) {
  const linePattern = new RegExp(`^\\s*#?\\s*${escapeRegExp(key)}\\s*=.*$`, 'm')
  const nextLine = `${enabled ? '' : '# '}${key}=${stringifyEnvValue(value)}`

  if (linePattern.test(source)) {
    return source.replace(linePattern, nextLine)
  }

  const trimmed = source.replace(/\s*$/, '')
  return `${trimmed}${trimmed ? '\n' : ''}${nextLine}\n`
}

// Strict replace-only helper: only replace existing lines, do NOT append
function replaceEnvLine(source: string, key: string, value: string, enabled: boolean) {
  const lines = source.split(/\r?\n/)
  let found = false

  const newLines = lines.map((line) => {
    const trimmed = line.trim()
    const match = trimmed.match(new RegExp(`^#?\\s*${escapeRegExp(key)}\\s*=`))
    if (!match) return line
    found = true
    return `${enabled ? '' : '# '}${key}=${stringifyEnvValue(value)}`
  })

  return found ? newLines.join('\n') : source
}

// Remove any existing entries for a key and append a single canonical line (replace or append)
function setEnvKey(source: string, key: string, value: string, enabled: boolean) {
  const linePattern = new RegExp(`^\\s*#?\\s*${escapeRegExp(key)}\\s*=.*$`, 'gm')
  const cleaned = source.replace(linePattern, '').replace(/\n{2,}/g, '\n').replace(/^\n|\n$/g, '')
  const nextLine = `${enabled ? '' : '# '}${key}=${stringifyEnvValue(value)}`
  return `${cleaned}${cleaned ? '\n' : ''}${nextLine}\n`
}

function hasEnvKey(source: string, key: string) {
  const pattern = new RegExp(`^\\s*#?\\s*${escapeRegExp(key)}\\s*=`, 'm')
  return pattern.test(source)
}

function readSecretConfig(source: string): SecretConfig {
  const supabaseUrl = readEnvEntry(source, 'NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  const supabaseAnonKey = readEnvEntry(source, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '')
  const turnstileSiteKey = readEnvEntry(source, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '')
  const nxctlApiUrl = readEnvEntry(source, 'NXCTL_API_URL', process.env.NXCTL_API_URL || '')
  const nxctlApiToken = readEnvEntry(source, 'NXCTL_API_TOKEN', process.env.NXCTL_API_TOKEN || '')
  const nxctlApiAdminSecret = readEnvEntry(source, 'NXCTL_API_ADMIN_SECRET', process.env.NXCTL_API_ADMIN_SECRET || '')

  return {
    supabaseUrl: supabaseUrl.value,
    supabaseAnonKey: supabaseAnonKey.value,
    turnstileSiteKey: turnstileSiteKey.value,
    turnstileSiteKeyEnabled: turnstileSiteKey.enabled,
    nxctlEnabled: nxctlApiUrl.enabled || nxctlApiToken.enabled || nxctlApiAdminSecret.enabled,
    nxctlApiUrl: nxctlApiUrl.value,
    nxctlApiToken: nxctlApiToken.value,
    nxctlApiAdminSecret: nxctlApiAdminSecret.value,
  }
}

function readString(source: string, pattern: RegExp, fallback = '') {
  const match = source.match(pattern)
  return match?.[1] ?? fallback
}

function readBoolean(source: string, pattern: RegExp, fallback = false) {
  const match = source.match(pattern)
  if (!match?.[1]) return fallback
  return match[1].trim() === 'true'
}

function readCategories(source: string, key: string) {
  const pattern = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\n\\s*\\],`)
  const match = source.match(pattern)
  if (!match) return []
  return Array.from(match[1].matchAll(/['"]((?:[^'"\\]|\\.)*)['"](?:\s*,)?/g)).map((item) => item[1])
}

function readConfig(source: string): SetupConfig {
  const teamsBlock = source.match(/teams:\s*\{([\s\S]*?)\n\s*\},/)

  return {
    shortName: readString(source, /shortName:\s*['"]([^'"]*)['"]/),
    fullName: readString(source, /fullName:\s*['"]([^'"]*)['"]/),
    description: readString(source, /description:\s*['"]([^'"]*)['"]/),
    notifSolves: readBoolean(source, /notifSolves:\s*(true|false)/),
    teamsEnabled: readBoolean(teamsBlock?.[1] || '', /enabled:\s*(true|false)/),
    hideScoreboardIndividual: readBoolean(teamsBlock?.[1] || '', /hideScoreboardIndividual:\s*(true|false)/),
    hideScoreboardTotal: readBoolean(teamsBlock?.[1] || '', /hidescoreboardTotal:\s*(true|false)/),
    image_icon: readString(source, /image_icon:\s*['"]([^'"]*)['"]/),
    image_logo: readString(source, /image_logo:\s*['"]([^'"]*)['"]/),
    image_preview: readString(source, /image_preview:\s*['"]([^'"]*)['"]/),
  }
}

function readEnvFile() {
  return fs.readFile(envFilePath, 'utf8').catch(() => '')
}

function replaceFirst(source: string, pattern: RegExp, replacement: string) {
  if (!pattern.test(source)) return source
  return source.replace(pattern, () => replacement)
}

function updateConfig(source: string, config: SetupConfig) {
  let updated = source

  updated = replaceFirst(updated, /shortName:\s*['"][^'"]*['"]/, `shortName: ${toJsonString(config.shortName)}`)
  updated = replaceFirst(updated, /fullName:\s*['"][^'"]*['"]/, `fullName: ${toJsonString(config.fullName)}`)
  updated = replaceFirst(updated, /description:\s*['"][^'"]*['"]/, `description: ${toJsonString(config.description)}`)
  // baseUrl is env-backed (NEXT_PUBLIC_SITE_URL); do not change literal fallback here.

  updated = replaceFirst(updated, /notifSolves:\s*(true|false)/, `notifSolves: ${config.notifSolves}`)
  updated = replaceFirst(
    updated,
    /teams:\s*\{([\s\S]*?)\n\s*\},/,
    `teams: {\n    enabled: ${config.teamsEnabled},\n    hideScoreboardIndividual: ${config.hideScoreboardIndividual},\n    hidescoreboardTotal: ${config.hideScoreboardTotal},\n  },`
  )
  updated = replaceFirst(updated, /image_icon:\s*['"][^'"]*['"]/, `image_icon: ${toJsonString(config.image_icon)}`)
  updated = replaceFirst(updated, /image_logo:\s*['"][^'"]*['"]/, `image_logo: ${toJsonString(config.image_logo)}`)
  updated = replaceFirst(updated, /image_preview:\s*['"][^'"]*['"]/, `image_preview: ${toJsonString(config.image_preview)}`)
  // Note: maintenance mode and site URL are env-backed and will be written to .env.local instead of editing the literal fallback here.

  return updated
}

function updateSecret(source: string, secret: SecretConfig) {
  let updated = source

  const updateIfExists = (key: string, value: string, enabled: boolean) => {
    if (!value && !enabled) return
    if (hasEnvKey(updated, key)) {
      updated = replaceEnvLine(updated, key, value || '', enabled)
    }
  }

  updateIfExists('NEXT_PUBLIC_SUPABASE_URL', secret.supabaseUrl, true)
  updateIfExists('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', secret.supabaseAnonKey, true)
  updateIfExists('NEXT_PUBLIC_TURNSTILE_SITE_KEY', secret.turnstileSiteKey, secret.turnstileSiteKeyEnabled)
  // Ensure NXCTL entries are explicitly set or commented when toggled.
  // Preserve existing values if the client payload doesn't include them (avoid erasing real values).
  const existingNxctlUrl = readEnvEntry(updated, 'NXCTL_API_URL').value
  const nxctlUrlToWrite = (secret.nxctlApiUrl?.trim() || existingNxctlUrl || '')
  updated = setEnvKey(updated, 'NXCTL_API_URL', nxctlUrlToWrite, Boolean(secret.nxctlEnabled))

  const existingNxctlToken = readEnvEntry(updated, 'NXCTL_API_TOKEN').value
  const nxctlTokenToWrite = (secret.nxctlApiToken?.trim() || existingNxctlToken || '')
  updated = setEnvKey(updated, 'NXCTL_API_TOKEN', nxctlTokenToWrite, Boolean(secret.nxctlEnabled))

  const existingNxctlAdminSecret = readEnvEntry(updated, 'NXCTL_API_ADMIN_SECRET').value
  const nxctlAdminSecretToWrite = (secret.nxctlApiAdminSecret?.trim() || existingNxctlAdminSecret || '')
  updated = setEnvKey(updated, 'NXCTL_API_ADMIN_SECRET', nxctlAdminSecretToWrite, Boolean(secret.nxctlEnabled))

  return updated
}

function normalizeConfig(input: Partial<SetupConfig>): SetupConfig {
  return {
    shortName: input.shortName?.trim() || '',
    fullName: input.fullName?.trim() || '',
    description: input.description?.trim() || '',
    notifSolves: Boolean(input.notifSolves),
    teamsEnabled: Boolean(input.teamsEnabled),
    hideScoreboardIndividual: Boolean(input.hideScoreboardIndividual),
    hideScoreboardTotal: Boolean(input.hideScoreboardTotal),
    image_icon: input.image_icon?.trim() || '',
    image_logo: input.image_logo?.trim() || '',
    image_preview: input.image_preview?.trim() || '',
  }
}

function normalizeSecret(input: Partial<SecretConfig>): SecretConfig {
  return {
    supabaseUrl: input.supabaseUrl?.trim() || '',
    supabaseAnonKey: input.supabaseAnonKey?.trim() || '',
    turnstileSiteKey: input.turnstileSiteKey?.trim() || '',
    turnstileSiteKeyEnabled: input.turnstileSiteKeyEnabled ?? Boolean(input.turnstileSiteKey?.trim()),
    nxctlEnabled: input.nxctlEnabled ?? Boolean(input.nxctlApiUrl?.trim() || input.nxctlApiToken?.trim() || input.nxctlApiAdminSecret?.trim()),
    nxctlApiUrl: input.nxctlApiUrl?.trim() || '',
    nxctlApiToken: input.nxctlApiToken?.trim() || '',
    nxctlApiAdminSecret: input.nxctlApiAdminSecret?.trim() || '',
  }
}

function hasAnyOwnProperty(source: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(source, key))
}

export async function GET() {
  if (isProduction) {
    return NextResponse.json({ ok: false, error: 'Config editor is disabled in production.' }, { status: 404 })
  }

  try {
    const [configSource, envSource] = await Promise.all([
      fs.readFile(configFilePath, 'utf8'),
      readEnvFile(),
    ])

    return NextResponse.json({
      ok: true,
      config: readConfig(configSource),
      secret: readSecretConfig(envSource),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read src/config.ts'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (isProduction) {
    return NextResponse.json({ ok: false, error: 'Config editor is disabled in production.' }, { status: 404 })
  }

  try {
    const body = (await request.json()) as {
      config?: Partial<SetupConfig>
      secret?: Partial<SecretConfig>
    } & Partial<SetupConfig> & Partial<SecretConfig>

    const [source, envSource] = await Promise.all([
      fs.readFile(configFilePath, 'utf8'),
      readEnvFile(),
    ])

    const currentConfig = readConfig(source)
    const currentSecret = readSecretConfig(envSource)

    const configInput = body.config || body
    const secretInput = body.secret || body

    const hasConfigPayload = Boolean(body.config) || hasAnyOwnProperty(body, [
      'shortName',
      'fullName',
      'description',
      'notifSolves',
      'teamsEnabled',
      'image_icon',
      'image_logo',
      'image_preview',
      'discord',
    ])

    const hasSecretPayload = Boolean(body.secret) || hasAnyOwnProperty(body, [
      'supabaseUrl',
      'supabaseAnonKey',
      'turnstileSiteKey',
      'turnstileSiteKeyEnabled',
      'nxctlEnabled',
      'nxctlApiUrl',
      'nxctlApiToken',
      'nxctlApiAdminSecret',
    ])

    const config = hasConfigPayload ? normalizeConfig({ ...currentConfig, ...configInput }) : currentConfig
    const secret = hasSecretPayload ? normalizeSecret({ ...currentSecret, ...secretInput }) : currentSecret

    // Merge secret updates into env (only updates existing env keys)
    const updatedEnv = updateSecret(envSource, secret)

    // Update the non-env-backed parts of src/config.ts
    const updatedConfig = updateConfig(source, config)

    await Promise.all([
      fs.writeFile(configFilePath, updatedConfig, 'utf8'),
      fs.writeFile(envFilePath, updatedEnv, 'utf8'),
    ])

    return NextResponse.json({
      ok: true,
      config: readConfig(updatedConfig),
      secret: readSecretConfig(updatedEnv),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update src/config.ts'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (isProduction) {
    return NextResponse.json({ ok: false, error: 'Config editor is disabled in production.' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'icon', 'logo', 'preview'

    if (!file || !type) {
      return NextResponse.json({ ok: false, error: 'Missing file or type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name
    const ext = path.extname(filename)

    // Determine standard filename based on type
    let targetName = filename
    if (type === 'icon') targetName = 'favicon.ico'
    else if (type === 'logo') targetName = `logo${ext}`
    else if (type === 'preview') targetName = `og-image${ext}`

    const publicPath = path.join(process.cwd(), 'public', targetName)
    await fs.writeFile(publicPath, buffer)

    return NextResponse.json({
      ok: true,
      path: targetName,
      message: `Successfully uploaded ${type} as ${targetName}`
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload file'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
