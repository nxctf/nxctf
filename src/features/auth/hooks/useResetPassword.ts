import { useState } from 'react'
import { AuthService } from '../services/auth.service'

export function useResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters')
        return
    }

    setLoading(true)
    try {
      const { error } = await AuthService.updatePassword(newPassword)
      if (error) {
        setError(error)
      } else {
        setSuccess('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleResetPassword,
    loading,
    error,
    success
  }
}
