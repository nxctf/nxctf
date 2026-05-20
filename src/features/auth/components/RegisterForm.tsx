'use client'

import { useMemo, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'

import { isValidUsername } from '@/features/auth'
import { useRegister } from '../hooks'
import GoogleLoginButton from './GoogleLoginButton'
import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  PasswordMatchIndicator,
} from './ui'

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    formData,
    handleChange,
    handleRegister,
    loading,
    error,
    success,
    setCaptchaToken,
    captchaEnabled,
    captchaSiteKey
  } = useRegister()

  const usernameError = useMemo(() => {
    if (!formData.username) return ''
    return isValidUsername(formData.username) ?? ''
  }, [formData.username])

  return (
    <AuthCard>
      <AuthHeader
        badge="Create Account"
        title="Join NXCTF"
        subtitle="Start solving challenges today"
      />

      <form className="space-y-5" onSubmit={handleRegister}>
        <div className="space-y-4">
          <AuthInput
            id="username"
            name="username"
            type="text"
            required
            placeholder="Username"
            icon={User}
            error={usernameError}
            value={formData.username}
            onChange={handleChange}
          />

          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

          {/* <PasswordStrength password={formData.password} /> */}

          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Confirm Password"
            icon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className={`rounded-lg p-1 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <PasswordMatchIndicator
            password={formData.password}
            confirmPassword={formData.confirmPassword}
          />
        </div>

        {error && (
          <AuthStatusMessage tone="error">{error}</AuthStatusMessage>
        )}

        {success && (
          <AuthStatusMessage tone="success" title="Check your email">
            {success}
          </AuthStatusMessage>
        )}

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
          Register
        </AuthButton>

        <AuthDivider />
        <GoogleLoginButton />
      </form>

      <AuthFooter text="Already have an account?" href="/login" linkText="Sign in" />
    </AuthCard>
  )
}
