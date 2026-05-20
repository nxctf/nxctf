import { supabase } from '@/lib/supabase/client'
import { User } from '@/shared/types'
import { AuthResponse, AuthIdentity } from '../types'
import { mergeProfilePicture } from '../lib/auth-utils'
import { SUPABASE_URL } from '@/const'
import ky from 'ky'

/**
 * Authentication Service
 * Handles all direct interactions with Supabase Auth and User tables
 */
export const AuthService = {
  /**
   * Check if an OAuth provider is enabled in Supabase
   */
  async checkProviderEnabled(provider: string): Promise<boolean> {
    try {
      if (!SUPABASE_URL) return true;

      // Sanitize URL (remove trailing slash if exists)
      const baseUrl = SUPABASE_URL.replace(/\/$/, '');

      try {
        await ky.get(`${baseUrl}/auth/v1/authorize`, {
          searchParams: { provider },
          redirect: 'manual',
        })
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 400) {
          const data = await error.response.json()
        // Only return false if Supabase explicitly says the provider is not enabled
        // If it's 400 for other reasons (like missing redirect_to), we assume it might be enabled
        if (data.msg?.toLowerCase().includes('provider is not enabled')) {
          console.warn(`AuthService: Provider ${provider} is disabled in Supabase config.`, data);
          return false;
        }
        }
      }
      return true;
    } catch {
      // In case of CORS or network error, we assume it's enabled
      // so we don't accidentally block users if the check itself fails
      return true;
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      // Check if provider is enabled first
      const isEnabled = await this.checkProviderEnabled('google');
      if (!isEnabled) {
        return { user: null, error: 'Google Sign-In is not enabled on this platform. Please contact the administrator.' };
      }

      const redirectUrl = `${window.location.origin}/challenges`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        return { user: null, error: error.message }
      }
      return { user: null, error: null }
    } catch {
      return { user: null, error: 'Google sign-in failed' }
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, captchaToken?: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile/password`,
        ...(captchaToken && { captchaToken })
      })
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch {
      return { error: 'Failed to send reset email' }
    }
  },

  /**
   * Update current user's password
   */
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { error: 'User not authenticated' }
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch {
      return { error: 'Failed to update password' }
    }
  },

  /**
   * Register a new user
   */
  async signUp(email: string, password: string, username: string, captchaToken?: string): Promise<AuthResponse> {
    try {
      if (!email.toLowerCase().endsWith('@gmail.com')) {
        return { user: null, error: 'Only @gmail.com emails are allowed for registration' }
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { user: null, error: 'Username already taken' }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          },
          emailRedirectTo: `${window.location.origin}/login`,
          ...(captchaToken && { captchaToken })
        }
      })

      if (authError?.message === 'User already registered') {
        return { user: null, error: "Email already registered" }
      }
      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create account' }
      }

      if (!authData.session) {
        return {
          user: null,
          error: null,
          emailConfirmationRequired: true,
          message: 'Registration successful. Please check your email to confirm your account before signing in.'
        }
      }

      const { error: rpcError } = await supabase.rpc('create_profile', {
        p_id: authData.user.id,
        p_username: username
      })

      if (rpcError) {
        return { user: null, error: `Failed to create user profile: ${rpcError.message}` }
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        return { user: null, error: userError.message }
      }

      const { data: profileRows } = await supabase.rpc('get_user_profile', { p_id: authData.user.id })
      const profileRow = Array.isArray(profileRows) ? profileRows[0] : null
      const mergedUser = mergeProfilePicture(userData as any, authData.user, profileRow)

      return { user: mergedUser, error: null }
    } catch {
      return { user: null, error: 'Registration failed' }
    }
  },

  /**
   * Sign in with email/username and password
   */
  async signIn(identifier: string, password: string, captchaToken?: string): Promise<AuthResponse> {
    try {
      let email = identifier

      if (!identifier.includes('@')) {
        const { data: rpcEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
          p_username: identifier
        })

        if (rpcError || !rpcEmail) {
          return { user: null, error: 'User not found' }
        }

        email = rpcEmail
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          ...(captchaToken && { captchaToken })
        }
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: 'Login failed' }
      }

      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        const username =
          data.user.user_metadata?.username ??
          (data.user.email ? data.user.email.split("@")[0] : "user_" + data.user.id.substring(0, 8))

        const { error: rpcError } = await supabase.rpc('create_profile', {
          p_id: data.user.id,
          p_username: username
        })

        if (rpcError) {
          return { user: null, error: 'Failed to create user profile' }
        }

        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (newUserError) {
          return { user: null, error: newUserError.message }
        }

        userData = newUserData
      }

      const { data: profileRows } = await supabase.rpc('get_user_profile', { p_id: data.user.id })
      const profileRow = Array.isArray(profileRows) ? profileRows[0] : null
      const mergedUser = mergeProfilePicture(userData as any, data.user, profileRow)

      return { user: mergedUser, error: null }
    } catch {
      return { user: null, error: 'Login failed' }
    }
  },

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  /**
   * Get current user details from DB and Auth
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      let { data } = await supabase.rpc('get_user_profile', { p_id: user.id })
      let userData = data && data.length > 0 ? data[0] : null

      if (!userData) {
        const username =
          user.user_metadata?.username ||
          (user.email ? user.email.split("@")[0] : "user_" + user.id.substring(0, 8))

        const { error: rpcError } = await supabase.rpc('create_profile', {
          p_id: user.id,
          p_username: username
        })
        if (rpcError) return null

        const { data: newData, error: newError } = await supabase.rpc('get_user_profile', { p_id: user.id })
        userData = newData && newData.length > 0 ? newData[0] : null
        if (newError || !userData) return null
      }

      const merged = mergeProfilePicture(userData as any, user, userData)
      return merged
    } catch {
      return null
    }
  },

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) return false
      return data || false
    } catch {
      return false
    }
  },

  /**
   * Check if current user is global admin
   */
  async isGlobalAdmin(): Promise<boolean> {
    return this.isAdmin()
  },

  /**
   * Get administrative scope for current user
   */
  async getAdminScope(): Promise<{ is_global_admin: boolean; event_ids: string[] }> {
    const { data, error } = await supabase.rpc('get_admin_scope')
    if (error || !data) return { is_global_admin: false, event_ids: [] }

    const is_global_admin = !!(data as any).is_global_admin
    const event_ids_raw = (data as any).event_ids
    const event_ids = Array.isArray(event_ids_raw) ? event_ids_raw.map((x) => String(x)) : []
    return { is_global_admin, event_ids }
  },

  /**
   * Get current auth identities (Google, Email, etc)
   */
  async getCurrentAuthInfo(): Promise<AuthIdentity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      if (user.identities && user.identities.length > 0) {
        return user.identities.map((id: any) => ({
          provider: id.provider,
          email: id.identity_data?.email || id.email || '',
        }))
      }

      if (user.app_metadata?.provider) {
        return [{ provider: user.app_metadata.provider, email: user.email || '' }]
      }

      return [{ provider: 'email', email: user.email || '' }]
    } catch {
      return []
    }
  },

  /**
   * Bind Google account
   */
  async bindGoogle(): Promise<{ error: string | null }> {
    try {
      const isEnabled = await this.checkProviderEnabled('google');
      if (!isEnabled) {
        return { error: 'Google integration is not enabled on this platform.' };
      }

      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) return { error: error.message }
      return { error: null }
    } catch {
      return { error: 'Failed to link Google account' }
    }
  },

  /**
   * Unbind Google account
   */
  async unbindGoogle(): Promise<{ error: string | null }> {
    try {
      const { data: identities, error: identitiesError } = await supabase.auth.getUserIdentities()
      if (identitiesError) return { error: identitiesError.message }
      if (!identities || !identities.identities) return { error: 'No identities found.' }

      const googleIdentity = identities.identities.find((identity: any) => identity.provider === 'google')
      if (!googleIdentity) return { error: 'Google identity not linked.' }

      const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
      if (error) return { error: error.message }

      return { error: null }
    } catch {
      return { error: 'Failed to unlink Google account.' }
    }
  }
}

export class AuthStaticService {
  static checkProviderEnabled = AuthService.checkProviderEnabled
  static loginWithGoogle = AuthService.loginWithGoogle
  static sendPasswordReset = AuthService.sendPasswordReset
  static updatePassword = AuthService.updatePassword
  static signUp = AuthService.signUp
  static signIn = AuthService.signIn
  static signOut = AuthService.signOut
  static getCurrentUser = AuthService.getCurrentUser
  static isAdmin = AuthService.isAdmin
  static isGlobalAdmin = AuthService.isGlobalAdmin
  static getAdminScope = AuthService.getAdminScope
  static getCurrentAuthInfo = AuthService.getCurrentAuthInfo
  static bindGoogle = AuthService.bindGoogle
  static unbindGoogle = AuthService.unbindGoogle
}
