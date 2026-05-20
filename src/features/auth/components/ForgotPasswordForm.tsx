'use client'

import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'
import { Mail } from 'lucide-react'

import { useForgotPassword } from '../hooks'
import {
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
} from './ui'

export default function ForgotPasswordForm() {
  const {
    email,
    setEmail,
    handleSubmit,
    loading,
    error,
    success,
    setCaptchaToken,
    captchaEnabled,
    captchaSiteKey
  } = useForgotPassword()

  return (
    <AuthCard>
      <AuthHeader
        badge="Password Recovery"
        title="Reset your password"
        subtitle="We'll send you a reset link"
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          type="email"
          name="email"
          required
          placeholder="Email address"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        {captchaEnabled && (
          <div className="w-full flex justify-center">
            <Turnstile
              siteKey={captchaSiteKey}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              options={{ theme: 'auto' }}
            />
          </div>
        )}
        
        {error && (
          <AuthStatusMessage tone="error">{error}</AuthStatusMessage>
        )}
        
        {success && (
          <AuthStatusMessage tone="success" title="Check your email for reset instructions">
            {success}
          </AuthStatusMessage>
        )}
        
        <AuthButton type="submit" loading={loading}>
          Send Reset Email
        </AuthButton>
      </form>
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className={`text-sm font-semibold transition-colors hover:text-primary/80 ${'text-primary'}`}
        >
          Back to Login
        </Link>
      </div>
    </AuthCard>
  )
}
