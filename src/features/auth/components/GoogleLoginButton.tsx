'use client'

import { useState } from 'react'
import { AlertCircle, Globe, Loader2 } from 'lucide-react'

import { AuthService } from '../services/auth.service'

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await AuthService.loginWithGoogle()
      if (error) {
        setError(error)
      }
    } catch {
      setError('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`relative flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold focus:outline-none ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'} ${'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
        <span>{loading ? 'Processing...' : 'Sign in with Google'}</span>
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-none" />
          {error}
        </div>
      )}
    </div>
  )
}
