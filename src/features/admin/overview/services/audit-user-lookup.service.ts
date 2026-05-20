import { supabase } from '@/lib/supabase/client'

async function getUsernameByEmailImpl(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_username_by_email', {
      p_email: email
    })

    if (error) {
      console.error('Error fetching username by email:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error fetching username by email:', error)
    return null
  }
}

export class AuditUserLookupService {
  static getUsernameByEmail = getUsernameByEmailImpl
}


