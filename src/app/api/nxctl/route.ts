import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NXCTL_API_ADMIN_SECRET, NXCTL_API_TOKEN, NXCTL_API_URL } from '@/_vars/secret'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/_vars/const'

const apiUrl = NXCTL_API_URL.replace(/\/$/, '')
const CHALLENGE_KEY_HEADER = 'X-NXCTL-Challenge-Key'

type NxctlAction = 'up' | 'down' | 'restart' | 'extend'

async function safeFetch(url: string, options?: RequestInit) {
  if (!apiUrl) {
    return {
      ok: false,
      status: 503,
      data: { error: 'NXCTL API URL is not configured' },
    }
  }

  try {
    const res = await fetch(url, options)
    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text || null }
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: {
        error: err.message || 'Unknown fetch error',
      },
    }
  }
}

function buildNxctlHeaders(challengeKey?: string | null, includeAdminSecret = false) {
  const headers: Record<string, string> = {}

  if (NXCTL_API_TOKEN) {
    headers.Authorization = `Bearer ${NXCTL_API_TOKEN}`
  }

  const key = String(challengeKey || '').trim()
  if (key) {
    headers[CHALLENGE_KEY_HEADER] = key
  }

  if (includeAdminSecret && NXCTL_API_ADMIN_SECRET) {
    headers['X-NXCTL-Admin-Secret'] = NXCTL_API_ADMIN_SECRET
  }

  return headers
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return ''
  return token.trim()
}

async function isGlobalAdminRequest(request: Request) {
  const scope = await getAdminScopeForRequest(request)
  return scope.is_global_admin
}

async function getAdminScopeForRequest(request: Request) {
  const token = getBearerToken(request)
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { is_global_admin: false, event_ids: [] as string[] }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const { data, error } = await supabase.rpc('get_admin_scope')
  if (error || !data) return { is_global_admin: false, event_ids: [] as string[] }

  const rawEventIds = (data as any).event_ids
  return {
    is_global_admin: !!(data as any).is_global_admin,
    event_ids: Array.isArray(rawEventIds) ? rawEventIds.map((id) => String(id)) : [],
  }
}

async function isUserBanned(request: Request) {
  const token = getBearerToken(request)
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  try {
    const { data } = await supabase.rpc('is_current_user_banned')
    return !!data
  } catch {
    return false
  }
}

function servicePath(name: string) {
  return encodeURIComponent(name)
}

function challengeKeyFromRequest(request: Request, fallback?: unknown) {
  return request.headers.get(CHALLENGE_KEY_HEADER) || String(fallback || '')
}

function parseStatusFilter(searchParams: URLSearchParams) {
  const names = [
    ...searchParams
      .getAll('filter')
      .flatMap((filter) => filter.split(',')),
    ...searchParams.getAll('name'),
  ]
    .map((name) => name.trim())
    .filter(Boolean)

  return Array.from(new Set(names))
}

function buildStatusUrl(targetNames: string[]) {
  if (targetNames.length === 0) return `${apiUrl}/status`

  const statusParams = new URLSearchParams()
  targetNames.forEach((name) => {
    statusParams.append('name', name)
  })

  return `${apiUrl}/status?${statusParams.toString()}`
}

function getNxctlErrorCode(data: any): string {
  const values = [data?.detail, data?.error, data?.message, data]

  for (const value of values) {
    if (!value) continue
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      if (typeof value.error === 'string') return value.error
      if (typeof value.code === 'string') return value.code
    }
  }

  return ''
}

function isTargetedStatusAccessError(result: Awaited<ReturnType<typeof safeFetch>>) {
  return (
    result.status === 404 &&
    getNxctlErrorCode(result.data) === 'challenge_not_found_or_not_authorized'
  )
}

async function fetchStatus(targetNames: string[], headers: Record<string, string>) {
  const result = await safeFetch(buildStatusUrl(targetNames), { headers })

  if (
    targetNames.length <= 1 ||
    result.ok ||
    !isTargetedStatusAccessError(result)
  ) {
    return result
  }

  const results = []
  for (const name of targetNames) {
    const item = await safeFetch(buildStatusUrl([name]), { headers })
    if (item.ok && Array.isArray(item.data)) {
      results.push(...item.data)
    }
  }

  if (results.length > 0) {
    return {
      ok: true,
      status: 200,
      data: results,
    }
  }

  return result
}

function jsonResponse(result: Awaited<ReturnType<typeof safeFetch>>) {
  return NextResponse.json(result.data, {
    status: result.status,
  })
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  if (await isUserBanned(request)) {
    return jsonError('Your account is temporarily banned', 403)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const challengeKey = challengeKeyFromRequest(request, searchParams.get('key'))

  if (action === 'admin-challenges') {
    const isAdmin = await isGlobalAdminRequest(request)
    if (!isAdmin) return jsonError('Global admin access required', 403)

    const result = await safeFetch(`${apiUrl}/admin/challenges`, {
      headers: buildNxctlHeaders(null, true),
    })

    return jsonResponse(result)
  }

  if (action === 'live-services') {
    const isAdmin = await isGlobalAdminRequest(request)
    if (!isAdmin) return jsonError('Global admin access required', 403)

    const result = await fetchStatus(
      parseStatusFilter(searchParams),
      buildNxctlHeaders(challengeKey, true)
    )

    return jsonResponse(result)
  }

  if (action === 'inspect') {
    const name = searchParams.get('name')

    if (!name) {
      return jsonError('Missing service name')
    }

    const result = await safeFetch(`${apiUrl}/inspect/${servicePath(name)}`, {
      headers: buildNxctlHeaders(challengeKey),
    })

    return jsonResponse(result)
  }

  if (action !== 'status') {
    return jsonError('Invalid GET action')
  }

  const result = await fetchStatus(
    parseStatusFilter(searchParams),
    buildNxctlHeaders(challengeKey)
  )

  return jsonResponse(result)
}

export async function POST(request: Request) {
  if (await isUserBanned(request)) {
    return jsonError('Your account is temporarily banned', 403)
  }

  try {
    const body = await request.json()
    const action = body?.action as NxctlAction | undefined
    const name = typeof body?.name === 'string' ? body.name : ''
    const all = body?.all === true
    const force = body?.force === true
    const challengeKey = challengeKeyFromRequest(request, body?.key)

    if (!action || !['up', 'down', 'restart', 'extend'].includes(action)) {
      return jsonError('Invalid action')
    }

    if (all) {
      if (!['up', 'down'].includes(action)) {
        return jsonError('Only up/down support all=true')
      }

      const isAdmin = await isGlobalAdminRequest(request)
      if (!isAdmin) {
        return jsonError('Global admin access required', 403)
      }

      const adminPath = action === 'down' ? '/admin/down' : `/${action}?all=true`
      const result = await safeFetch(`${apiUrl}${adminPath}`, {
        method: 'POST',
        headers: buildNxctlHeaders(null, true),
      })

      return jsonResponse(result)
    }

    if (!name) {
      return jsonError('Missing challenge name')
    }

    const isAdminAction = action === 'down' || (action === 'restart' && force)
    if (isAdminAction) {
      const isAdmin = await isGlobalAdminRequest(request)
      if (!isAdmin) {
        return jsonError('Global admin access required', 403)
      }
    }

    const upstreamPath = action === 'down'
      ? `/admin/down/${servicePath(name)}`
      : action === 'restart' && force
        ? `/admin/restart/${servicePath(name)}?force=true`
        : `/${action}/${servicePath(name)}`
    const result = await safeFetch(`${apiUrl}${upstreamPath}`, {
      method: 'POST',
      headers: buildNxctlHeaders(challengeKey, isAdminAction),
    })

    return jsonResponse(result)
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || 'Unknown server error',
      },
      {
        status: 500,
      }
    )
  }
}
