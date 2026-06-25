'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import APP from '@/config'
import { useLogin } from '../hooks'
import { THEME_PRIMARY_RING_CLASS, THEME_PRIMARY_TEXT_CLASS } from '@/shared/styles'
import GoogleLoginButton from './GoogleLoginButton'
import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  AuthTurnstile,
} from './ui'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const {
    formData,
    handleChange,
    handleLogin,
    loading,
    error,
    setCaptchaToken,
    turnstileKey,
    captchaEnabled,
    captchaSiteKey
  } = useLogin()

  return (
    <AuthCard>
      <AuthHeader
        badge="Welcome Back"
        title={`Sign in to ${APP.fullName}`}
        subtitle="Continue your CTF journey"
      />

      <form className="space-y-5" onSubmit={handleLogin}>
        <div className="space-y-4">
          <AuthInput
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            placeholder="Email or username"
            icon={Mail}
            value={formData.identifier}
            onChange={handleChange}
          />
          <AuthInput
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Password"
            icon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className={`rounded-lg p-1 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${THEME_PRIMARY_RING_CLASS}`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {error && (
          <AuthStatusMessage tone="error">{error}</AuthStatusMessage>
        )}

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className={`text-xs font-semibold transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${THEME_PRIMARY_TEXT_CLASS}`}
          >
            Forgot password?
          </Link>
        </div>

        {captchaEnabled && (
          <AuthTurnstile
            turnstileKey={turnstileKey}
            siteKey={captchaSiteKey}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        )}

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>

        <AuthDivider />
        <GoogleLoginButton />
      </form>

      <AuthFooter text={`New to ${APP.shortName}?`} href="/register" linkText="Create an account" />
    </AuthCard>
  )
}
