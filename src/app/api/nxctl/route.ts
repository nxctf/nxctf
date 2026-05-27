import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NXCTL_API_ADMIN_SECRET, NXCTL_API_TOKEN, NXCTL_API_URL } from '@/secret'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/const'

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
  const token = getBearerToken(request)
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false

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

  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

function servicePath(name: string) {
  return encodeURIComponent(name)
}

function challengeKeyFromRequest(request: Request, fallback?: unknown) {
  return request.headers.get(CHALLENGE_KEY_HEADER) || String(fallback || '')
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
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const challengeKey = challengeKeyFromRequest(request, searchParams.get('key'))

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

  const result = await safeFetch(`${apiUrl}/status`, {
    headers: buildNxctlHeaders(challengeKey),
  })

  return jsonResponse(result)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = body?.action as NxctlAction | undefined
    const name = typeof body?.name === 'string' ? body.name : ''
    const all = body?.all === true
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

      const result = await safeFetch(`${apiUrl}/${action}?all=true`, {
        method: 'POST',
        headers: buildNxctlHeaders(null, true),
      })

      return jsonResponse(result)
    }

    if (!name) {
      return jsonError('Missing challenge name')
    }

    const isAdminAction = action === 'down'
    if (isAdminAction) {
      const isAdmin = await isGlobalAdminRequest(request)
      if (!isAdmin) {
        return jsonError('Global admin access required', 403)
      }
    }

    const result = await safeFetch(`${apiUrl}/${action}/${servicePath(name)}`, {
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
