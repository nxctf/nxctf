'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

import { useResetPassword } from '../hooks'
import {
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  PasswordMatchIndicator,
} from './ui'

export default function ResetPasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleResetPassword,
    loading,
    error,
    success
  } = useResetPassword()

  return (
    <AuthCard>
      <AuthHeader
        title="Change Password"
      />

      <form className="space-y-5" onSubmit={handleResetPassword}>
        <AuthInput
          type={showNewPassword ? 'text' : 'password'}
          name="newPassword"
          required
          placeholder="New password"
          icon={Lock}
          rightElement={
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className={`rounded-lg p-1 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />

        <AuthInput
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          required
          placeholder="Confirm new password"
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
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <PasswordMatchIndicator
          password={newPassword}
          confirmPassword={confirmPassword}
        />

        {error && (
          <AuthStatusMessage tone="error">{error}</AuthStatusMessage>
        )}

        {success && (
          <AuthStatusMessage tone="success">{success}</AuthStatusMessage>
        )}

        <AuthButton type="submit" loading={loading}>
          Update Password
        </AuthButton>
      </form>
    </AuthCard>
  )
}
