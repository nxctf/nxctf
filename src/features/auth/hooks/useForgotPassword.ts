import { useState } from 'react'
import { AuthService } from '../services/auth.service'
import Config from '@/config'

export function useForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (Config.captchaEnabled && !captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const { error } = await AuthService.sendPasswordReset(email, captchaToken ?? undefined)
      if (error) {
        setError(error)
      } else {
        setSuccess('Password reset email sent! Please check your inbox.')
      }
    } catch {
      setError('Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    setEmail,
    handleSubmit,
    loading,
    error,
    success,
    setCaptchaToken,
    captchaEnabled: Config.captchaEnabled,
    captchaSiteKey: Config.captchaSiteKey
  }
}
