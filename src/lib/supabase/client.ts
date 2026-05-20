import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseConfigErrorMessage, getSupabaseConfigStatus } from '@/lib/supabase/config'
import type { Database } from '@/lib/supabase/database.types'

type SupabaseErrorResult = {
  data: null
  error: {
    message: string
    details: string
    hint: string
    code: string
  }
}

const configStatus = getSupabaseConfigStatus()
const configErrorMessage = createSupabaseConfigErrorMessage()

function createErrorResult(): SupabaseErrorResult {
  return {
    data: null,
    error: {
      message: configErrorMessage,
      details: '',
      hint: '',
      code: 'SUPABASE_CONFIG',
    },
  }
}

function createAuthErrorResult(method: string) {
  const error = createErrorResult().error

  switch (method) {
    case 'getUser':
      return Promise.resolve({ data: { user: null }, error })
    case 'getSession':
      return Promise.resolve({ data: { session: null }, error })
    case 'getUserIdentities':
      return Promise.resolve({ data: { identities: [] }, error })
    case 'signInWithPassword':
    case 'signUp':
    case 'updateUser':
    case 'linkIdentity':
    case 'unlinkIdentity':
      return Promise.resolve({ data: { user: null, session: null }, error })
    case 'signInWithOAuth':
    case 'resetPasswordForEmail':
      return Promise.resolve({ data: null, error })
    case 'signOut':
      return Promise.resolve({ error })
    default:
      return Promise.resolve({ data: null, error })
  }
}

function createQueryFallback() {
  const queryTarget = function () {}

  return new Proxy(queryTarget, {
    apply() {
      return Promise.resolve(createErrorResult())
    },
    get(target, property) {
      if (property === 'then') {
        const result = Promise.resolve(createErrorResult())
        return result.then.bind(result)
      }

      if (property === 'catch') {
        const result = Promise.resolve(createErrorResult())
        return result.catch.bind(result)
      }

      if (property === 'finally') {
        const result = Promise.resolve(createErrorResult())
        return result.finally.bind(result)
      }

      if (property in target) {
        return (target as any)[property]
      }

      return (..._args: any[]) => queryProxy
    },
  })
}

const queryProxy = createQueryFallback()

function createAuthFallback() {
  const authMethods = new Set([
    'getSession',
    'getUser',
    'getUserIdentities',
    'signInWithOAuth',
    'signInWithPassword',
    'signUp',
    'signOut',
    'resetPasswordForEmail',
    'updateUser',
    'linkIdentity',
    'unlinkIdentity',
  ])

  return new Proxy({}, {
    get(_target, property) {
      if (typeof property === 'string' && authMethods.has(property)) {
        return async () => createAuthErrorResult(property)
      }

      return () => createErrorResult()
    },
  })
}

function createUnavailableClient(): SupabaseClient<Database> {
  const client = {
    from: () => queryProxy,
    rpc: async () => createErrorResult(),
    auth: createAuthFallback(),
    storage: {
      from: () => queryProxy,
    },
    channel: () => ({
      on: () => queryProxy,
      subscribe: () => queryProxy,
      unsubscribe: () => Promise.resolve(),
    }),
    removeChannel: async () => ({ error: null }),
    getChannels: () => [],
  }

  return client as unknown as SupabaseClient<Database>
}

if (!configStatus.isConfigured) {
  console.warn(`[supabase] ${configErrorMessage}`)
}

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/const'

export const supabase: SupabaseClient<Database> = configStatus.isConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createUnavailableClient()

export const isSupabaseConfigured = configStatus.isConfigured
export const supabaseConfigErrorMessage = configErrorMessage
