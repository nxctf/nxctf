import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '../services/auth.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import { CAPTCHA_ENABLED, CAPTCHA_SITE_KEY } from '@/_vars/const'

export function useLogin() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (CAPTCHA_ENABLED && !captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { user, error } = await AuthService.signIn(
        formData.identifier,
        formData.password,
        captchaToken ?? undefined
      )

      if (error) {
        setError(error)
      } else if (user) {
        setUser(user)
        router.push('/challenges')
      }
    } catch {
      setError('Login failed')
    } finally {
      setCaptchaToken(null)
      setTurnstileKey((k) => k + 1)
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    const { error } = await AuthService.loginWithGoogle()
    if (error) {
      setError(error)
      setLoading(false)
    }
    // Success redirect is handled by Supabase OAuth
  }

  return {
    formData,
    handleChange,
    handleLogin,
    loginWithGoogle,
    loading,
    error,
    setCaptchaToken,
    turnstileKey,
    captchaEnabled: CAPTCHA_ENABLED,
    captchaSiteKey: CAPTCHA_SITE_KEY
  }
}
