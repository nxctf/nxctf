type SupabaseConfigStatus = {
  isConfigured: boolean
  message: string
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/const'

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && isValidHttpUrl(SUPABASE_URL))

  if (isConfigured) {
    return { isConfigured: true, message: '' }
  }

  return {
    isConfigured: false,
    message:
      'Supabase belum dikonfigurasi atau URL-nya tidak valid. Isi NEXT_PUBLIC_SUPABASE_URL dengan URL http/https yang valid dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local.',
  }
}

export function createSupabaseConfigErrorMessage() {
  return getSupabaseConfigStatus().message
}
