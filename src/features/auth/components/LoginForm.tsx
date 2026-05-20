'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { useLogin } from '../hooks'
import GoogleLoginButton from './GoogleLoginButton'
import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
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
    captchaEnabled,
    captchaSiteKey
  } = useLogin()

  return (
    <AuthCard>
      <AuthHeader
        badge="Welcome Back"
        title="Sign in to NXCTF"
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
                className={`rounded-lg p-1 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
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
            className={`text-xs font-semibold transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${'text-primary'}`}
          >
            Forgot password?
          </Link>
        </div>

        {captchaEnabled && (
          <div className="w-full flex justify-center">
            <Turnstile
              siteKey={captchaSiteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              options={{
                theme: 'auto'
              }}
            />
          </div>
        )}

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>

        <AuthDivider />
        <GoogleLoginButton />
      </form>

      <AuthFooter text="New to NXCTF?" href="/register" linkText="Create an account" />
    </AuthCard>
  )
}
